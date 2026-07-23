import os
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter()

# --- Mock Data Stores & Live Fallback Functions ---

MOCK_CHARACTERS = [
    {
        "id": "zeus",
        "name": "Zeus",
        "title": "King of the Gods, God of Thunder & Sky",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Homer's Iliad", "Homer's Odyssey", "Ovid's Metamorphoses"],
        "aliases": ["Jove", "Jupiter", "Father of Gods and Men"],
        "connectionsCount": 42,
        "conflictCount": 8,
        "avatar": "⚡",
        "summary": "Supreme ruler of Mount Olympus, father of numerous gods and heroes across Greek and Roman tradition."
    },
    {
        "id": "hera",
        "name": "Hera",
        "title": "Queen of the Gods, Goddess of Marriage",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Homer's Iliad", "Ovid's Metamorphoses"],
        "aliases": ["Juno", "Ox-eyed Hera"],
        "connectionsCount": 24,
        "conflictCount": 5,
        "avatar": "👑",
        "summary": "Wife and sister of Zeus, patron goddess of marriage and women, known for her fierce rivalry with Zeus's consorts."
    },
    {
        "id": "athena",
        "name": "Athena",
        "title": "Goddess of Wisdom, Warfare & Craft",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Homer's Iliad", "Homer's Odyssey", "Ovid's Metamorphoses"],
        "aliases": ["Minerva", "Pallas Athene", "Grey-eyed Goddess"],
        "connectionsCount": 38,
        "conflictCount": 3,
        "avatar": "🦉",
        "summary": "Born fully armed from Zeus's forehead, champion of Odysseus and Achilles, embodiment of strategic war and wisdom."
    },
    {
        "id": "odysseus",
        "name": "Odysseus",
        "title": "King of Ithaca, Hero of Trojan War",
        "tradition": "Greek",
        "sources": ["Homer's Iliad", "Homer's Odyssey"],
        "aliases": ["Ulysses", "Man of Twists and Turns"],
        "connectionsCount": 31,
        "conflictCount": 6,
        "avatar": "⛵",
        "summary": "Cunning hero of the Odyssey, mastermind of the Trojan Horse, spent ten years journeying home to Ithaca."
    },
    {
        "id": "poseidon",
        "name": "Poseidon",
        "title": "God of the Sea, Earthquakes & Horses",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Homer's Iliad", "Homer's Odyssey", "Ovid's Metamorphoses"],
        "aliases": ["Neptune", "Earth-Shaker"],
        "connectionsCount": 29,
        "conflictCount": 7,
        "avatar": "🌊",
        "summary": "Brother of Zeus and Hades, relentless adversary of Odysseus after the blinding of Polyphemus."
    },
    {
        "id": "apollo",
        "name": "Apollo",
        "title": "God of Music, Prophecy, Sun & Healing",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Homer's Iliad", "Ovid's Metamorphoses"],
        "aliases": ["Phoebus", "Phoebus Apollo"],
        "connectionsCount": 33,
        "conflictCount": 4,
        "avatar": "☀️",
        "summary": "Son of Zeus and Leto, patron of Delphi, archer god who brought plague to the Achaean camp in the Iliad."
    },
    {
        "id": "ares",
        "name": "Ares",
        "title": "God of Savage War & Bloodlust",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Homer's Iliad", "Ovid's Metamorphoses"],
        "aliases": ["Mars"],
        "connectionsCount": 19,
        "conflictCount": 6,
        "avatar": "⚔️",
        "summary": "Son of Zeus and Hera, embodiment of untamed physical battle, wounded by Diomedes with Athena's aid."
    },
    {
        "id": "cronos",
        "name": "Cronos",
        "title": "Leader of the Titans, God of Time & Agriculture",
        "tradition": "Greek",
        "sources": ["Hesiod's Theogony", "Ovid's Metamorphoses"],
        "aliases": ["Saturn", "Kronos"],
        "connectionsCount": 16,
        "conflictCount": 9,
        "avatar": "⏳",
        "summary": "Titan ruler who swallowed his children to prevent prophecy, overthrown by Zeus in the Titanomachy."
    }
]

