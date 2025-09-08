/**
 * Global Test Teardown
 * การทำความสะอาดหลังการทดสอบทั้งหมด
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Starting Global Test Teardown...');

  try {
    // Cleanup test directories
    await cleanupTestDirectories();

    // Cleanup test database
    await cleanupTestDatabase();

    // Cleanup test Git repository
    await cleanupTestGitRepository();

    // Cleanup mock services
    cleanupMockServices();

    // Generate test report
    await generateTestReport();

    // Cleanup performance monitoring
    cleanupPerformanceMonitoring();

    console.log('✅ Global Test Teardown completed successfully');
  } catch (error) {
    console.error('❌ Global Test Teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

/**
 * Cleanup test directories
 */
async function cleanupTestDirectories() {
  const directories = [
    './test-cache',
    './test-logs'
  ];

  // Only cleanup cache and logs, keep test-data and test-repo for debugging
  for (const dir of directories) {
    try {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup directory ${dir}:`, error.message);
    }
  }

  console.log('📁 Test directories cleaned up');
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  // Mock database cleanup
  // In a real implementation, this would clean up test database
  console.log('🗄️ Test database cleanup (mocked)');
}

/**
 * Cleanup test Git repository
 */
async function cleanupTestGitRepository() {
  const testRepoPath = './test-repo';
  
  try {
    // Keep the test repo for debugging, just clean up temporary files
    const tempFiles = [
      path.join(testRepoPath, '.git', 'index.lock'),
      path.join(testRepoPath, '.git', 'refs', 'heads', 'test-branch.lock')
    ];

    for (const file of tempFiles) {
      if (await fs.pathExists(file)) {
        await fs.remove(file);
      }
    }

    console.log('📦 Test Git repository cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test Git repository cleanup failed:', error.message);
  }
}

/**
 * Cleanup mock services
 */
function cleanupMockServices() {
  if (global.mockServices) {
    // Clear all mock implementations
    Object.values(global.mockServices).forEach(service => {
      Object.values(service).forEach(mockFn => {
        if (typeof mockFn.mockClear === 'function') {
          mockFn.mockClear();
        }
      });
    });

    // Clear global mock services
    delete global.mockServices;
  }

  console.log('🎭 Mock services cleanup completed');
}

/**
 * Generate test report
 */
async function generateTestReport() {
  try {
    const reportDir = './test-results';
    await fs.ensureDir(reportDir);

    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeEnv: process.env.NODE_ENV
      },
      testConfig: {
        testTimeout: 30000,
        maxWorkers: '50%',
        testEnvironment: 'node'
      },
      performance: {
        totalMemoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      cleanup: {
        directoriesCleanedUp: ['test-cache', 'test-logs'],
        filesRemoved: ['temp files', 'lock files'],
        servicesCleanedUp: ['mockServices']
      }
    };

    const reportPath = path.join(reportDir, 'teardown-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });

    console.log('📊 Test report generated:', reportPath);
  } catch (error) {
    console.warn('⚠️ Failed to generate test report:', error.message);
  }
}

/**
 * Cleanup performance monitoring
 */
function cleanupPerformanceMonitoring() {
  if (global.performanceCounters) {
    global.performanceCounters.clear();
    delete global.performanceCounters;
  }

  if (global.performanceStart) {
    delete global.performanceStart;
  }

  if (global.performanceEnd) {
    delete global.performanceEnd;
  }

  console.log('📊 Performance monitoring cleanup completed');
}

/**
 * Force cleanup on process exit
 */
process.on('exit', () => {
  console.log('🔚 Process exiting, performing final cleanup...');
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, performing cleanup...');
  await globalTeardown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, performing cleanup...');
  await globalTeardown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception during teardown:', error);
  await globalTeardown();
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection during teardown at:', promise, 'reason:', reason);
  await globalTeardown();
  process.exit(1);
});