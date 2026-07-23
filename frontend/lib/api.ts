import { Character, Relationship, GraphNode, GraphLink, DashboardData, AnalyticsData, AskResponse, CompareResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
const DEFAULT_TIMEOUT_MS = 8000;

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs / 1000}s while fetching ${url}`);
    }
    throw error;
  }
}

export async function fetchHealthStatus(): Promise<{ status: string; neo4j: boolean; qdrant: boolean }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (e) {
    if (USE_MOCK) {
      return { status: "ok (mock)", neo4j: true, qdrant: true };
    }
    return { status: "offline", neo4j: false, qdrant: false };
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/dashboard`);
    if (!res.ok) throw new Error(`Dashboard API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to load Dashboard data: ${(e as Error).message}`);
    }
    return {
      stats: { total_characters: 184, total_relationships: 1145, sources_indexed: 4, active_conflicts: 52 },
      sources: [
        { id: "hesiod_theogony", name: "Hesiod's Theogony", passages: 139, relationships: 87, status: "Completed" },
        { id: "homer_iliad", name: "Homer's Iliad", passages: 2143, relationships: 913, status: "Completed" },
        { id: "homer_odyssey", name: "Homer's Odyssey", passages: 1027, relationships: 53, status: "Processing" },
        { id: "ovid_metamorphoses", name: "Ovid's Metamorphoses", passages: 3020, relationships: 0, status: "Queued" }
      ],
      relationship_distribution: [
        { name: "OPPOSES", count: 347, color: "#EF4444" },
        { name: "ALLIES_WITH", count: 245, color: "#10B981" },
        { name: "PARENT_OF", count: 182, color: "#3B82F6" },
        { name: "LOCATED_AT", count: 131, color: "#F59E0B" },
        { name: "SIBLING_OF", count: 53, color: "#8B5CF6" },
        { name: "MARRIED_TO", count: 44, color: "#EC4899" }
      ],
      most_connected: [
        { name: "Zeus", connections: 42, role: "Deity" },
        { name: "Athena", connections: 38, role: "Deity" },
        { name: "Apollo", connections: 33, role: "Deity" },
        { name: "Odysseus", connections: 31, role: "Hero" },
        { name: "Poseidon", connections: 29, role: "Deity" }
      ],
      pipeline_status: {
        current_source: "homer_odyssey",
        progress_pct: 85.0,
        rpm: 25.0,
        errors_429: 0,
        circuit_breaker: "CLOSED",
        eta: "02m 15s"
      }
    };
  }
}

export async function fetchCharacters(search?: string): Promise<{ items: Character[]; total: number }> {
  try {
    const url = new URL(`${API_BASE_URL}/characters`);
    if (search) url.searchParams.append("search", search);
    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) throw new Error(`Characters API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to load Characters: ${(e as Error).message}`);
    }
    return {
      total: 8,
      items: [
        { id: "zeus", name: "Zeus", title: "King of the Gods", tradition: "Greek", sources: ["Hesiod", "Iliad", "Odyssey"], aliases: ["Jove", "Jupiter"], connectionsCount: 42, conflictCount: 8, avatar: "⚡", summary: "Supreme ruler of Olympus." },
        { id: "athena", name: "Athena", title: "Goddess of Wisdom", tradition: "Greek", sources: ["Iliad", "Odyssey"], aliases: ["Minerva"], connectionsCount: 38, conflictCount: 3, avatar: "🦉", summary: "Champion of wisdom and strategy." },
        { id: "odysseus", name: "Odysseus", title: "King of Ithaca", tradition: "Greek", sources: ["Iliad", "Odyssey"], aliases: ["Ulysses"], connectionsCount: 31, conflictCount: 6, avatar: "⛵", summary: "Cunning hero of the Odyssey." }
      ]
    };
  }
}