MOCK_RELATIONSHIPS = [
    {"id": "r1", "entity_a": "Zeus", "relation_type": "PARENT_OF", "entity_b": "Athena", "source": "hesiod_theogony", "confidence": 1.0},
    {"id": "r2", "entity_a": "Zeus", "relation_type": "MARRIED_TO", "entity_b": "Hera", "source": "hesiod_theogony", "confidence": 1.0},
    {"id": "r3", "entity_a": "Zeus", "relation_type": "PARENT_OF", "entity_b": "Apollo", "source": "homer_iliad", "confidence": 0.95},
    {"id": "r4", "entity_a": "Poseidon", "relation_type": "OPPOSES", "entity_b": "Odysseus", "source": "homer_odyssey", "confidence": 0.98},
    {"id": "r5", "entity_a": "Athena", "relation_type": "ALLIES_WITH", "entity_b": "Odysseus", "source": "homer_odyssey", "confidence": 0.99},
    {"id": "r6", "entity_a": "Cronos", "relation_type": "PARENT_OF", "entity_b": "Zeus", "source": "hesiod_theogony", "confidence": 1.0},
    {"id": "r7", "entity_a": "Ares", "relation_type": "ALLIES_WITH", "entity_b": "Homer_Iliad", "source": "homer_iliad", "confidence": 0.85},
    {"id": "r8", "entity_a": "Athena", "relation_type": "OPPOSES", "entity_b": "Ares", "source": "homer_iliad", "confidence": 0.95},
    {"id": "r9", "entity_a": "Odysseus", "relation_type": "LOCATED_AT", "entity_b": "Ithaca", "source": "homer_odyssey", "confidence": 1.0},
    {"id": "r10", "entity_a": "Jove", "relation_type": "PARENT_OF", "entity_b": "Minerva", "source": "ovid_metamorphoses", "confidence": 0.92},
]

# --- Endpoint Models ---

class QueryAskRequest(BaseModel):
    query: str
    source_filter: Optional[str] = None

class CompareSourceRequest(BaseModel):
    source_a: str
    source_b: str

# --- Endpoints Implementation ---

@router.get("/dashboard")
def get_dashboard_summary():
    return {
        "stats": {
            "total_characters": 184,
            "total_relationships": 1145,
            "sources_indexed": 4,
            "active_conflicts": 52
        },
        "sources": [
            {"id": "hesiod_theogony", "name": "Hesiod's Theogony", "passages": 139, "relationships": 87, "status": "Completed"},
            {"id": "homer_iliad", "name": "Homer's Iliad", "passages": 2143, "relationships": 913, "status": "Completed"},
            {"id": "homer_odyssey", "name": "Homer's Odyssey", "passages": 1027, "relationships": 53, "status": "Processing"},
            {"id": "ovid_metamorphoses", "name": "Ovid's Metamorphoses", "passages": 3020, "relationships": 0, "status": "Queued"}
        ],
        "relationship_distribution": [
            {"name": "OPPOSES", "count": 347, "color": "#EF4444"},
            {"name": "ALLIES_WITH", "count": 245, "color": "#10B981"},
            {"name": "PARENT_OF", "count": 182, "color": "#3B82F6"},
            {"name": "LOCATED_AT", "count": 131, "color": "#F59E0B"},
            {"name": "SIBLING_OF", "count": 53, "color": "#8B5CF6"},
            {"name": "MARRIED_TO", "count": 44, "color": "#EC4899"},
            {"name": "CAUSED_BY", "count": 32, "color": "#6366F1"}
        ],
        "most_connected": [
            {"name": "Zeus", "connections": 42, "role": "Deity"},
            {"name": "Athena", "connections": 38, "role": "Deity"},
            {"name": "Apollo", "connections": 33, "role": "Deity"},
            {"name": "Odysseus", "connections": 31, "role": "Hero"},
            {"name": "Poseidon", "connections": 29, "role": "Deity"}
        ],
        "pipeline_status": {
            "current_source": "homer_odyssey",
            "progress_pct": 85.0,
            "rpm": 25.0,
            "errors_429": 0,
            "circuit_breaker": "CLOSED",
            "eta": "02m 15s"
        }
    }

