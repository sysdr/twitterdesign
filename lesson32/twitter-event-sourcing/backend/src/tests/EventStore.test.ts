import { EventStore } from '../services/EventStore';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const testDb = new Pool({
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://twitter_user:twitter_pass@localhost:5432/twitter_events_test'
});

describe('EventStore', () => {
    let eventStore: EventStore;
    
    beforeAll(() => {
        eventStore = new EventStore(testDb);
    });
    
    afterAll(async () => {
        await testDb.end();
    });

    it('should save and retrieve events', async () => {
        const streamId = uuidv4();
        const event = {
            id: uuidv4(),
            streamId,
            streamType: 'User',
            eventType: 'UserCreated',
            eventData: { userId: streamId, username: 'testuser' },
            metadata: { timestamp: new Date() },
            version: 1,
            createdAt: new Date()
        };

        await eventStore.saveEvents(streamId, [event], 0);
        const retrievedEvents = await eventStore.getEvents(streamId);

        expect(retrievedEvents).toHaveLength(1);
        expect(retrievedEvents[0].eventType).toBe('UserCreated');
        expect(retrievedEvents[0].eventData.username).toBe('testuser');
    });

    it('should handle concurrency conflicts', async () => {
        const streamId = uuidv4();
        const event = {
            id: uuidv4(),
            streamId,
            streamType: 'User',
            eventType: 'UserCreated',
            eventData: { userId: streamId, username: 'testuser' },
            metadata: { timestamp: new Date() },
            version: 1,
            createdAt: new Date()
        };

        await eventStore.saveEvents(streamId, [event], 0);

        // Try to save with wrong expected version
        await expect(
            eventStore.saveEvents(streamId, [event], 0)
        ).rejects.toThrow('Concurrency conflict');
    });
});
