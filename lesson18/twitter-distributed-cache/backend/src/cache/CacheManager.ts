import Redis from 'ioredis';
import ConsistentHashing from 'consistent-hashing';
import { EventEmitter } from 'events';

export interface CacheNode {
  id: string;
  host: string;
  port: number;
  region: string;
  client?: Redis;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  avgResponseTime: number;
}

export class CacheManager extends EventEmitter {
  private static instance: CacheManager;
  private nodes: Map<string, CacheNode> = new Map();
  private consistentHashing: ConsistentHashing;
  private stats: Map<string, CacheStats> = new Map();
  private reconnectAttempts = new Map<string, number>();

  private constructor() {
    super();
    this.consistentHashing = new ConsistentHashing([], { replicas: 150 });
    this.initializeNodes();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async initializeNodes(): Promise<void> {
    const nodes: CacheNode[] = [
      { id: 'shard-1', host: 'localhost', port: 6379, region: 'us-west' },
      { id: 'shard-2', host: 'localhost', port: 6380, region: 'us-east' },
      { id: 'shard-3', host: 'localhost', port: 6381, region: 'eu-west' },
    ];

    for (const node of nodes) {
      await this.addNode(node);
    }

    console.log(`✅ Initialized ${nodes.length} cache nodes`);
  }

  public async addNode(node: CacheNode): Promise<void> {
    try {
      const client = new Redis({
        host: node.host,
        port: node.port,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      client.on('error', (err) => this.handleNodeError(node.id, err));
      client.on('connect', () => this.handleNodeConnect(node.id));
      client.on('ready', () => this.handleNodeReady(node.id));

      node.client = client;
      await client.connect();

      this.nodes.set(node.id, node);
      this.consistentHashing.addNode(node.id);
      this.stats.set(node.id, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
        avgResponseTime: 0
      });

      this.emit('nodeAdded', node);
      console.log(`📡 Added cache node: ${node.id} (${node.region})`);
    } catch (error) {
      console.error(`❌ Failed to add node ${node.id}:`, error);
      throw error;
    }
  }

  private handleNodeError(nodeId: string, error: any): void {
    console.error(`❌ Node ${nodeId} error:`, error.message);
    const attempts = this.reconnectAttempts.get(nodeId) || 0;
    this.reconnectAttempts.set(nodeId, attempts + 1);
    this.emit('nodeError', { nodeId, error, attempts });
  }

  private handleNodeConnect(nodeId: string): void {
    console.log(`🔗 Node ${nodeId} connected`);
    this.reconnectAttempts.set(nodeId, 0);
    this.emit('nodeConnect', nodeId);
  }

  private handleNodeReady(nodeId: string): void {
    console.log(`✅ Node ${nodeId} ready`);
    this.emit('nodeReady', nodeId);
  }

  private getNodeForKey(key: string): CacheNode | null {
    const nodeId = this.consistentHashing.getNode(key);
    return nodeId ? this.nodes.get(nodeId) || null : null;
  }

  public async get(key: string): Promise<string | null> {
    const startTime = Date.now();
    const node = this.getNodeForKey(key);
    
    if (!node || !node.client) {
      throw new Error(`No available node for key: ${key}`);
    }

    try {
      const value = await node.client.get(key);
      const responseTime = Date.now() - startTime;
      
      const stats = this.stats.get(node.id)!;
      if (value !== null) {
        stats.hits++;
      } else {
        stats.misses++;
      }
      stats.hitRate = stats.hits / (stats.hits + stats.misses) * 100;
      stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;

      this.emit('cacheGet', { key, nodeId: node.id, hit: value !== null, responseTime });
      return value;
    } catch (error) {
      console.error(`❌ Cache GET error for key ${key}:`, error);
      const stats = this.stats.get(node.id)!;
      stats.misses++;
      throw error;
    }
  }

  public async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    const startTime = Date.now();
    const node = this.getNodeForKey(key);
    
    if (!node || !node.client) {
      throw new Error(`No available node for key: ${key}`);
    }

    try {
      await node.client.setex(key, ttl, value);
      const responseTime = Date.now() - startTime;
      
      const stats = this.stats.get(node.id)!;
      stats.sets++;

      this.emit('cacheSet', { key, nodeId: node.id, responseTime });
    } catch (error) {
      console.error(`❌ Cache SET error for key ${key}:`, error);
      throw error;
    }
  }

  public async delete(key: string): Promise<number> {
    const node = this.getNodeForKey(key);
    
    if (!node || !node.client) {
      throw new Error(`No available node for key: ${key}`);
    }

    try {
      const result = await node.client.del(key);
      const stats = this.stats.get(node.id)!;
      stats.deletes++;

      this.emit('cacheDelete', { key, nodeId: node.id });
      return result;
    } catch (error) {
      console.error(`❌ Cache DELETE error for key ${key}:`, error);
      throw error;
    }
  }

  public async mget(keys: string[]): Promise<(string | null)[]> {
    const keysByNode = new Map<string, string[]>();
    
    // Group keys by their target nodes
    keys.forEach(key => {
      const node = this.getNodeForKey(key);
      if (node) {
        if (!keysByNode.has(node.id)) {
          keysByNode.set(node.id, []);
        }
        keysByNode.get(node.id)!.push(key);
      }
    });

    // Execute parallel requests to each node
    const promises: Promise<(string | null)[]>[] = [];
    const nodeOrder: string[] = [];

    keysByNode.forEach((nodeKeys, nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node && node.client) {
        promises.push(node.client.mget(...nodeKeys));
        nodeOrder.push(nodeId);
      }
    });

    const results = await Promise.all(promises);
    
    // Reconstruct results in original key order
    const finalResults: (string | null)[] = new Array(keys.length);
    let resultIndex = 0;

    keysByNode.forEach((nodeKeys, nodeId) => {
      const nodeResultIndex = nodeOrder.indexOf(nodeId);
      const nodeResults = results[nodeResultIndex];
      
      nodeKeys.forEach((key, keyIndex) => {
        const originalIndex = keys.indexOf(key);
        finalResults[originalIndex] = nodeResults[keyIndex];
      });
    });

    return finalResults;
  }

  public getStats(): Map<string, CacheStats> {
    return this.stats;
  }

  public async getHealthStatus(): Promise<any> {
    const health: any = {
      totalNodes: this.nodes.size,
      healthyNodes: 0,
      unhealthyNodes: 0,
      nodes: {}
    };

    for (const [nodeId, node] of this.nodes) {
      try {
        if (node.client) {
          await node.client.ping();
          health.healthyNodes++;
          health.nodes[nodeId] = { status: 'healthy', region: node.region };
        }
      } catch (error) {
        health.unhealthyNodes++;
        health.nodes[nodeId] = { status: 'unhealthy', region: node.region, error: error instanceof Error ? error.message : String(error) };
      }
    }

    return health;
  }

  public async flushAll(): Promise<void> {
    const promises = Array.from(this.nodes.values()).map(node => 
      node.client ? node.client.flushdb() : Promise.resolve()
    );
    await Promise.all(promises);
    console.log('🧹 Flushed all cache nodes');
  }
}
