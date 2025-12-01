import { BandwidthAllocation } from '../types/network';

export class BandwidthManager {
  private allocation: BandwidthAllocation;
  private lastUpdate: number = Date.now();

  constructor(totalBandwidth: number) {
    this.allocation = {
      totalBandwidth,
      classes: new Map()
    };

    // Initialize traffic classes
    this.initializeClasses();
  }

  private initializeClasses(): void {
    const classes: Array<[string, number]> = [
      ['text', 1],      // Baseline
      ['media', 3],     // Important but compressible
      ['video', 5],     // High priority, time-sensitive
      ['analytics', 0.5] // Deferrable background traffic
    ];

    const totalWeight = classes.reduce((sum, [, weight]) => sum + weight, 0);

    classes.forEach(([name, weight]) => {
      // Convert Mbps to bytes per second (1 Mbps = 125000 bytes/s)
      const rateMbps = (weight / totalWeight) * this.allocation.totalBandwidth;
      const rateBytesPerSec = rateMbps * 125000;
      this.allocation.classes.set(name, {
        name,
        weight,
        tokens: rateBytesPerSec * 2, // Initial burst capacity (2 seconds worth)
        capacity: rateBytesPerSec * 2,
        rate: rateBytesPerSec // Store in bytes per second
      });
    });
  }

  refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    this.allocation.classes.forEach((trafficClass) => {
      const newTokens = trafficClass.tokens + (trafficClass.rate * elapsed);
      trafficClass.tokens = Math.min(trafficClass.capacity, newTokens);
    });
  }

  canSend(className: string, bytes: number): boolean {
    const trafficClass = this.allocation.classes.get(className);
    if (!trafficClass) return false;

    this.refillTokens();
    return trafficClass.tokens >= bytes;
  }

  consumeTokens(className: string, bytes: number): boolean {
    const trafficClass = this.allocation.classes.get(className);
    if (!trafficClass) return false;

    if (this.canSend(className, bytes)) {
      trafficClass.tokens -= bytes;
      return true;
    }
    return false;
  }

  getAllocation(): BandwidthAllocation {
    return {
      totalBandwidth: this.allocation.totalBandwidth,
      classes: new Map(this.allocation.classes)
    };
  }

  updateTotalBandwidth(newBandwidth: number): void {
    const ratio = newBandwidth / this.allocation.totalBandwidth;
    this.allocation.totalBandwidth = newBandwidth;

    this.allocation.classes.forEach((trafficClass) => {
      // rate is in bytes per second, so we need to recalculate from Mbps
      const weight = trafficClass.weight;
      const totalWeight = Array.from(this.allocation.classes.values())
        .reduce((sum, tc) => sum + tc.weight, 0);
      const rateMbps = (weight / totalWeight) * newBandwidth;
      trafficClass.rate = rateMbps * 125000; // Convert to bytes per second
      trafficClass.capacity = trafficClass.rate * 2;
      trafficClass.tokens = Math.min(trafficClass.tokens * ratio, trafficClass.capacity);
    });
  }
}
