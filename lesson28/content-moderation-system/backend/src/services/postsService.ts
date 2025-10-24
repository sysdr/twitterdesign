import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { getPool } from '../config/database';

const pool = getPool();

interface CreatePostData {
  content: string;
  userId: string;
  mediaUrls: string[];
}

interface GetPostsFilter {
  status?: string;
  page: number;
  limit: number;
}

export class PostsService {
  async createPost(data: CreatePostData) {
    const client = await pool.connect();
    try {
      const postId = uuidv4();
      
      const query = `
        INSERT INTO posts (id, user_id, content, media_urls, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `;
      
      const result = await client.query(query, [
        postId,
        data.userId,
        data.content,
        data.mediaUrls
      ]);
      
      logger.info(`Created post ${postId}`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getPosts(filter: GetPostsFilter) {
    const client = await pool.connect();
    try {
      let query = `
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id
      `;
      
      const params: any[] = [];
      
      if (filter.status && filter.status !== 'all') {
        query += ' WHERE p.status = $1';
        params.push(filter.status);
      }
      
      query += ' ORDER BY p.created_at DESC';
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      
      params.push(filter.limit, (filter.page - 1) * filter.limit);
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async getPostById(id: string) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT p.*, u.username,
               mr.violation_type, mr.confidence_score, mr.decision as ml_decision,
               hr.decision as human_decision, hr.reason as human_reason
        FROM posts p 
        JOIN users u ON p.user_id = u.id
        LEFT JOIN moderation_results mr ON p.id = mr.post_id
        LEFT JOIN human_reviews hr ON p.id = hr.post_id
        WHERE p.id = $1
      `;
      
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
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
        RETURNING *
      `;
      
      const result = await client.query(query, [status, postId]);
      logger.info(`Updated post ${postId} status to ${status}`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}
