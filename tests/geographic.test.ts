import { GeographicService } from '../src/services/geographic';
import { ComplianceService } from '../src/services/compliance';

describe('GeographicService', () => {
  let service: GeographicService;

  beforeEach(() => {
    service = new GeographicService();
  });

  test('should return optimal region based on location', async () => {
    // Test US location
    const usLocation = { lat: 40.7128, lng: -74.0060 }; // New York
    const usRegion = await service.getOptimalRegion(usLocation);
    expect(usRegion).toBe('us-east');

    // Test EU location
    const euLocation = { lat: 50.1109, lng: 8.6821 }; // Frankfurt
    const euRegion = await service.getOptimalRegion(euLocation);
    expect(euRegion).toBe('eu-central');

    // Test Asia location
    const asiaLocation = { lat: 1.3521, lng: 103.8198 }; // Singapore
    const asiaRegion = await service.getOptimalRegion(asiaLocation);
    expect(asiaRegion).toBe('asia-pacific');
  });

  test('should return all regions', () => {
    const regions = service.getRegions();
    expect(regions).toHaveLength(3);
    expect(regions.map(r => r.id)).toContain('us-east');
    expect(regions.map(r => r.id)).toContain('eu-central');
    expect(regions.map(r => r.id)).toContain('asia-pacific');
  });

  test('should update region status', () => {
    service.updateRegionStatus('us-east', 'degraded');
    const regions = service.getRegions();
    const usRegion = regions.find(r => r.id === 'us-east');
    expect(usRegion?.status).toBe('degraded');
  });
});

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService();
  });

  test('should determine data residency region correctly', () => {
    expect(service.getDataResidencyRegion('DE')).toBe('eu-central');
    expect(service.getDataResidencyRegion('FR')).toBe('eu-central');
    expect(service.getDataResidencyRegion('SG')).toBe('asia-pacific');
    expect(service.getDataResidencyRegion('US')).toBe('us-east');
  });

  test('should validate data storage permissions', () => {
    expect(service.canStoreData('personal_data', 'eu-central')).toBe(true);
    expect(service.canStoreData('public_data', 'us-east')).toBe(true);
  });

  test('should validate cross-region data transfer', () => {
    expect(service.canTransferData('personal_data', 'eu-central', 'us-east')).toBe(false);
    expect(service.canTransferData('public_data', 'us-east', 'asia-pacific')).toBe(true);
  });
});
