/**
 * Playwright Configuration for NEXUS IDE
 * 
 * This configuration sets up end-to-end testing for the IDE,
 * including cross-browser testing, visual regression testing, and performance testing.
 */

import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    ['line'],
    ...(process.env.CI ? [['github']] : [])
  ],
  
  // Global test timeout
  timeout: 30 * 1000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000,
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'strict',
      animations: 'disabled'
    },
    toMatchSnapshot: {
      threshold: 0.2,
      mode: 'strict'
    }
  },
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Permissions
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // Color scheme
    colorScheme: 'dark',
    
    // Reduced motion for consistent screenshots
    reducedMotion: 'reduce',
    
    // Force prefers-color-scheme
    forcedColors: 'none'
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup'
    },
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/
    },
    
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for advanced debugging
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-field-trial-config'
          ]
        }
      },
      dependencies: ['setup']
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
      dependencies: ['setup']
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
      dependencies: ['setup']
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true
      },
      dependencies: ['setup']
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        isMobile: true,
        hasTouch: true
      },
      dependencies: ['setup']
    },
    
    // Tablet
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        isMobile: true,
        hasTouch: true
      },
      dependencies: ['setup']
    },
    
    // High DPI
    {
      name: 'High DPI',
      use: {
        ...devices['Desktop Chrome HiDPI'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
      },
      dependencies: ['setup']
    },
    
    // Dark mode testing
    {
      name: 'Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark'
      },
      dependencies: ['setup']
    },
    
    // Light mode testing
    {
      name: 'Light Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light'
      },
      dependencies: ['setup']
    },
    
    // Performance testing
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-gpu-benchmarking',
            '--enable-threaded-compositing'
          ]
        }
      },
      testMatch: /.*\.perf\.spec\.ts/,
      dependencies: ['setup']
    },
    
    // Accessibility testing
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility features
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--enable-accessibility-logging'
          ]
        }
      },
      testMatch: /.*\.a11y\.spec\.ts/,
      dependencies: ['setup']
    },
    
    // Visual regression testing
    {
      name: 'Visual',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent visual testing
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows'
          ]
        }
      },
      testMatch: /.*\.visual\.spec\.ts/,
      dependencies: ['setup']
    }
  ],
  
  // Global setup and teardown
  globalSetup: resolve(__dirname, './e2e/global-setup.ts'),
  globalTeardown: resolve(__dirname, './e2e/global-teardown.ts'),
  
  // Output directory for test artifacts
  outputDir: 'test-results/',
  
  // Directory for test artifacts such as screenshots, videos, traces, etc.
  testDir: './e2e',
  
  // Glob patterns or regular expressions that match test files
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.e2e.ts'
  ],
  
  // Glob patterns or regular expressions that should be ignored
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**'
  ],
  
  // Maximum time one test can run for
  timeout: 30 * 1000,
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Whether to update snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
  
  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      VITE_APP_ENV: 'test'
    }
  },
  
  // Metadata
  metadata: {
    'test-type': 'e2e',
    'project': 'NEXUS IDE',
    'version': process.env.npm_package_version || '1.0.0'
  }
});