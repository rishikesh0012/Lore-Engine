# Lore Engine — Portfolio & Senior AI Engineer Resume Package

---

## 1. 60-Second Elevator Pitch

> *"Lore Engine is a multi-tradition GraphRAG platform that solves the fundamental limitation of traditional RAG: multi-hop relational reasoning and contradiction resolution across conflicting narrative sources. By pairing vector search in Qdrant with a Neo4j knowledge graph, Lore Engine ingests thousands of classical text passages, resolves cross-tradition aliases like Zeus and Jove, and isolates structural contradictions across centuries of storytelling with 100% precision. It features a resilient LLM extraction pipeline with AIMD rate limiting that achieved zero rate-limit crashes during full dataset processing."*

---

## 2. Senior AI Engineer Resume Bullet Points

- **Architected GraphRAG Platform:** Built an enterprise GraphRAG intelligence system combining **Neo4j** graph traversals and **Qdrant** dense vector similarity search to execute multi-hop reasoning over 6,300+ text passages.
- **Designed Resilient LLM Extraction Infrastructure:** Engineered an asynchronous extraction pipeline featuring an **AIMD Adaptive Rate Limiter** and a **4-stage resilient fallback parser**, eliminating 429 rate-limit crashes and achieving **100.0% precision** on a 50-sample verification audit.
- **Formulated Rule-Based Contradiction Engine:** Developed Cypher graph traversal algorithms (`DISPUTED_PARENTAGE_QUERY`, `DIRECT_CONTRADICTION_QUERY`) to detect narrative conflicts across Greek and Roman mythic traditions.
- **Built Production React Frontend:** Delivered an interactive Next.js 15 UI with a 2D force-directed SVG canvas, WCAG 2.1 AAA accessibility, and real-time GraphRAG evidence exploration.

---

## 3. Traditional RAG vs. Lore Engine GraphRAG Comparison

| Feature Dimension | Traditional Vector RAG | Lore Engine GraphRAG |
|---|---|---|
| **Retrieval Strategy** | Top-K cosine similarity over text chunks | **Hybrid Vector Search + 2-Hop Graph Traversal** |
| **Multi-Hop Relationships** | Fails when facts span disjoint passages | **Traverses multi-hop Cypher paths seamlessly** |
| **Alias Resolution** | Treats "Zeus" and "Jove" as separate entities | **Resolves `SAME_AS` canonical graph edges** |
| **Contradiction Resolution** | Blends conflicting facts into hallucination | **Calculates deterministic structural conflicts** |
| **Evidence Lineage** | Passage snippet only | **Verbatim passage + graph edge + confidence score** |

---

## 4. 5-Minute Live Technical Demo Script

1. **0:00 - 0:45 | Introduction & Problem Statement:**
   - Present the challenge of cross-referencing ancient manuscripts where narrative facts conflict across traditions.
2. **0:45 - 1:45 | Interactive Knowledge Graph (`/graph`):**
   - Showcase 2D graph canvas, zoom/pan, relation type filtering (`PARENT_OF`, `OPPOSES`), and node drawer.
3. **1:45 - 2:45 | Natural Language Search (`/ask`):**
   - Run query *"Who opposes Odysseus?"* Demonstrate synthesized answer with verified graph triples and verbatim passage citations.
4. **2:45 - 3:45 | Source Comparison & Contradictions (`/compare`):**
   - Compare *Hesiod's Theogony* vs *Homer's Iliad*. Demonstrate disputed parentage and alliance vs opposition contradiction detection.
5. **3:45 - 5:00 | Architecture & Resiliency Overview (`/settings` & `/dashboard`):**
   - Highlight AIMD rate limiting, 4-stage JSON fallback parser, Neo4j connectivity, and zero 429 error telemetry.

---

## 5. Technical Challenges Solved & Lessons Learned

### Challenge 1: LLM Reasoning Prefixes Breaking JSON Parsing
- **Symptom:** NVIDIA Nemotron LLM output chain-of-thought text before returning raw JSON arrays, causing 198 JSON parse failures in initial naive runs.
- **Solution:** Designed a 4-stage fallback parser: `json.loads` -> Markdown block stripper -> Substring array matcher (`r'\[\s*\{.*\}\s*\]'`) -> Dict pair regex extractor. Recovered 100% of CoT responses.

### Challenge 2: API 429 Bottlenecks Under Free-Tier Limits
- **Symptom:** Fixed RPM limits resulted in worker sleep locks inside semaphore slots and API timeouts.
- **Solution:** Replaced static semaphores with an **AIMD Adaptive Rate Limiter** and non-blocking worker queue with exponential jittered backoff.
