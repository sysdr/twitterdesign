import { EventStore } from './EventStore';
import { DomainEvent } from '../types/events';
import { Pool } from 'pg';

export class ProjectionRunner {
    private isRunning = false;
    private interval: NodeJS.Timeout | null = null;

    constructor(
        private eventStore: EventStore,
        private projections: any[],
        private db: Pool
    ) {}

    start(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('📡 Starting projection runner...');
        
        this.interval = setInterval(async () => {
            await this.processEvents();
        }, 1000); // Process every second
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        console.log('⏹️  Projection runner stopped');
    }

    private async processEvents(): Promise<void> {
        try {
            for (const projection of this.projections) {
                await this.processProjection(projection);
            }
        } catch (error) {
            console.error('❌ Error processing projections:', error);
        }
    }

    private async processProjection(projection: any): Promise<void> {
        const projectionName = projection.constructor.name;
        
        // Get current position
        const positionResult = await this.db.query(
            'SELECT position FROM projection_positions WHERE projection_name = $1',
            [projectionName]
        );
        
        const currentPosition = positionResult.rows[0]?.position || 0;
        
        // Get new events
        const events = await this.eventStore.getAllEvents(currentPosition, 50);
        
        if (events.length === 0) return;
        
        // Process events
        for (const event of events) {
            await projection.handle(event);
        }
        
        // Update position
        const lastEvent = events[events.length - 1];
        await this.db.query(
            'UPDATE projection_positions SET position = $1, updated_at = NOW() WHERE projection_name = $2',
            [lastEvent.version, projectionName]
        );
        
        console.log(`✅ Processed ${events.length} events for ${projectionName}`);
    }
}
