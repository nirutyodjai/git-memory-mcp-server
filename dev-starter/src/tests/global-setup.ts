/**
 * Global Test Setup
 * การตั้งค่าเริ่มต้นสำหรับการทดสอบทั้งหมด
 */

import { TestConfigFactory } from '../config/test.config';
import * as fs from 'fs-extra';
import * as path from 'path';

export default async function globalSetup() {
  console.log('🚀 Starting Global Test Setup...');

  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.DISABLE_EXTERNAL_SERVICES = 'true';

  // Load test configuration
  const testConfig = TestConfigFactory.getConfig('mock');

  try {
    // Create test directories
    await createTestDirectories();

    // Setup test database (if needed)
    await setupTestDatabase();

    // Setup test Git repository
    await setupTestGitRepository();

    // Setup mock services
    await setupMockServices();

    // Initialize performance monitoring
    setupPerformanceMonitoring();

    console.log('✅ Global Test Setup completed successfully');
  } catch (error) {
    console.error('❌ Global Test Setup failed:', error);
    throw error;
  }
}

/**
 * Create necessary test directories
 */
async function createTestDirectories() {
  const directories = [
    './test-data',
    './test-repo',
    './test-cache',
    './test-logs',
    './test-results'
  ];

  for (const dir of directories) {
    await fs.ensureDir(dir);
  }

  console.log('📁 Test directories created');
}

/**
 * Setup test database
 */
async function setupTestDatabase() {
  // Mock database setup
  // In a real implementation, this would set up a test database
  console.log('🗄️ Test database setup (mocked)');
}

/**
 * Setup test Git repository
 */
async function setupTestGitRepository() {
  const testRepoPath = './test-repo';
  
  try {
    // Ensure test repo directory exists
    await fs.ensureDir(testRepoPath);

    // Create a simple git repository structure for testing
    const gitDir = path.join(testRepoPath, '.git');
    await fs.ensureDir(gitDir);

    // Create basic git files (mocked)
    await fs.writeFile(
      path.join(testRepoPath, 'README.md'),
      '# Test Repository\n\nThis is a test repository for AI integration testing.'
    );

    await fs.writeFile(
      path.join(testRepoPath, 'test-file.ts'),
      'export const testFunction = () => {\n  return "Hello, World!";\n};'
    );

    console.log('📦 Test Git repository setup completed');
  } catch (error) {
    console.warn('⚠️ Test Git repository setup failed (using mock):', error.message);
  }
}

/**
 * Setup mock services
 */
async function setupMockServices() {
  // Mock external services
  global.mockServices = {
    llmProvider: {
      generateResponse: () => Promise.resolve({
        content: 'Mock AI response',
        confidence: 0.95,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      })
    },
    
    gitMemory: {
      store: () => Promise.resolve({ success: true, id: 'mock-id' }),
      retrieve: () => Promise.resolve({ content: 'mock content' }),
      search: () => Promise.resolve([{ id: 'mock-id', content: 'mock content' }])
    },
    
    semanticMemory: {
      addMemory: () => Promise.resolve({ success: true, id: 'mock-memory-id' }),
      searchSimilar: () => Promise.resolve([
        { id: 'mock-memory-1', content: 'similar content 1', similarity: 0.9 },
        { id: 'mock-memory-2', content: 'similar content 2', similarity: 0.8 }
      ]),
      getMemory: () => Promise.resolve({ id: 'mock-memory-id', content: 'mock memory' })
    }
  };

  console.log('🎭 Mock services setup completed');
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
  global.performanceCounters = new Map<string, bigint>();
  global.performanceStart = (label: string) => {
    global.performanceCounters.set(label, process.hrtime.bigint());
  };
  
  global.performanceEnd = (label: string) => {
    const start = global.performanceCounters.get(label);
    if (!start) return 0;
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    global.performanceCounters.delete(label);
    return duration;
  };

  console.log('📊 Performance monitoring setup completed');
}

// Type declarations for global variables
// Note: These are available globally after setup