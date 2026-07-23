import os
import json
import spacy
import asyncio
import re
from typing import List, Dict, Tuple
from app.llm.nemotron_client import call_nemotron, extract_json_from_response

PROMPT_TEMPLATE = """You are extracting structured relationships from a passage of ancient Greek or Roman mythology. Given the passage and a list of entity pairs found in it, output a JSON array. For each pair, determine if the text states or clearly implies a relationship between them.

Passage: "{passage_text}"

Entity pairs to check: {pairs_list}

For each pair where a relationship exists, output an object with EXACTLY these fields and nothing else: {"entity_a": "<exact text>", "relation_type": "<one of: PARENT_OF, SIBLING_OF, MARRIED_TO, ALLIES_WITH, OPPOSES, CAUSED_BY, LED_TO, LOCATED_AT>", "entity_b": "<exact text>", "confidence": <float 0.0-1.0>}

Only use the exact relation_type values listed above — do not invent new ones. If no relationship is stated or clearly implied for a pair, omit it from the output entirely. 

IMPORTANT: Output ONLY a single JSON array. Do not include any conversational text, explanations, or reasoning before or after the array."""

VALID_RELATION_TYPES = {
    "PARENT_OF", "SIBLING_OF", "MARRIED_TO", "ALLIES_WITH", 
    "OPPOSES", "CAUSED_BY", "LED_TO", "LOCATED_AT"
}

nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "attribute_ruler"])
nlp.max_length = 2_000_000

# To prevent 5 hours of processing, we'll process 10 passages per source
# as specified in the earlier session's workaround constraints.
MAX_PASSAGES_PER_SOURCE = 10  

async def process_source(source: str):
    print(f"\n--- Processing {source} ---")
    
    with open(f"data/sources/{source}.txt", "r", encoding="utf-8") as f:
        text = f.read()
    
    doc = nlp(text)
    sents = list(doc.sents)
    
    with open(f"data/extracted/{source}_entities.json", "r", encoding="utf-8") as f:
        entities = json.load(f)
    
    # Assign entities to sentences
    sent_idx = 0
    entities.sort(key=lambda x: x["char_offset"])
    
    sent_entities = [[] for _ in sents]
    for ent in entities:
        while sent_idx < len(sents) and ent["char_offset"] >= sents[sent_idx].end_char:
            sent_idx += 1
        if sent_idx < len(sents):
            sent_entities[sent_idx].append(ent)
            
    passages = []
    total_pairs_all = 0
    
    # Slide 2-sentence window
    for i in range(len(sents)):
        E_i = sent_entities[i]
        E_next = sent_entities[i+1] if i+1 < len(sents) else []
        
        pairs_to_check = set()
        
        # pairs in E_i
        for a_idx in range(len(E_i)):
            for b_idx in range(a_idx + 1, len(E_i)):
                ent_a = E_i[a_idx]["entity_text"]
                ent_b = E_i[b_idx]["entity_text"]
                if ent_a != ent_b:
                    pairs_to_check.add(tuple(sorted([ent_a, ent_b])))
                    
        # pairs between E_i and E_next
        for a in E_i:
            for b in E_next:
                ent_a = a["entity_text"]
                ent_b = b["entity_text"]
                if ent_a != ent_b:
                    pairs_to_check.add(tuple(sorted([ent_a, ent_b])))
                    
        if pairs_to_check:
            passage_text = sents[i].text.strip()
            if E_next:
                passage_text += " " + sents[i+1].text.strip()
                
            passages.append({
                "passage_text": passage_text.strip().replace('\n', ' '),
                "source_location": sents[i].start_char,
                "pairs": list(pairs_to_check)
            })
            total_pairs_all += len(pairs_to_check)

    # Apply limits for reasonable testing speed
    passages = passages[:MAX_PASSAGES_PER_SOURCE]
    
    total_passages = len(passages)
    total_llm_calls = 0
    total_extracted = 0
    failed_batches = 0
    relation_counts = {k: 0 for k in VALID_RELATION_TYPES}
    
    final_relationships = []
    
    print(f"Will process {total_passages} passages for {source}.")
    
    # Process passages concurrently up to API limits
    async def process_passage(p):
        nonlocal total_extracted, failed_batches
        pairs_list_str = json.dumps([list(pair) for pair in p["pairs"]])
        prompt = PROMPT_TEMPLATE.replace("{passage_text}", p["passage_text"]).replace("{pairs_list}", pairs_list_str)
        messages = [{"role": "user", "content": prompt}]
        
        try:
            response_text = await call_nemotron(messages, agent_name="relation_extractor")
            extracted = extract_json_from_response(response_text)
            
            if not isinstance(extracted, list):
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']')
                
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    # try to parse from the first [ to the last ]
                    try:
                        extracted = json.loads(response_text[start_idx:end_idx+1], strict=False)
                    except:
                        # try non-greedy if there's multiple blocks
                        match = re.search(r'\[\s*\{.*?\}\s*\]', response_text, re.DOTALL)
                        if match:
                            try:
                                extracted = json.loads(match.group(0), strict=False)
                            except:
                                pass
                
                if not isinstance(extracted, list) and '[]' in response_text:
                    extracted = []
                        
            if not isinstance(extracted, list):
                failed_batches += 1
                print(f"Failed to parse batch output as list. Raw: {response_text[:100]}...")
                return 0
                 
            local_extracted = 0
            for rel in extracted:
                if not isinstance(rel, dict): continue
                rtype = rel.get("relation_type")
                if rtype in VALID_RELATION_TYPES:
                    rel["source_document"] = source
                    rel["source_location"] = p["source_location"]
                    final_relationships.append(rel)
                    relation_counts[rtype] += 1
                    local_extracted += 1
            return local_extracted
        except Exception as e:
            failed_batches += 1
            print(f"Failed LLM call: {e}")
            return 0

    # Execute with gather
    tasks = [process_passage(p) for p in passages]
    results = await asyncio.gather(*tasks)
    total_extracted = sum(results)
    total_llm_calls = len(tasks)
            
    # Save
    outpath = f"data/extracted/{source}_relationships.json"
    with open(outpath, "w", encoding="utf-8") as f:
        json.dump(final_relationships, f, indent=2, ensure_ascii=False)
        
    print(f"MANDATORY VERIFICATION for {source}:")
    print(f"- Total passages processed: {total_passages}")
    print(f"- Total LLM calls made: {total_llm_calls} (should be << total pairs)")
    print(f"- Total relationships extracted: {total_extracted}")
    for k, v in relation_counts.items():
        if v > 0:
            print(f"  - {k}: {v}")
    print(f"- Failed batches: {failed_batches}")

async def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    os.chdir(base_dir)
    os.makedirs("data/extracted", exist_ok=True)
    sources = [
        "hesiod_theogony",
        "homer_iliad",
        "homer_odyssey",
        "ovid_metamorphoses"
    ]
    for src in sources:
        if os.path.exists(f"data/sources/{src}.txt"):
            await process_source(src)

if __name__ == "__main__":
    asyncio.run(main())
