/**
 * Test Configuration
 * การตั้งค่าสำหรับการทดสอบระบบ AI Integration
 */

export interface TestConfig {
  // AI Context Awareness System
  contextSystem: {
    maxContexts: number;
    cleanupInterval: number;
    conflictResolutionStrategy: 'merge' | 'override' | 'manual';
    realTimeSync: boolean;
    performanceMode: boolean;
    aiCollaborationEnabled: boolean;
  };

  // Git Memory Service
  gitMemory: {
    repositoryPath: string;
    branchName: string;
    enableCompression: boolean;
    batchSize: number;
    autoCommit: boolean;
    commitMessage: string;
  };

  // Semantic Memory Service
  semanticMemory: {
    embeddingModel: string;
    maxMemorySize: number;
    enableCaching: boolean;
    cacheSize: number;
    similarityThreshold: number;
    indexingStrategy: 'immediate' | 'batch' | 'lazy';
  };

  // LLM Provider Service
  llmProvider: {
    providers: {
      openai?: {
        enabled: boolean;
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
      };
      claude?: {
        enabled: boolean;
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
      };
      gemini?: {
        enabled: boolean;
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
      };
    };
    enableCaching: boolean;
    cacheSize: number;
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
    fallbackEnabled: boolean;
    retryAttempts: number;
  };

  // Performance Settings
  performance: {
    enableProfiling: boolean;
    logPerformanceMetrics: boolean;
    performanceThresholds: {
      contextAddition: number; // ms
      contextSearch: number; // ms
      memoryStorage: number; // ms
      memoryRetrieval: number; // ms
      llmRequest: number; // ms
    };
    concurrencyLimits: {
      maxConcurrentContexts: number;
      maxConcurrentMemoryOps: number;
      maxConcurrentLLMRequests: number;
    };
  };

  // Testing Settings
  testing: {
    enableMockServices: boolean;
    mockResponseDelay: number;
    simulateErrors: boolean;
    errorRate: number; // 0-1
    enableDetailedLogging: boolean;
    testDataPath: string;
    cleanupAfterTests: boolean;
  };
}

/**
 * Default Test Configuration
 */
export const defaultTestConfig: TestConfig = {
  contextSystem: {
    maxContexts: 5000,
    cleanupInterval: 30000, // 30 seconds
    conflictResolutionStrategy: 'merge',
    realTimeSync: true,
    performanceMode: true,
    aiCollaborationEnabled: true
  },

  gitMemory: {
    repositoryPath: './test-repo',
    branchName: 'test-branch',
    enableCompression: true,
    batchSize: 100,
    autoCommit: true,
    commitMessage: 'Test: AI context update'
  },

  semanticMemory: {
    embeddingModel: 'text-embedding-ada-002',
    maxMemorySize: 10000,
    enableCaching: true,
    cacheSize: 1000,
    similarityThreshold: 0.7,
    indexingStrategy: 'immediate'
  },

  llmProvider: {
    providers: {
      openai: {
        enabled: true,
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.1
      },
      claude: {
        enabled: false,
        apiKey: process.env.CLAUDE_API_KEY || 'test-key',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 1000,
        temperature: 0.1
      },
      gemini: {
        enabled: false,
        apiKey: process.env.GEMINI_API_KEY || 'test-key',
        model: 'gemini-pro',
        maxTokens: 1000,
        temperature: 0.1
      }
    },
    enableCaching: true,
    cacheSize: 500,
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    },
    fallbackEnabled: true,
    retryAttempts: 3
  },

  performance: {
    enableProfiling: true,
    logPerformanceMetrics: true,
    performanceThresholds: {
      contextAddition: 100, // 100ms
      contextSearch: 50, // 50ms
      memoryStorage: 500, // 500ms
      memoryRetrieval: 200, // 200ms
      llmRequest: 5000 // 5 seconds
    },
    concurrencyLimits: {
      maxConcurrentContexts: 50,
      maxConcurrentMemoryOps: 20,
      maxConcurrentLLMRequests: 10
    }
  },

  testing: {
    enableMockServices: false,
    mockResponseDelay: 100,
    simulateErrors: false,
    errorRate: 0.05, // 5% error rate
    enableDetailedLogging: true,
    testDataPath: './test-data',
    cleanupAfterTests: true
  }
};

/**
 * Performance Test Configuration
 */
export const performanceTestConfig: TestConfig = {
  ...defaultTestConfig,
  contextSystem: {
    ...defaultTestConfig.contextSystem,
    maxContexts: 10000,
    cleanupInterval: 60000, // 1 minute
    performanceMode: true
  },
  semanticMemory: {
    ...defaultTestConfig.semanticMemory,
    maxMemorySize: 50000,
    cacheSize: 5000,
    indexingStrategy: 'batch'
  },
  performance: {
    ...defaultTestConfig.performance,
    enableProfiling: true,
    performanceThresholds: {
      contextAddition: 50, // Stricter for performance tests
      contextSearch: 25,
      memoryStorage: 300,
      memoryRetrieval: 100,
      llmRequest: 3000
    },
    concurrencyLimits: {
      maxConcurrentContexts: 100,
      maxConcurrentMemoryOps: 50,
      maxConcurrentLLMRequests: 20
    }
  }
};

/**
 * Integration Test Configuration
 */
