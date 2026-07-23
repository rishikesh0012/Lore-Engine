import sys
import os
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(base_dir, "backend"))
from app.config import settings
settings.qdrant_url = "http://localhost:6337"

from app.retrieval.vector_search import search_chunks
import asyncio

async def run():
    res = await search_chunks("Jupiter", source_document="ovid_metamorphoses", top_k=3)
    for i, r in enumerate(res):
        print(f"Result {i+1} [Score: {r.get('score', 0):.4f}]:")
        print(f"  Source: {r.get('source_document')}")
        print(f"  Text: {r.get('chunk_text')[:150]}...")
        
asyncio.run(run())
