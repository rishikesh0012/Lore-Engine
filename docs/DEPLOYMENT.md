# Deployment & Infrastructure Guide

## 1. Local Development Setup

### Environment Prerequisites
- macOS or Linux
- Python 3.11+
- Node.js 20+ & npm
- Docker Engine 24.0+ & Docker Compose v2.0+

### Setup Commands
```bash
# 1. Clone repository
git clone https://github.com/your-username/lore-engine.git
cd lore-engine

# 2. Environment Variables
cp .env.example .env

# 3. Start Infrastructure Containers (Neo4j & Qdrant)
docker compose up -d neo4j qdrant

# 4. Install & Run Backend API
export PYTHONPATH=$(pwd)/backend
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --port 8002

# 5. Install & Run Frontend
cd frontend
npm install
npm run dev
```

---

## 2. Docker Compose Production Deployment

To run the complete production stack in isolated containers:

```bash
docker compose up -d --build
```

### Container Port Allocation Summary

| Service | Container Port | Host Mapped Port | Protocol / Path |
|---|---|---|---|
| **Frontend** | 3000 | **3005** | HTTP (`http://localhost:3005`) |
| **Backend API** | 8000 | **8002** | HTTP / REST (`http://localhost:8002/api`) |
| **Neo4j Bolt** | 7687 | **7688** | Bolt (`bolt://localhost:7688`) |
| **Neo4j HTTP** | 7474 | **7475** | Web Browser (`http://localhost:7475`) |
| **Qdrant HTTP** | 6333 | **6337** | HTTP Dashboard (`http://localhost:6337`) |
| **PostgreSQL** | 5432 | **5433** | PostgreSQL (`localhost:5433`) |

---

## 3. Production Health Checks & Troubleshooting

### Check Container Health
```bash
docker compose ps
```

### View Live Execution Logs
```bash
docker compose logs -f backend
```

### Manual Neo4j Connectivity Verification
```bash
export PYTHONPATH=$(pwd)/backend
NEO4J_URI=bolt://localhost:7688 python3 -c "from app.graph.neo4j_client import db_client; db_client.connect(); print('Neo4j Connection Verified!')"
```
