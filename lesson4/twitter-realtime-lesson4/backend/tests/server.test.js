const request = require('supertest');
const api = request('http://127.0.0.1:8000');

jest.setTimeout(15000);

describe('API Endpoints', () => {
  test('GET /api/stats should return system statistics', async () => {
    const response = await api.get('/api/stats').timeout({ deadline: 10000 });
    expect(response.status).toBe(200);
    
    expect(response.body).toHaveProperty('totalUsers');
    expect(response.body).toHaveProperty('totalTweets');
    expect(response.body).toHaveProperty('onlineUsers');
  });

  test('POST /api/tweets should create a new tweet', async () => {
    const tweetData = {
      content: 'Test tweet for real-time processing',
      authorId: 'user1'
    };

    const response = await api.post('/api/tweets').send(tweetData).timeout({ deadline: 10000 });
    expect(response.status).toBe(200);

    expect(response.body.tweet).toHaveProperty('id');
    expect(response.body.tweet.content).toBe(tweetData.content);
    expect(response.body.event).toHaveProperty('type', 'TWEET_CREATED');
  });
});
