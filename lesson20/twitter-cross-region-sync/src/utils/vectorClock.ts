import { VectorClock } from '../types';

export class VectorClockUtil {
  static increment(clock: VectorClock, regionId: string): VectorClock {
    return {
      ...clock,
      [regionId]: (clock[regionId] || 0) + 1
    };
  }

  static merge(clock1: VectorClock, clock2: VectorClock): VectorClock {
    const merged: VectorClock = { ...clock1 };
    
    Object.keys(clock2).forEach(regionId => {
      merged[regionId] = Math.max(merged[regionId] || 0, clock2[regionId]);
    });
    
    return merged;
  }

  static compare(clock1: VectorClock, clock2: VectorClock): 'BEFORE' | 'AFTER' | 'CONCURRENT' {
    const regions = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
    let hasSmaller = false;
    let hasLarger = false;

    for (const region of regions) {
      const v1 = clock1[region] || 0;
      const v2 = clock2[region] || 0;
      
      if (v1 < v2) hasSmaller = true;
      if (v1 > v2) hasLarger = true;
    }

    if (hasSmaller && hasLarger) return 'CONCURRENT';
    if (hasSmaller) return 'BEFORE';
    if (hasLarger) return 'AFTER';
    return 'CONCURRENT'; // equal
  }

  static causality(clock1: VectorClock, clock2: VectorClock): boolean {
    return this.compare(clock1, clock2) !== 'CONCURRENT';
  }
}
