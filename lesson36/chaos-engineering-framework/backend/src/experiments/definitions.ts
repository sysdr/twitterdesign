import { v4 as uuidv4 } from 'uuid';
import { ChaosExperiment, FailureType } from '../chaos/types.js';

export const experimentTemplates = {
  serviceCrash: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'Service Unavailability Test',
    failureType: FailureType.SERVICE_UNAVAILABLE,
    target: 'api',
    intensity: 100,
    duration: 30000, // 30 seconds
    blastRadius: 10, // Affect 10% of requests
    status: 'pending'
  }),

  databaseSlow: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'Database Latency Injection',
    failureType: FailureType.DATABASE_SLOW,
    target: 'database',
    intensity: 75, // 4 second delay
    duration: 45000,
    blastRadius: 20,
    status: 'pending'
  }),

  databaseDown: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'Database Failover Test',
    failureType: FailureType.DATABASE_DOWN,
    target: 'database',
    intensity: 100,
    duration: 60000,
    blastRadius: 50,
    status: 'pending'
  }),

  networkLatency: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'Network Latency Simulation',
    failureType: FailureType.NETWORK_LATENCY,
    target: 'network',
    intensity: 50, // 1 second delay
    duration: 40000,
    blastRadius: 30,
    status: 'pending'
  }),

  cacheFailure: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'Cache Cluster Failure',
    failureType: FailureType.CACHE_FAILURE,
    target: 'cache',
    intensity: 100,
    duration: 35000,
    blastRadius: 100, // All requests miss cache
    status: 'pending'
  }),

  cpuThrottle: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'CPU Throttling Simulation',
    failureType: FailureType.CPU_THROTTLE,
    target: 'compute',
    intensity: 60,
    duration: 25000,
    blastRadius: 100,
    status: 'pending'
  }),

  memoryPressure: (): ChaosExperiment => ({
    id: uuidv4(),
    name: 'Memory Pressure Test',
    failureType: FailureType.MEMORY_PRESSURE,
    target: 'memory',
    intensity: 70,
    duration: 20000,
    blastRadius: 100,
    status: 'pending'
  })
};
