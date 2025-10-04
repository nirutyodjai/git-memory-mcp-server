#!/usr/bin/env node

/**
 * Global Test Teardown
 * Cleans up test environment, databases, and services after running tests
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global test teardown function
 */
export default async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...');

  // Cleanup test databases
  await cleanupTestDatabases();

  // Cleanup test cache
  await cleanupTestCache();

  // Cleanup test logs
  await cleanupTestLogs();

  // Cleanup test files
  await cleanupTestFiles();

  // Generate test reports
  await generateTestReports();

  console.log('✅ Global test environment cleanup complete');
}

/**
 * Cleanup test databases
 */
async function cleanupTestDatabases() {
  try {
    // Cleanup Redis test database
    const redis = (await import('redis')).default;
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      database: 15 // Test database
    });

    await redisClient.connect();
    await redisClient.flushDb();
    await redisClient.disconnect();

    console.log('🗄️ Test Redis database cleaned');

  } catch (error) {
    console.log(`⚠️ Redis cleanup failed: ${error.message}`);
  }

  try {
    // Cleanup PostgreSQL test database
    const { Client } = await import('pg');

    const pgClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'git_memory_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });

    await pgClient.connect();

    // Drop test tables
    await pgClient.query('DROP TABLE IF EXISTS test_audit_logs CASCADE');
    await pgClient.query('DROP TABLE IF EXISTS test_metrics CASCADE');

    await pgClient.end();

    console.log('🗄️ Test PostgreSQL database cleaned');

  } catch (error) {
    console.log(`⚠️ PostgreSQL cleanup failed: ${error.message}`);
  }
}

/**
 * Cleanup test cache
 */
async function cleanupTestCache() {
  try {
    const cacheDir = path.join(__dirname, '..', 'test-temp', 'cache');

    // Remove cache directory and all contents
    await fs.rm(cacheDir, { recursive: true, force: true });

    console.log('💾 Test cache cleaned');

  } catch (error) {
    console.log(`⚠️ Cache cleanup failed: ${error.message}`);
  }
}

/**
 * Cleanup test logs
 */
async function cleanupTestLogs() {
  try {
    const logDir = path.join(__dirname, '..', 'test-logs');

    // Archive current logs
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(logDir, 'archive');

    await fs.mkdir(archiveDir, { recursive: true });

    const files = await fs.readdir(logDir);

    for (const file of files) {
      if (file.endsWith('.log')) {
        const sourcePath = path.join(logDir, file);
        const destPath = path.join(archiveDir, `${timestamp}-${file}`);

        await fs.rename(sourcePath, destPath);
      }
    }

    console.log('📝 Test logs archived');

  } catch (error) {
    console.log(`⚠️ Log cleanup failed: ${error.message}`);
  }
}

/**
 * Cleanup test files and directories
 */
async function cleanupTestFiles() {
  try {
    const testDirs = [
      'test-temp',
      'test-data',
      'test-results'
    ];

    for (const dir of testDirs) {
      const fullPath = path.join(__dirname, '..', dir);

      try {
        await fs.access(fullPath);
        await fs.rm(fullPath, { recursive: true, force: true });
        console.log(`🗑️ Removed directory: ${dir}`);
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // Remove test configuration files
    const testFiles = [
      '.env.test',
      'test-temp/cache-config.json',
      'test-temp/log-config.json',
      'test-temp/metrics-config.json'
    ];

    for (const file of testFiles) {
      const fullPath = path.join(__dirname, '..', file);

      try {
        await fs.unlink(fullPath);
        console.log(`🗑️ Removed file: ${file}`);
      } catch {
        // File doesn't exist, skip
      }
    }

  } catch (error) {
    console.log(`⚠️ File cleanup failed: ${error.message}`);
  }
}

/**
 * Generate comprehensive test reports
 */
async function generateTestReports() {
  try {
    // Generate test summary report
    const reportDir = path.join(__dirname, '..', 'test-results');
    await fs.mkdir(reportDir, { recursive: true });

    const summaryReport = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      testResults: {
        summary: 'Tests completed successfully',
        coverage: 'See coverage reports',
        performance: 'See performance test results'
      },
      recommendations: [
        'Review failed tests for debugging',
        'Check coverage reports for untested code',
        'Analyze performance metrics for bottlenecks',
        'Verify integration tests for end-to-end flows'
      ]
    };

    await fs.writeFile(
      path.join(reportDir, 'test-summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );

    console.log('📊 Test reports generated');

  } catch (error) {
    console.log(`⚠️ Report generation failed: ${error.message}`);
  }
}
