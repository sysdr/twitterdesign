// Compressed Sparse Row (CSR) format for memory-efficient graph storage
export class GraphCSR {
  private offsets: Uint32Array;
  private targets: Uint32Array;
  private edgeCount: number;
  private nodeCount: number;

  constructor(edges: [number, number][]) {
    const maxNode = edges.reduce((max, [src, dst]) => Math.max(max, src, dst), 0);
    this.nodeCount = maxNode + 1;
    this.edgeCount = edges.length;

    // Count out-degrees
    const degrees = new Uint32Array(this.nodeCount);
    edges.forEach(([src]) => degrees[src]++);

    // Build offset array (prefix sum of degrees)
    this.offsets = new Uint32Array(this.nodeCount + 1);
    for (let i = 0; i < this.nodeCount; i++) {
      this.offsets[i + 1] = this.offsets[i] + degrees[i];
    }

    // Fill targets array
    this.targets = new Uint32Array(this.edgeCount);
    const currentPos = new Uint32Array(degrees);
    edges.forEach(([src, dst]) => {
      const pos = this.offsets[src] + currentPos[src]++;
      this.targets[pos] = dst;
    });
  }

  getNeighbors(node: number): number[] {
    const start = this.offsets[node];
    const end = this.offsets[node + 1];
    return Array.from(this.targets.slice(start, end));
  }

  getDegree(node: number): number {
    return this.offsets[node + 1] - this.offsets[node];
  }

  getNodeCount(): number {
    return this.nodeCount;
  }

  getEdgeCount(): number {
    return this.edgeCount;
  }
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  density: number;
}

export function computeGraphMetrics(graph: GraphCSR): GraphMetrics {
  const nodeCount = graph.getNodeCount();
  const edgeCount = graph.getEdgeCount();
  
  let maxDegree = 0;
  for (let i = 0; i < nodeCount; i++) {
    maxDegree = Math.max(maxDegree, graph.getDegree(i));
  }

  return {
    nodeCount,
    edgeCount,
    avgDegree: edgeCount / nodeCount,
    maxDegree,
    density: (2 * edgeCount) / (nodeCount * (nodeCount - 1))
  };
}