@router.get("/characters")
def get_characters(
    search: Optional[str] = None,
    tradition: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    filtered = MOCK_CHARACTERS
    if search:
        s = search.lower()
        filtered = [c for c in filtered if s in c["name"].lower() or any(s in a.lower() for a in c["aliases"])]
    
    total = len(filtered)
    paginated = filtered[offset : offset + limit]
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": paginated
    }

@router.get("/characters/{id}")
def get_character_profile(id: str):
    char = next((c for c in MOCK_CHARACTERS if c["id"].lower() == id.lower() or c["name"].lower() == id.lower()), None)
    if not char:
        # Fallback dummy profile
        char = {
            "id": id,
            "name": id.capitalize(),
            "title": "Mythological Figure",
            "tradition": "Classical Myth",
            "sources": ["Hesiod's Theogony", "Homer's Iliad"],
            "aliases": [id.capitalize()],
            "connectionsCount": 12,
            "conflictCount": 1,
            "avatar": "🏛️",
            "summary": f"Classical figure {id.capitalize()} referenced across Greek and Roman literature."
        }

    # Fetch character's specific relationships
    rels = [r for r in MOCK_RELATIONSHIPS if r["entity_a"].lower() == char["name"].lower() or r["entity_b"].lower() == char["name"].lower()]

    return {
        "profile": char,
        "relationships": rels,
        "subgraph": {
            "nodes": [{"id": char["name"], "label": char["name"], "type": "Character"}] + [{"id": r["entity_b"] if r["entity_a"].lower() == char["name"].lower() else r["entity_a"], "label": r["entity_b"] if r["entity_a"].lower() == char["name"].lower() else r["entity_a"], "type": "Character"} for r in rels],
            "edges": [{"source": r["entity_a"], "target": r["entity_b"], "relation": r["relation_type"]} for r in rels]
        }
    }

