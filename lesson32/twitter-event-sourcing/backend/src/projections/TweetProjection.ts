import { Pool } from 'pg';
import { DomainEvent } from '../types/events';

export class TweetProjection {
    constructor(private db: Pool) {}

    async handle(event: DomainEvent): Promise<void> {
        switch (event.eventType) {
            case 'TweetCreated':
                await this.handleTweetCreated(event);
                break;
            case 'TweetLiked':
                await this.handleTweetLiked(event);
                break;
            case 'TweetRetweeted':
                await this.handleTweetRetweeted(event);
                break;
            default:
                // Ignore other events
                break;
        }
    }

    private async handleTweetCreated(event: DomainEvent): Promise<void> {
        const { tweetId, userId, content } = event.eventData;
        
        await this.db.query(
            `INSERT INTO tweets (tweet_id, user_id, content, created_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (tweet_id) DO UPDATE SET
             content = EXCLUDED.content,
             updated_at = NOW()`,
            [tweetId, userId, content, event.createdAt]
        );
    }

    private async handleTweetLiked(event: DomainEvent): Promise<void> {
        const { tweetId } = event.eventData;
        
        await this.db.query(
            `UPDATE tweets 
             SET likes_count = likes_count + 1,
                 updated_at = NOW()
             WHERE tweet_id = $1`,
            [tweetId]
        );
    }

    private async handleTweetRetweeted(event: DomainEvent): Promise<void> {
        const { tweetId } = event.eventData;
        
        await this.db.query(
            `UPDATE tweets 
             SET retweets_count = retweets_count + 1,
                 updated_at = NOW()
             WHERE tweet_id = $1`,
            [tweetId]
        );
    }
}
