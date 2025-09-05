import { Server } from '../../types';

export class HashRing {
  private nodes: Map<number, Server> = new Map();
  private sortedHashes: number[] = [];
  private virtualNodes: number = 150;

  constructor(servers: Server[] = []) {
    servers.forEach(server => this.addServer(server));
  }

  private hash(key: string): number {
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  addServer(server: Server): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${server.id}:${i}`);
      this.nodes.set(hash, server);
    }
    this.sortedHashes = Array.from(this.nodes.keys()).sort((a, b) => a - b);
  }

  removeServer(serverId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${serverId}:${i}`);
      this.nodes.delete(hash);
    }
    this.sortedHashes = Array.from(this.nodes.keys()).sort((a, b) => a - b);
  }

  getServer(key: string): Server | null {
    if (this.sortedHashes.length === 0) return null;

    const hash = this.hash(key);
    let idx = this.binarySearch(hash);
    
    if (idx === this.sortedHashes.length) idx = 0;
    
    return this.nodes.get(this.sortedHashes[idx]) || null;
  }

  getServerWithBounds(key: string, serverLoads: Map<string, number>, maxLoad: number): Server | null {
    const avgLoad = Array.from(serverLoads.values()).reduce((a, b) => a + b, 0) / serverLoads.size || 0;
    const loadBound = avgLoad * 1.25;
    
    let attempts = 0;
    let currentKey = key;
    
    while (attempts < this.virtualNodes) {
      const server = this.getServer(currentKey);
      if (!server) return null;
      
      const serverLoad = serverLoads.get(server.id) || 0;
      if (serverLoad < Math.min(loadBound, maxLoad)) {
        return server;
      }
      
      currentKey = `${currentKey}:${attempts}`;
      attempts++;
    }
    
    return this.getServer(key);
  }

  private binarySearch(target: number): number {
    let left = 0;
    let right = this.sortedHashes.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedHashes[mid] < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    return left;
  }

  getDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.nodes.forEach(server => {
      distribution[server.id] = (distribution[server.id] || 0) + 1;
    });
    return distribution;
  }
}
