import { ReplicationEngine } from '../../services/replication/ReplicationEngine';
import { ReplicationEvent } from '../../types';

describe('ReplicationEngine Integration', () => {
  let engine: ReplicationEngine;

  beforeEach(() => {
    engine = new ReplicationEngine('us-east');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should replicate events across regions', async () => {
    const event: ReplicationEvent = {
      id: 'test-event-1',
      type: 'TWEET_CREATE',
      data: { content: 'Test tweet' },
      vectorClock: { 'us-east': 1 },
      timestamp: Date.now(),
      originRegion: 'us-east',
      targetRegions: ['eu-west', 'asia-pacific']
    };

    await engine.replicateEvent(event);
    
    expect(engine.getCurrentVectorClock()['us-east']).toBeGreaterThan(0);
  });

  test('should handle network partitions', () => {
    engine.simulateNetworkPartition('eu-west', 1000);
    
    const regions = engine.getRegions();
    const euRegion = regions.find(r => r.id === 'eu-west');
    
    expect(euRegion?.status).toBe('PARTITIONED');
    
    // Fast-forward time to simulate recovery
    jest.advanceTimersByTime(1500);
    
    const updatedRegions = engine.getRegions();
    const recoveredRegion = updatedRegions.find(r => r.id === 'eu-west');
    
    expect(recoveredRegion?.status).toBe('ACTIVE');
  });
});
