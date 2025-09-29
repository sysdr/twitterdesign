import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Metric, Region } from '../../types/monitoring';

export class RegionalCollector extends EventEmitter {
  private regionId: string;
  private collectionInterval: NodeJS.Timeout | null = null;
  private simulationVariance: number;

  constructor(regionId: string) {
    super();
    this.regionId = regionId;
    this.simulationVariance = Math.random() * 0.3 + 0.85; // Simulate regional performance differences
  }

  startCollection(): void {
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect every 5 seconds

    console.log(`🔍 Started metric collection for region: ${this.regionId}`);
  }

  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  private collectMetrics(): void {
    const timestamp = Date.now();
    const baseLatency = 100 * this.simulationVariance;
    
    const metrics: Metric[] = [
      {
        id: uuidv4(),
        regionId: this.regionId,
        timestamp,
        type: 'api_latency',
        value: baseLatency + (Math.random() * 50),
        unit: 'ms'
      },
      {
        id: uuidv4(),
        regionId: this.regionId,
        timestamp,
        type: 'error_rate',
        value: (Math.random() * 2) * (2 - this.simulationVariance),
        unit: '%'
      },
      {
        id: uuidv4(),
        regionId: this.regionId,
        timestamp,
        type: 'cpu_usage',
        value: 40 + (Math.random() * 30) * (2 - this.simulationVariance),
        unit: '%'
      },
      {
        id: uuidv4(),
        regionId: this.regionId,
        timestamp,
        type: 'memory_usage',
        value: 60 + (Math.random() * 25),
        unit: '%'
      },
      {
        id: uuidv4(),
        regionId: this.regionId,
        timestamp,
        type: 'db_connections',
        value: Math.floor(150 + (Math.random() * 100)),
        unit: 'count'
      },
      {
        id: uuidv4(),
        regionId: this.regionId,
        timestamp,
        type: 'cache_hit_rate',
        value: 85 + (Math.random() * 10) * this.simulationVariance,
        unit: '%'
      }
    ];

    this.emit('metrics', metrics);
  }

  // Simulate regional issues for testing
  simulateIssue(severity: 'minor' | 'major'): void {
    if (severity === 'major') {
      this.simulationVariance = 0.3; // Significant degradation
    } else {
      this.simulationVariance = 0.7; // Minor degradation
    }
  }

  resetToNormal(): void {
    this.simulationVariance = Math.random() * 0.3 + 0.85;
  }
}
