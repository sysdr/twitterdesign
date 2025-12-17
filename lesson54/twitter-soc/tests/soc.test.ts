import { ThreatAnalyzer } from '../src/services/ThreatAnalyzer';
import { SecurityEvent } from '../src/models/SecurityEvent';

describe('SOC Service Tests', () => {
  let analyzer: ThreatAnalyzer;

  beforeEach(() => {
    analyzer = new ThreatAnalyzer();
  });

  afterEach(async () => {
    await analyzer.cleanup();
  });

  test('should detect brute force attack', async () => {
    const event: SecurityEvent = {
      id: 'test-1',
      timestamp: new Date(),
      eventType: 'AUTH',
      ipAddress: '10.0.0.1',
      userAgent: 'test',
      action: 'LOGIN_ATTEMPT',
      outcome: 'FAILURE',
      metadata: {}
    };

    const threat = await analyzer.analyzeEvent(event);
    expect(threat.score).toBeGreaterThan(0);
  });

  test('should detect SQL injection', async () => {
    const event: SecurityEvent = {
      id: 'test-2',
      timestamp: new Date(),
      eventType: 'API',
      ipAddress: '10.0.0.2',
      userAgent: 'sqlmap',
      action: 'POST /api/search',
      outcome: 'FAILURE',
      metadata: { query: "' OR '1'='1" }
    };

    const threat = await analyzer.analyzeEvent(event);
    expect(threat.score).toBeGreaterThanOrEqual(0.9);
    expect(threat.threatType).toBe('INJECTION_ATTACK');
  });

  test('should allow normal traffic', async () => {
    const event: SecurityEvent = {
      id: 'test-3',
      timestamp: new Date(),
      eventType: 'API',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      action: 'GET /api/tweets',
      outcome: 'SUCCESS',
      metadata: {}
    };

    const threat = await analyzer.analyzeEvent(event);
    expect(threat.recommendedAction).toBe('ALLOW');
  });
});
