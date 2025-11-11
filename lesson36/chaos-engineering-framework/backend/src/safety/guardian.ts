import { ChaosExperiment, SafetyThreshold, ExperimentMetrics } from '../chaos/types.js';
import { chaosInjector } from '../chaos/injector.js';
import { metricsCollector } from '../monitoring/metrics.js';

export class SafetyGuardian {
  private readonly defaultThresholds: SafetyThreshold = {
    maxErrorRate: 0.1, // 0.1%
    maxLatencyP99: 500, // 500ms
    maxRecoveryTime: 30000 // 30 seconds
  };

  private checkInterval?: NodeJS.Timeout;

  startMonitoring(): void {
    // Check safety every 5 seconds
    this.checkInterval = setInterval(() => {
      this.checkSafety();
    }, 5000);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  checkSafety(): void {
    const activeExperiments = chaosInjector.getActiveExperiments()
      .filter(exp => exp.status === 'running');

    for (const experiment of activeExperiments) {
      const metrics = metricsCollector.getMetrics();
      
      if (this.shouldAbort(metrics, this.defaultThresholds)) {
        console.warn(`[Safety] Aborting experiment ${experiment.id} - safety threshold breached`);
        this.abortExperiment(experiment.id, metrics);
      }
    }
  }

  private shouldAbort(metrics: ExperimentMetrics, thresholds: SafetyThreshold): boolean {
    // Abort if error rate too high
    if (metrics.errorRate > thresholds.maxErrorRate) {
      console.warn(`[Safety] Error rate ${metrics.errorRate}% exceeds threshold ${thresholds.maxErrorRate}%`);
      return true;
    }

    // Abort if latency too high
    if (metrics.latencyP99 > thresholds.maxLatencyP99) {
      console.warn(`[Safety] P99 latency ${metrics.latencyP99}ms exceeds threshold ${thresholds.maxLatencyP99}ms`);
      return true;
    }

    return false;
  }

  private abortExperiment(experimentId: string, metrics: ExperimentMetrics): void {
    chaosInjector.stopExperiment(experimentId);
    
    console.log('[Safety] Executing automated rollback');
    // Clear all chaos injections immediately
    (global as any).chaosInjections = {};
    
    // Reset metrics
    metricsCollector.reset();
  }

  emergencyStop(): void {
    console.error('[Safety] EMERGENCY STOP - Halting all experiments');
    
    const activeExperiments = chaosInjector.getActiveExperiments();
    for (const experiment of activeExperiments) {
      chaosInjector.stopExperiment(experiment.id);
    }

    // Clear all injections
    (global as any).chaosInjections = {};
    (global as any).chaosIntervals?.forEach((interval: NodeJS.Timeout) => clearInterval(interval));
    (global as any).chaosMemory?.clear();
  }
}

export const safetyGuardian = new SafetyGuardian();