export async function fetchCharacterProfile(id: string): Promise<any> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/characters/${id}`);
    if (!res.ok) throw new Error(`Profile API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to load Character Profile for ${id}: ${(e as Error).message}`);
    }
    return {
      profile: { id, name: id.toUpperCase(), title: "Mythological Figure", tradition: "Ancient", sources: ["Hesiod", "Homer"], aliases: [id], connectionsCount: 12, conflictCount: 1, avatar: "🏛️", summary: "Classical figure." },
      relationships: [
        { id: "1", entity_a: id, relation_type: "ALLIES_WITH", entity_b: "Zeus", source: "Hesiod", confidence: 0.95 }
      ],
      subgraph: { nodes: [{ id, label: id }], edges: [] }
    };
  }
}

export async function fetchRelationships(filterType?: string, search?: string): Promise<{ items: Relationship[]; total: number }> {
  try {
    const url = new URL(`${API_BASE_URL}/relationships`);
    if (filterType && filterType !== "ALL") url.searchParams.append("relation_type", filterType);
    if (search) url.searchParams.append("search", search);
    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) throw new Error(`Relationships API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to load Relationships: ${(e as Error).message}`);
    }
    return {
      total: 5,
      items: [
        { id: "r1", entity_a: "Zeus", relation_type: "PARENT_OF", entity_b: "Athena", source: "hesiod_theogony", confidence: 1.0 },
        { id: "r2", entity_a: "Poseidon", relation_type: "OPPOSES", entity_b: "Odysseus", source: "homer_odyssey", confidence: 0.98 }
      ]
    };
  }
}

export async function fetchGraph(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/graph`);
    if (!res.ok) throw new Error(`Graph API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to load Knowledge Graph: ${(e as Error).message}`);
    }
    return {
      nodes: [
        { id: "Zeus", label: "Zeus", group: "Greek", val: 42 },
        { id: "Athena", label: "Athena", group: "Greek", val: 38 },
        { id: "Odysseus", label: "Odysseus", group: "Greek", val: 31 },
        { id: "Poseidon", label: "Poseidon", group: "Greek", val: 29 }
      ],
      links: [
        { source: "Zeus", target: "Athena", label: "PARENT_OF", confidence: 1.0 },
        { source: "Poseidon", target: "Odysseus", label: "OPPOSES", confidence: 0.98 },
        { source: "Athena", target: "Odysseus", label: "ALLIES_WITH", confidence: 0.99 }
      ]
    };
  }
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics`);
    if (!res.ok) throw new Error(`Analytics API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to load Analytics: ${(e as Error).message}`);
    }
    return {
      network_stats: { node_count: 184, edge_count: 1145, avg_degree: 12.4, density: 0.068, diameter: 5 },
      centrality_rankings: [
        { character: "Zeus", degree: 42, betweenness: 0.42, closeness: 0.78 },
        { character: "Athena", degree: 38, betweenness: 0.35, closeness: 0.72 }
      ],
      degree_distribution: [
        { degree_range: "1-5", count: 65 },
        { degree_range: "6-10", count: 48 }
      ],
      source_contributions: [
        { source: "Homer's Iliad", relationships: 913, percentage: 79.7 },
        { source: "Hesiod's Theogony", relationships: 87, percentage: 7.6 }
      ]
    };
  }
}

export async function askQuestion(query: string, sourceFilter?: string): Promise<AskResponse> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, source_filter: sourceFilter })
    }, 12000);
    if (!res.ok) throw new Error(`Ask API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to process query on backend: ${(e as Error).message}`);
    }

    const qLower = query.toLowerCase();

    if (qLower.includes("athena") || qLower.includes("born")) {
      return {
        answer: "According to Hesiod's Theogony, Athena was born fully armed from the head of Zeus after he swallowed Metis. Homer's Iliad and Odyssey further depict her as the grey-eyed champion of strategic warfare and wisdom who actively aids Telemachus and Odysseus.",
        confidence: 0.98,
        entities: ["Athena", "Zeus", "Metis", "Odysseus"],
        passages: [
          { source: "Hesiod's Theogony (lines 924-929)", text: "Zeus himself from his own head gave birth to bright-eyed Athena, the awful, strife-stirring leader of the host." },
          { source: "Homer's Odyssey (Book 1, lines 44-50)", text: "Grey-eyed Athena spoke: 'O Father, King of Kings, Odysseus' heart is torn for his longing to return home.'" }
        ],
        graph_nodes: [{ id: "Zeus", label: "Zeus" }, { id: "Athena", label: "Athena" }, { id: "Metis", label: "Metis" }]
      };
    } else if (qLower.includes("poseidon") || qLower.includes("odysseus")) {
      return {
        answer: "The central conflict between Poseidon and Odysseus stems from Odysseus blinding Poseidon's cyclops son, Polyphemus, in Homer's Odyssey. In revenge, Poseidon vows that Odysseus shall suffer ten years of shipwreck and storm before reaching Ithaca.",
        confidence: 0.96,
        entities: ["Poseidon", "Odysseus", "Polyphemus", "Ithaca"],
        passages: [
          { source: "Homer's Odyssey (Book 9, lines 525-535)", text: "Hear me, Poseidon, lord of the dark waves: grant that Odysseus, raider of cities, never reaches his home in Ithaca!" },
          { source: "Homer's Odyssey (Book 1, lines 68-75)", text: "Poseidon the Earth-shaker rages unceasingly against noble Odysseus because he blinded Polyphemus the Cyclops." }
        ],
        graph_nodes: [{ id: "Poseidon", label: "Poseidon" }, { id: "Odysseus", label: "Odysseus" }, { id: "Polyphemus", label: "Polyphemus" }]
      };
    } else if (qLower.includes("ovid") || qLower.includes("diff") || qLower.includes("zeus")) {
      return {
        answer: "In Ovid's Metamorphoses, Zeus (referred to as Jove/Jupiter) is portrayed with a focus on dramatic transformations, psychological passions, and Roman imperial allegories. In contrast, Hesiod's Theogony emphasizes cosmic lineage, divine order, and the Titanomachy.",
        confidence: 0.92,
        entities: ["Zeus", "Jove", "Ovid", "Hesiod", "Cronos"],
        passages: [
          { source: "Ovid's Metamorphoses (Book 1, lines 150-165)", text: "Jove from his high citadel looked down upon the crimes of mankind and commanded the Great Flood to cleanse the earth." },
          { source: "Hesiod's Theogony (lines 453-465)", text: "Cronos swallowed his children as each came from the holy womb, but Zeus was hidden in Crete." }
        ],
        graph_nodes: [{ id: "Zeus", label: "Zeus" }, { id: "Jove", label: "Jove" }, { id: "Hesiod", label: "Hesiod" }]
      };
    }

    return {
      answer: `Cross-referencing mythological graph index for query: "${query}". Graph retrieval identifies 3 primary entities and 5 connected relationships across Hesiod and Homer.`,
      confidence: 0.90,
      entities: ["Zeus", "Apollo", "Athena"],
      passages: [
        { source: "Homer's Iliad (Book 1, lines 1-15)", text: "Sing, O goddess, the anger of Achilles son of Peleus, that brought countless ills upon the Achaeans." }
      ],
      graph_nodes: [{ id: "Zeus", label: "Zeus" }, { id: "Apollo", label: "Apollo" }]
    };
  }
}

export async function compareSources(sourceA: string, sourceB: string): Promise<CompareResponse> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_a: sourceA, source_b: sourceB })
    }, 12000);
    if (!res.ok) throw new Error(`Comparison API error (${res.status})`);
    return await res.json();
  } catch (e) {
    if (!USE_MOCK) {
      throw new Error(`Failed to compare sources on backend: ${(e as Error).message}`);
    }
    return {
      source_a: sourceA,
      source_b: sourceB,
      agreements: [
        { entity: "Zeus / Jove", relation: "PARENT_OF", target: "Athena / Minerva", evidence_a: "Hesiod states Athena born from Zeus", evidence_b: "Ovid refers to Minerva as Jove's child" }
      ],
      contradictions: [
        { entity: "Zeus / Jove", relation: "PARENT_OF", claim_a: "Father of Hermes (Hesiod)", claim_b: "Father of Sarpedon (Homer Iliad)", type: "Disputed Parentage", confidence: "High" }
      ],
      unique_to_a: [{ entity: "Cronos", relation: "PARENT_OF", target: "Titan" }],
      unique_to_b: [{ entity: "Jove", relation: "PARENT_OF", target: "Sarpedon" }]
    };
  }
}
