import { Region } from '../types';

export class FailoverService {
  private regions: Region[] = [];
  private failoverCallbacks: ((regionId: string, status: string) => void)[] = [];

  constructor() {
    this.initializeRegions();
  }

  private initializeRegions(): void {
    this.regions = [
      {
        id: 'us-east-1',
        name: 'US East (Virginia)',
        endpoint: 'https://api-us-east.twitter-clone.com',
        location: { lat: 39.0458, lng: -76.6413 },
        status: 'active'
      },
      {
        id: 'eu-west-1',
        name: 'EU West (Ireland)',
        endpoint: 'https://api-eu-west.twitter-clone.com',
        location: { lat: 53.3498, lng: -6.2603 },
        status: 'active'
      },
      {
        id: 'ap-southeast-1',
        name: 'Asia Pacific (Singapore)',
        endpoint: 'https://api-ap-southeast.twitter-clone.com',
        location: { lat: 1.3521, lng: 103.8198 },
        status: 'active'
      },
      {
        id: 'us-west-2',
        name: 'US West (Oregon)',
        endpoint: 'https://api-us-west.twitter-clone.com',
        location: { lat: 45.5152, lng: -122.6784 },
        status: 'active'
      }
    ];
  }

  async simulateRegionalFailure(regionId: string): Promise<void> {
    console.log(`🚨 Simulating failure in region: ${regionId}`);
    
    const region = this.regions.find(r => r.id === regionId);
    if (region) {
      region.status = 'offline';
      this.notifyFailover(regionId, 'offline');
      
      // Simulate recovery after 30 seconds
      setTimeout(() => {
        this.recoverRegion(regionId);
      }, 30000);
    }
  }

  async simulateRegionalDegradation(regionId: string): Promise<void> {
    console.log(`⚠️ Simulating degradation in region: ${regionId}`);
    
    const region = this.regions.find(r => r.id === regionId);
    if (region) {
      region.status = 'degraded';
      this.notifyFailover(regionId, 'degraded');
      
      // Simulate recovery after 60 seconds
      setTimeout(() => {
        this.recoverRegion(regionId);
      }, 60000);
    }
  }

  private recoverRegion(regionId: string): void {
    console.log(`✅ Recovering region: ${regionId}`);
    
    const region = this.regions.find(r => r.id === regionId);
    if (region) {
      region.status = 'active';
      this.notifyFailover(regionId, 'active');
    }
  }

  private notifyFailover(regionId: string, status: string): void {
    this.failoverCallbacks.forEach(callback => {
      callback(regionId, status);
    });
  }

  onFailover(callback: (regionId: string, status: string) => void): void {
    this.failoverCallbacks.push(callback);
  }

  getRegions(): Region[] {
    return [...this.regions];
  }

  getHealthyRegions(): Region[] {
    return this.regions.filter(r => r.status === 'active');
  }
}
