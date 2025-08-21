import { redis } from '../utils/redis';

beforeAll(async () => {
  // Connect to test Redis database
  if (!redis.status || redis.status === 'close') {
    await redis.connect();
  }
});

afterAll(async () => {
  // Clean up test data
  await redis.flushdb();
  await redis.disconnect();
});

beforeEach(async () => {
  // Clear rate limiting data before each test
  const keys = await redis.keys('rate_limit:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
});
