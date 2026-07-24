import os
import json
from fastapi import APIRouter, Query
from app.graph.neo4j_client import db_client

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONTRADICTIONS_FILE = os.path.join(BASE_DIR, "data", "contradictions.json")

@router.get("/contradictions")
def get_contradictions():
    if not os.path.exists(CONTRADICTIONS_FILE):
        return []
    with open(CONTRADICTIONS_FILE, "r") as f:
        try:
            return json.load(f)
        except Exception:
            return []

@router.get("/graph")
def get_graph(
    entity: str = Query(None, description="Center entity to fetch 1-hop subgraph"),
    source: str = Query(None, description="Filter to edges from a specific source")
):
    nodes_dict = {}
    links = []
    
    try:
        db_client.connect()
        if entity:
            query = """
            MATCH (n)-[r]-(m)
            WHERE n.name = $entity OR n.label = $entity
            """
            if source:
                query += " AND (r.source = $source OR type(r) = 'MENTIONED_IN' AND m.name = $source OR n.name = $source) "
            query += """
            RETURN n.name AS source, labels(n)[0] AS source_label,
                   type(r) AS rel_type, r.source AS rel_source,
                   m.name AS target, labels(m)[0] AS target_label
            LIMIT 500
            """
            params = {"entity": entity, "source": source}
            results = db_client.execute_read(query, params)
        else:
            query = "MATCH (n)-[r]->(m)"
            if source:
                query += " WHERE r.source = $source OR (type(r) = 'MENTIONED_IN' AND m.name = $source) "
            query += """
            RETURN n.name AS source, labels(n)[0] AS source_label,
                   type(r) AS rel_type, r.source AS rel_source,
                   m.name AS target, labels(m)[0] AS target_label
            LIMIT 500
            """
            results = db_client.execute_read(query, {"source": source})
            
        for row in results:
            src = row.get('source')
            src_lbl = row.get('source_label', 'Entity')
            tgt = row.get('target')
            tgt_lbl = row.get('target_label', 'Entity')
            
            if not src or not tgt:
                continue
                
            if src not in nodes_dict:
                nodes_dict[src] = {"id": src, "label": src, "type": src_lbl}
            if tgt not in nodes_dict:
                nodes_dict[tgt] = {"id": tgt, "label": tgt, "type": tgt_lbl}
                
            links.append({
                "source": src,
                "target": tgt,
                "type": row.get('rel_type', 'UNKNOWN'),
                "sourceText": row.get('rel_source', 'Unknown Source')
            })
            
    except Exception as e:
        print(f"Graph retrieval error: {e}")
        
    if len(nodes_dict) == 0:
        from app.routers.api_foundation import get_full_graph
        return get_full_graph(source=source)
        
    return {
        "nodes": list(nodes_dict.values()),
        "links": links
    }

from app.graph import graph_queries

@router.get("/key-figures")
def api_get_key_figures(source: str = Query(..., description="Name of the source document (e.g. 'Hesiod_Theogony')"), limit: int = Query(10)):
    try:
        return graph_queries.get_key_figures(source, limit)
    except Exception as e:
        return {"error": str(e)}

@router.get("/most-contested")
def api_get_most_contested(limit: int = Query(10)):
    try:
        return graph_queries.get_most_contested(limit)
    except Exception as e:
        return {"error": str(e)}
