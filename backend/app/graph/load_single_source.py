import sys
import os
import json
from neo4j import GraphDatabase

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.join(base_dir, "backend"))

from app.config import settings
from app.extraction.deity_aliases import get_canonical_id

def load_source(source):
    driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))
    extracted_dir = os.path.join(base_dir, "data", "extracted")
    
    filepath = os.path.join(extracted_dir, f"{source}_relationships.json")
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return
        
    with open(filepath, "r", encoding="utf-8") as f:
        rels = json.load(f)
        
    with driver.session() as session:
        # Clear existing data for this source first to avoid duplicates if we run this multiple times
        session.run("MATCH (a)-[r]->(b) WHERE r.source = $source DELETE r", source=source)
        
        for rel in rels:
            entity_a_label = rel["entity_a"]
            entity_b_label = rel["entity_b"]
            relation_type = rel["relation_type"]
            confidence = rel.get("confidence", 1.0)
            
            a_id = f"{entity_a_label.lower().replace(' ', '_')}_{source}"
            b_id = f"{entity_b_label.lower().replace(' ', '_')}_{source}"
            
            a_canonical = get_canonical_id(entity_a_label)
            b_canonical = get_canonical_id(entity_b_label)
            
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
            
        print(f"--- Edge-type counts for {source} ---")
        q1 = "MATCH ()-[r]->() WHERE r.source = $source RETURN type(r) AS rel_type, count(*) AS c ORDER BY c DESC"
        for record in session.run(q1, source=source):
            print(f"{record['rel_type']}: {record['c']}")
            
    driver.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        load_source(sys.argv[1])
    else:
        load_source("hesiod_theogony")
