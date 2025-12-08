export interface GraphGeneratorOptions {
  nodeCount: number;
  avgDegree: number;
  communityCount?: number;
  powerLawExponent?: number;
}

export class GraphGenerator {
  static generateScaleFree(options: GraphGeneratorOptions): [number, number][] {
    const { nodeCount, avgDegree, powerLawExponent = 2.5 } = options;
    const edges: [number, number][] = [];
    const degrees = new Array(nodeCount).fill(1);

    // Barabási-Albert model for scale-free networks
    for (let newNode = avgDegree; newNode < nodeCount; newNode++) {
      const targets = this.selectTargets(degrees, avgDegree, newNode);
      
      for (const target of targets) {
        edges.push([newNode, target]);
        edges.push([target, newNode]); // Undirected
        degrees[newNode]++;
        degrees[target]++;
      }
    }

    return edges;
  }

  static generateCommunity(options: GraphGeneratorOptions): [number, number][] {
    const { nodeCount, avgDegree, communityCount = 5 } = options;
    const edges: [number, number][] = [];
    const communitySize = Math.floor(nodeCount / communityCount);

    // Generate edges within communities (high probability)
    for (let c = 0; c < communityCount; c++) {
      const start = c * communitySize;
      const end = Math.min((c + 1) * communitySize, nodeCount);

      for (let i = start; i < end; i++) {
        const numEdges = avgDegree;
        for (let e = 0; e < numEdges; e++) {
          const target = start + Math.floor(Math.random() * (end - start));
          if (target !== i) {
            edges.push([i, target]);
          }
        }
      }
    }

    // Add inter-community edges (low probability)
    const interCommunityEdges = Math.floor(nodeCount * avgDegree * 0.1);
    for (let i = 0; i < interCommunityEdges; i++) {
      const src = Math.floor(Math.random() * nodeCount);
      const dst = Math.floor(Math.random() * nodeCount);
      const srcCommunity = Math.floor(src / communitySize);
      const dstCommunity = Math.floor(dst / communitySize);
      
      if (srcCommunity !== dstCommunity) {
        edges.push([src, dst]);
      }
    }

    return edges;
  }

  static generateSmallWorld(nodeCount: number, avgDegree: number, rewireProbability: number = 0.1): [number, number][] {
    const edges: [number, number][] = [];
    const k = Math.floor(avgDegree / 2);

    // Start with ring lattice
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 1; j <= k; j++) {
        const target = (i + j) % nodeCount;
        edges.push([i, target]);
      }
    }

    // Rewire edges with probability
    const rewired = new Set<string>();
    for (let i = 0; i < edges.length; i++) {
      if (Math.random() < rewireProbability) {
        const [src, oldDst] = edges[i];
        const newDst = Math.floor(Math.random() * nodeCount);
        const key = `${src}-${newDst}`;
        
        if (newDst !== src && !rewired.has(key)) {
          edges[i] = [src, newDst];
          rewired.add(key);
        }
      }
    }

    return edges;
  }

  private static selectTargets(degrees: number[], count: number, exclude: number): number[] {
    const totalDegree = degrees.reduce((sum, d, i) => i < exclude ? sum + d : sum, 0);
    const targets = new Set<number>();

    while (targets.size < count) {
      let r = Math.random() * totalDegree;
      for (let i = 0; i < exclude; i++) {
        r -= degrees[i];
        if (r <= 0) {
          targets.add(i);
          break;
        }
      }
    }

    return Array.from(targets);
  }
}
