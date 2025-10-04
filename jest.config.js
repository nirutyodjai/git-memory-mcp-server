/**
 * Jest Configuration for Git Memory MCP Server
 * Comprehensive testing configuration for enterprise-grade application
 */

export default {
  // Test environment
  testEnvironment: 'node',
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
    '**/src/**/*.test.js',
    '**/src/**/*.spec.js'
  ],

  // Setup and teardown files
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],
  globalSetup: '<rootDir>/test/global-setup.js',
  globalTeardown: '<rootDir>/test/global-teardown.js',

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/routes/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Test timeout and other settings
  testTimeout: 30000,
  maxWorkers: '50%',
  detectOpenHandles: true,
  forceExit: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],

  // Transform configuration
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest'
  },

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@test/(.*)$': '<rootDir>/test/$1'
  },

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Bail out after first test failure in CI
  bail: process.env.CI ? 1 : 0,

  // Error handling
  errorOnDeprecated: true,

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // Performance and memory settings
  maxWorkers: process.env.JEST_MAX_WORKERS || '50%',
  detectLeaks: true,
  unmockedModulePathPatterns: [
    'winston',
    'redis',
    'ws',
    'express',
    'simple-git'
  ]
};
