import { logger } from '../utils/logger';
import { getPool } from '../config/database';

const pool = getPool();

export interface Appeal {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  original_decision: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  resolved_at?: Date;
  resolution?: string;
}

export interface AppealSubmission {
  postId: string;
  userId: string;
  reason: string;
}

export interface AppealQuery {
  status: string;
  page: number;
  limit: number;
}

export class AppealsService {

  async submitAppeal(submission: AppealSubmission): Promise<Appeal> {
    const client = await pool.connect();
    try {
      // First, get the post details
      const postQuery = `
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id = $1
      `;
      const postResult = await client.query(postQuery, [submission.postId]);
      
      if (postResult.rows.length === 0) {
        throw new Error('Post not found');
      }
      
      const post = postResult.rows[0];
      
      // Create the appeal
      const appealQuery = `
        INSERT INTO appeals (post_id, user_id, reason, status, created_at)
        VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const result = await client.query(appealQuery, [
        submission.postId,
        submission.userId,
        submission.reason
      ]);
      
      const appeal = {
        ...result.rows[0],
        username: post.username,
        content: post.content,
        original_decision: post.status
      };
      
      logger.info(`Created appeal ${appeal.id} for post ${submission.postId}`);
      return appeal;
    } catch (error) {
      logger.error('Error creating appeal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAppeals(query: AppealQuery): Promise<Appeal[]> {
    const client = await pool.connect();
    try {
      let whereClause = '';
      const params: any[] = [];
      
      if (query.status && query.status !== 'all') {
        whereClause = 'WHERE a.status = $1';
        params.push(query.status);
      }
      
      const query_sql = `
        SELECT 
          a.*,
          u.username,
          p.content,
          p.status as original_decision
        FROM appeals a
        JOIN users u ON a.user_id = u.id
        JOIN posts p ON a.post_id = p.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(query.limit, (query.page - 1) * query.limit);
      
      const result = await client.query(query_sql, params);
      
      logger.info(`Retrieved ${result.rows.length} appeals`);
      return result.rows;
    } catch (error) {
      logger.error('Error retrieving appeals:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAppealById(id: string): Promise<Appeal | null> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          a.*,
          u.username,
          p.content,
          p.status as original_decision
        FROM appeals a
        JOIN users u ON a.user_id = u.id
        JOIN posts p ON a.post_id = p.id
        WHERE a.id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length > 0) {
        logger.info(`Retrieved appeal ${id}`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Error retrieving appeal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async resolveAppeal(id: string, decision: 'approved' | 'rejected', resolution: string): Promise<Appeal | null> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE appeals 
        SET status = $1, resolved_at = CURRENT_TIMESTAMP, resolution = $2
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await client.query(query, [decision, resolution, id]);
      
      if (result.rows.length > 0) {
        logger.info(`Appeal ${id} ${decision} with resolution: ${resolution}`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Error reviewing appeal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async reviewAppeal(id: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<Appeal | null> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE appeals 
        SET status = $1, resolved_at = CURRENT_TIMESTAMP, resolution = $2
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await client.query(query, [status, `Reviewed by ${reviewedBy}`, id]);
      
      if (result.rows.length > 0) {
        logger.info(`Appeal ${id} ${status} by ${reviewedBy}`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      logger.error('Error reviewing appeal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
