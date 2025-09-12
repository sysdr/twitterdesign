import { Pool } from 'pg';
import { ReplicationConfig, DatabaseStats } from '../types';

export class DatabaseService {
  private masterPool!: Pool;
  private slavePools: Map<string, Pool> = new Map();
  private config: ReplicationConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private stats: DatabaseStats;

  constructor(config: ReplicationConfig) {
    this.config = config;
    this.initializePools();
    this.startHealthChecks();
    
    this.stats = {
      master: { status: 'healthy', connections: 0, lag: 0 },
      slaves: config.slaves.map(slave => ({
        id: slave.id,
        status: 'healthy',
        connections: 0,
        replication_lag: 0,
        last_sync: new Date().toISOString()
      }))
    };
  }

  private initializePools() {
    // Master pool configuration
    this.masterPool = new Pool({
      host: this.config.master.host,
      port: this.config.master.port,
      database: this.config.master.database,
      user: this.config.master.username,
      password: this.config.master.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Slave pools configuration
    this.config.slaves.forEach(slave => {
      const pool = new Pool({
        host: slave.host,
        port: slave.port,
        database: slave.database,
        user: slave.username,
        password: slave.password,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      this.slavePools.set(slave.id, pool);
    });
  }

  // Smart connection routing
  async executeQuery(query: string, params: any[] = [], options: { 
    preferMaster?: boolean, 
    readOnly?: boolean 
  } = {}): Promise<any> {
    const isWriteOperation = this.isWriteOperation(query);
    
    if (isWriteOperation || options.preferMaster) {
      return this.executeOnMaster(query, params);
    }
    
    if (options.readOnly !== false) {
      return this.executeOnSlave(query, params);
    }
    
    return this.executeOnMaster(query, params);
  }

  async executeOnMaster(query: string, params: any[]): Promise<any> {
    try {
      const client = await this.masterPool.connect();
      const result = await client.query(query, params);
      client.release();
      
      this.stats.master.connections = this.masterPool.totalCount;
      return result;
    } catch (error) {
      this.stats.master.status = 'degraded';
      throw error;
    }
  }

  private async executeOnSlave(query: string, params: any[]): Promise<any> {
    const healthySlaves = this.getHealthySlaves();
    
    if (healthySlaves.length === 0) {
      console.warn('No healthy slaves available, routing to master');
      return this.executeOnMaster(query, params);
    }

    // Round-robin with weighted selection
    const selectedSlave = this.selectSlave(healthySlaves);
    const pool = this.slavePools.get(selectedSlave.id);
    
    if (!pool) {
      return this.executeOnMaster(query, params);
    }

    try {
      const client = await pool.connect();
      const result = await client.query(query, params);
      client.release();
      
      // Update slave stats
      const slaveStats = this.stats.slaves.find(s => s.id === selectedSlave.id);
      if (slaveStats) {
        slaveStats.connections = pool.totalCount;
        slaveStats.last_sync = new Date().toISOString();
      }
      
      return result;
    } catch (error) {
      console.error(`Slave ${selectedSlave.id} error:`, error);
      // Fallback to master
      return this.executeOnMaster(query, params);
    }
  }

  private isWriteOperation(query: string): boolean {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
    const upperQuery = query.trim().toUpperCase();
    return writeKeywords.some(keyword => upperQuery.startsWith(keyword));
  }

  private getHealthySlaves() {
    return this.config.slaves.filter(slave => {
      const stats = this.stats.slaves.find(s => s.id === slave.id);
      return stats?.status === 'healthy';
    });
  }

  private selectSlave(healthySlaves: typeof this.config.slaves) {
    // Simple round-robin for now, can be enhanced with load balancing
    return healthySlaves[Math.floor(Math.random() * healthySlaves.length)];
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 5000); // Check every 5 seconds
  }

  private async performHealthChecks() {
    // Check master health
    try {
      const client = await this.masterPool.connect();
      await client.query('SELECT 1');
      client.release();
      this.stats.master.status = 'healthy';
    } catch (error) {
      this.stats.master.status = 'down';
    }

    // Check slave health and replication lag
    for (const slave of this.config.slaves) {
      const pool = this.slavePools.get(slave.id);
      const slaveStats = this.stats.slaves.find(s => s.id === slave.id);
      
      if (!pool || !slaveStats) continue;

      try {
        const client = await pool.connect();
        
        // Check basic connectivity
        await client.query('SELECT 1');
        
        // Check replication lag
        const lagResult = await client.query(`
          SELECT CASE 
            WHEN pg_is_in_recovery() THEN 
              EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
            ELSE 0 
          END as replication_lag;
        `);
        
        const lag = parseFloat(lagResult.rows[0]?.replication_lag || '0');
        slaveStats.replication_lag = lag;
        slaveStats.status = lag > 10 ? 'lagging' : 'healthy';
        
        client.release();
      } catch (error) {
        slaveStats.status = 'down';
        slaveStats.replication_lag = -1;
      }
    }
  }

  getStats(): DatabaseStats {
    return { ...this.stats };
  }

  async close() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    await this.masterPool.end();
    
    for (const pool of this.slavePools.values()) {
      await pool.end();
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService({
  master: {
    host: process.env.MASTER_HOST || 'localhost',
    port: parseInt(process.env.MASTER_PORT || '5432'),
    database: process.env.DB_NAME || 'twitter_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  slaves: [
    {
      id: 'slave1',
      host: process.env.SLAVE1_HOST || 'localhost',
      port: parseInt(process.env.SLAVE1_PORT || '5433'),
      database: process.env.DB_NAME || 'twitter_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      weight: 1
    },
    {
      id: 'slave2',
      host: process.env.SLAVE2_HOST || 'localhost',
      port: parseInt(process.env.SLAVE2_PORT || '5434'),
      database: process.env.DB_NAME || 'twitter_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      weight: 1
    }
  ]
});
