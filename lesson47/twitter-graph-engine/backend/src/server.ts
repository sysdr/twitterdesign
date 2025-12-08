import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { GraphCSR, computeGraphMetrics } from './graph.js';
import { LabelPropagation } from './labelPropagation.js';
import { PageRank } from './pageRank.js';
import { GraphPartitioner } from './graphPartitioning.js';
import { GraphGenerator } from './graphGenerator.js';

const app = express();
const PORT = 3047;

app.use(cors());
app.use(express.json());

// Global graph state
let currentGraph: GraphCSR | null = null;
let graphData: { nodes: any[], edges: any[] } | null = null;

// WebSocket for real-time updates
const wss = new WebSocketServer({ noServer: true });

function broadcast(data: any) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// Generate graph
app.post('/api/graph/generate', (req, res) => {
  try {
    const { type, nodeCount, avgDegree, communityCount } = req.body;

    let edges: [number, number][];
    if (type === 'scale-free') {
      edges = GraphGenerator.generateScaleFree({ nodeCount, avgDegree });
    } else if (type === 'community') {
      edges = GraphGenerator.generateCommunity({ nodeCount, avgDegree, communityCount });
    } else if (type === 'small-world') {
      edges = GraphGenerator.generateSmallWorld(nodeCount, avgDegree);
    } else {
      throw new Error('Invalid graph type');
    }

    currentGraph = new GraphCSR(edges);
    const metrics = computeGraphMetrics(currentGraph);

    // Prepare graph data for visualization
    graphData = {
      nodes: Array.from({ length: nodeCount }, (_, i) => ({
        id: i,
        degree: currentGraph!.getDegree(i)
      })),
      edges: edges.slice(0, Math.min(5000, edges.length)).map(([src, dst]) => ({ source: src, target: dst }))
    };

    broadcast({ type: 'graph-generated', data: { metrics, graphData } });

    res.json({ success: true, metrics, nodeCount: graphData.nodes.length, edgeCount: graphData.edges.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run community detection
app.post('/api/analysis/communities', async (req, res) => {
  if (!currentGraph) {
    return res.status(400).json({ error: 'No graph loaded' });
  }

  try {
    const lpa = new LabelPropagation(currentGraph);
    const result = lpa.detect();

    const communityData = Array.from(result.communities.entries()).map(([id, nodes]) => ({
      id,
      size: nodes.length,
      nodes: nodes.slice(0, 100) // Limit for visualization
    }));

    broadcast({ type: 'communities-detected', data: { communityData, result } });

    res.json({
      success: true,
      communityCount: result.communities.size,
      modularity: result.modularity,
      iterations: result.iterations,
      executionTime: result.executionTime,
      communities: communityData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Run PageRank
app.post('/api/analysis/pagerank', async (req, res) => {
  if (!currentGraph) {
    return res.status(400).json({ error: 'No graph loaded' });
  }

  try {
    const { personalized, sourceNodes } = req.body;
    const pagerank = new PageRank(currentGraph);

    const result = personalized && sourceNodes
      ? pagerank.computePersonalized(sourceNodes)
      : pagerank.compute();

    broadcast({ type: 'pagerank-computed', data: { result } });

    res.json({
      success: true,
      ...result,
      ranks: undefined, // Don't send full rank array
      topInfluencers: result.topInfluencers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Partition graph
app.post('/api/analysis/partition', async (req, res) => {
  if (!currentGraph) {
    return res.status(400).json({ error: 'No graph loaded' });
  }

  try {
    const { numPartitions, method } = req.body;
    const partitioner = new GraphPartitioner(currentGraph);

    const result = method === 'metis'
      ? partitioner.metisPartition(numPartitions)
      : partitioner.partition(numPartitions);

    const partitionSizes = new Map<number, number>();
    for (const partition of result.partitions.values()) {
      partitionSizes.set(partition, (partitionSizes.get(partition) || 0) + 1);
    }

    // Convert Map to array for WebSocket broadcast (Maps don't serialize well in JSON)
    const partitionSizesArray = Array.from(partitionSizes.entries());
    broadcast({ type: 'graph-partitioned', data: { result, partitionSizes: partitionSizesArray } });

    res.json({
      success: true,
      edgeCut: result.edgeCut,
      balance: result.balance,
      executionTime: result.executionTime,
      partitionSizes: Array.from(partitionSizes.entries())
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get graph data for visualization
app.get('/api/graph/data', (req, res) => {
  if (!graphData) {
    return res.status(404).json({ error: 'No graph data available' });
  }
  res.json(graphData);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`Graph Engine server running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Graph Engine' }));
});
