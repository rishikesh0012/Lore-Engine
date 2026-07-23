import os
import json
from neo4j import GraphDatabase
from app.config import settings
from app.extraction.deity_aliases import get_canonical_id

def load_data():
    driver = GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password)
    )
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    extracted_dir = os.path.join(base_dir, "data", "extracted")
    
    sources = [
        "hesiod_theogony",
        "homer_iliad",
        "homer_odyssey",
        "ovid_metamorphoses"
    ]
    
    with driver.session() as session:
        for source in sources:
            filepath = os.path.join(extracted_dir, f"{source}_relationships.json")
            if not os.path.exists(filepath):
                continue
            with open(filepath, "r", encoding="utf-8") as f:
                try:
                    rels = json.load(f)
                except:
                    continue
                
            for rel in rels:
                entity_a_label = rel["entity_a"]
                entity_b_label = rel["entity_b"]
                relation_type = rel["relation_type"]
                confidence = rel.get("confidence", 1.0)
                
                a_id = f"{entity_a_label.lower().replace(' ', '_')}_{source}"
                b_id = f"{entity_b_label.lower().replace(' ', '_')}_{source}"
                
                a_canonical = get_canonical_id(entity_a_label)
                b_canonical = get_canonical_id(entity_b_label)
                
                # Use apoc.merge.relationship or dynamic Cypher
                # Since relation_type is restricted and safe from extraction, dynamic cypher is fine.
                cypher = f"""
                MERGE (a:Character {{id: $entity_a_id}})
                  ON CREATE SET a.label = $entity_a_label, a.canonical_id = $entity_a_canonical,
                                a.source_document = $source_document
                MERGE (b:Character {{id: $entity_b_id}})
                  ON CREATE SET b.label = $entity_b_label, b.canonical_id = $entity_b_canonical,
                                b.source_document = $source_document
                MERGE (s:Source {{name: $source_document}})
                MERGE (a)-[:MENTIONED_IN {{source: $source_document}}]->(s)
                MERGE (b)-[:MENTIONED_IN {{source: $source_document}}]->(s)
                MERGE (a)-[r:{relation_type} {{source: $source_document, confidence: $confidence}}]->(b)
                """
                
                session.run(
                    cypher,
                    entity_a_id=a_id,
                    entity_a_label=entity_a_label,
                    entity_a_canonical=a_canonical,
                    entity_b_id=b_id,
                    entity_b_label=entity_b_label,
                    entity_b_canonical=b_canonical,
                    source_document=source,
                    confidence=confidence
                )
        
        # Cross-tradition SAME_AS edges
        print("Creating SAME_AS edges...")
        same_as_cypher = """
        MATCH (a:Character), (b:Character)
        WHERE a.canonical_id IS NOT NULL 
          AND a.canonical_id = b.canonical_id 
          AND a.source_document <> b.source_document
          AND id(a) < id(b)
        MERGE (a)-[:SAME_AS]->(b)
        """
        session.run(same_as_cypher)
        
        print("\n--- FINAL NEO4J GRAPH VERIFICATION ---")
        c_nodes = session.run("MATCH (c:Character) RETURN count(c) AS count").single()["count"]
        s_nodes = session.run("MATCH (s:Source) RETURN count(s) AS count").single()["count"]
        same_as_count = session.run("MATCH ()-[r:SAME_AS]->() RETURN count(r) AS count").single()["count"]
        
        print(f"  - Character Nodes: {c_nodes}")
        print(f"  - Source Nodes: {s_nodes}")
        print(f"  - SAME_AS Edges: {same_as_count}")
        print("\n--- Relationship Type Counts ---")
        q1 = "MATCH ()-[r]->() RETURN type(r) AS rel_type, count(*) AS c ORDER BY c DESC"
        result1 = session.run(q1)
        for record in result1:
            print(f"  - {record['rel_type']}: {record['c']}")

    driver.close()

if __name__ == "__main__":
    load_data()
