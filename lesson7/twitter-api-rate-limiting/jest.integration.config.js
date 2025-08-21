module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/integration/**/*.test.ts'],
  collectCoverage: false,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
};
