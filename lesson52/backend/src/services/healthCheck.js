const { Pool } = require('pg');
const dbConfig = require('../../config/database');
const logger = require('../utils/logger');

class HealthCheckService {
  constructor() {
    this.primaryPool = new Pool(dbConfig.primary);
    this.standbyPool = new Pool(dbConfig.standby);
    this.failureCount = { primary: 0, standby: 0 };
    this.state = 'HEALTHY';
    this.metrics = {
      primaryLatency: [],
      standbyLatency: [],
      checks: { shallow: 0, medium: 0, deep: 0 }
    };
  }

  async shallowCheck(pool, region) {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      const latency = Date.now() - start;
      this.metrics[`${region}Latency`].push(latency);
      if (this.metrics[`${region}Latency`].length > 100) {
        this.metrics[`${region}Latency`].shift();
      }
      return { success: true, latency, type: 'shallow' };
    } catch (error) {
      logger.error(`Shallow check failed for ${region}:`, error.message);
      return { success: false, error: error.message, type: 'shallow' };
    }
  }

  async mediumCheck(pool, region) {
    try {
      await pool.query('SELECT COUNT(*) FROM pg_stat_database');
      const cacheQuery = await pool.query("SELECT setting FROM pg_settings WHERE name = 'shared_buffers'");
      return { 
        success: true, 
        type: 'medium',
        cacheSize: cacheQuery.rows[0].setting 
      };
    } catch (error) {
      logger.error(`Medium check failed for ${region}:`, error.message);
      return { success: false, error: error.message, type: 'medium' };
    }
  }

  async deepCheck(pool, region) {
    try {
      const start = Date.now();
      
      // Test write capability (if primary)
      if (region === 'primary') {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS health_check (
            id SERIAL PRIMARY KEY,
            checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query('INSERT INTO health_check DEFAULT VALUES');
        await pool.query('DELETE FROM health_check WHERE checked_at < NOW() - INTERVAL \'1 hour\'');
      }
      
      // Check replication lag (if standby)
      if (region === 'standby') {
        const lagQuery = await pool.query(`
          SELECT EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) AS lag_seconds
        `);
        const lagSeconds = parseFloat(lagQuery.rows[0]?.lag_seconds || 0);
        
        return {
          success: true,
          type: 'deep',
          replicationLag: lagSeconds,
          latency: Date.now() - start
        };
      }
      
      return { 
        success: true, 
        type: 'deep',
        latency: Date.now() - start 
      };
    } catch (error) {
      logger.error(`Deep check failed for ${region}:`, error.message);
      return { success: false, error: error.message, type: 'deep' };
    }
  }

  async checkRegion(region) {
    const pool = region === 'primary' ? this.primaryPool : this.standbyPool;
    
    const shallow = await this.shallowCheck(pool, region);
    if (!shallow.success) {
      this.failureCount[region]++;
      return { region, status: 'FAILED', checks: { shallow } };
    }

    const medium = await this.mediumCheck(pool, region);
    const deep = await this.deepCheck(pool, region);
    
    this.failureCount[region] = 0;
    this.metrics.checks.shallow++;
    this.metrics.checks.medium++;
    this.metrics.checks.deep++;

    return {
      region,
      status: 'HEALTHY',
      checks: { shallow, medium, deep },
      failureCount: this.failureCount[region]
    };
  }

  async runChecks() {
    const primaryHealth = await this.checkRegion('primary');
    const standbyHealth = await this.checkRegion('standby');

    // Update system state
    if (primaryHealth.status === 'FAILED' && this.failureCount.primary >= 3) {
      if (standbyHealth.status === 'HEALTHY') {
        this.state = 'FAILING_OVER';
      } else {
        this.state = 'CRITICAL';
      }
    } else if (primaryHealth.status === 'FAILED') {
      this.state = 'DEGRADED';
    } else {
      this.state = 'HEALTHY';
    }

    return {
      state: this.state,
      primary: primaryHealth,
      standby: standbyHealth,
      timestamp: new Date().toISOString()
    };
  }

  getMetrics() {
    const avgLatency = (arr) => arr.length > 0 
      ? arr.reduce((a, b) => a + b, 0) / arr.length 
      : 0;

    return {
      primaryAvgLatency: avgLatency(this.metrics.primaryLatency),
      standbyAvgLatency: avgLatency(this.metrics.standbyLatency),
      totalChecks: this.metrics.checks,
      failureCount: this.failureCount
    };
  }
}

module.exports = new HealthCheckService();
