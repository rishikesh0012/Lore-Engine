# Canon Consistency & Contradiction Detector — GraphRAG Lore Engine

A GraphRAG system that ingests a mythology corpus spread across multiple ancient
sources, builds a knowledge graph of characters, events, and relationships, and
surfaces genuine contradictions between sources — e.g. two texts claiming
different parentage for the same figure — with citations back to the exact
source.

This is the Slot 2 project in a 4-project portfolio (alongside a multi-agent RAG
Insurance advisor, a trained deep-learning Cybersecurity classifier, and a
prompt-engineering project). Its job is to prove a **different retrieval
technique** than the vector-only RAG used in the Insurance project: knowledge
graphs handle multi-hop relationship questions ("how are these two connected")
that pure vector similarity structurally cannot answer.

> Save this file as `README.md` inside its own `lore-consistency-checker/`
> project folder — it's named `LORE_ENGINE_README.md` here only so it doesn't
> overwrite your Insurance project's README.md.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Graph database | **Neo4j** | Industry-standard, Cypher query language, free AuraDB tier |
| Entity extraction | **spaCy NER** | Free, local, fast — handles the "easy" part (naming a character) without spending LLM budget |
| Relationship/attribute extraction | **NVIDIA Nemotron LLM** | Handles the harder inference (implicit relationships, causal claims) |
| Graph schema | **Rich/typed** | Typed nodes (Character, Event, Location, Source) + typed edges (`PARENT_OF`, `ALLIES_WITH`, `CAUSED_BY`, `MENTIONED_IN`) with a `source` property on every edge — required to detect contradictions at all |
| Contradiction detection | **Hybrid** — Cypher rules flag candidates, LLM confirms + explains | Keeps LLM calls (and rate-limit budget) to only genuine candidates |
| Retrieval | **Graph + vector hybrid** | Vector search (Qdrant) finds relevant passages → graph traversal (Neo4j) pulls the entity neighborhood around what's mentioned → both combined as context |
| Source corpus | **Greek mythology** (Hesiod, Homer, later sources) | Public domain, and contains real, well-documented contradictions between ancient sources — not manufactured ones |
| Backend | **FastAPI** | Same as Insurance project |
| Structured DB | **PostgreSQL** | User sessions and query history (Neo4j holds the graph itself) |
| Frontend | **React + Next.js + react-force-graph** | Renders the actual knowledge graph as an interactive, explorable diagram — the strongest demo moment of this project |
| LLM provider | **NVIDIA Nemotron** (`nvidia/nemotron-3-ultra-550b-a55b`), fallback `meta/llama-3.3-70b-instruct`, cheap-pass `meta/llama-3.2-3b-instruct` | Same rate-limit-safe wrapper built for the Insurance project — reuse it unchanged |
| Deployment | **Docker + Render/Railway** | Same as Insurance project |

---

## 2. System architecture

```
Next.js frontend (chat + interactive graph explorer)
        │
        ▼
FastAPI backend (REST API layer)
        │
        ▼
Hybrid retrieval engine (vector search + graph traversal)
        │
   ┌────┼────────────┬─────────────┐
   ▼    ▼             ▼             ▼
Qdrant  Neo4j     PostgreSQL   NVIDIA LLM
(text   (entity    (user        (reasoning,
vectors) graph)     sessions)    extraction)
```

The frontend never queries Neo4j or Qdrant directly — every request goes through
FastAPI, which invokes the hybrid retrieval engine. That engine decides how much
of the answer comes from vector-retrieved text versus graph-traversed
relationships, based on the query shape.

---

## 3. Graph schema

**Node types**: `Character`, `Event`, `Location`, `Source` (a Source node
represents an originating text — e.g. "Hesiod's Theogony" — and every fact node
links back to which Source(s) claimed it).

**Edge types** (all carry a `source` property naming which text made the claim,
plus optionally a `confidence` score from the extraction pass):
- `PARENT_OF`, `SIBLING_OF`, `MARRIED_TO` — genealogy
- `ALLIES_WITH`, `OPPOSES` — relationships
- `CAUSED_BY`, `LED_TO` — causal chains between events
- `LOCATED_AT` — character/event to location
- `MENTIONED_IN` — links any node to the Source text(s) that reference it

