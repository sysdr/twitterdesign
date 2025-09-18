import { ReplicationEvent, Region, VectorClock } from '../../types';
import { VectorClockUtil } from '../../utils/vectorClock';
import { ConflictResolver } from '../conflict-resolution/ConflictResolver';

export class ReplicationEngine {
  private regions: Map<string, Region> = new Map();
  private eventQueue: Map<string, ReplicationEvent[]> = new Map();
  private vectorClock: VectorClock = {};
  private conflictResolver = ConflictResolver.getInstance();

  constructor(private currentRegion: string) {
    this.initializeRegions();
    this.startReplicationLoop();
  }

  private initializeRegions() {
    const regions = [
      { id: 'us-east', name: 'US East', location: 'Virginia', status: 'ACTIVE' as const, latency: 50, lastSync: Date.now(), conflictRate: 0.02 },
      { id: 'eu-west', name: 'EU West', location: 'Ireland', status: 'ACTIVE' as const, latency: 120, lastSync: Date.now(), conflictRate: 0.01 },
      { id: 'asia-pacific', name: 'Asia Pacific', location: 'Tokyo', status: 'ACTIVE' as const, latency: 200, lastSync: Date.now(), conflictRate: 0.03 }
    ];

    regions.forEach(region => {
      this.regions.set(region.id, region);
      this.eventQueue.set(region.id, []);
      this.vectorClock[region.id] = 0;
    });
  }

  async replicateEvent(event: ReplicationEvent): Promise<void> {
    // Increment local vector clock
    this.vectorClock = VectorClockUtil.increment(this.vectorClock, this.currentRegion);
    event.vectorClock = { ...this.vectorClock };

    // Add to replication queues for target regions
    event.targetRegions.forEach(regionId => {
      if (regionId !== this.currentRegion) {
        const queue = this.eventQueue.get(regionId) || [];
        queue.push(event);
        this.eventQueue.set(regionId, queue);
      }
    });

    // Simulate network delay
    await this.simulateNetworkDelay(event.targetRegions);
  }

  private async simulateNetworkDelay(targetRegions: string[]): Promise<void> {
    const maxLatency = Math.max(
      ...targetRegions.map(regionId => this.regions.get(regionId)?.latency || 100)
    );
    
    await new Promise(resolve => setTimeout(resolve, maxLatency + Math.random() * 100));
  }

  private startReplicationLoop() {
    setInterval(() => {
      this.processReplicationQueues();
    }, 1000); // Process every second
  }

  private processReplicationQueues() {
    this.eventQueue.forEach((queue, regionId) => {
      if (queue.length === 0) return;

      // Group events by ID to detect conflicts
      const eventGroups = new Map<string, ReplicationEvent[]>();
      queue.forEach(event => {
        const group = eventGroups.get(event.id) || [];
        group.push(event);
        eventGroups.set(event.id, group);
      });

      // Process each group
      eventGroups.forEach((events, eventId) => {
        if (events.length > 1) {
          // Conflict detected
          try {
            const resolution = this.conflictResolver.resolveConflict(events);
            this.applyResolution(resolution);
            
            // Update region conflict rate
            const region = this.regions.get(regionId);
            if (region) {
              region.conflictRate = (region.conflictRate + 0.01) * 0.9; // Exponential smoothing
            }
          } catch (error) {
            console.error('Conflict resolution failed:', error);
          }
        } else {
          // No conflict, apply directly
          this.applyEvent(events[0]);
        }
      });

      // Clear processed events
      this.eventQueue.set(regionId, []);
      
      // Update last sync timestamp
      const region = this.regions.get(regionId);
      if (region) {
        region.lastSync = Date.now();
      }
    });
  }

  private applyResolution(resolution: any) {
    // Apply conflict resolution to local state
    console.log('Applied conflict resolution:', resolution);
    
    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('conflict-resolved', { 
      detail: resolution 
    }));
  }

  private applyEvent(event: ReplicationEvent) {
    // Merge vector clocks
    this.vectorClock = VectorClockUtil.merge(this.vectorClock, event.vectorClock);
    
    // Apply event to local state
    console.log('Applied replication event:', event);
    
    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('event-replicated', { 
      detail: event 
    }));
  }

  getRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  getCurrentVectorClock(): VectorClock {
    return { ...this.vectorClock };
  }

  simulateNetworkPartition(regionId: string, duration: number = 10000) {
    const region = this.regions.get(regionId);
    if (region) {
      region.status = 'PARTITIONED';
      
      setTimeout(() => {
        region.status = 'ACTIVE';
        region.lastSync = Date.now();
        
        // Emit partition recovery event
        window.dispatchEvent(new CustomEvent('partition-recovered', {
          detail: { regionId, duration }
        }));
      }, duration);
    }
  }
}
