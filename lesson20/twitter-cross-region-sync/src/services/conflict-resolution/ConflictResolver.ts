import { ReplicationEvent, ConflictResolution, VectorClock } from '../../types';
import { VectorClockUtil } from '../../utils/vectorClock';

export class ConflictResolver {
  private static instance: ConflictResolver;

  static getInstance(): ConflictResolver {
    if (!this.instance) {
      this.instance = new ConflictResolver();
    }
    return this.instance;
  }

  resolveConflict(events: ReplicationEvent[]): ConflictResolution {
    if (events.length < 2) {
      throw new Error('Need at least 2 events to resolve conflict');
    }

    const conflictType = this.detectConflictType(events);
    const strategy = this.selectResolutionStrategy(conflictType, events);
    const resolution = this.applyResolutionStrategy(strategy, events);

    return {
      eventId: events[0].id,
      conflictType,
      strategy,
      resolution,
      timestamp: Date.now()
    };
  }

  private detectConflictType(events: ReplicationEvent[]): ConflictResolution['conflictType'] {
    const hasPartitionRecovery = events.some(e => 
      Date.now() - e.timestamp > 30000 // 30 second delay indicates partition
    );
    
    if (hasPartitionRecovery) return 'PARTITION_RECOVERY';

    const hasCausalConflict = events.some((e1, i) => 
      events.slice(i + 1).some(e2 => 
        VectorClockUtil.causality(e1.vectorClock, e2.vectorClock)
      )
    );

    if (hasCausalConflict) return 'CAUSAL_CONFLICT';
    return 'CONCURRENT_UPDATE';
  }

  private selectResolutionStrategy(
    conflictType: ConflictResolution['conflictType'], 
    events: ReplicationEvent[]
  ): ConflictResolution['strategy'] {
    switch (conflictType) {
      case 'CONCURRENT_UPDATE':
        return 'LAST_WRITER_WINS';
      case 'CAUSAL_CONFLICT':
        return 'MERGE';
      case 'PARTITION_RECOVERY':
        return 'MERGE';
      default:
        return 'MANUAL_RESOLVE';
    }
  }

  private applyResolutionStrategy(
    strategy: ConflictResolution['strategy'], 
    events: ReplicationEvent[]
  ): any {
    switch (strategy) {
      case 'LAST_WRITER_WINS':
        return this.lastWriterWins(events);
      case 'MERGE':
        return this.mergeEvents(events);
      default:
        return events[0].data; // fallback
    }
  }

  private lastWriterWins(events: ReplicationEvent[]): any {
    return events.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    ).data;
  }

  private mergeEvents(events: ReplicationEvent[]): any {
    // Implement merge logic based on data type
    if (events[0].type === 'USER_FOLLOW') {
      return this.mergeFollowerLists(events);
    }
    
    // Default to timestamp-based merge
    return this.lastWriterWins(events);
  }

  private mergeFollowerLists(events: ReplicationEvent[]): any {
    const merged = new Set();
    events.forEach(event => {
      if (event.data.followers) {
        event.data.followers.forEach((follower: string) => merged.add(follower));
      }
    });
    return { followers: Array.from(merged) };
  }
}
