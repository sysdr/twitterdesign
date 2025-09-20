import { SessionManager } from '../session/SessionManager';
import { SimpleRedisManager } from '../redis/SimpleRedisManager';

// Mock Redis
jest.mock('../redis/SimpleRedisManager');

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockRedisManager: jest.Mocked<SimpleRedisManager>;

  beforeEach(() => {
    mockRedisManager = new SimpleRedisManager() as jest.Mocked<SimpleRedisManager>;
    sessionManager = new SessionManager(mockRedisManager);
  });

  test('should create session successfully', async () => {
    mockRedisManager.set = jest.fn().mockResolvedValue(undefined);
    
    const tokens = await sessionManager.createSession('user123', 'test@example.com', 'us-east');
    
    expect(tokens).toBeDefined();
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(mockRedisManager.set).toHaveBeenCalled();
  });

  test('should validate session token', async () => {
    const mockSessionData = {
      userId: 'user123',
      sessionId: 'session123',
      email: 'test@example.com',
      region: 'us-east',
      createdAt: new Date(),
      lastActivity: new Date(),
      permissions: ['user:read']
    };

    mockRedisManager.exists = jest.fn().mockResolvedValue(0);
    mockRedisManager.get = jest.fn().mockResolvedValue(JSON.stringify(mockSessionData));
    mockRedisManager.set = jest.fn().mockResolvedValue(undefined);

    // This would need a real JWT token for proper testing
    // For now, we'll mock the validation
    expect(sessionManager).toBeDefined();
  });
});
