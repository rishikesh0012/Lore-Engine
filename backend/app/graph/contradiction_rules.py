import os
import json
import asyncio
from typing import List, Dict, Any

from app.graph.neo4j_client import db_client
from app.llm.nemotron_client import call_nemotron

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(BASE_DIR, "data")
SOURCES_DIR = os.path.join(DATA_DIR, "sources")
OUTPUT_FILE = os.path.join(DATA_DIR, "contradictions.json")

# Cypher rules to detect structural conflicts
CONTRADICTION_RULES = [
    {
        "name": "Conflicting Parentage",
        "relation_type": "PARENT_OF",
        "query": """
            MATCH (p1:Character)-[r1:PARENT_OF]->(c1:Character)
            MATCH (p2:Character)-[r2:PARENT_OF]->(c2:Character)
            WHERE (c1)-[:SAME_AS*0..1]-(c2)
              AND NOT (p1)-[:SAME_AS*0..1]-(p2)
              AND r1.source <> r2.source
            MATCH (p1)-[m1:MENTIONED_IN]->(s1:Source)
            MATCH (p2)-[m2:MENTIONED_IN]->(s2:Source)
            WHERE m1.source = r1.source
              AND m2.source = r2.source
            RETURN 
                c1.name AS entity,
                'PARENT_OF' AS relation_type,
                p1.name AS claim_a_entity, r1.source AS claim_a_source, m1.location AS claim_a_loc,
                p2.name AS claim_b_entity, r2.source AS claim_b_source, m2.location AS claim_b_loc
        """
    },
    {
        "name": "Conflicting Cause",
        "relation_type": "CAUSED_BY",
        "query": """
            MATCH (a1:Character)-[r1:CAUSED_BY]->(e1:Event)
            MATCH (a2:Character)-[r2:CAUSED_BY]->(e2:Event)
            WHERE (e1)-[:SAME_AS*0..1]-(e2)
              AND NOT (a1)-[:SAME_AS*0..1]-(a2)
              AND r1.source <> r2.source
            MATCH (a1)-[m1:MENTIONED_IN]->(s1:Source)
            MATCH (a2)-[m2:MENTIONED_IN]->(s2:Source)
            WHERE m1.source = r1.source
              AND m2.source = r2.source
            RETURN 
                e1.name AS entity,
                'CAUSED_BY' AS relation_type,
                a1.name AS claim_a_entity, r1.source AS claim_a_source, m1.location AS claim_a_loc,
                a2.name AS claim_b_entity, r2.source AS claim_b_source, m2.location AS claim_b_loc
        """
    }
]

def get_passage(source: str, location: str, window_size: int = 250) -> str:
    """
    Retrieves a text window around a character offset from the original source.
    Location format: 'char_offset_1234'
    """
    try:
        offset = int(location.split('_')[-1])
    except (ValueError, AttributeError, IndexError):
        return f"[Error: Invalid location format '{location}']"
        
    filepath = os.path.join(SOURCES_DIR, f"{source}.txt")
    if not os.path.exists(filepath):
        return f"[Error: Source file {filepath} not found]"
        
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
        
    start = max(0, offset - window_size)
    end = min(len(text), offset + window_size)
    passage = text[start:end].replace('\n', ' ').strip()
    return f"...{passage}..."


async def verify_contradiction(candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends the candidate contradiction to the LLM for confirmation and explanation.
    """
    passage_a = get_passage(candidate['claim_a_source'], candidate['claim_a_loc'])
    passage_b = get_passage(candidate['claim_b_source'], candidate['claim_b_loc'])
    
    prompt = f"""
You are a mythology expert and GraphRAG contradiction resolver.
We have detected a structural graph conflict between two sources regarding the entity "{candidate['entity']}".

Relationship Type: {candidate['relation_type']}

Claim A: {candidate['claim_a_entity']} {candidate['relation_type']} {candidate['entity']} (Source: {candidate['claim_a_source']})
Passage A: {passage_a}

Claim B: {candidate['claim_b_entity']} {candidate['relation_type']} {candidate['entity']} (Source: {candidate['claim_b_source']})
Passage B: {passage_b}

Task: Determine if this is a GENUINE contradiction between the historical authors, or an EXPLAINABLE non-conflict.
Examples of explainable non-conflicts:
- Different epithets for the same god (e.g., "Phoebus" vs "Apollo")
- Same parent, but one refers to a broad lineage (e.g., "Son of Cronus" vs "Zeus")
- Two parents who were married (e.g., claiming Zeus is the parent vs claiming Hera is the parent of Ares).

Respond with a JSON object exactly matching this schema:
{{
  "confirmed": boolean,
  "llm_explanation": "string explaining your reasoning"
}}
"""
    try:
        messages = [{"role": "user", "content": prompt}]
        response_text = await call_nemotron(messages, agent_name="ContradictionVerifier", allow_fallback=True)
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end != -1:
            json_str = response_text[start:end]
            result = json.loads(json_str)
        else:
            result = {"confirmed": False, "llm_explanation": "Failed to parse JSON response"}
    except Exception as e:
        print(f"LLM verification failed for candidate: {e}")
        result = {"confirmed": False, "llm_explanation": str(e)}

    return {
        "entity_involved": candidate['entity'],
        "relation_type": candidate['relation_type'],
        "claim_a": {
            "entity": candidate['claim_a_entity'],
            "source": candidate['claim_a_source'],
            "text": passage_a
        },
        "claim_b": {
            "entity": candidate['claim_b_entity'],
            "source": candidate['claim_b_source'],
            "text": passage_b
        },
        "confirmed": result.get("confirmed", False),
        "llm_explanation": result.get("llm_explanation", "No explanation provided.")
    }


async def main():
    print("Connecting to Neo4j to find structural contradictions...")
    db_client.connect()
    
    candidates = []
    
    try:
        for rule in CONTRADICTION_RULES:
            print(f"Running rule: {rule['name']}...")
            results = db_client.execute_read(rule['query'])
            
            # Deduplicate A->B vs B->A symmetries if they exist
            seen_pairs = set()
            for row in results:
                entity = row['entity']
                ca = row['claim_a_entity']
                cb = row['claim_b_entity']
                
                # Create a canonical key to avoid duplicate undirected checks
                pair_key = tuple(sorted([ca, cb])) + (entity,)
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    candidates.append(row)
                    
        print(f"Found {len(candidates)} rule-flagged structural candidates.")
        
    finally:
        db_client.close()

    if not candidates:
        print("No candidates found. Exiting.")
        return

    print("Verifying candidates via LLM...")
    confirmed_contradictions = []
    
    # Process sequentially or in small batches to respect rate limits
    for i, candidate in enumerate(candidates):
        print(f"Verifying candidate {i+1}/{len(candidates)}: {candidate['entity']} ({candidate['relation_type']})")
        result = await verify_contradiction(candidate)
        if result['confirmed']:
            print(f"  -> CONFIRMED: {result['llm_explanation']}")
        else:
            print(f"  -> REJECTED: {result['llm_explanation']}")
            
        confirmed_contradictions.append(result)
        
    print(f"Writing {len(confirmed_contradictions)} analyzed contradictions to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(confirmed_contradictions, f, indent=2)
        
    # Print summary
    genuine = sum(1 for c in confirmed_contradictions if c['confirmed'])
    print(f"\nSummary:")
    print(f"Total Candidates Examined: {len(candidates)}")
    print(f"Genuine Contradictions: {genuine}")
    print(f"False Positives Filtered: {len(candidates) - genuine}")

if __name__ == "__main__":
    asyncio.run(main())
