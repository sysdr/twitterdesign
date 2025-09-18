import React, { useState, useEffect } from 'react';
import { ReplicationEngine } from './services/replication/ReplicationEngine';
import { RegionStatus } from './components/dashboard/RegionStatus';
import { SyncMetrics } from './components/dashboard/SyncMetrics';
import { EventLog } from './components/dashboard/EventLog';
import { ReplicationEvent, Region } from './types';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const CURRENT_REGION = 'us-east';

function App() {
  const [replicationEngine] = useState(() => new ReplicationEngine(CURRENT_REGION));
  const [regions, setRegions] = useState<Region[]>([]);
  const [events, setEvents] = useState<ReplicationEvent[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize regions
    setRegions(replicationEngine.getRegions());

    // Listen for replication events
    const handleEventReplicated = (event: CustomEvent) => {
      setEvents(prev => [...prev, event.detail]);
      updateMetrics();
    };

    const handleConflictResolved = (event: CustomEvent) => {
      console.log('Conflict resolved:', event.detail);
      updateMetrics();
    };

    const handlePartitionRecovered = (event: CustomEvent) => {
      console.log('Partition recovered:', event.detail);
      setRegions(replicationEngine.getRegions());
    };

    window.addEventListener('event-replicated', handleEventReplicated);
    window.addEventListener('conflict-resolved', handleConflictResolved);
    window.addEventListener('partition-recovered', handlePartitionRecovered);

    // Update regions every 2 seconds
    const regionInterval = setInterval(() => {
      setRegions(replicationEngine.getRegions());
    }, 2000);

    // Update metrics every 5 seconds
    const metricsInterval = setInterval(updateMetrics, 5000);

    return () => {
      window.removeEventListener('event-replicated', handleEventReplicated);
      window.removeEventListener('conflict-resolved', handleConflictResolved);
      window.removeEventListener('partition-recovered', handlePartitionRecovered);
      clearInterval(regionInterval);
      clearInterval(metricsInterval);
    };
  }, [replicationEngine]);

  const updateMetrics = () => {
    const newMetric = {
      timestamp: Date.now(),
      totalEvents: events.length,
      replicationLag: Math.random() * 500 + 100, // Simulated
      conflictsResolved: Math.floor(events.length * 0.05), // 5% conflict rate
      successRate: 0.95 + Math.random() * 0.05,
      networkPartitions: 0
    };

    setMetrics(prev => [...prev.slice(-20), newMetric]); // Keep last 20 points
  };

  const createTweet = async () => {
    setIsLoading(true);
    
    const tweetEvent: ReplicationEvent = {
      id: uuidv4(),
      type: 'TWEET_CREATE',
      data: {
        content: `Sample tweet from ${CURRENT_REGION} at ${new Date().toLocaleTimeString()}`,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now()
      },
      vectorClock: replicationEngine.getCurrentVectorClock(),
      timestamp: Date.now(),
      originRegion: CURRENT_REGION,
      targetRegions: ['eu-west', 'asia-pacific']
    };

    try {
      await replicationEngine.replicateEvent(tweetEvent);
      setEvents(prev => [...prev, tweetEvent]);
    } catch (error) {
      console.error('Failed to create tweet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateConflict = async () => {
    setIsLoading(true);

    // Create conflicting events
    const baseEvent = {
      id: uuidv4(),
      type: 'TWEET_UPDATE' as const,
      vectorClock: replicationEngine.getCurrentVectorClock(),
      originRegion: CURRENT_REGION,
      targetRegions: ['eu-west', 'asia-pacific']
    };

    const event1: ReplicationEvent = {
      ...baseEvent,
      data: { content: 'Updated from US', version: 1 },
      timestamp: Date.now()
    };

    const event2: ReplicationEvent = {
      ...baseEvent,
      data: { content: 'Updated from EU', version: 1 },
      timestamp: Date.now() + 100,
      originRegion: 'eu-west'
    };

    try {
      await replicationEngine.replicateEvent(event1);
      await replicationEngine.replicateEvent(event2);
      setEvents(prev => [...prev, event1, event2]);
    } catch (error) {
      console.error('Failed to simulate conflict:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePartition = () => {
    const regionToPartition = regions.find(r => r.status === 'ACTIVE' && r.id !== CURRENT_REGION);
    if (regionToPartition) {
      replicationEngine.simulateNetworkPartition(regionToPartition.id, 5000);
      alert(`Simulating network partition for ${regionToPartition.name} for 5 seconds`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cross-Region Synchronization Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor global data replication and conflict resolution across regions
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Test Operations</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={createTweet}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Tweet'}
            </button>
            
            <button
              onClick={simulateConflict}
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Simulate Conflict
            </button>
            
            <button
              onClick={simulatePartition}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Simulate Partition
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RegionStatus regions={regions} />
          <SyncMetrics metrics={metrics} />
        </div>

        <EventLog events={events} />
      </div>
    </div>
  );
}

export default App;
