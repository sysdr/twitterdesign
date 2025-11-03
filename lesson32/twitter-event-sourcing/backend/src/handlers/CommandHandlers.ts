import { EventStore } from '../services/EventStore';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent, Command, UserCreatedEvent, TweetCreatedEvent } from '../types/events';

export class UserCommandHandler {
    constructor(private eventStore: EventStore) {}

    async handleCreateUser(command: Command): Promise<void> {
        const { userId, username, email, displayName } = command.data;
        
        // Business logic validation
        if (!username || !email) {
            throw new Error('Username and email are required');
        }
        
        const event: UserCreatedEvent = {
            id: uuidv4(),
            streamId: userId,
            streamType: 'User',
            eventType: 'UserCreated',
            eventData: { userId, username, email, displayName },
            metadata: command.metadata,
            version: 1,
            createdAt: new Date(),
            correlationId: command.id
        };
        
        await this.eventStore.saveEvents(userId, [event], 0);
    }
}

export class TweetCommandHandler {
    constructor(private eventStore: EventStore) {}

    async handleCreateTweet(command: Command): Promise<void> {
        const { tweetId, userId, content } = command.data;
        
        // Business logic validation
        if (!content || content.length > 280) {
            throw new Error('Tweet content is required and must be <= 280 characters');
        }
        
        // Extract mentions and hashtags
        const mentions = this.extractMentions(content);
        const hashtags = this.extractHashtags(content);
        
        const event: TweetCreatedEvent = {
            id: uuidv4(),
            streamId: tweetId,
            streamType: 'Tweet',
            eventType: 'TweetCreated',
            eventData: { tweetId, userId, content, mentions, hashtags },
            metadata: command.metadata,
            version: 1,
            createdAt: new Date(),
            correlationId: command.id
        };
        
        await this.eventStore.saveEvents(tweetId, [event], 0);
    }

    private extractMentions(content: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const matches = content.match(mentionRegex);
        return matches ? matches.map(match => match.substring(1)) : [];
    }

    private extractHashtags(content: string): string[] {
        const hashtagRegex = /#(\w+)/g;
        const matches = content.match(hashtagRegex);
        return matches ? matches.map(match => match.substring(1)) : [];
    }
}
