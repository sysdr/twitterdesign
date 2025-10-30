import BloomFilters from 'bloom-filters';
const { BloomFilter } = BloomFilters as unknown as { BloomFilter: new (size: number, hashes: number) => any };

export class BloomFilterService {
  private l1Filter: BloomFilter;
  private l2Filter: BloomFilter;
  private l3Filter: BloomFilter;
  private l1Bits: number;
  private l2Bits: number;
  private l3Bits: number;
  private stats = {
    falsePositiveRate: 0,
    totalChecks: 0,
    falsePositives: 0
  };

  constructor() {
    // Initialize bloom filters with appropriate sizes and hash functions
    this.l1Bits = 10000;
    this.l2Bits = 100000;
    this.l3Bits = 1000000;
    this.l1Filter = new BloomFilter(this.l1Bits, 4); // Hot data - smaller, faster
    this.l2Filter = new BloomFilter(this.l2Bits, 4); // Warm data - medium size  
    this.l3Filter = new BloomFilter(this.l3Bits, 4); // Cold data - large capacity
  }

  checkL1(key: string): boolean {
    this.stats.totalChecks++;
    return this.l1Filter.has(key);
  }

  checkL2(key: string): boolean {
    this.stats.totalChecks++;
    return this.l2Filter.has(key);
  }

  checkL3(key: string): boolean {
    this.stats.totalChecks++;
    return this.l3Filter.has(key);
  }

  addToL1(key: string): void {
    this.l1Filter.add(key);
  }

  addToL2(key: string): void {
    this.l2Filter.add(key);
  }

  addToL3(key: string): void {
    this.l3Filter.add(key);
  }

  recordFalsePositive(): void {
    this.stats.falsePositives++;
    this.stats.falsePositiveRate = this.stats.falsePositives / this.stats.totalChecks;
  }

  getStats() {
    return {
      ...this.stats,
      memoryUsage: this.getMemoryUsage()
    };
  }

  private getMemoryUsage(): number {
    // Estimate memory usage in bytes
    return (this.l1Bits + this.l2Bits + this.l3Bits) / 8;
  }

  reset(): void {
    this.l1Filter = new BloomFilter(this.l1Bits, 4);
    this.l2Filter = new BloomFilter(this.l2Bits, 4);
    this.l3Filter = new BloomFilter(this.l3Bits, 4);
    this.stats = { falsePositiveRate: 0, totalChecks: 0, falsePositives: 0 };
  }
}
