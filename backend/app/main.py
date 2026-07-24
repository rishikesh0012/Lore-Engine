from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import query, graph_explorer, api_foundation

app = FastAPI(title="Lore Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/api")
app.include_router(graph_explorer.router, prefix="/api")
app.include_router(api_foundation.router, prefix="/api")

@app.get("/")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "neo4j": True, "qdrant": True}
