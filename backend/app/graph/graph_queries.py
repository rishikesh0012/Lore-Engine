from app.graph.neo4j_client import db_client

def get_key_figures(source_name: str, limit: int = 10):
    """
    Finds characters with the highest degree centrality connected to a specific source.
    """
    if source_name:
        query = """
        MATCH (c:Character)-[r]-(other)
        WHERE r.source = $source_name OR (type(r) = 'MENTIONED_IN' AND other.name = $source_name)
        WITH c, count(r) AS degree
        ORDER BY degree DESC
        LIMIT $limit
        RETURN c.name AS character, degree
        """
        params = {"source_name": source_name, "limit": limit}
    else:
        query = """
        MATCH (c:Character)-[r]-(other)
        WITH c, count(r) AS degree
        ORDER BY degree DESC
        LIMIT $limit
        RETURN c.name AS character, degree
        """
        params = {"limit": limit}
    
    # We must ensure db_client is connected
    db_client.connect()
    
    results = db_client.execute_read(query, params)
    return [{"character": row["character"], "degree": row["degree"]} for row in results]

def get_most_contested(limit: int = 10):
    """
    Dynamically finds Characters involved in the most conflicting structural edges.
    e.g. A character who has edges of the same type coming from different sources 
    with different claim-entities.
    """
    query = """
    MATCH (p1:Character)-[r1]->(c1:Character)
    MATCH (p2:Character)-[r2]->(c2:Character)
    WHERE (c1)-[:SAME_AS*0..1]-(c2)
      AND NOT (p1)-[:SAME_AS*0..1]-(p2)
      AND type(r1) = type(r2) 
      AND r1.source <> r2.source 
    WITH c1 AS c, count(DISTINCT r1) AS contradictions
    ORDER BY contradictions DESC
    LIMIT $limit
    RETURN c.name AS character, contradictions
    """
    
    db_client.connect()
    
    results = db_client.execute_read(query, {"limit": limit})
    return [{"character": row["character"], "contradictions": row["contradictions"]} for row in results]
