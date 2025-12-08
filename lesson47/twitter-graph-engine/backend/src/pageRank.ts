import { GraphCSR } from './graph.js';

export interface PageRankResult {
  ranks: Float64Array;
  iterations: number;
  convergence: number;
  executionTime: number;
  topInfluencers: { node: number; rank: number }[];
}

export class PageRank {
  private graph: GraphCSR;
  private dampingFactor: number;

  constructor(graph: GraphCSR, dampingFactor: number = 0.85) {
    this.graph = graph;
    this.dampingFactor = dampingFactor;
  }

  compute(tolerance: number = 0.0001, maxIterations: number = 100): PageRankResult {
    const startTime = Date.now();
    const nodeCount = this.graph.getNodeCount();
    
    // Initialize ranks uniformly
    let ranks = new Float64Array(nodeCount);
    let newRanks = new Float64Array(nodeCount);
    const initialRank = 1.0 / nodeCount;
    ranks.fill(initialRank);

    let iteration = 0;
    let delta = Infinity;

    while (delta > tolerance && iteration < maxIterations) {
      iteration++;

      // Calculate new ranks
      newRanks.fill((1 - this.dampingFactor) / nodeCount);

      for (let src = 0; src < nodeCount; src++) {
        const neighbors = this.graph.getNeighbors(src);
        const contribution = this.dampingFactor * ranks[src] / neighbors.length;
        
        for (const dst of neighbors) {
          newRanks[dst] += contribution;
        }
      }

      // Calculate convergence
      delta = 0;
      for (let i = 0; i < nodeCount; i++) {
        delta += Math.abs(newRanks[i] - ranks[i]);
      }

      // Swap arrays
      [ranks, newRanks] = [newRanks, ranks];
    }

    // Find top influencers
    const topInfluencers = Array.from(ranks)
      .map((rank, node) => ({ node, rank }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 10);

    const executionTime = Date.now() - startTime;

    return {
      ranks,
      iterations: iteration,
      convergence: delta,
      executionTime,
      topInfluencers
    };
  }

  // Personalized PageRank biased toward specific nodes
  computePersonalized(sourceNodes: number[], tolerance: number = 0.0001): PageRankResult {
    const startTime = Date.now();
    const nodeCount = this.graph.getNodeCount();
    
    // Create personalization vector
    const personalization = new Float64Array(nodeCount);
    for (const node of sourceNodes) {
      personalization[node] = 1.0 / sourceNodes.length;
    }

    let ranks = new Float64Array(nodeCount);
    let newRanks = new Float64Array(nodeCount);
    ranks.fill(1.0 / nodeCount);

    let iteration = 0;
    let delta = Infinity;

    while (delta > tolerance && iteration < 100) {
      iteration++;

      for (let i = 0; i < nodeCount; i++) {
        newRanks[i] = (1 - this.dampingFactor) * personalization[i];
      }

      for (let src = 0; src < nodeCount; src++) {
        const neighbors = this.graph.getNeighbors(src);
        const contribution = this.dampingFactor * ranks[src] / neighbors.length;
        
        for (const dst of neighbors) {
          newRanks[dst] += contribution;
        }
      }

      delta = 0;
      for (let i = 0; i < nodeCount; i++) {
        delta += Math.abs(newRanks[i] - ranks[i]);
      }

      [ranks, newRanks] = [newRanks, ranks];
    }

    const topInfluencers = Array.from(ranks)
      .map((rank, node) => ({ node, rank }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 10);

    return {
      ranks,
      iterations: iteration,
      convergence: delta,
      executionTime: Date.now() - startTime,
      topInfluencers
    };
  }
}
