import { GraphCSR, computeGraphMetrics } from '../src/graph';
import { LabelPropagation } from '../src/labelPropagation';
import { PageRank } from '../src/pageRank';
import { GraphPartitioner } from '../src/graphPartitioning';

describe('Graph Processing', () => {
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [0, 4], [4, 5], [5, 6], [6, 0]
  ];

  let graph: GraphCSR;

  beforeEach(() => {
    graph = new GraphCSR(edges);
  });

  test('GraphCSR stores graph correctly', () => {
    expect(graph.getNodeCount()).toBe(7);
    expect(graph.getEdgeCount()).toBe(8);
    expect(graph.getDegree(0)).toBeGreaterThan(0);
  });

  test('Graph metrics calculation', () => {
    const metrics = computeGraphMetrics(graph);
    expect(metrics.nodeCount).toBe(7);
    expect(metrics.edgeCount).toBe(8);
    expect(metrics.avgDegree).toBeGreaterThan(0);
  });

  test('Label Propagation detects communities', () => {
    const lpa = new LabelPropagation(graph);
    const result = lpa.detect(10);
    
    expect(result.communities.size).toBeGreaterThan(0);
    expect(result.iterations).toBeLessThanOrEqual(10);
    expect(result.modularity).toBeGreaterThanOrEqual(-1);
    expect(result.modularity).toBeLessThanOrEqual(1);
  });

  test('PageRank computes influence scores', () => {
    const pagerank = new PageRank(graph);
    const result = pagerank.compute(0.001, 50);
    
    expect(result.ranks.length).toBe(7);
    expect(result.iterations).toBeLessThanOrEqual(50);
    expect(result.topInfluencers.length).toBeGreaterThan(0);
    
    // Sum of ranks should be approximately 1
    const sum = Array.from(result.ranks).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 1);
  });

  test('Graph partitioning creates balanced partitions', () => {
    const partitioner = new GraphPartitioner(graph);
    const result = partitioner.partition(2);
    
    expect(result.partitions.size).toBe(7);
    expect(result.balance).toBeGreaterThan(0.5);
    expect(result.edgeCut).toBeGreaterThanOrEqual(0);
  });

  test('Personalized PageRank biases toward source nodes', () => {
    const pagerank = new PageRank(graph);
    const result = pagerank.computePersonalized([0, 1]);
    
    // Nodes 0 and 1 should have higher ranks than others
    expect(result.ranks[0]).toBeGreaterThan(result.ranks[6]);
    expect(result.ranks[1]).toBeGreaterThan(result.ranks[6]);
  });
});
