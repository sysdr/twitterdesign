import { Server } from '../../types';

export class GeoRouter {
  private regionLatencyMap: Map<string, Map<string, number>> = new Map();

  constructor() {
    this.initializeLatencyMap();
  }

  private initializeLatencyMap(): void {
    // Simulated latency data for different regions (in ms)
    const latencies = {
      'us-east': { 'us-east': 10, 'us-west': 70, 'eu-west': 80, 'asia-pacific': 150 },
      'us-west': { 'us-east': 70, 'us-west': 10, 'eu-west': 120, 'asia-pacific': 80 },
      'eu-west': { 'us-east': 80, 'us-west': 120, 'eu-west': 10, 'asia-pacific': 100 },
      'asia-pacific': { 'us-east': 150, 'us-west': 80, 'eu-west': 100, 'asia-pacific': 10 }
    };

    Object.entries(latencies).forEach(([region, targets]) => {
      const targetMap = new Map();
      Object.entries(targets).forEach(([target, latency]) => {
        targetMap.set(target, latency);
      });
      this.regionLatencyMap.set(region, targetMap);
    });
  }

  getClientRegion(clientIp: string): string {
    // Browser-compatible IP-based region detection
    // Parse IP address to determine region
    const ipParts = clientIp.split('.').map(Number);
    
    if (ipParts.length !== 4) {
      return 'us-east'; // Default fallback
    }

    // Simple IP-based region mapping for demo purposes
    const firstOctet = ipParts[0];
    
    // US IP ranges (simplified)
    if (firstOctet >= 1 && firstOctet <= 126) {
      return ipParts[1] > 128 ? 'us-west' : 'us-east';
    }
    // EU IP ranges (simplified)
    else if (firstOctet >= 80 && firstOctet <= 95) {
      return 'eu-west';
    }
    // Asia-Pacific IP ranges (simplified)
    else if (firstOctet >= 100 && firstOctet <= 150) {
      return 'asia-pacific';
    }
    // Default to US East for other ranges
    else {
      return 'us-east';
    }
  }

  selectOptimalServers(clientRegion: string, availableServers: Server[]): Server[] {
    const regionLatencies = this.regionLatencyMap.get(clientRegion);
    if (!regionLatencies) return availableServers;

    return availableServers
      .filter(server => server.status === 'healthy' || server.status === 'warning')
      .sort((a, b) => {
        const latencyA = regionLatencies.get(a.region) || 1000;
        const latencyB = regionLatencies.get(b.region) || 1000;
        return latencyA - latencyB;
      });
  }

  getExpectedLatency(clientRegion: string, serverRegion: string): number {
    const regionLatencies = this.regionLatencyMap.get(clientRegion);
    return regionLatencies?.get(serverRegion) || 1000;
  }
}
