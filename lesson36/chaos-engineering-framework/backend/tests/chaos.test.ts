import { describe, test, expect, beforeEach } from '@jest/globals';
import { ChaosInjector } from '../src/chaos/injector';
import { FailureType } from '../src/chaos/types';
import { v4 as uuidv4 } from 'uuid';

describe('Chaos Engineering Framework', () => {
  let injector: ChaosInjector;

  beforeEach(() => {
    injector = new ChaosInjector();
  });

  test('should inject service failure', () => {
    const experiment = {
      id: uuidv4(),
      name: 'Test',
      failureType: FailureType.SERVICE_UNAVAILABLE,
      target: 'api',
      intensity: 100,
      duration: 5000,
      blastRadius: 50,
      status: 'pending' as const
    };

    injector.injectFailure(experiment);
    const active = injector.getActiveExperiments();
    
    expect(active.length).toBe(1);
    expect(active[0].status).toBe('running');
  });

  test('should stop experiment', async () => {
    const experiment = {
      id: uuidv4(),
      name: 'Test',
      failureType: FailureType.SERVICE_UNAVAILABLE,
      target: 'api',
      intensity: 100,
      duration: 10000,
      blastRadius: 50,
      status: 'pending' as const
    };

    injector.injectFailure(experiment);
    injector.stopExperiment(experiment.id);

    const active = injector.getActiveExperiments();
    expect(active[0].status).toBe('completed');
  });
});
