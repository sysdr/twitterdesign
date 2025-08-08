import { Event, EventType } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class EventStore {
  private events: Event[] = [];
  private eventsByType: Map<EventType, Event[]> = new Map();
  private eventsByUser: Map<string, Event[]> = new Map();

  public async store(event: Event): Promise<void> {
    // Add ID and timestamp if not present
    if (!event.id) event.id = uuidv4();
    if (!event.timestamp) event.timestamp = new Date();
    if (!event.version) event.version = 1;

    this.events.push(event);
    
    // Index by type
    if (!this.eventsByType.has(event.type)) {
      this.eventsByType.set(event.type, []);
    }
    this.eventsByType.get(event.type)!.push(event);

    // Index by user
    if (!this.eventsByUser.has(event.userId)) {
      this.eventsByUser.set(event.userId, []);
    }
    this.eventsByUser.get(event.userId)!.push(event);

    console.log(`📝 Stored event: ${event.type} for user ${event.userId}`);
  }

  public async getEventsByUser(userId: string, since?: Date): Promise<Event[]> {
    const userEvents = this.eventsByUser.get(userId) || [];
    return since ? userEvents.filter(e => e.timestamp > since) : userEvents;
  }

  public async getEventsByType(type: EventType, since?: Date): Promise<Event[]> {
    const typeEvents = this.eventsByType.get(type) || [];
    return since ? typeEvents.filter(e => e.timestamp > since) : typeEvents;
  }

  public async getRecentEvents(limit: number = 100): Promise<Event[]> {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public async replay(userId: string, since: Date, callback: (event: Event) => void): Promise<void> {
    const events = await this.getEventsByUser(userId, since);
    events.forEach(callback);
  }

  public getTotalEvents(): number {
    return this.events.length;
  }
}
