/**
 * Vitest Configuration for NEXUS IDE
 * 
 * This configuration sets up comprehensive testing environment for the IDE,
 * including unit tests, integration tests, and component tests.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for tests
      fastRefresh: true,
      // Include .tsx files
      include: '**/*.{jsx,tsx}',
      // Babel configuration for tests
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    setupFiles: [
      './src/test/setup.ts'
    ],
    
    // Include patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'build',
      'coverage',
      'public',
      'docs',
      'storybook-static',
      '**/*.d.ts',
      '**/*.config.*',
      '**/e2e/**'
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.*',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'public/',
        'dist/',
        'coverage/',
        'docs/',
        'storybook-static/',
        '**/*.test.*',
        '**/*.spec.*',
        '**/types/**',
        '**/mocks/**',
        '**/fixtures/**'
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}'
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      // Skip coverage for specific files
      skipFull: false,
      // Clean coverage directory before running tests
      clean: true
    },
    
    // Reporter configuration
    reporter: [
      'default',
      'json',
      'html',
      'junit'
    ],
    
    // Output files
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html',
      junit: './test-results/junit.xml'
    },
    
    // Watch options
    watch: {
      // Ignore patterns for watch mode
      ignore: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'test-results/**',
        'docs/**',
        'storybook-static/**'
      ]
    },
    
    // Pool options for parallel testing
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use available CPU cores
        minThreads: 1,
        maxThreads: 4,
        // Isolate environment for each test file
        isolate: true
      }
    },
    
    // Retry failed tests
    retry: 2,
    
    // Bail after first test failure in CI
    bail: process.env.CI ? 1 : 0,
    
    // Silent console output during tests
    silent: false,
    
    // Mock options
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_APP_ENV: 'test',
      VITE_API_URL: 'http://localhost:3001',
      VITE_MCP_SERVER_URL: 'ws://localhost:3002',
      VITE_AI_SERVICE_URL: 'http://localhost:3003'
    },
    
    // Sequence options
    sequence: {
      // Run tests in random order
      shuffle: true,
      // Seed for reproducible test runs
      seed: Date.now()
    },
    
    // Benchmark configuration
    benchmark: {
      include: ['**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
      reporter: ['default', 'json'],
      outputFile: './test-results/benchmark.json'
    },
    
    // UI configuration for @vitest/ui
    ui: {
      enabled: true,
      open: false,
      port: 51204
    },
    
    // API configuration
    api: {
      port: 51203,
      host: '127.0.0.1'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@stores': resolve(__dirname, './src/stores'),
      '@types': resolve(__dirname, './src/types'),
      '@assets': resolve(__dirname, './src/assets'),
      '@styles': resolve(__dirname, './src/styles'),
      '@test': resolve(__dirname, './src/test'),
      '@mocks': resolve(__dirname, './src/test/mocks'),
      '@fixtures': resolve(__dirname, './src/test/fixtures')
    }
  },
  
  // Define global variables
  define: {
    __DEV__: true,
    __TEST__: true,
    __PROD__: false,
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    'import.meta.vitest': 'undefined'
  },
  
  // ESBuild options
  esbuild: {
    target: 'node14',
    // Remove console.log in production tests
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/test-utils',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'vitest',
      'jsdom'
    ]
  }
});