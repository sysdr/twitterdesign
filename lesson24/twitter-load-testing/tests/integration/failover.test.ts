import { FailoverService } from '../../src/services/FailoverService';

describe('FailoverService Integration', () => {
  let service: FailoverService;

  beforeEach(() => {
    service = new FailoverService();
  });

  test('should handle regional failure simulation', async () => {
    const regions = service.getRegions();
    const testRegion = regions[0];
    
    expect(testRegion.status).toBe('active');
    
    await service.simulateRegionalFailure(testRegion.id);
    
    const updatedRegions = service.getRegions();
    const updatedRegion = updatedRegions.find(r => r.id === testRegion.id);
    
    expect(updatedRegion?.status).toBe('offline');
  });

  test('should return only healthy regions', () => {
    const healthyRegions = service.getHealthyRegions();
    expect(healthyRegions.every(r => r.status === 'active')).toBe(true);
  });
});
