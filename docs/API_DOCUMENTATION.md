# Lore Engine API Reference Documentation

Base URL: `http://localhost:8002/api`

---

## Endpoints Summary

| Endpoint | Method | Description |
|---|---|---|
| `/dashboard` | `GET` | Retrieve overall system statistics, pipeline monitor, and source metrics |
| `/characters` | `GET` | List/search characters with pagination and tradition filtering |
| `/characters/{id}` | `GET` | Fetch character profile, canonical aliases, and 1-hop subgraph |
| `/relationships` | `GET` | Tabular index of extracted narrative relationships with type filters |
| `/graph` | `GET` | Return full graph node & edge list formatted for 2D visual canvas |
| `/analytics` | `GET` | Betweenness centrality rankings, degree distributions, and source weights |
| `/ask` | `POST` | Natural language GraphRAG Q&A with synthesized answer and citations |
| `/compare` | `POST` | Compare two source documents for agreements, contradictions, and unique edges |

---

## Detailed Endpoint Specifications

### 1. `GET /api/dashboard`
Returns high-level graph statistics and pipeline status.

**Response Schema:**
```json
{
  "stats": {
    "total_characters": 184,
    "total_relationships": 1145,
    "sources_indexed": 4,
    "active_conflicts": 52
  },
  "sources": [
    { "id": "hesiod_theogony", "name": "Hesiod's Theogony", "passages": 139, "relationships": 87, "status": "Completed" }
  ],
  "relationship_distribution": [
    { "name": "OPPOSES", "count": 347, "color": "#EF4444" }
  ],
  "pipeline_status": {
    "current_source": "homer_odyssey",
    "progress_pct": 85.0,
    "rpm": 25.0,
    "errors_429": 0
  }
}
```

---

### 2. `GET /api/characters`
Fetch paginated character profiles with optional name search.

**Query Parameters:**
- `search` (optional string): Filter by name or alias (e.g. `Zeus`, `Jove`).
- `limit` (int, default 20): Page size.
- `offset` (int, default 0): Record offset.

---

### 3. `POST /api/ask`
Execute GraphRAG hybrid retrieval and answer synthesis.

**Request Body:**
```json
{
  "query": "Who opposes Odysseus?",
  "source_filter": "homer_odyssey"
}
```

**Response Schema:**
```json
{
  "answer": "Odysseus is primarily opposed by Poseidon...",
  "confidence": 0.94,
  "entities": ["Odysseus", "Poseidon"],
  "passages": [
    { "source": "Homer's Odyssey", "text": "Poseidon, shaker of the earth, nursed a persistent rage..." }
  ]
}
```

---

### 4. `POST /api/compare`
Cross-reference narrative claims across two traditions.

**Request Body:**
```json
{
  "source_a": "hesiod_theogony",
  "source_b": "homer_iliad"
}
```
