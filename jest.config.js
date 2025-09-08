/**
 * Jest Configuration
 * การตั้งค่าสำหรับการทดสอบระบบ AI Integration
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support
  preset: 'ts-jest',

  // Root directory
  rootDir: '.',

  // Test directories
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts}',
    '<rootDir>/src/tests/**/*.{test,spec}.{js,ts}'
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/src/tests/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/global-teardown.ts',

  // Coverage settings
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/node_modules/**',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Global setup and teardown
  globalSetup: '<rootDir>/src/tests/global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/global-teardown.ts',

  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Error on deprecated features
  errorOnDeprecated: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests
  forceExit: true,

  // Max workers
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml'
      }
    ]
  ],

  // Watch plugins (disabled for compatibility)
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ],

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.unit.{test,spec}.{js,ts}'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.{test,spec}.{js,ts}'],
      testEnvironment: 'node',
      testTimeout: 60000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/tests/performance.test.ts'],
      testEnvironment: 'node',
      testTimeout: 120000
    },
    {
      displayName: 'ai-integration',
      testMatch: ['<rootDir>/src/tests/ai-integration.test.ts'],
      testEnvironment: 'node',
      testTimeout: 90000
    }
  ]
};