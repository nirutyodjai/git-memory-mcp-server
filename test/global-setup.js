#!/usr/bin/env node

/**
 * Global Test Setup
 * Sets up test environment, databases, and services before running tests
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global test setup function
 */
export default async function globalSetup() {
  console.log('🔧 Setting up global test environment...');

  // Create test directories
  await createTestDirectories();

  // Setup test databases
  await setupTestDatabases();

  // Setup test cache
  await setupTestCache();

  // Setup test logging
  await setupTestLogging();

  // Setup test metrics
  await setupTestMetrics();

  // Setup environment variables
  await setupTestEnvironment();

  console.log('✅ Global test environment setup complete');
}

/**
 * Create necessary test directories
 */
async function createTestDirectories() {
  const testDirs = [
    'test-results',
    'coverage',
    'test-temp',
    'test-logs',
    'test-data'
  ];

  for (const dir of testDirs) {
    const fullPath = path.join(__dirname, '..', dir);
    try {
      await fs.access(fullPath);
    } catch {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

/**
 * Setup test databases (Redis, PostgreSQL)
 */
async function setupTestDatabases() {
  try {
    // Setup Redis for testing
    const redis = (await import('redis')).default;
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      database: 15 // Use database 15 for testing
    });

    await redisClient.connect();

    // Clear test database
    await redisClient.flushDb();

    // Set test data
    await redisClient.set('test:config', JSON.stringify({
      rateLimit: { windowMs: 60000, max: 100 },
      cache: { ttl: 300 }
    }));

    await redisClient.disconnect();

    console.log('🗄️ Test Redis database configured');

  } catch (error) {
    console.log(`⚠️ Redis setup failed: ${error.message}`);
  }

  try {
    // Setup PostgreSQL for testing (if available)
    const { Client } = await import('pg');

    const pgClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'git_memory_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });

    await pgClient.connect();

    // Create test tables
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS test_audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        level VARCHAR(10),
        message TEXT,
        user_id VARCHAR(100),
        action VARCHAR(100),
        resource VARCHAR(200),
        metadata JSONB
      )
    `);

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS test_metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metric_name VARCHAR(100),
        metric_value DECIMAL,
        tags JSONB
      )
    `);

    // Clear test data
    await pgClient.query('DELETE FROM test_audit_logs');
    await pgClient.query('DELETE FROM test_metrics');

    await pgClient.end();

    console.log('🗄️ Test PostgreSQL database configured');

  } catch (error) {
    console.log(`⚠️ PostgreSQL setup failed: ${error.message}`);
  }
}

/**
 * Setup test cache configuration
 */
async function setupTestCache() {
  // Setup file-based cache for testing
  const cacheDir = path.join(__dirname, '..', 'test-temp', 'cache');
  await fs.mkdir(cacheDir, { recursive: true });

  // Create cache configuration file
  const cacheConfig = {
    memory: {
      maxSize: '100MB',
      ttl: 300
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 15,
      ttl: 600
    },
    file: {
      directory: cacheDir,
      ttl: 3600
    }
  };

  await fs.writeFile(
    path.join(__dirname, '..', 'test-temp', 'cache-config.json'),
    JSON.stringify(cacheConfig, null, 2)
  );

  console.log('💾 Test cache configured');
}

/**
 * Setup test logging configuration
 */
async function setupTestLogging() {
  const logDir = path.join(__dirname, '..', 'test-logs');
  await fs.mkdir(logDir, { recursive: true });

  const logConfig = {
    level: 'debug',
    format: 'json',
    transports: [
      {
        type: 'console',
        level: 'info'
      },
      {
        type: 'file',
        filename: path.join(logDir, 'test.log'),
        level: 'debug'
      }
    ],
    exceptionHandlers: [
      {
        type: 'file',
        filename: path.join(logDir, 'exceptions.log')
      }
    ],
    rejectionHandlers: [
      {
        type: 'file',
        filename: path.join(logDir, 'rejections.log')
      }
    ]
  };

  await fs.writeFile(
    path.join(__dirname, '..', 'test-temp', 'log-config.json'),
    JSON.stringify(logConfig, null, 2)
  );

  console.log('📝 Test logging configured');
}

/**
 * Setup test metrics collection
 */
async function setupTestMetrics() {
  const metricsConfig = {
    prometheus: {
      enabled: true,
      port: 9090,
      path: '/metrics'
    },
    jaeger: {
      enabled: true,
      endpoint: 'http://localhost:14268/api/traces'
    },
    custom: {
      enabled: true,
      interval: 5000
    }
  };

  await fs.writeFile(
    path.join(__dirname, '..', 'test-temp', 'metrics-config.json'),
    JSON.stringify(metricsConfig, null, 2)
  );

  console.log('📊 Test metrics configured');
}

/**
 * Setup test environment variables
 */
async function setupTestEnvironment() {
  // Create .env.test file
  const testEnv = {
    NODE_ENV: 'test',
    PORT: '3001',
    API_KEY: 'test-api-key-for-testing',
    JWT_SECRET: 'test-jwt-secret-for-testing',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_NAME: process.env.DB_NAME || 'git_memory_test',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    REDIS_DB: '15',
    WEBHOOK_SECRET: 'test-webhook-secret-for-testing',
    ADMIN_USERNAME: 'test-admin',
    ADMIN_PASSWORD: 'test-admin-password',
    LOG_LEVEL: 'debug',
    METRICS_ENABLED: 'true',
    TRACING_ENABLED: 'true',
    CACHE_ENABLED: 'true',
    RATE_LIMIT_ENABLED: 'true'
  };

  const envContent = Object.entries(testEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(
    path.join(__dirname, '..', '.env.test'),
    envContent
  );

  // Load test environment variables
  Object.assign(process.env, testEnv);

  console.log('🌍 Test environment configured');
}
