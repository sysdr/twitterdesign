import { MeteringService } from '../../src/services/metering/MeteringService';
import { CostCalculator } from '../../src/services/calculator/CostCalculator';

describe('CostCalculator', () => {
  let metering: MeteringService;
  let calculator: CostCalculator;

  beforeEach(() => {
    metering = new MeteringService();
    calculator = new CostCalculator();
  });

  afterEach(() => {
    metering.stop();
    calculator.stop();
  });

  test('should calculate costs from metrics', async () => {
    metering.start();
    calculator.start(metering);
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const costs = calculator.getRecentCosts(1);
    expect(costs.length).toBeGreaterThan(0);
  });

  test('should include cost breakdown', async () => {
    metering.start();
    calculator.start(metering);
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const costs = calculator.getRecentCosts(1);
    const sample = costs[0];
    
    expect(sample.breakdown).toHaveProperty('compute');
    expect(sample.breakdown).toHaveProperty('storage');
    expect(sample.breakdown).toHaveProperty('network');
  });

  test('should aggregate costs correctly', async () => {
    metering.start();
    calculator.start(metering);
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const total = calculator.getTotalCost(1);
    expect(total).toBeGreaterThan(0);
  });
});
