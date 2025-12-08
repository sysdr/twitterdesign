export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  density: number;
}

export interface CommunityData {
  id: number;
  size: number;
  nodes: number[];
}

export interface AnalysisResult {
  communityCount?: number;
  modularity?: number;
  iterations?: number;
  executionTime: number;
  topInfluencers?: { node: number; rank: number }[];
  edgeCut?: number;
  balance?: number;
  communities?: CommunityData[];
  convergence?: number;
  partitionSizes?: [number, number][];
}

export interface GraphNode {
  id: number;
  degree: number;
  community?: number;
  rank?: number;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
