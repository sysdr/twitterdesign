import { Pool } from 'pg';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { getModerationQueue } from '../queues/moderationQueue';
import { getPool } from '../config/database';

const pool = getPool();

const ML_SERVICE_URL = 'http://localhost:8001';

interface ModerationQueueFilter {
  status: string;
  priority: string;
}

export class ModerationService {
  async queueForModeration(postId: string) {
    try {
      // Add to processing queue
      const moderationQueue = getModerationQueue();
      await moderationQueue.add('moderate-post', { postId }, {
        priority: 1,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      
      logger.info(`Queued post ${postId} for moderation`);
    } catch (error) {
      logger.error(`Error queuing post ${postId}:`, error);
      throw error;
    }
  }
  
  async processPostModeration(postId: string) {
    const client = await pool.connect();
    try {
      // Get post content
      const postQuery = 'SELECT * FROM posts WHERE id = $1';
      const postResult = await client.query(postQuery, [postId]);
      const post = postResult.rows[0];
      
      if (!post) {
        throw new Error(`Post ${postId} not found`);
      }
      
      // Call ML service for text moderation
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/moderate/text`, {
        text: post.content,
        user_id: post.user_id,
        post_id: postId
      });
      
      const { violations, overall_decision, confidence } = mlResponse.data;
      
      // Store ML results
      await this.storeModerationResult(postId, violations, overall_decision, confidence);
      
      // Update post status based on decision
      if (overall_decision === 'approve') {
        await this.updatePostStatus(postId, 'approved');
      } else if (overall_decision === 'reject') {
        await this.updatePostStatus(postId, 'rejected');
      } else {
        // Queue for human review
        await this.queueForHumanReview(postId, violations);
      }
      
      logger.info(`Processed moderation for post ${postId}: ${overall_decision}`);
      
    } catch (error) {
      logger.error(`Error processing moderation for post ${postId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async storeModerationResult(postId: string, violations: any[], decision: string, confidence: number) {
    const client = await pool.connect();
    try {
      for (const violation of violations) {
        const query = `
          INSERT INTO moderation_results (id, post_id, model_name, violation_type, confidence_score, decision)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(query, [
          uuidv4(),
          postId,
          'ml-classifier',
          violation.type,
          violation.confidence,
          decision
        ]);
      }
      
      // Store overall result if no violations
      if (violations.length === 0) {
        const query = `
          INSERT INTO moderation_results (id, post_id, model_name, violation_type, confidence_score, decision)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(query, [
          uuidv4(),
          postId,
          'ml-classifier',
          'none',
          confidence,
          decision
        ]);
      }
    } finally {
      client.release();
    }
  }
  
  async queueForHumanReview(postId: string, violations: any[]) {
    const client = await pool.connect();
    try {
      // Calculate priority based on violation severity
      let priority = 5; // Default
      if (violations.some(v => v.severity === 'high')) {
        priority = 1;
      } else if (violations.some(v => v.severity === 'medium')) {
        priority = 3;
      }
      
      const query = `
        INSERT INTO moderation_queue (id, post_id, priority, status)
        VALUES ($1, $2, $3, 'pending')
      `;
      
      await client.query(query, [uuidv4(), postId, priority]);
      await this.updatePostStatus(postId, 'flagged');
      
      logger.info(`Queued post ${postId} for human review with priority ${priority}`);
    } finally {
      client.release();
    }
  }
  
  async getModerationQueue(filter: ModerationQueueFilter) {
    const client = await pool.connect();
    try {
      let query = `
        SELECT mq.*, p.content, p.media_urls, COALESCE(u.username, 'Unknown User') as username,
               mr.violation_type, mr.confidence_score
        FROM moderation_queue mq
        JOIN posts p ON mq.post_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN moderation_results mr ON p.id = mr.post_id
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (filter.status !== 'all') {
        conditions.push(`mq.status = $${params.length + 1}`);
        params.push(filter.status);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY mq.priority ASC, mq.created_at ASC';
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async submitHumanReview(reviewData: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert human review
      const reviewQuery = `
        INSERT INTO human_reviews (id, post_id, moderator_id, decision, reason)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const reviewResult = await client.query(reviewQuery, [
        uuidv4(),
        reviewData.postId,
        reviewData.moderatorId,
        reviewData.decision,
        reviewData.reason
      ]);
      
      // Update post status
      const newStatus = reviewData.decision === 'approve' ? 'approved' : 'rejected';
      await this.updatePostStatus(reviewData.postId, newStatus);
      
      // Remove from queue
      await client.query('UPDATE moderation_queue SET status = $1 WHERE post_id = $2', 
                         ['completed', reviewData.postId]);
      
      await client.query('COMMIT');
      
      logger.info(`Human review submitted for post ${reviewData.postId}: ${reviewData.decision}`);
      return reviewResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async updatePostStatus(postId: string, status: string) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE posts 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `;
      
      await client.query(query, [status, postId]);
    } finally {
      client.release();
    }
  }
  
  async getModerationStats() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM posts 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY status
      `;
      
      const result = await client.query(query);
      
      const stats = {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        flagged: 0
      };
      
      result.rows.forEach(row => {
        stats[row.status as keyof typeof stats] = parseInt(row.count);
        stats.total += parseInt(row.count);
      });
      
      return stats;
    } finally {
      client.release();
    }
  }
}
