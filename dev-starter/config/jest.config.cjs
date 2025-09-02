module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../src', '<rootDir>/../tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\.ts$': 'ts-jest',
    '^.+\.js$': 'babel-jest',
  },
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.{ts,js}',
    '!<rootDir>/../src/**/*.d.ts',
    '!<rootDir>/../src/3d-sco/**/*',
    '!<rootDir>/../src/**/node_modules/**',
    '!<rootDir>/../src/**/*.spec.{ts,js}',
    '!<rootDir>/../src/**/*.test.{ts,js}',
  ],
  setupFilesAfterEnv: ['<rootDir>/../tests/setup.ts'],
  testTimeout: 10000
};