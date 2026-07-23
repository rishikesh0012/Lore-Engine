from neo4j import GraphDatabase
driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))
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
