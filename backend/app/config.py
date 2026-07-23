import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Central configuration for the Lore Engine backend."""
    
    # ── NVIDIA API ───────────────────────────────────────────────
    nvidia_api_key: str = os.getenv("NVIDIA_API_KEY", "")
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "nvidia/nemotron-3-ultra-550b-a55b"
    nvidia_embed_model: str = "nvidia/nv-embedqa-e5-v5"

    # ── Qdrant ───────────────────────────────────────────────────
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")

    # ── Neo4j ────────────────────────────────────────────────────
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "password")

    # ── PostgreSQL ───────────────────────────────────────────────
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://user:password@localhost:5432/lore_consistency"
    )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

settings = Settings()
