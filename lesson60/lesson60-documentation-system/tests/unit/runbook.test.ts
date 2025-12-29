import { RunbookGenerator } from '../../src/generators/runbookGenerator';

describe('RunbookGenerator', () => {
  const generator = new RunbookGenerator();

  test('should generate runbook from template', () => {
    const runbook = generator.generateFromTemplate('High latency', 'API');
    
    expect(runbook.symptom).toBe('High latency');
    expect(runbook.title).toContain('API');
    expect(runbook.diagnosis.length).toBeGreaterThan(0);
    expect(runbook.remediation.length).toBeGreaterThan(0);
  });

  test('should include automated steps', () => {
    const runbook = generator.generateFromTemplate('Test', 'Component');
    const automatedSteps = runbook.diagnosis.filter(s => s.automated);
    
    expect(automatedSteps.length).toBeGreaterThan(0);
  });
});
