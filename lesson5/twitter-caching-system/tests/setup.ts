import { Logger } from '../src/utils/Logger';

// Reduce log level for tests
process.env.LOG_LEVEL = 'error';

beforeAll(() => {
  // Setup global test configuration
});

afterAll(() => {
  // Cleanup global test resources
});
