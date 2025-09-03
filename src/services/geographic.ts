import { Region, LatencyData, TrafficRoute } from '../types';

export class GeographicService {
  private regions: Region[] = [
    {
      id: 'us-east',
      name: 'US East (Virginia)',
      code: 'USE1',
      endpoint: 'https://use1.twitter-clone.com',
      location: { lat: 38.13, lng: -78.45 },
      status: 'healthy',
      latency: 0,
      activeUsers: 0,
      capacity: 10000,
      compliance: ['CCPA', 'SOC2']
    },
    {
      id: 'eu-central',
      name: 'EU Central (Frankfurt)',
      code: 'EUC1',
      endpoint: 'https://euc1.twitter-clone.com',
      location: { lat: 50.12, lng: 8.68 },
      status: 'healthy',
      latency: 0,
      activeUsers: 0,
      capacity: 8000,
      compliance: ['GDPR', 'ISO27001']
    },
    {
      id: 'asia-pacific',
      name: 'Asia Pacific (Singapore)',
      code: 'APS1',
      endpoint: 'https://aps1.twitter-clone.com',
      location: { lat: 1.29, lng: 103.85 },
      status: 'healthy',
      latency: 0,
      activeUsers: 0,
      capacity: 6000,
      compliance: ['PDPA', 'SOC2']
    }
  ];

  private latencyMatrix: Map<string, LatencyData[]> = new Map();

  constructor() {
    this.initializeLatencyMonitoring();
  }

  async getOptimalRegion(userLocation: { lat: number; lng: number }): Promise<string> {
    const distances = this.regions.map(region => ({
      regionId: region.id,
      distance: this.calculateDistance(userLocation, region.location),
      region
    }));

    // Sort by distance and filter healthy regions
    const healthyRegions = distances
      .filter(({ region }) => region.status === 'healthy' || region.status === 'degraded')
      .sort((a, b) => a.distance - b.distance);

    // Consider capacity utilization
    const optimalRegion = healthyRegions.find(({ region }) => 
      region.activeUsers < region.capacity * 0.8
    );

    return optimalRegion?.regionId || healthyRegions[0]?.regionId || 'us-east';
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private async initializeLatencyMonitoring(): Promise<void> {
    setInterval(async () => {
      await this.measureLatencies();
    }, 30000); // Measure every 30 seconds
  }

  private async measureLatencies(): Promise<void> {
    for (const fromRegion of this.regions) {
      for (const toRegion of this.regions) {
        if (fromRegion.id !== toRegion.id) {
          const latency = await this.pingRegion(fromRegion.endpoint, toRegion.endpoint);
          const key = `${fromRegion.id}-${toRegion.id}`;
          
          if (!this.latencyMatrix.has(key)) {
            this.latencyMatrix.set(key, []);
          }
          
          this.latencyMatrix.get(key)!.push({
            from: fromRegion.id,
            to: toRegion.id,
            latency,
            timestamp: Date.now()
          });

          // Keep only last 100 measurements
          const measurements = this.latencyMatrix.get(key)!;
          if (measurements.length > 100) {
            measurements.splice(0, measurements.length - 100);
          }
        }
      }
    }
  }

  private async pingRegion(from: string, to: string): Promise<number> {
    const start = performance.now();
    try {
      // Simulate network ping with realistic latencies
      const baseLatency = Math.random() * 50 + 20; // 20-70ms base
      await new Promise(resolve => setTimeout(resolve, baseLatency));
      return Math.round(performance.now() - start);
    } catch {
      return 9999; // Timeout/error
    }
  }

  getRegions(): Region[] {
    return this.regions;
  }

  getLatencyMatrix(): Map<string, LatencyData[]> {
    return this.latencyMatrix;
  }

  updateRegionStatus(regionId: string, status: Region['status']): void {
    const region = this.regions.find(r => r.id === regionId);
    if (region) {
      region.status = status;
    }
  }
}
