/**
 * Test Setup
 * การตั้งค่าเริ่มต้นสำหรับการทดสอบ
 */

import { TestConfigFactory } from '../config/test.config';
import { jest } from '@jest/globals';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHavePerformanceWithin(threshold: number): R;
      toBeValidAIResponse(): R;
      toHaveValidContext(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHavePerformanceWithin(received: number, threshold: number) {
    const pass = received <= threshold;
    if (pass) {
      return {
        message: () => `expected ${received}ms not to be within performance threshold ${threshold}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received}ms to be within performance threshold ${threshold}ms`,
        pass: false,
      };
    }
  },

  toBeValidAIResponse(received: any) {
    const isValid = received &&
      typeof received === 'object' &&
      received.content &&
      typeof received.content === 'string' &&
      received.confidence !== undefined &&
      typeof received.confidence === 'number' &&
      received.confidence >= 0 &&
      received.confidence <= 1;

    if (isValid) {
      return {
        message: () => `expected response not to be a valid AI response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be a valid AI response with content and confidence`,
        pass: false,
      };
    }
  },

  toHaveValidContext(received: any) {
    const isValid = received &&
      typeof received === 'object' &&
      received.id &&
      received.type &&
      received.data &&
      received.timestamp;

    if (isValid) {
      return {
        message: () => `expected context not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected context to have id, type, data, and timestamp`,
        pass: false,
      };
    }
  },
});

// Global test configuration
const testConfig = TestConfigFactory.getConfig('mock');

// Environment setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.DISABLE_EXTERNAL_SERVICES = 'true';

// Mock external services by default
jest.mock('axios');
jest.mock('simple-git');
jest.mock('fs-extra');

// Global test utilities
global.testConfig = testConfig;
global.createMockContext = (overrides = {}) => ({
  id: 'test-context-' + Math.random().toString(36).substr(2, 9),
  type: 'code',
  data: {
    content: 'test content',
    language: 'typescript',
    file: 'test.ts'
  },
  timestamp: new Date(),
  metadata: {
    source: 'test',
    version: '1.0.0'
  },
  ...overrides
});

global.createMockAIResponse = (overrides = {}) => ({
  content: 'Mock AI response',
  confidence: 0.95,
  usage: {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150
  },
  metadata: {
    model: 'mock-model',
    provider: 'mock-provider',
    timestamp: new Date()
  },
  ...overrides
});

global.createMockMemoryEntry = (overrides = {}) => ({
  id: 'memory-' + Math.random().toString(36).substr(2, 9),
  content: 'Mock memory content',
  embedding: new Array(1536).fill(0).map(() => Math.random()),
  metadata: {
    type: 'code',
    language: 'typescript',
    timestamp: new Date()
  },
  similarity: 0.85,
  ...overrides
});

// Performance monitoring utilities
global.measurePerformance = async (fn: () => Promise<any>) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  return { result, duration };
};

global.waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Test data generators
global.generateTestData = {
  contexts: (count: number) => {
    return Array.from({ length: count }, (_, i) => global.createMockContext({
      id: `context-${i}`,
      data: {
        content: `Test content ${i}`,
        language: 'typescript',
        file: `test-${i}.ts`
      }
    }));
  },

  memories: (count: number) => {
    return Array.from({ length: count }, (_, i) => global.createMockMemoryEntry({
      id: `memory-${i}`,
      content: `Memory content ${i}`,
      metadata: {
        type: 'code',
        language: 'typescript',
        timestamp: new Date(Date.now() - i * 1000)
      }
    }));
  },

  aiResponses: (count: number) => {
    return Array.from({ length: count }, (_, i) => global.createMockAIResponse({
      content: `AI response ${i}`,
      confidence: 0.9 - (i * 0.1),
      metadata: {
        model: 'mock-model',
        provider: 'mock-provider',
        timestamp: new Date(Date.now() - i * 1000)
      }
    }));
  }
};

// Cleanup utilities
global.cleanup = {
  contexts: new Set(),
  memories: new Set(),
  services: new Set(),

  addContext: (id: string) => {
    global.cleanup.contexts.add(id);
  },

  addMemory: (id: string) => {
    global.cleanup.memories.add(id);
  },

  addService: (service: any) => {
    global.cleanup.services.add(service);
  },

  async all() {
    // Cleanup contexts
    for (const contextId of global.cleanup.contexts) {
      // Mock cleanup - in real implementation, this would clean up actual contexts
      console.log(`Cleaning up context: ${contextId}`);
    }
    global.cleanup.contexts.clear();

    // Cleanup memories
    for (const memoryId of global.cleanup.memories) {
      // Mock cleanup - in real implementation, this would clean up actual memories
      console.log(`Cleaning up memory: ${memoryId}`);
    }
    global.cleanup.memories.clear();

    // Cleanup services
    for (const service of global.cleanup.services) {
      if (service && typeof service.cleanup === 'function') {
        await service.cleanup();
      }
    }
    global.cleanup.services.clear();
  }
};

// Test hooks
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  
  // Reset performance counters
  if (global.performanceCounters) {
    global.performanceCounters.clear();
  }
});

afterEach(async () => {
  // Cleanup after each test
  await global.cleanup.all();
});

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Console override for cleaner test output
if (process.env.JEST_SILENT === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Export test utilities for use in test files
export {
  testConfig,
};

// Type declarations for global utilities
declare global {
  var testConfig: any;
  var createMockContext: (overrides?: any) => any;
  var createMockAIResponse: (overrides?: any) => any;
  var createMockMemoryEntry: (overrides?: any) => any;
  var measurePerformance: (fn: () => Promise<any>) => Promise<{ result: any; duration: number }>;
  var waitFor: (ms: number) => Promise<void>;
  var generateTestData: {
    contexts: (count: number) => any[];
    memories: (count: number) => any[];
    aiResponses: (count: number) => any[];
  };
  var cleanup: {
    contexts: Set<string>;
    memories: Set<string>;
    services: Set<any>;
    addContext: (id: string) => void;
    addMemory: (id: string) => void;
    addService: (service: any) => void;
    all: () => Promise<void>;
  };
  var performanceCounters: Map<string, number>;
}