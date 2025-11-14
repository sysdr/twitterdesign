import { BayesianOptimizer, Parameter } from '../src/bayesian-optimizer/BayesianOptimizer';

describe('BayesianOptimizer', () => {
  const parameters: Parameter[] = [
    { name: 'x', min: 0, max: 10, type: 'continuous' },
    { name: 'y', min: 0, max: 10, type: 'continuous' }
  ];

  test('should suggest initial configurations', () => {
    const optimizer = new BayesianOptimizer(parameters);
    const suggestion = optimizer.suggestNext();
    
    expect(suggestion.configuration.x).toBeGreaterThanOrEqual(0);
    expect(suggestion.configuration.x).toBeLessThanOrEqual(10);
    expect(suggestion.configuration.y).toBeGreaterThanOrEqual(0);
    expect(suggestion.configuration.y).toBeLessThanOrEqual(10);
  });

  test('should learn from observations', () => {
    const optimizer = new BayesianOptimizer(parameters);
    
    // Optimum is at x=5, y=5
    const testFunction = (config: any) => {
      return -Math.pow(config.x - 5, 2) - Math.pow(config.y - 5, 2);
    };

    // Add observations
    for (let i = 0; i < 10; i++) {
      const suggestion = optimizer.suggestNext();
      const performance = testFunction(suggestion.configuration);
      optimizer.addObservation(suggestion.configuration, performance);
    }

    const best = optimizer.getBestConfiguration();
    expect(best).not.toBeNull();
    expect(best!.performance).toBeLessThan(0); // Should find configurations close to optimum
  });

  test('should handle discrete parameters', () => {
    const discreteParams: Parameter[] = [
      { name: 'threads', min: 2, max: 16, type: 'discrete', step: 2 }
    ];
    
    const optimizer = new BayesianOptimizer(discreteParams);
    const suggestion = optimizer.suggestNext();
    
    expect(suggestion.configuration.threads % 2).toBe(0);
    expect(suggestion.configuration.threads).toBeGreaterThanOrEqual(2);
    expect(suggestion.configuration.threads).toBeLessThanOrEqual(16);
  });
});