**Why this matters**: contradiction detection is a Cypher query for two edges of
the *same type* between the *same two nodes* with *different `source`
properties and conflicting claims* — e.g. two `PARENT_OF` edges into the same
Character node from different parents, each sourced from a different text. A
generic untyped edge can't carry the information needed to find this.

---

## 4. Extraction pipeline (raw text → graph)

1. **spaCy NER** — pass over all ingested texts, tags PERSON, GPE (places), and
   custom-trained EVENT entities. Free, local, no LLM cost.
2. **LLM relationship extraction** — for each entity pair found near each other
   in text, prompt the LLM to output structured JSON: `{entity_a, relation_type,
   entity_b, source_document, source_page_or_line, confidence}`. This is the
   only LLM-costed step in graph construction — batch it, and cache aggressively
   during development (identical passages shouldn't be re-extracted).
3. **Neo4j load** — write extracted entities as nodes and relationships as typed
   edges with the `source` property attached.

---

## 5. Folder structure

```
lore-consistency-checker/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── extraction/
│   │   │   ├── entity_extractor.py       # spaCy NER
│   │   │   ├── relation_extractor.py     # LLM relationship/attribute extraction
│   │   │   └── run_extraction.py
│   │   ├── graph/
│   │   │   ├── neo4j_client.py
│   │   │   ├── schema.py                 # typed node/edge definitions
│   │   │   └── contradiction_rules.py    # Cypher rule queries
│   │   ├── retrieval/
│   │   │   ├── vector_search.py          # Qdrant
│   │   │   ├── graph_traversal.py        # Neo4j neighborhood expansion
│   │   │   └── hybrid_retriever.py       # combines both
│   │   ├── llm/
│   │   │   └── nemotron_client.py        # reused unchanged from Insurance project
│   │   ├── db/
│   │   │   ├── models.py                 # PostgreSQL: sessions, query history
│   │   │   └── session.py
│   │   ├── routers/
│   │   │   ├── query.py
│   │   │   └── graph_explorer.py         # serves graph data to the frontend viz
│   │   └── config.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── explore/page.tsx              # interactive graph visualization
│   ├── components/
│   │   └── GraphView.tsx                 # react-force-graph component
│   ├── package.json
│   └── Dockerfile
├── data/
│   └── sources/                          # public-domain Greek mythology texts
├── docker-compose.yml                    # backend + frontend + postgres + neo4j + qdrant
└── README.md
```

---

## 6. Build order

1. **Source corpus** — pull public-domain Greek mythology texts (Hesiod's
   *Theogony*, Homer, later playwrights) from Project Gutenberg.
2. **Entity extraction** — spaCy NER pass across all texts (free, local).
3. **Relationship/attribute extraction** — LLM pass via the reused rate-limit-safe
   NVIDIA wrapper, outputting typed relationships with source attribution.
4. **Neo4j graph population** — load entities/relationships with the rich schema.
5. **Vector ingestion** — embed the same texts into Qdrant for the vector half
   of hybrid retrieval (chunk by scene/passage, ~300-500 tokens, 50-100 overlap
   — same chunking parameters as the Insurance project, adapted for prose
   instead of clauses).
6. **Contradiction detection** — Cypher rule queries for candidate conflicts,
   then an LLM confirmation + plain-language explanation pass on flagged
   candidates only.
7. **Hybrid retrieval** — wire vector search + graph-neighborhood traversal
   together.
8. **FastAPI endpoints** — query endpoint + a graph-data endpoint feeding the
   frontend visualization.
9. **Next.js frontend** — chat interface + interactive graph explorer.
10. **Dockerize + deploy.**

---

## 7. Environment variables

```
NVIDIA_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
NEO4J_URI=
NEO4J_USER=
NEO4J_PASSWORD=
DATABASE_URL=postgresql://user:password@localhost:5432/lore_consistency
```

---

## 8. Working in Antigravity

- Open this folder directly: `File → Open Folder` → `lore-consistency-checker`.
- Use **Manager view** to run agents in parallel — e.g. one on the extraction
  pipeline (steps 2-4) while another sets up the Qdrant ingestion (step 5).
- Copy `nemotron_client.py` from your Insurance project into this repo
  unchanged before starting — don't regenerate it, it's already tested and
  rate-limit-safe.
- Reference this README in your first prompt to each agent so it has full
  project context.
