from neo4j import GraphDatabase
driver = GraphDatabase.driver("bolt://localhost:7687")
with driver.session() as session:
    print("--- Nodes count ---")
    print(session.run("MATCH (n) RETURN count(n) AS c").single()["c"])
    print("--- Relationships count ---")
    print(session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"])
    print("--- Relationship Types ---")
    for r in session.run("MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS c"):
        print(f"{r['type']}: {r['c']}")
driver.close()
