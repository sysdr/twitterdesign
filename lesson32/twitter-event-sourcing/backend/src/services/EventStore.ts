import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent, Snapshot } from '../types/events';

export class EventStore {
    constructor(private db: Pool) {}

    async saveEvents(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');
            
            // Check current version
            const versionResult = await client.query(
                'SELECT COALESCE(MAX(version), 0) as version FROM event_store WHERE stream_id = $1',
                [streamId]
            );
            
            const currentVersion = parseInt(versionResult.rows[0].version);
            
            if (currentVersion !== expectedVersion) {
                throw new Error(`Concurrency conflict. Expected version ${expectedVersion}, but current version is ${currentVersion}`);
            }
            
            // Insert events
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                const version = currentVersion + i + 1;
                
                await client.query(
                    `INSERT INTO event_store (
                        id, stream_id, stream_type, event_type, event_data, 
                        metadata, version, correlation_id, causation_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        event.id,
                        streamId,
                        event.streamType,
                        event.eventType,
                        JSON.stringify(event.eventData),
                        JSON.stringify(event.metadata),
                        version,
                        event.correlationId,
                        event.causationId
                    ]
                );
            }
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getEvents(streamId: string, fromVersion: number = 0): Promise<DomainEvent[]> {
        const result = await this.db.query(
            `SELECT * FROM event_store 
             WHERE stream_id = $1 AND version > $2 
             ORDER BY version`,
            [streamId, fromVersion]
        );
        
        return result.rows.map(row => ({
            id: row.id,
            streamId: row.stream_id,
            streamType: row.stream_type,
            eventType: row.event_type,
            eventData: typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            version: parseInt(row.version),
            createdAt: row.created_at,
            correlationId: row.correlation_id,
            causationId: row.causation_id
        }));
    }

    async getAllEvents(fromPosition: number = 0, limit: number = 100): Promise<DomainEvent[]> {
        const result = await this.db.query(
            `SELECT * FROM event_store 
             WHERE version > $1 
             ORDER BY created_at, version 
             LIMIT $2`,
            [fromPosition, limit]
        );
        
        return result.rows.map(row => ({
            id: row.id,
            streamId: row.stream_id,
            streamType: row.stream_type,
            eventType: row.event_type,
            eventData: typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            version: parseInt(row.version),
            createdAt: row.created_at,
            correlationId: row.correlation_id,
            causationId: row.causation_id
        }));
    }

    async saveSnapshot(snapshot: Snapshot): Promise<void> {
        await this.db.query(
            `INSERT INTO snapshots (id, stream_id, stream_type, version, data)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (stream_id, version) 
             DO UPDATE SET data = EXCLUDED.data`,
            [
                snapshot.id,
                snapshot.streamId,
                snapshot.streamType,
                snapshot.version,
                JSON.stringify(snapshot.data)
            ]
        );
    }

    async getSnapshot(streamId: string): Promise<Snapshot | null> {
        const result = await this.db.query(
            `SELECT * FROM snapshots 
             WHERE stream_id = $1 
             ORDER BY version DESC 
             LIMIT 1`,
            [streamId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        return {
            id: row.id,
            streamId: row.stream_id,
            streamType: row.stream_type,
            version: parseInt(row.version),
            data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
            createdAt: row.created_at
        };
    }
}
