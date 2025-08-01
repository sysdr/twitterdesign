import { query } from '../config/database';

export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  privacy: 'public' | 'protected' | 'private';
  verified: boolean;
  follower_count: number;
  following_count: number;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(userData: Partial<User>): Promise<User> {
    const result = await query(
      `INSERT INTO users (username, email, display_name, bio, privacy)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userData.username, userData.email, userData.display_name, userData.bio, userData.privacy || 'public']
    );
    return result.rows[0];
  }

  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  static async getFollowers(userId: number, limit = 50, offset = 0): Promise<User[]> {
    const result = await query(
      `SELECT u.* FROM users u
       INNER JOIN user_followers uf ON u.id = uf.follower_id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async getFollowing(userId: number, limit = 50, offset = 0): Promise<User[]> {
    const result = await query(
      `SELECT u.* FROM users u
       INNER JOIN user_follows uf ON u.id = uf.following_id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async follow(followerId: number, followingId: number): Promise<void> {
    await query('BEGIN');
    try {
      // Insert into both relationship tables
      await query(
        'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [followerId, followingId]
      );
      await query(
        'INSERT INTO user_followers (user_id, follower_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [followingId, followerId]
      );
      
      // Update counters
      await query('UPDATE users SET following_count = following_count + 1 WHERE id = $1', [followerId]);
      await query('UPDATE users SET follower_count = follower_count + 1 WHERE id = $1', [followingId]);
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async unfollow(followerId: number, followingId: number): Promise<void> {
    await query('BEGIN');
    try {
      await query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
      await query('DELETE FROM user_followers WHERE user_id = $1 AND follower_id = $2', [followingId, followerId]);
      
      await query('UPDATE users SET following_count = following_count - 1 WHERE id = $1', [followerId]);
      await query('UPDATE users SET follower_count = follower_count - 1 WHERE id = $1', [followingId]);
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
}