@router.get("/relationships")
def get_relationships(
    relation_type: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    filtered = MOCK_RELATIONSHIPS
    if relation_type:
        filtered = [r for r in filtered if r["relation_type"].upper() == relation_type.upper()]
    if source:
        filtered = [r for r in filtered if r["source"].lower() == source.lower()]
    if search:
        s = search.lower()
        filtered = [r for r in filtered if s in r["entity_a"].lower() or s in r["entity_b"].lower()]

    total = len(filtered)
    paginated = filtered[offset : offset + limit]
    return {
        "total": total,
        "items": paginated
    }

@router.get("/graph")
def get_full_graph(
    source: Optional[str] = None,
    relation_filter: Optional[str] = None
):
    nodes = [
        {"id": c["name"], "label": c["name"], "group": c["tradition"], "val": c["connectionsCount"]}
        for c in MOCK_CHARACTERS
    ]
    edges = [
        {
            "id": r["id"],
            "source": r["entity_a"],
            "target": r["entity_b"],
            "label": r["relation_type"],
            "confidence": r["confidence"],
            "sourceDoc": r["source"]
        }
        for r in MOCK_RELATIONSHIPS
    ]
    return {
        "nodes": nodes,
        "links": edges
    }

@router.get("/analytics")
def get_graph_analytics():
    return {
        "network_stats": {
            "node_count": 184,
            "edge_count": 1145,
            "avg_degree": 12.4,
            "density": 0.068,
            "diameter": 5
        },
        "centrality_rankings": [
            {"character": "Zeus", "degree": 42, "betweenness": 0.42, "closeness": 0.78},
            {"character": "Athena", "degree": 38, "betweenness": 0.35, "closeness": 0.72},
            {"character": "Apollo", "degree": 33, "betweenness": 0.28, "closeness": 0.69},
            {"character": "Odysseus", "degree": 31, "betweenness": 0.31, "closeness": 0.65},
            {"character": "Poseidon", "degree": 29, "betweenness": 0.22, "closeness": 0.63}
        ],
        "degree_distribution": [
            {"degree_range": "1-5", "count": 65},
            {"degree_range": "6-10", "count": 48},
            {"degree_range": "11-20", "count": 32},
            {"degree_range": "21-30", "count": 18},
            {"degree_range": "31+", "count": 5}
        ],
        "source_contributions": [
            {"source": "Homer's Iliad", "relationships": 913, "percentage": 79.7},
            {"source": "Hesiod's Theogony", "relationships": 87, "percentage": 7.6},
            {"source": "Homer's Odyssey", "relationships": 53, "percentage": 4.6},
            {"source": "Ovid's Metamorphoses", "relationships": 92, "percentage": 8.0}
        ]
    }

@router.post("/ask")
def ask_question(body: QueryAskRequest):
    q = body.query.lower()
    
    if "zeus" in q and "children" in q:
        answer = "Across the indexed traditions, Zeus is recorded as the father of Athena, Apollo, Artemis, Hermes, Ares, Dionysus, and Hercules. In Hesiod's Theogony, Athena's birth is notable as she emerged directly from Zeus's forehead."
        entities = ["Zeus", "Athena", "Apollo", "Hermes", "Ares"]
        confidence = 0.96
        passages = [
            {"source": "Hesiod's Theogony", "text": "Zeus himself from his own head gave birth to the bright-eyed Tritogeneia, the awful, strife-stirring, army-leading goddess."},
            {"source": "Homer's Iliad", "text": "Apollo, son of Zeus and Leto, came down from the peaks of Olympus enraged in heart."}
        ]
    elif "opposes" in q or "odysseus" in q:
        answer = "Odysseus is primarily opposed by Poseidon (Neptune) following the blinding of the Cyclops Polyphemus. He is also opposed by Aegisthus and the suitors of Penelope in Ithaca."
        entities = ["Odysseus", "Poseidon", "Aegisthus", "Athena"]
        confidence = 0.94
        passages = [
            {"source": "Homer's Odyssey", "text": "Poseidon, shaker of the earth, nursed a persistent rage against godlike Odysseus until he reached his native land."}
        ]
    else:
        answer = f"Based on cross-referencing Hesiod, Homer, and Ovid for '{body.query}': Entities and relationships show strong consistency across Greek traditions with key Roman name shifts."
        entities = ["Zeus", "Athena", "Odysseus"]
        confidence = 0.89
        passages = [
            {"source": "Hesiod's Theogony", "text": "First of all Titan Cronos ruled, and after him Zeus held the supreme seat of power."}
        ]

    return {
        "answer": answer,
        "confidence": confidence,
        "entities": entities,
        "passages": passages,
        "graph_nodes": [{"id": e, "label": e} for e in entities]
    }

@router.post("/compare")
def compare_sources(body: CompareSourceRequest):
    return {
        "source_a": body.source_a,
        "source_b": body.source_b,
        "agreements": [
            {"entity": "Zeus / Jove", "relation": "PARENT_OF", "target": "Athena / Minerva", "evidence_a": "Hesiod states Athena born from Zeus", "evidence_b": "Ovid refers to Minerva as Jove's child"},
            {"entity": "Cronos / Saturn", "relation": "PARENT_OF", "target": "Zeus / Jove", "evidence_a": "Hesiod names Cronos father of Zeus", "evidence_b": "Ovid refers to Saturn as father of Jove"}
        ],
        "contradictions": [
            {"entity": "Zeus / Jove", "relation": "PARENT_OF", "claim_a": "Father of Hermes (Hesiod)", "claim_b": "Father of Sarpedon (Homer Iliad)", "type": "Disputed Parentage", "confidence": "High"},
            {"entity": "Zeus", "relation": "OPPOSES", "claim_a": "Opposes Metis (Hesiod)", "claim_b": "Opposes Neptune (Homer Iliad)", "type": "Divergent Opposition", "confidence": "Lower"}
        ],
        "unique_to_a": [
            {"entity": "Cronos", "relation": "PARENT_OF", "target": "Titan"},
            {"entity": "Zeus", "relation": "OPPOSES", "target": "Metis"}
        ],
        "unique_to_b": [
            {"entity": "Jove", "relation": "PARENT_OF", "target": "Sarpedon"},
            {"entity": "Jove", "relation": "LOCATED_AT", "target": "Oceanus"}
        ]
    }
