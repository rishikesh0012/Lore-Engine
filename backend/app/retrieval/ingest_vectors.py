import os
import uuid
import tiktoken
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest_models
from app.retrieval.vector_search import embedder

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6337")
client = QdrantClient(url=QDRANT_URL)

def setup_collection():
    collection_name = "lore_chunks"
    
    if client.collection_exists(collection_name):
        client.delete_collection(collection_name)
        
    client.create_collection(
        collection_name=collection_name,
        vectors_config=rest_models.VectorParams(
            size=384,
            distance=rest_models.Distance.COSINE
        )
    )
    print(f"Collection {collection_name} created with dimension 384.")

def ingest_source(source: str):
    print(f"Ingesting {source}...")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    filepath = os.path.join(base_dir, "data", "sources", f"{source}.txt")
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()
        
    paragraphs = []
    start = 0
    split_str = '\n\n' if '\n\n' in text else '\n'
    for p in text.split(split_str):
        end = start + len(p)
        paragraphs.append({"text": p, "start": start, "end": end})
        start = end + len(split_str)
        
    enc = tiktoken.get_encoding("cl100k_base")
    
    chunks = []
    current_chunk = []
    current_tokens = 0
    chunk_index = 0
    
    for p in paragraphs:
        p_text = p["text"].strip()
        if not p_text:
            continue
            
        p_tokens = len(enc.encode(p_text))
        
        if current_tokens + p_tokens > 500 and current_chunk:
            chunk_text = "\n\n".join([c["text"] for c in current_chunk])
            chunks.append({
                "chunk_text": chunk_text.strip(),
                "chunk_index": chunk_index,
                "char_start": current_chunk[0]["start"],
                "char_end": current_chunk[-1]["end"],
                "source_document": source
            })
            chunk_index += 1
            
            overlap_p = current_chunk[-1]
            current_chunk = [overlap_p]
            current_tokens = len(enc.encode(overlap_p["text"]))
            
            if current_chunk and current_chunk[-1]["start"] == p["start"]:
                continue
                
        current_chunk.append(p)
        current_tokens += p_tokens
            
    if current_chunk:
        if len(current_chunk) > 1 or chunk_index == 0:
            chunk_text = "\n\n".join([c["text"] for c in current_chunk])
            chunks.append({
                "chunk_text": chunk_text.strip(),
                "chunk_index": chunk_index,
                "char_start": current_chunk[0]["start"],
                "char_end": current_chunk[-1]["end"],
                "source_document": source
            })
            
    print(f"Created {len(chunks)} chunks for {source}. Upserting in batches...")
    
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        texts = [c["chunk_text"] for c in batch]
        vectors = embedder.encode(texts).tolist()
        
        points = []
        for j, c in enumerate(batch):
            points.append(
                rest_models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vectors[j],
                    payload=c
                )
            )
            
        client.upsert(
            collection_name="lore_chunks",
            points=points
        )
    print(f"Upserted {len(chunks)} chunks for {source}.")

def verify():
    from app.retrieval.vector_search import search_chunks
    print("\n--- MANDATORY VERIFICATION ---")
    results = search_chunks("Jupiter", source_document="ovid_metamorphoses", top_k=5)
    for i, r in enumerate(results):
        print(f"\nResult {i+1} (Score: {r['score']:.4f}, Index: {r['chunk_index']}):")
        print(r['chunk_text'])

if __name__ == "__main__":
    setup_collection()
    sources = ["hesiod_theogony", "homer_iliad", "homer_odyssey", "ovid_metamorphoses"]
    for s in sources:
        ingest_source(s)
    verify()
