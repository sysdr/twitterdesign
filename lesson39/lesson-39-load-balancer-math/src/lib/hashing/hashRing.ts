import { Server, VirtualNode, HashRing } from '../../types';
import { murmurhash3 } from './murmurhash';

export class WeightedHashRing {
  private nodes: VirtualNode[] = [];
  private serverMap: Map<string, Server> = new Map();
  private baseVirtualNodes: number;

  constructor(baseVirtualNodes: number = 150) {
    this.baseVirtualNodes = baseVirtualNodes;
  }

  addServer(server: Server): void {
    this.serverMap.set(server.id, server);
    this.rebuildRing();
  }

  removeServer(serverId: string): void {
    this.serverMap.delete(serverId);
    this.rebuildRing();
  }

  updateServerWeight(serverId: string, weight: number): void {
    const server = this.serverMap.get(serverId);
    if (server) {
      server.effectiveWeight = weight;
      this.rebuildRing();
    }
  }

  private rebuildRing(): void {
    this.nodes = [];
    
    const servers = Array.from(this.serverMap.values());
    if (servers.length === 0) return;
    
    for (const server of servers) {
      // Virtual nodes proportional to effective weight
      // baseVirtualNodes represents nodes per unit weight
      // A server with weight 1.0 gets baseVirtualNodes nodes
      // A server with weight 2.0 gets 2 * baseVirtualNodes nodes
      // Using a multiplier to increase node count and reduce hash distribution variance
      const multiplier = Math.max(1, servers.length);
      const numNodes = Math.max(1, Math.round(this.baseVirtualNodes * server.effectiveWeight * multiplier));
      server.virtualNodes = numNodes;

      for (let i = 0; i < numNodes; i++) {
        const hash = murmurhash3(`${server.id}:${i}`);
        this.nodes.push({
          hash,
          serverId: server.id,
          index: i
        });
      }
    }

    // Sort by hash for binary search
    this.nodes.sort((a, b) => a.hash - b.hash);
  }

  getServer(key: string): string | null {
    if (this.nodes.length === 0) return null;

    const hash = murmurhash3(key);
    
    // Binary search for first node with hash >= key hash
    let low = 0;
    let high = this.nodes.length - 1;
    
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.nodes[mid].hash < hash) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    // Wrap around if needed
    const index = this.nodes[low].hash >= hash ? low : 0;
    return this.nodes[index].serverId;
  }

  getNextServer(key: string, skipServers: Set<string>): string | null {
    if (this.nodes.length === 0) return null;

    const hash = murmurhash3(key);
    
    // Find starting position
    let low = 0;
    let high = this.nodes.length - 1;
    
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.nodes[mid].hash < hash) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    // Search for next available server
    for (let i = 0; i < this.nodes.length; i++) {
      const index = (low + i) % this.nodes.length;
      const serverId = this.nodes[index].serverId;
      if (!skipServers.has(serverId)) {
        return serverId;
      }
    }

    return null;
  }

  getState(): HashRing {
    return {
      nodes: [...this.nodes],
      serverMap: new Map(this.serverMap)
    };
  }

  getServers(): Server[] {
    return Array.from(this.serverMap.values());
  }
}
