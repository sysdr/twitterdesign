const API_BASE = '/api';

export const graphAPI = {
  async generateGraph(type: string, nodeCount: number, avgDegree: number, communityCount?: number) {
    const response = await fetch(`${API_BASE}/graph/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, nodeCount, avgDegree, communityCount })
    });
    return response.json();
  },

  async detectCommunities() {
    const response = await fetch(`${API_BASE}/analysis/communities`, {
      method: 'POST'
    });
    return response.json();
  },

  async computePageRank(personalized: boolean = false, sourceNodes?: number[]) {
    const response = await fetch(`${API_BASE}/analysis/pagerank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalized, sourceNodes })
    });
    return response.json();
  },

  async partitionGraph(numPartitions: number, method: string = 'hash') {
    const response = await fetch(`${API_BASE}/analysis/partition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numPartitions, method })
    });
    return response.json();
  },

  async getGraphData() {
    const response = await fetch(`${API_BASE}/graph/data`);
    return response.json();
  }
};

export function connectWebSocket(onMessage: (data: any) => void): WebSocket {
  const ws = new WebSocket('ws://localhost:3047');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
