import { TableHistogram, QueryStats, OptimizationRecommendation } from '../types';
import {
  estimateSelectivity,
  estimateQueryCost,
  buildHistogram,
  calculateCardinality
} from '../utils/queryOptimizer';

export class QueryOptimizerService {
  private histograms: Map<string, TableHistogram> = new Map();
  private queryHistory: QueryStats[] = [];
  
  // Initialize with sample data
  initializeSampleData(): void {
    // Users table histogram
    const userIds = Array.from({ length: 10000 }, (_, i) => i);
    const userCreatedDates = Array.from({ length: 10000 }, () => 
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    );
    
    this.histograms.set('users_id', {
      tableName: 'users',
      columnName: 'id',
      buckets: buildHistogram(userIds),
      totalRows: 10000,
      distinctValues: calculateCardinality(userIds)
    });
    
    this.histograms.set('users_created_at', {
      tableName: 'users',
      columnName: 'created_at',
      buckets: buildHistogram(userCreatedDates),
      totalRows: 10000,
      distinctValues: calculateCardinality(userCreatedDates)
    });
    
    // Tweets table histogram (skewed distribution)
    const tweetUserIds = Array.from({ length: 100000 }, () => {
      // Power law distribution - some users have many tweets
      const r = Math.random();
      return Math.floor(Math.pow(r, 2) * 10000);
    });
    
    this.histograms.set('tweets_user_id', {
      tableName: 'tweets',
      columnName: 'user_id',
      buckets: buildHistogram(tweetUserIds),
      totalRows: 100000,
      distinctValues: calculateCardinality(tweetUserIds)
    });
  }
  
  // Simulate query execution with cost estimation
  executeQuery(sql: string): QueryStats {
    const queryId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse simple query patterns
    let estimatedSelectivity = 0.5;
    let tableName = 'unknown';
    let hasIndex = false;
    
    // Simple pattern matching for demo
    if (sql.includes('users')) {
      tableName = 'users';
      if (sql.includes('WHERE id =')) {
        estimatedSelectivity = 1 / 10000; // Single row
        hasIndex = true;
      } else if (sql.includes('WHERE created_at >')) {
        const histogram = this.histograms.get('users_created_at');
        if (histogram) {
          // Assume filtering recent month
          const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          estimatedSelectivity = estimateSelectivity(histogram, monthAgo, Date.now());
        }
      }
    } else if (sql.includes('tweets')) {
      tableName = 'tweets';
      if (sql.includes('WHERE user_id =')) {
        const histogram = this.histograms.get('tweets_user_id');
        if (histogram) {
          // Random user
          const userId = Math.floor(Math.random() * 10000);
          estimatedSelectivity = estimateSelectivity(histogram, userId, userId + 1);
        }
        hasIndex = true;
      }
    }
    
    const tableSize = tableName === 'users' ? 10000 : 100000;
    const costEstimate = estimateQueryCost(estimatedSelectivity, tableSize, hasIndex);
    
    // Simulate actual execution (with some variance)
    const variance = 0.8 + Math.random() * 0.4; // ±20%
    const actualSelectivity = estimatedSelectivity * variance;
    const actualCost = costEstimate.scanCost < costEstimate.indexCost 
      ? costEstimate.scanCost * variance
      : costEstimate.indexCost * variance;
    
    // Execution time based on cost
    const executionTime = actualCost * 0.001 * (0.8 + Math.random() * 0.4);
    
    const stats: QueryStats = {
      queryId,
      sql,
      estimatedCost: Math.min(costEstimate.scanCost, costEstimate.indexCost),
      actualCost,
      estimatedRows: Math.round(estimatedSelectivity * tableSize),
      actualRows: Math.round(actualSelectivity * tableSize),
      executionTime,
      selectivity: actualSelectivity
    };
    
    this.queryHistory.push(stats);
    if (this.queryHistory.length > 100) {
      this.queryHistory.shift();
    }
    
    return stats;
  }
  
  // Get query history
  getQueryHistory(): QueryStats[] {
    return [...this.queryHistory];
  }
  
  // Get histogram for table/column
  getHistogram(key: string): TableHistogram | undefined {
    return this.histograms.get(key);
  }
  
  // Calculate estimation accuracy
  getEstimationAccuracy(): { avgError: number; maxError: number } {
    if (this.queryHistory.length === 0) {
      return { avgError: 0, maxError: 0 };
    }
    
    const errors = this.queryHistory.map(q => 
      Math.abs(q.estimatedCost - q.actualCost) / q.actualCost
    );
    
    return {
      avgError: errors.reduce((a, b) => a + b, 0) / errors.length,
      maxError: Math.max(...errors)
    };
  }
  
  // Get index recommendations
  getIndexRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze query patterns
    const columnAccess: Map<string, number> = new Map();
    
    for (const query of this.queryHistory) {
      if (query.sql.includes('WHERE')) {
        const match = query.sql.match(/WHERE\s+(\w+)/i);
        if (match) {
          const column = match[1];
          columnAccess.set(column, (columnAccess.get(column) || 0) + 1);
        }
      }
    }
    
    // Recommend indexes for frequently accessed columns
    for (const [column, count] of columnAccess) {
      if (count > 5 && column !== 'id') {
        recommendations.push({
          type: 'index',
          priority: count > 20 ? 'high' : 'medium',
          currentValue: 0,
          recommendedValue: 1,
          expectedImprovement: `Up to ${Math.round((1 - 0.1) * 100)}% faster queries`,
          reasoning: `Column '${column}' accessed ${count} times in WHERE clauses`
        });
      }
    }
    
    return recommendations;
  }
}
