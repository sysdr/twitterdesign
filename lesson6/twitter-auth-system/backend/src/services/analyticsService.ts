import { pool, redis } from '../config/database.js';

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalSecurityEvents: number;
  rateLimitHits: number;
  systemUptime: number;
  databaseConnections: number;
  redisMemoryUsage: string;
  lastLoginTime: string | null;
  lastRegistrationTime: string | null;
}

export interface UserMetrics {
  userId: string;
  username: string;
  loginCount: number;
  lastLoginAt: string | null;
  deviceCount: number;
  securityEventCount: number;
}

class AnalyticsService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get user statistics
      const userStats = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN updated_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users,
          MAX(created_at) as last_registration_time
        FROM users
      `);

      // Get session statistics
      const sessionStats = await pool.query(`
        SELECT COUNT(*) as total_sessions
        FROM refresh_tokens
        WHERE expires_at > NOW()
      `);

      // Get security event statistics
      const securityStats = await pool.query(`
        SELECT COUNT(*) as total_security_events
        FROM security_events
      `);

      // Get last login time
      const lastLogin = await pool.query(`
        SELECT MAX(created_at) as last_login_time
        FROM security_events
        WHERE event_type = 'login' AND success = true
      `);

      // Get Redis memory usage
      const redisInfo = await redis.info('memory');
      const memoryMatch = redisInfo.match(/used_memory_human:(\S+)/);
      const redisMemoryUsage = memoryMatch ? memoryMatch[1] : '0B';

      // Get database connections
      const dbConnections = await pool.query('SELECT count(*) FROM pg_stat_activity');

      // Get rate limit hits from Redis
      const rateLimitKeys = await redis.keys('*_limit:*');
      const rateLimitHits = rateLimitKeys.length;

      // Calculate system uptime (simplified)
      const systemUptime = process.uptime();

      return {
        totalUsers: parseInt(userStats.rows[0]?.total_users || '0'),
        activeUsers: parseInt(userStats.rows[0]?.active_users || '0'),
        totalSessions: parseInt(sessionStats.rows[0]?.total_sessions || '0'),
        totalSecurityEvents: parseInt(securityStats.rows[0]?.total_security_events || '0'),
        rateLimitHits: rateLimitHits,
        systemUptime: Math.floor(systemUptime),
        databaseConnections: parseInt(dbConnections.rows[0]?.count || '0'),
        redisMemoryUsage: redisMemoryUsage,
        lastLoginTime: lastLogin.rows[0]?.last_login_time || null,
        lastRegistrationTime: userStats.rows[0]?.last_registration_time || null
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  async getUserMetrics(userId: string): Promise<UserMetrics | null> {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.username,
          COUNT(DISTINCT se.id) as security_event_count,
          MAX(CASE WHEN se.event_type = 'login' AND se.success = true THEN se.created_at END) as last_login_at
        FROM users u
        LEFT JOIN security_events se ON u.id = se.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.username
      `, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      
      // Get device count
      const deviceResult = await pool.query(`
        SELECT COUNT(*) as device_count
        FROM trusted_devices
        WHERE user_id = $1
      `, [userId]);

      // Get login count
      const loginResult = await pool.query(`
        SELECT COUNT(*) as login_count
        FROM security_events
        WHERE user_id = $1 AND event_type = 'login' AND success = true
      `, [userId]);

      return {
        userId: user.id,
        username: user.username,
        loginCount: parseInt(loginResult.rows[0]?.login_count || '0'),
        lastLoginAt: user.last_login_at,
        deviceCount: parseInt(deviceResult.rows[0]?.device_count || '0'),
        securityEventCount: parseInt(user.security_event_count || '0')
      };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      throw error;
    }
  }

  async getTopUsers(limit: number = 10): Promise<UserMetrics[]> {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.username,
          COUNT(CASE WHEN se.event_type = 'login' AND se.success = true THEN 1 END) as login_count,
          MAX(CASE WHEN se.event_type = 'login' AND se.success = true THEN se.created_at END) as last_login_at,
          COUNT(DISTINCT td.id) as device_count,
          COUNT(se.id) as security_event_count
        FROM users u
        LEFT JOIN security_events se ON u.id = se.user_id
        LEFT JOIN trusted_devices td ON u.id = td.user_id
        GROUP BY u.id, u.username
        ORDER BY login_count DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        userId: row.id,
        username: row.username,
        loginCount: parseInt(row.login_count || '0'),
        lastLoginAt: row.last_login_at,
        deviceCount: parseInt(row.device_count || '0'),
        securityEventCount: parseInt(row.security_event_count || '0')
      }));
    } catch (error) {
      console.error('Error getting top users:', error);
      throw error;
    }
  }

  async recordSecurityEvent(
    userId: string | null,
    eventType: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: any
  ): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO security_events (user_id, event_type, ip_address, user_agent, success, details)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, eventType, ipAddress, userAgent, success, details ? JSON.stringify(details) : null]);
    } catch (error) {
      console.error('Error recording security event:', error);
    }
  }
}

export default new AnalyticsService();
