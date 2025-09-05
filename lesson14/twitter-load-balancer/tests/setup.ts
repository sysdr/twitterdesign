import { vi } from 'vitest';

// Mock geoip-lite
vi.mock('geoip-lite', () => ({
  lookup: vi.fn((ip: string) => {
    if (ip.startsWith('8.8')) return { country: 'US', ll: [39.0, -77.0] };
    if (ip.startsWith('93.184')) return { country: 'US', ll: [51.5, -0.1] };
    return { country: 'US', ll: [39.0, -77.0] };
  })
}));

// Mock crypto for consistent hashing
Object.defineProperty(global, 'crypto', {
  value: {
    createHash: () => ({
      update: () => ({
        digest: () => 'abcd1234'
      })
    })
  }
});
