import { Pool } from 'pg';
import { DomainEvent } from '../types/events';

export class UserProjection {
    constructor(private db: Pool) {}

    async handle(event: DomainEvent): Promise<void> {
        switch (event.eventType) {
            case 'UserCreated':
                await this.handleUserCreated(event);
                break;
            case 'UserFollowed':
                await this.handleUserFollowed(event);
                break;
            default:
                // Ignore other events
                break;
        }
    }

    private async handleUserCreated(event: DomainEvent): Promise<void> {
        const { userId, username, displayName } = event.eventData;
        
        await this.db.query(
            `INSERT INTO user_profiles (user_id, username, display_name, created_at)
             VALUES ($1, $2, $3, $4)`,
            [userId, username, displayName, event.createdAt]
        );
    }

    private async handleUserFollowed(event: DomainEvent): Promise<void> {
        const { followerId, followeeId } = event.eventData;
        
        // Update follower count for followee
        await this.db.query(
            `UPDATE user_profiles 
             SET followers_count = followers_count + 1,
                 updated_at = NOW()
             WHERE user_id = $1`,
            [followeeId]
        );
        
        // Update following count for follower
        await this.db.query(
            `UPDATE user_profiles 
             SET following_count = following_count + 1,
                 updated_at = NOW()
             WHERE user_id = $1`,
            [followerId]
        );
    }
}
