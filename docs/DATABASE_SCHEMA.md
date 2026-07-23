# Database Schema & Cypher Specification

## 1. Neo4j Graph Database Schema

```
       (:Source) <---[:MENTIONED_IN]--- (:Character) ---[:SAME_AS]---> (:Character)
                                             |
                                     [RELATIONSHIP_TYPE]
                                  (PARENT_OF, OPPOSES, etc.)
                                             v
                                        (:Character)
```

---

## Node Definitions

### 1. `Character` Node
Represents a mythological deity, hero, titan, or creature.
- **Properties:**
  - `name` (String, Required, Unique): Canonical character name (e.g., `Zeus`, `Odysseus`).
  - `label` (String): Display label.
  - `tradition` (String): Origin tradition (`Greek`, `Roman`).

### 2. `Source` Node
Represents an indexed classical manuscript or text document.
- **Properties:**
  - `name` (String, Required, Unique): Document identifier (`hesiod_theogony`, `homer_iliad`, `homer_odyssey`, `ovid_metamorphoses`).

---

## Relationship Edge Definitions

| Relationship Type | Direction | Description | Key Edge Properties |
|---|---|---|---|
| `PARENT_OF` | `(A) -> (B)` | Direct parental lineage | `source`, `confidence`, `passage_idx` |
| `SIBLING_OF` | `(A) <-> (B)` | Sibling relationship | `source`, `confidence` |
| `MARRIED_TO` | `(A) <-> (B)` | Conjugal / marital bond | `source`, `confidence` |
| `ALLIES_WITH` | `(A) -> (B)` | Military or divine alliance | `source`, `confidence` |
| `OPPOSES` | `(A) -> (B)` | Conflict, warfare, or rivalry | `source`, `confidence` |
| `LOCATED_AT` | `(A) -> (B)` | Geographic association | `source`, `confidence` |
| `SAME_AS` | `(A) <-> (B)` | Cross-tradition alias equivalence | `confidence` (1.0) |
| `MENTIONED_IN` | `(A) -> (S)` | Document citation reference | `passage_count` |

---

## Cypher Constraints & Indexes

```cypher
// Uniqueness Constraints
CREATE CONSTRAINT character_name_unique IF NOT EXISTS
FOR (c:Character) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT source_name_unique IF NOT EXISTS
FOR (s:Source) REQUIRE s.name IS UNIQUE;

// Composite Property Indexes
CREATE INDEX rel_source_idx IF NOT EXISTS
FOR ()-[r:PARENT_OF]-() REQUIRE (r.source);

CREATE INDEX rel_opposes_idx IF NOT EXISTS
FOR ()-[r:OPPOSES]-() REQUIRE (r.source);
```

---

## 2. Qdrant Vector Collection Schema

- **Collection Name:** `lore_chunks`
- **Vector Parameters:**
  - `size`: 384 dimensions (`all-MiniLM-L6-v2` / NVIDIA Embeddings)
  - `distance`: Cosine
- **Payload Schema:**
  - `chunk_id` (String): Unique passage UUID.
  - `chunk_text` (String): Raw verbatim text passage.
  - `source_document` (String): Indexed manuscript name.
  - `passage_index` (Integer): Sequential passage index within source.
  - `character_mentions` (List[String]): Extracted entity names present in chunk.
