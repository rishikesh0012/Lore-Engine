import os
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest_models
from sentence_transformers import SentenceTransformer

# Setup Qdrant Client
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6337")
client = QdrantClient(url=QDRANT_URL)
vdb_client = client

# Setup Embedding Model
embedder = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> List[float]:
    return embedder.encode(text).tolist()

def search_chunks(query: str, source_document: Optional[str] = None, top_k: int = 20) -> List[Dict]:
    query_vector = get_embedding(query)
    
    # Filter by source_document BEFORE similarity search
    query_filter = None
    if source_document:
        query_filter = rest_models.Filter(
            must=[
                rest_models.FieldCondition(
                    key="source_document",
                    match=rest_models.MatchValue(value=source_document)
                )
            ]
        )
        
    results = client.search(
        collection_name="lore_chunks",
        query_vector=query_vector,
        query_filter=query_filter,
        limit=top_k
    )
    
    output = []
    for hit in results:
        payload = hit.payload or {}
        output.append({
            "id": hit.id,
            "score": hit.score,
            "source_document": payload.get("source_document"),
            "chunk_text": payload.get("chunk_text"),
            "chunk_index": payload.get("chunk_index"),
            "char_start": payload.get("char_start"),
            "char_end": payload.get("char_end"),
        })
        
    return output
