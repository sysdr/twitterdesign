import { createHash } from 'crypto';
import { ShardInfo } from '../../types';

export class ShardRouter {
  private shards: ShardInfo[] = [];
  private virtualNodes: Map<string, number> = new Map();
  private readonly virtualNodesPerShard = 150;

  constructor(shards: ShardInfo[]) {
    this.shards = shards;
    this.buildHashRing();
  }

  private buildHashRing(): void {
    this.virtualNodes.clear();
    
    this.shards.forEach(shard => {
      for (let i = 0; i < this.virtualNodesPerShard; i++) {
        const virtualNodeKey = `${shard.id}:${i}`;
        const hash = this.hash(virtualNodeKey);
        this.virtualNodes.set(hash, shard.id);
      }
    });
  }

  private hash(key: string): string {
    return createHash('md5').update(key).digest('hex');
  }

  public getShardId(userId: string): number {
    const userHash = this.hash(userId);
    const sortedHashes = Array.from(this.virtualNodes.keys()).sort();
    
    for (const hash of sortedHashes) {
      if (userHash <= hash) {
        return this.virtualNodes.get(hash)!;
      }
    }
    
    // Wrap around to first hash
    return this.virtualNodes.get(sortedHashes[0])!;
  }

  public addShard(shard: ShardInfo): void {
    this.shards.push(shard);
    this.buildHashRing();
  }

  public removeShard(shardId: number): void {
    this.shards = this.shards.filter(s => s.id !== shardId);
    this.buildHashRing();
  }

  public getShardInfo(shardId: number): ShardInfo | undefined {
    return this.shards.find(s => s.id === shardId);
  }

  public getAllShards(): ShardInfo[] {
    return [...this.shards];
  }

  public getHealthyShards(): ShardInfo[] {
    return this.shards.filter(s => s.status === 'healthy');
  }
}
