"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Global test setup
beforeAll(() => {
    // Suppress console.error during tests unless explicitly needed
    globals_1.jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => {
    // Restore console.error
    globals_1.jest.restoreAllMocks();
});
// Increase timeout for integration tests
globals_1.jest.setTimeout(10000);
// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MCP_COMPRESSION = 'false'; // Disable compression for faster tests
//# sourceMappingURL=setup.js.map