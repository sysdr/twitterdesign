import { RebalanceOperation, ShardInfo } from '../../types';
import { ShardRouter } from '../shard-router/ShardRouter';
import { DatabaseService } from '../database/DatabaseService';
import { v4 as uuidv4 } from 'uuid';

export class RebalancerService {
  private operations: Map<string, RebalanceOperation> = new Map();
  private hotShardThreshold = 75; // Percentage load

  constructor(
    private shardRouter: ShardRouter,
    private databaseService: DatabaseService
  ) {}

  public async detectHotShards(): Promise<ShardInfo[]> {
    const allShards = this.shardRouter.getAllShards();
    const hotShards: ShardInfo[] = [];

    for (const shard of allShards) {
      const stats = await this.databaseService.getShardStats(shard.id);
      const loadPercentage = (stats.user_count / 1000) * 100; // Assuming 1000 users per shard capacity
      
      if (loadPercentage > this.hotShardThreshold) {
        hotShards.push({
          ...shard,
          load_percentage: loadPercentage,
          user_count: stats.user_count,
          tweet_count: stats.tweet_count,
          last_health_check: new Date()
        });
      }
    }

    return hotShards;
  }

  public async initiateRebalance(sourceShardId: number, targetShardId: number, userCount: number): Promise<string> {
    const operationId = uuidv4();
    const operation: RebalanceOperation = {
      id: operationId,
      source_shard: sourceShardId,
      target_shard: targetShardId,
      user_ids: [], // Will be populated during execution
      status: 'pending',
      progress: 0,
      started_at: new Date()
    };

    this.operations.set(operationId, operation);
    
    // Start rebalancing process asynchronously
    this.executeRebalance(operationId, userCount);
    
    return operationId;
  }

  private async executeRebalance(operationId: string, userCount: number): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    try {
      operation.status = 'in_progress';
      
      // Simulate gradual migration process
      for (let i = 0; i < userCount; i++) {
        const userId = `user_${Date.now()}_${i}`;
        operation.user_ids.push(userId);
        operation.progress = Math.round((i / userCount) * 100);
        
        // Simulate migration time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      operation.status = 'completed';
      operation.progress = 100;
      operation.completed_at = new Date();
      
    } catch (error) {
      operation.status = 'failed';
      console.error('Rebalancing failed:', error);
    }
  }

  public getRebalanceOperation(operationId: string): RebalanceOperation | undefined {
    return this.operations.get(operationId);
  }

  public getAllOperations(): RebalanceOperation[] {
    return Array.from(this.operations.values());
  }

  public async autoRebalance(): Promise<string[]> {
    const hotShards = await this.detectHotShards();
    const healthyShards = this.shardRouter.getHealthyShards()
      .filter(s => !hotShards.some(h => h.id === s.id));

    const operationIds: string[] = [];

    for (const hotShard of hotShards) {
      if (healthyShards.length === 0) break;
      
      const targetShard = healthyShards[0]; // Simple selection strategy
      const usersToMove = Math.ceil(hotShard.user_count * 0.2); // Move 20% of users
      
      const operationId = await this.initiateRebalance(
        hotShard.id, 
        targetShard.id, 
        usersToMove
      );
      
      operationIds.push(operationId);
    }

    return operationIds;
  }
}
