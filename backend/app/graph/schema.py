import os
from neo4j import GraphDatabase
from app.config import settings

def setup_schema():
    driver = GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password)
    )
    queries = [
        "CREATE CONSTRAINT character_id IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE;",
        "CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE;",
        "CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE;",
        "CREATE CONSTRAINT source_name IF NOT EXISTS FOR (s:Source) REQUIRE s.name IS UNIQUE;",
        "CREATE INDEX character_canonical IF NOT EXISTS FOR (c:Character) ON (c.canonical_id);"
    ]
    with driver.session() as session:
        for q in queries:
            print(f"Executing: {q}")
            session.run(q)
    print("Schema setup complete.")
    driver.close()

if __name__ == "__main__":
    setup_schema()
