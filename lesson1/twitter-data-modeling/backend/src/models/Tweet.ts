import { query } from '../config/database';

export interface Tweet {
  id: number;
  user_id: number;
  content: string;
  reply_to_tweet_id?: number;
  original_tweet_id?: number;
  media_urls: string[];
  hashtags: string[];
  mentions: number[];
  like_count: number;
  retweet_count: number;
  reply_count: number;
  created_at: Date;
  updated_at: Date;
}

export class TweetModel {
  static async create(tweetData: Partial<Tweet>): Promise<Tweet> {
    const result = await query(
      `INSERT INTO tweets (user_id, content, reply_to_tweet_id, media_urls, hashtags, mentions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        tweetData.user_id,
        tweetData.content,
        tweetData.reply_to_tweet_id,
        tweetData.media_urls || [],
        tweetData.hashtags || [],
        tweetData.mentions || []
      ]
    );
    return result.rows[0];
  }

  static async findById(id: number): Promise<Tweet | null> {
    const result = await query('SELECT * FROM tweets WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getUserTimeline(userId: number, limit = 20, offset = 0): Promise<Tweet[]> {
    const result = await query(
      `SELECT t.*, u.username, u.display_name, u.profile_image_url, u.verified
       FROM tweets t
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async getHomeTimeline(userId: number, limit = 20, offset = 0): Promise<Tweet[]> {
    const result = await query(
      `SELECT t.*, u.username, u.display_name, u.profile_image_url, u.verified
       FROM tweets t
       INNER JOIN users u ON t.user_id = u.id
       INNER JOIN user_follows uf ON t.user_id = uf.following_id
       WHERE uf.follower_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async like(userId: number, tweetId: number): Promise<void> {
    await query('BEGIN');
    try {
      await query(
        'INSERT INTO tweet_likes (user_id, tweet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, tweetId]
      );
      await query('UPDATE tweets SET like_count = like_count + 1 WHERE id = $1', [tweetId]);
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async unlike(userId: number, tweetId: number): Promise<void> {
    await query('BEGIN');
    try {
      await query('DELETE FROM tweet_likes WHERE user_id = $1 AND tweet_id = $2', [userId, tweetId]);
      await query('UPDATE tweets SET like_count = like_count - 1 WHERE id = $1', [tweetId]);
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
}
