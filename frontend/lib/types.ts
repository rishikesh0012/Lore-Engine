export interface Character {
  id: string;
  name: string;
  title: string;
  tradition: string;
  sources: string[];
  aliases: string[];
  connectionsCount: number;
  conflictCount: number;
  avatar: string;
  summary: string;
}

export interface Relationship {
  id: string;
  entity_a: string;
  relation_type: string;
  entity_b: string;
  source: string;
  confidence: number;
}

export interface GraphNode {
  id: string;
  label: string;
  group?: string;
  val?: number;
  type?: string;
}

export interface GraphLink {
  id?: string;
  source: string;
  target: string;
  label?: string;
  relation?: string;
  confidence?: number;
  sourceDoc?: string;
}

export interface DashboardData {
  stats: {
    total_characters: number;
    total_relationships: number;
    sources_indexed: number;
    active_conflicts: number;
  };
  sources: Array<{
    id: string;
    name: string;
    passages: number;
    relationships: number;
    status: string;
  }>;
  relationship_distribution: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  most_connected: Array<{
    name: string;
    connections: number;
    role: string;
  }>;
  pipeline_status: {
    current_source: string;
    progress_pct: number;
    rpm: number;
    errors_429: number;
    circuit_breaker: string;
    eta: string;
  };
}

export interface AnalyticsData {
  network_stats: {
    node_count: number;
    edge_count: number;
    avg_degree: number;
    density: number;
    diameter: number;
  };
  centrality_rankings: Array<{
    character: string;
    degree: number;
    betweenness: number;
    closeness: number;
  }>;
  degree_distribution: Array<{
    degree_range: string;
    count: number;
  }>;
  source_contributions: Array<{
    source: string;
    relationships: number;
    percentage: number;
  }>;
}

export interface AskResponse {
  answer: string;
  confidence: number;
  entities: string[];
  passages: Array<{
    source: string;
    text: string;
  }>;
  graph_nodes: Array<{ id: string; label: string }>;
}

export interface CompareResponse {
  source_a: string;
  source_b: string;
  agreements: Array<{
    entity: string;
    relation: string;
    target: string;
    evidence_a: string;
    evidence_b: string;
  }>;
  contradictions: Array<{
    entity: string;
    relation: string;
    claim_a: string;
    claim_b: string;
    type: string;
    confidence: string;
  }>;
  unique_to_a: Array<{ entity: string; relation: string; target: string }>;
  unique_to_b: Array<{ entity: string; relation: string; target: string }>;
}
