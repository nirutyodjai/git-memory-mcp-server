import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Suppress console.error during tests unless explicitly needed
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console.error
  jest.restoreAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MCP_COMPRESSION = 'false'; // Disable compression for faster tests