import request from 'supertest';
import app from '../server';

describe('Authentication Endpoints', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `test${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    password: 'Test123!@#'
  };

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.tokens).toHaveProperty('accessToken');
    expect(response.body.data.tokens).toHaveProperty('refreshToken');
  });

  it('should login existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens).toHaveProperty('accessToken');
  });

  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect(401);
  });

  it('should validate password requirements', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: `weak${timestamp}@example.com`,
        username: `weakuser${timestamp}`,
        password: 'weak'
      })
      .expect(400);
  });
});
