import Redis from 'ioredis-mock';

// Mock Redis
jest.mock('ioredis', () => require('ioredis-mock'));
