import os
import sys
import json
from neo4j import GraphDatabase
from qdrant_client import QdrantClient

def check_neo4j():
    print("\n" + "="*50)
    print("2. NEO4J GRAPH STATE")
    print("="*50)
    try:
        driver = GraphDatabase.driver("bolt://localhost:7688", auth=("neo4j", "password"))
        with driver.session() as session:
            print("\n--- Node Label Counts ---")
            for record in session.run("MATCH (n) RETURN labels(n) AS label, count(*) AS count ORDER BY count DESC"):
                print(f"{record['label']}: {record['count']}")
                
            print("\n--- Relationship Type Counts ---")
            for record in session.run("MATCH ()-[r]->() RETURN type(r) AS type, count(*) AS count ORDER BY count DESC"):
                print(f"{record['type']}: {record['count']}")
                
            print("\n--- SAME_AS Pairs ---")
            res = session.run("MATCH (a:Character)-[:SAME_AS]-(b:Character) RETURN count(*) AS same_as_pairs").single()
            print(f"Count: {res['same_as_pairs']}")
            
        driver.close()
    except Exception as e:
        print(f"Neo4j Error: {e}")

def check_qdrant():
    print("\n" + "="*50)
    print("3. QDRANT VECTOR STORE STATE")
    print("="*50)
    try:
        client = QdrantClient(url="http://localhost:6337")
        collections = client.get_collections().collections
        names = [c.name for c in collections]
        print(f"Collections: {names}")
        if "lore_chunks" in names:
            count = client.count(collection_name="lore_chunks").count
            print(f"Total points in lore_chunks: {count}")
            
            # Group by source_document (since Qdrant doesn't have group_by in python client easily, we can use scroll or just filter count)
            sources = ["hesiod_theogony", "homer_iliad", "homer_odyssey", "ovid_metamorphoses"]
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            for s in sources:
                scount = client.count(
                    collection_name="lore_chunks", 
                    count_filter=Filter(must=[FieldCondition(key="source_document", match=MatchValue(value=s))])
                ).count
                print(f"  {s}: {scount}")
        else:
            print("Collection 'lore_chunks' does NOT exist.")
    except Exception as e:
        print(f"Qdrant Error: {e}")

if __name__ == "__main__":
    check_neo4j()
    check_qdrant()
