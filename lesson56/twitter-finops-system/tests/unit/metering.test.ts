import { MeteringService } from '../../src/services/metering/MeteringService';

describe('MeteringService', () => {
  let service: MeteringService;

  beforeEach(() => {
    service = new MeteringService();
  });

  afterEach(() => {
    service.stop();
  });

  test('should start and collect metrics', async () => {
    service.start();
    
    // Wait for at least one collection cycle
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    const usage = service.getRecentUsage(1);
    expect(usage.length).toBeGreaterThan(0);
  });

  test('should track multiple services', async () => {
    service.start();
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    const usage = service.getRecentUsage(1);
    const serviceIds = new Set(usage.map(u => u.serviceId));
    
    expect(serviceIds.size).toBeGreaterThan(3);
  });

  test('should include required metrics', async () => {
    service.start();
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    const usage = service.getRecentUsage(1);
    const sample = usage[0];
    
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('serviceId');
    expect(sample).toHaveProperty('resourceType');
    expect(sample).toHaveProperty('metrics');
  });
});