export const integrationTestConfig: TestConfig = {
  ...defaultTestConfig,
  contextSystem: {
    ...defaultTestConfig.contextSystem,
    aiCollaborationEnabled: true,
    realTimeSync: true,
    conflictResolutionStrategy: 'merge'
  },
  llmProvider: {
    ...defaultTestConfig.llmProvider,
    providers: {
      openai: {
        enabled: true,
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0
      }
    },
    enableCaching: true,
    fallbackEnabled: true
  },
  testing: {
    ...defaultTestConfig.testing,
    enableDetailedLogging: true,
    simulateErrors: true,
    errorRate: 0.1 // 10% for stress testing
  }
};

/**
 * Mock Test Configuration
 */
export const mockTestConfig: TestConfig = {
  ...defaultTestConfig,
  testing: {
    ...defaultTestConfig.testing,
    enableMockServices: true,
    mockResponseDelay: 50,
    simulateErrors: false,
    enableDetailedLogging: false
  },
  llmProvider: {
    ...defaultTestConfig.llmProvider,
    providers: {
      openai: {
        enabled: true,
        apiKey: 'mock-key',
        model: 'mock-model',
        maxTokens: 100,
        temperature: 0
      }
    },
    enableCaching: false
  }
};

/**
 * Configuration Factory
 */
export class TestConfigFactory {
  static getConfig(type: 'default' | 'performance' | 'integration' | 'mock' = 'default'): TestConfig {
    switch (type) {
      case 'performance':
        return performanceTestConfig;
      case 'integration':
        return integrationTestConfig;
      case 'mock':
        return mockTestConfig;
      default:
        return defaultTestConfig;
    }
  }

  static createCustomConfig(overrides: Partial<TestConfig>): TestConfig {
    return this.deepMerge(defaultTestConfig, overrides);
  }

  private static deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  static validateConfig(config: TestConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate context system settings
    if (config.contextSystem.maxContexts <= 0) {
      errors.push('contextSystem.maxContexts must be greater than 0');
    }

    if (config.contextSystem.cleanupInterval < 1000) {
      errors.push('contextSystem.cleanupInterval must be at least 1000ms');
    }

    // Validate memory settings
    if (config.semanticMemory.maxMemorySize <= 0) {
      errors.push('semanticMemory.maxMemorySize must be greater than 0');
    }

    if (config.semanticMemory.similarityThreshold < 0 || config.semanticMemory.similarityThreshold > 1) {
      errors.push('semanticMemory.similarityThreshold must be between 0 and 1');
    }

    // Validate LLM provider settings
    const enabledProviders = Object.values(config.llmProvider.providers)
      .filter(provider => provider?.enabled);
    
    if (enabledProviders.length === 0) {
      errors.push('At least one LLM provider must be enabled');
    }

    // Validate performance thresholds
    const thresholds = config.performance.performanceThresholds;
    if (Object.values(thresholds).some(threshold => threshold <= 0)) {
      errors.push('All performance thresholds must be greater than 0');
    }

    // Validate concurrency limits
    const limits = config.performance.concurrencyLimits;
    if (Object.values(limits).some(limit => limit <= 0)) {
      errors.push('All concurrency limits must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Environment-specific configurations
 */
export const environmentConfigs = {
  development: {
    ...defaultTestConfig,
    testing: {
      ...defaultTestConfig.testing,
      enableDetailedLogging: true,
      cleanupAfterTests: false
    }
  },

  testing: {
    ...defaultTestConfig,
    testing: {
      ...defaultTestConfig.testing,
      enableMockServices: true,
      cleanupAfterTests: true
    }
  },

  production: {
    ...defaultTestConfig,
    contextSystem: {
      ...defaultTestConfig.contextSystem,
      performanceMode: true,
      maxContexts: 50000
    },
    performance: {
      ...defaultTestConfig.performance,
      enableProfiling: false,
      logPerformanceMetrics: false
    },
    testing: {
      ...defaultTestConfig.testing,
      enableDetailedLogging: false,
      simulateErrors: false
    }
  }
};

/**
 * Get configuration based on environment
 */
export function getEnvironmentConfig(): TestConfig {
  const env = process.env.NODE_ENV || 'development';
  return environmentConfigs[env as keyof typeof environmentConfigs] || environmentConfigs.development;
}

/**
 * Configuration validation and loading utilities
 */
export class ConfigLoader {
  static async loadFromFile(filePath: string): Promise<TestConfig> {
    try {
      const configData = await import(filePath);
      return configData.default || configData;
    } catch (error) {
      console.warn(`Failed to load config from ${filePath}, using default config`);
      return defaultTestConfig;
    }
  }

  static loadFromEnvironment(): Partial<TestConfig> {
    return {
      llmProvider: {
        providers: {
          openai: {
            enabled: process.env.OPENAI_ENABLED === 'true',
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1')
          },
          claude: {
            enabled: process.env.CLAUDE_ENABLED === 'true',
            apiKey: process.env.CLAUDE_API_KEY || '',
            model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
            maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1000'),
            temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.1')
          },
          gemini: {
            enabled: process.env.GEMINI_ENABLED === 'true',
            apiKey: process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_MODEL || 'gemini-pro',
            maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.1')
          }
        }
      } as any,
      gitMemory: {
        repositoryPath: process.env.GIT_REPO_PATH || './test-repo',
        branchName: process.env.GIT_BRANCH || 'test-branch'
      } as any,
      performance: {
        enableProfiling: process.env.ENABLE_PROFILING === 'true',
        logPerformanceMetrics: process.env.LOG_PERFORMANCE === 'true'
      } as any
    };
  }

  static mergeConfigs(...configs: Partial<TestConfig>[]): TestConfig {
    return configs.reduce(
      (merged, config) => TestConfigFactory.createCustomConfig(config),
      defaultTestConfig
    );
  }
}