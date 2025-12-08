import { GraphCSR } from './graph.js';

export interface CommunityDetectionResult {
  communities: Map<number, number[]>;
  modularity: number;
  iterations: number;
  executionTime: number;
}

export class LabelPropagation {
  private graph: GraphCSR;

  constructor(graph: GraphCSR) {
    this.graph = graph;
  }

  detect(maxIterations: number = 50): CommunityDetectionResult {
    const startTime = Date.now();
    const nodeCount = this.graph.getNodeCount();
    
    // Initialize each node with unique label
    const labels = new Uint32Array(nodeCount);
    for (let i = 0; i < nodeCount; i++) {
      labels[i] = i;
    }

    let changed = true;
    let iteration = 0;

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;

      // Process nodes in random order
      const order = Array.from({ length: nodeCount }, (_, i) => i);
      this.shuffle(order);

      for (const node of order) {
        const neighbors = this.graph.getNeighbors(node);
        if (neighbors.length === 0) continue;

        // Count neighbor labels
        const labelCounts = new Map<number, number>();
        for (const neighbor of neighbors) {
          const label = labels[neighbor];
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        }

        // Find most frequent label
        let maxCount = 0;
        let newLabel = labels[node];
        for (const [label, count] of labelCounts) {
          if (count > maxCount || (count === maxCount && label < newLabel)) {
            maxCount = count;
            newLabel = label;
          }
        }

        if (labels[node] !== newLabel) {
          labels[node] = newLabel;
          changed = true;
        }
      }
    }

    // Group nodes by community
    const communities = new Map<number, number[]>();
    for (let node = 0; node < nodeCount; node++) {
      const community = labels[node];
      if (!communities.has(community)) {
        communities.set(community, []);
      }
      communities.get(community)!.push(node);
    }

    const modularity = this.calculateModularity(labels);
    const executionTime = Date.now() - startTime;

    return { communities, modularity, iterations: iteration, executionTime };
  }

  private calculateModularity(labels: Uint32Array): number {
    const nodeCount = this.graph.getNodeCount();
    const edgeCount = this.graph.getEdgeCount();
    let modularity = 0;

    for (let i = 0; i < nodeCount; i++) {
      for (let j = 0; j < nodeCount; j++) {
        if (labels[i] === labels[j]) {
          const neighbors = this.graph.getNeighbors(i);
          const aij = neighbors.includes(j) ? 1 : 0;
          const ki = this.graph.getDegree(i);
          const kj = this.graph.getDegree(j);
          modularity += aij - (ki * kj) / (2 * edgeCount);
        }
      }
    }

    return modularity / (2 * edgeCount);
  }

  private shuffle(array: number[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
