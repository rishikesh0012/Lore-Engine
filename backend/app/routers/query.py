from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import time
from collections import defaultdict
from app.retrieval.hybrid_retriever import HybridRetriever

router = APIRouter()

# Rate limiting state
IP_REQUESTS = defaultdict(list)
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60  # seconds

# Global retriever instance
retriever = HybridRetriever()

class QueryRequest(BaseModel):
    query: str
    source: str | None = None

@router.post("/query")
async def execute_query(request: Request, body: QueryRequest):
    # Simple Rate Limiting (max 5 requests/min per IP)
    client_ip = request.client.host
    now = time.time()
    
    # Clean up old requests
    IP_REQUESTS[client_ip] = [t for t in IP_REQUESTS[client_ip] if now - t < RATE_LIMIT_WINDOW]
    
    if len(IP_REQUESTS[client_ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too Many Requests")
        
    IP_REQUESTS[client_ip].append(now)
    
    try:
        # Append instruction for explicit citations
        enhanced_query = body.query + "\n\n(Please include explicit inline citations with source document and location for every claim)"
        result = await retriever.ask(enhanced_query, source=body.source)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/universes/{id}/ask")
async def ask_universe(id: str, request: Request, body: QueryRequest):
    # Simple Rate Limiting (max 5 requests/min per IP)
    client_ip = request.client.host
    now = time.time()
    
    IP_REQUESTS[client_ip] = [t for t in IP_REQUESTS[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(IP_REQUESTS[client_ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too Many Requests")
        
    IP_REQUESTS[client_ip].append(now)
    
    try:
        enhanced_query = body.query + "\n\n(Please include explicit inline citations with source document and location for every claim)"
        result = await retriever.ask(enhanced_query, source=id)
        
        return {
            "response": result["answer"],
            "entities_mentioned": result["entities_found"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/raw")
async def get_raw_profile(request: Request, body: QueryRequest):
    # Simple Rate Limiting (max 10 requests/min per IP)
    client_ip = request.client.host
    now = time.time()
    
    IP_REQUESTS[client_ip] = [t for t in IP_REQUESTS[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(IP_REQUESTS[client_ip]) >= 10:
        raise HTTPException(status_code=429, detail="Too Many Requests")
        
    IP_REQUESTS[client_ip].append(now)
    
    try:
        # Pass the source filter to vector search if provided
        passages = await retriever.get_vector_passages(body.query, limit=5, source=body.source)
        graph_context, graph_data = retriever.get_graph_neighborhood([body.query])
        
        return {
            "passages": passages,
            "graph_context": graph_context,
            "graph_data": graph_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CompareRequest(BaseModel):
    queryA: str
    queryB: str
    source: str | None = None

@router.post("/compare/raw")
async def get_raw_comparison(request: Request, body: CompareRequest):
    # Simple Rate Limiting (max 10 requests/min per IP)
    client_ip = request.client.host
    now = time.time()
    
    IP_REQUESTS[client_ip] = [t for t in IP_REQUESTS[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(IP_REQUESTS[client_ip]) >= 10:
        raise HTTPException(status_code=429, detail="Too Many Requests")
        
    IP_REQUESTS[client_ip].append(now)
    
    try:
        # Fetch vector passages for both entities (limit 5 total)
        combined_query = f"{body.queryA} and {body.queryB}"
        passages = await retriever.get_vector_passages(combined_query, limit=5, source=body.source)
        
        # Fetch graph neighborhood for both entities
        graph_context, graph_data = retriever.get_graph_neighborhood([body.queryA, body.queryB])
        
        return {
            "passages": passages,
            "graph_context": graph_context,
            "graph_data": graph_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
