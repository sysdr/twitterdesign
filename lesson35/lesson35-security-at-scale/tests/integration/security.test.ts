import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE = 'http://localhost:3000/api';

describe('Security at Scale Integration Tests', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('should register a new user', async () => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user',
        email: 'test@example.com',
        password: 'TestPass123!'
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should login successfully', async () => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!'
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  it('should reject invalid credentials', async () => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword'
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });

  it('should get threat score', async () => {
    const response = await fetch(`${API_BASE}/user/threat-score`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.score).toBeDefined();
    expect(data.factors).toBeDefined();
  });

  it('should enforce rate limiting', async () => {
    const requests = Array.from({ length: 60 }, () =>
      fetch(`${API_BASE}/health`)
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    expect(rateLimited).toBe(true);
  });

  it('should refresh access token', async () => {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
  });
});
