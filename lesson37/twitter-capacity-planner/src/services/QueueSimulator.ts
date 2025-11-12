/**
 * Simulates queue behavior for testing and demonstration
 */
export class QueueSimulator {
  private queues: Map<string, any[]> = new Map();
  private arrivalRates: Map<string, number> = new Map();
  private serviceRates: Map<string, number> = new Map();
  private serverCounts: Map<string, number> = new Map();

  /**
   * Initialize a queue
   */
  initializeQueue(
    name: string,
    baseArrivalRate: number,
    serviceRate: number,
    serverCount: number = 1
  ): void {
    this.queues.set(name, []);
    this.arrivalRates.set(name, baseArrivalRate);
    this.serviceRates.set(name, serviceRate);
    this.serverCounts.set(name, serverCount);
  }

  /**
   * Simulate traffic pattern
   */
  simulateTrafficPattern(
    name: string,
    pattern: 'steady' | 'spike' | 'growing' | 'declining',
    intensity: number = 1.0
  ): void {
    const baseRate = this.arrivalRates.get(name) || 10;
    let newRate = baseRate;

    switch (pattern) {
      case 'spike':
        newRate = baseRate * (1 + 2 * intensity);
        break;
      case 'growing':
        newRate = baseRate * (1 + 0.1 * intensity);
        this.arrivalRates.set(name, newRate);
        break;
      case 'declining':
        newRate = baseRate * (1 - 0.1 * intensity);
        this.arrivalRates.set(name, newRate);
        break;
      case 'steady':
      default:
        newRate = baseRate;
    }

    // Generate arrivals based on Poisson process
    const arrivalCount = this.poissonRandom(newRate);
    const queue = this.queues.get(name) || [];
    
    for (let i = 0; i < arrivalCount; i++) {
      queue.push({ id: Date.now() + i, arrivalTime: Date.now() });
    }
    
    this.queues.set(name, queue);
  }

  /**
   * Process queue items (service)
   */
  processQueue(name: string): {
    arrivals: number;
    serviced: number;
    queueDepth: number;
  } {
    const queue = this.queues.get(name) || [];
    const serviceRate = this.serviceRates.get(name) || 10;
    const serverCount = this.serverCounts.get(name) || 1;
    
    // Service capacity
    const serviceCapacity = this.poissonRandom(serviceRate * serverCount);
    
    // Service items
    const serviced = Math.min(serviceCapacity, queue.length);
    queue.splice(0, serviced);
    
    this.queues.set(name, queue);
    
    return {
      arrivals: queue.length + serviced,
      serviced,
      queueDepth: queue.length
    };
  }

  /**
   * Get current queue depth
   */
  getQueueDepth(name: string): number {
    return (this.queues.get(name) || []).length;
  }

  /**
   * Update server count (simulate scaling)
   */
  updateServerCount(name: string, newCount: number): void {
    this.serverCounts.set(name, Math.max(1, newCount));
  }

  /**
   * Generate Poisson random variable
   */
  private poissonRandom(lambda: number): number {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;

    do {
      k++;
      p *= Math.random();
    } while (p > L);

    return k - 1;
  }

  /**
   * Reset all queues
   */
  reset(): void {
    this.queues.clear();
    this.arrivalRates.clear();
    this.serviceRates.clear();
    this.serverCounts.clear();
  }
}
