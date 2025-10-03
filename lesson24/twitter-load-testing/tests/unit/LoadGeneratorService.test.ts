import { LoadGeneratorService } from '../../src/services/LoadGeneratorService';
import { Region, LoadTestConfig } from '../../src/types';

describe('LoadGeneratorService', () => {
  let service: LoadGeneratorService;
  let mockRegion: Region;
  let mockConfig: LoadTestConfig;

  beforeEach(() => {
    service = new LoadGeneratorService();
    mockRegion = {
      id: 'us-east-1',
      name: 'US East',
      endpoint: 'https://api.example.com',
      location: { lat: 39, lng: -76 },
      status: 'active'
    };
    mockConfig = {
      duration: 1,
      concurrentUsers: 10,
      rampUpTime: 1,
      regions: ['us-east-1'],
      scenarios: [{
        id: 'test',
        name: 'Test Scenario',
        actions: [{ type: 'get', endpoint: '/test', expectedStatus: 200 }],
        weight: 1
      }]
    };
  });

  test('should start and complete regional test', async () => {
    const promise = service.startRegionalTest(mockRegion, mockConfig);
    
    // Wait a bit and then stop
    setTimeout(() => service.stopTest(mockRegion.id), 500);
    
    await promise;
    expect(service.getMetrics().length).toBeGreaterThan(0);
  });

  test('should record metrics during test', async () => {
    const promise = service.startRegionalTest(mockRegion, mockConfig);
    
    setTimeout(() => {
      const metrics = service.getRegionalMetrics(mockRegion.id);
      expect(metrics.length).toBeGreaterThan(0);
      service.stopTest(mockRegion.id);
    }, 200);
    
    await promise;
  });
});
