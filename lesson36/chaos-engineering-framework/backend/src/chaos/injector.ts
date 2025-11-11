import { FailureType, ChaosExperiment } from './types.js';

export class ChaosInjector {
  private activeExperiments: Map<string, ChaosExperiment> = new Map();
  private injectedFailures: Map<string, NodeJS.Timeout> = new Map();

  injectFailure(experiment: ChaosExperiment): void {
    console.log(`[Chaos] Injecting ${experiment.failureType} into ${experiment.target}`);
    
    this.activeExperiments.set(experiment.id, {
      ...experiment,
      status: 'running',
      startTime: Date.now()
    });

    switch (experiment.failureType) {
      case FailureType.SERVICE_UNAVAILABLE:
        this.injectServiceFailure(experiment);
        break;
      case FailureType.DATABASE_SLOW:
        this.injectDatabaseLatency(experiment);
        break;
      case FailureType.DATABASE_DOWN:
        this.injectDatabaseFailure(experiment);
        break;
      case FailureType.NETWORK_LATENCY:
        this.injectNetworkLatency(experiment);
        break;
      case FailureType.CACHE_FAILURE:
        this.injectCacheFailure(experiment);
        break;
      case FailureType.CPU_THROTTLE:
        this.injectCPUThrottle(experiment);
        break;
      case FailureType.MEMORY_PRESSURE:
        this.injectMemoryPressure(experiment);
        break;
    }

    // Auto-stop after duration
    const timeout = setTimeout(() => {
      this.stopExperiment(experiment.id);
    }, experiment.duration);

    this.injectedFailures.set(experiment.id, timeout);
  }

  private injectServiceFailure(experiment: ChaosExperiment): void {
    // Simulate service returning 500 errors
    (global as any).chaosInjections = (global as any).chaosInjections || {};
    (global as any).chaosInjections[experiment.target] = {
      type: 'SERVICE_UNAVAILABLE',
      intensity: experiment.intensity,
      blastRadius: experiment.blastRadius
    };
  }

  private injectDatabaseLatency(experiment: ChaosExperiment): void {
    // Add artificial delay to database queries
    (global as any).chaosInjections = (global as any).chaosInjections || {};
    (global as any).chaosInjections['database'] = {
      type: 'SLOW_QUERY',
      delay: 1000 + (experiment.intensity * 40), // 1-5 seconds
      blastRadius: experiment.blastRadius
    };
  }

  private injectDatabaseFailure(experiment: ChaosExperiment): void {
    (global as any).chaosInjections = (global as any).chaosInjections || {};
    (global as any).chaosInjections['database'] = {
      type: 'DATABASE_DOWN',
      intensity: experiment.intensity,
      blastRadius: experiment.blastRadius
    };
  }

  private injectNetworkLatency(experiment: ChaosExperiment): void {
    // Add network delay to requests
    (global as any).chaosInjections = (global as any).chaosInjections || {};
    (global as any).chaosInjections['network'] = {
      type: 'LATENCY',
      delay: 100 + (experiment.intensity * 19), // 100ms-2000ms
      blastRadius: experiment.blastRadius
    };
  }

  private injectCacheFailure(experiment: ChaosExperiment): void {
    (global as any).chaosInjections = (global as any).chaosInjections || {};
    (global as any).chaosInjections['cache'] = {
      type: 'CACHE_MISS',
      intensity: experiment.intensity,
      blastRadius: experiment.blastRadius
    };
  }

  private injectCPUThrottle(experiment: ChaosExperiment): void {
    // Simulate CPU throttling by running busy loop
    const throttleAmount = experiment.intensity / 100;
    const interval = setInterval(() => {
      const start = Date.now();
      while (Date.now() - start < 50 * throttleAmount) {
        // Busy wait to consume CPU
        Math.random();
      }
    }, 100);

    (global as any).chaosIntervals = (global as any).chaosIntervals || new Map();
    (global as any).chaosIntervals.set(experiment.id, interval);
  }

  private injectMemoryPressure(experiment: ChaosExperiment): void {
    // Allocate memory to simulate pressure
    const sizeInMB = 10 * (experiment.intensity / 100);
    const buffer = Buffer.alloc(sizeInMB * 1024 * 1024);
    
    (global as any).chaosMemory = (global as any).chaosMemory || new Map();
    (global as any).chaosMemory.set(experiment.id, buffer);
  }

  stopExperiment(experimentId: string): void {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) return;

    console.log(`[Chaos] Stopping experiment ${experimentId}`);

    // Clear timeout
    const timeout = this.injectedFailures.get(experimentId);
    if (timeout) {
      clearTimeout(timeout);
      this.injectedFailures.delete(experimentId);
    }

    // Clear CPU throttle
    if ((global as any).chaosIntervals?.has(experimentId)) {
      clearInterval((global as any).chaosIntervals.get(experimentId));
      (global as any).chaosIntervals.delete(experimentId);
    }

    // Clear memory
    if ((global as any).chaosMemory?.has(experimentId)) {
      (global as any).chaosMemory.delete(experimentId);
    }

    // Clear injections
    if ((global as any).chaosInjections) {
      delete (global as any).chaosInjections[experiment.target];
      delete (global as any).chaosInjections['database'];
      delete (global as any).chaosInjections['network'];
      delete (global as any).chaosInjections['cache'];
    }

    this.activeExperiments.set(experimentId, {
      ...experiment,
      status: 'completed',
      endTime: Date.now()
    });
  }

  getActiveExperiments(): ChaosExperiment[] {
    return Array.from(this.activeExperiments.values());
  }

  shouldInjectFailure(target: string): boolean {
    const injection = (global as any).chaosInjections?.[target];
    if (!injection) return false;

    // Apply blast radius
    return Math.random() * 100 < injection.blastRadius;
  }

  getInjectedDelay(target: string): number {
    const injection = (global as any).chaosInjections?.[target];
    if (!injection || !injection.delay) return 0;

    // Apply blast radius
    if (Math.random() * 100 < injection.blastRadius) {
      return injection.delay;
    }
    return 0;
  }
}

export const chaosInjector = new ChaosInjector();
