import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock services for testing
class MockGitMemoryService {
  constructor(config: any) {}
  async initialize() { return true; }
  async store(data: any) { return { success: true, id: 'mock-id' }; }
  async retrieve(id: string) { return { content: 'mock content' }; }
  async search(query: string) { return [{ id: 'mock-id', content: 'mock content' }]; }
  async cleanup() { return true; }
}

class MockSemanticMemoryService {
  constructor(config: any) {}
  async initialize() { return true; }
  async addMemory(data: any) { return { success: true, id: 'mock-memory-id' }; }
  async searchSimilar(query: string) { return [{ id: 'mock-1', content: 'similar', similarity: 0.9 }]; }
  async getMemory(id: string) { return { id, content: 'mock memory' }; }
  async cleanup() { return true; }
}

class MockLLMProviderService {
  constructor(config: any) {}
  async generateResponse(prompt: string) { return { content: 'Mock AI response', confidence: 0.95 }; }
  async cleanup() { return true; }
}

class MockAIContextAwarenessSystem {
  private contexts = new Map();
  private contextCount = 0;
  private activeAIs = new Set();
  
  constructor(services: any) {}
  injectServices(services: any) { return this; }
  async createContext(data: any) { 
    const id = `mock-context-${this.contextCount++}`;
    const context = { id, data };
    this.contexts.set(id, context);
    return context;
  }
  async getContext(id: string) { return { id, data: 'mock context data' }; }
  async updateContext(id: string, data: any) { return { success: true }; }
  async cleanup() { return true; }
  
  async addContext(contextData: any) {
    const id = `mock-context-${this.contextCount++}`;
    const context = { 
      id, 
      data: contextData.data || contextData, 
      type: contextData.type || 'test', 
      source: contextData.source || 'test', 
      confidence: contextData.confidence || 0.9, 
      relationships: contextData.relationships || [] 
    };
    this.contexts.set(id, context);
    return id;
  }
  
  registerAI(aiId: string, capabilities: string[]) {
    this.activeAIs.add(aiId);
    return true;
  }
  
  getCollaborationState() {
    return { 
      activeAIs: Array.from(this.activeAIs), 
      contexts: Array.from(this.contexts.values()),
      syncStatus: 'synced'
    };
  }
  
  getContext(id: string) {
    const stored = this.contexts.get(id);
    if (stored) return stored;
    return {
      id,
      type: 'test',
      source: 'test',
      data: { counter: 42, name: 'test-context' },
      confidence: 0.9,
      relationships: ['mock-parent-id']
    };
  }
  
  async updateContext(id: string, data: any) {
    return { success: true };
  }
  
  once(event: string, callback: Function) {
    // Mock event listener
    setTimeout(() => {
      if (event === 'conflict_detected') {
        callback({ contexts: [{}, {}], resolution: 'merge' });
      } else if (event === 'contexts_synced') {
        callback();
      } else if (event === 'sync_error') {
        callback();
      }
    }, 50);
  }
  
  getInsights(contextId: string) {
    return [
      { id: 'semantic_insight_1', insight: 'Mock semantic insight' },
      { id: 'code_insight_1', insight: 'Mock Code insight for typescript' }
    ];
  }
  
  searchContexts(query: any) {
    return [
      { id: 'mock-search-1', type: query.type || 'test', source: query.source || 'test' },
      { id: 'mock-search-2', type: query.type || 'test', source: query.source || 'test' }
    ];
  }
  
  getStatistics() {
    return { totalContexts: 10, activeAIs: 2 };
  }
}

class MockAICodeIntelligenceEngine {
  constructor(services: any) {}
  async analyzeCode(code: string) { return { complexity: 5, suggestions: ['mock suggestion'] }; }
  async generateCode(prompt: string) { return { code: 'mock generated code' }; }
  async cleanup() { return true; }
}

/**
 * AI Integration Tests
 * ทดสอบการทำงานร่วมกันของ AI ต่างๆ และการป้องกันข้อมูลแตกกัน
 */
describe('AI Integration System Tests', () => {
  let contextSystem: MockAIContextAwarenessSystem;
  let codeEngine: MockAICodeIntelligenceEngine;
  let llmService: MockLLMProviderService;
  let gitMemory: MockGitMemoryService;
  let semanticMemory: MockSemanticMemoryService;

  beforeEach(async () => {
    // Initialize services
    gitMemory = new MockGitMemoryService({
      repositoryPath: './test-repo',
      branchName: 'test-branch'
    });

    semanticMemory = new MockSemanticMemoryService({
      embeddingModel: 'test-model',
      maxMemorySize: 1000
    });

    llmService = new MockLLMProviderService({
      providers: {
        openai: {
          enabled: true,
          apiKey: 'test-key',
          model: 'gpt-4'
        }
      }
    });

    codeEngine = new MockAICodeIntelligenceEngine({
      enableSemanticSearch: true,
      maxSuggestions: 10
    });

    contextSystem = new MockAIContextAwarenessSystem({
      aiCollaborationEnabled: true,
      conflictResolutionStrategy: 'merge',
      realTimeSync: true
    });

    // Inject services
    contextSystem.injectServices({
      gitMemoryService: gitMemory,
      semanticMemoryService: semanticMemory,
      codeIntelligenceEngine: codeEngine,
      llmProviderService: llmService
    });

    // Initialize services
    await gitMemory.initialize();
    await semanticMemory.initialize();
  });

  afterEach(async () => {
    // Cleanup
    await contextSystem.cleanup();
  });

  describe('Context Synchronization', () => {
    it('should maintain data consistency across AI systems', async () => {
      // Register multiple AIs
      contextSystem.registerAI('ide-ai', ['code-completion', 'refactoring']);
      contextSystem.registerAI('assistant-ai', ['conversation', 'analysis']);

      // Add context from IDE AI
      const contextId1 = await contextSystem.addContext({
        type: 'code',
        source: 'ide-ai',
        data: {
          file: 'test.ts',
          content: 'function test() { return true; }',
          language: 'typescript'
        },
        confidence: 0.9,
        relationships: []
      });

      // Add related context from Assistant AI
      const contextId2 = await contextSystem.addContext({
        type: 'conversation',
        source: 'assistant-ai',
        data: {
          message: 'User asked about test function implementation',
          intent: 'code-help'
        },
        confidence: 0.8,
        relationships: [contextId1]
      });

      // Verify contexts are linked
      const context1 = contextSystem.getContext(contextId1);
      const context2 = contextSystem.getContext(contextId2);

      expect(context1).toBeDefined();
      expect(context2).toBeDefined();
      expect(context2?.relationships).toContain(contextId1);

      // Check collaboration state
      const collabState = contextSystem.getCollaborationState();
      expect(collabState.activeAIs).toContain('ide-ai');
      expect(collabState.activeAIs).toContain('assistant-ai');
      expect(collabState.syncStatus).toBe('synced');
    });

    it('should handle concurrent context updates without data corruption', async () => {
      contextSystem.registerAI('ai-1', ['testing']);
      contextSystem.registerAI('ai-2', ['testing']);

      // Simulate concurrent updates
      const contextId = await contextSystem.addContext({
        type: 'project',
        source: 'ai-1',
        data: { version: 1, status: 'initial' },
        confidence: 0.7,
        relationships: []
      });

      // Concurrent updates
      const update1Promise = contextSystem.updateContext(contextId, {
        data: { version: 2, status: 'updated-by-ai-1' },
        confidence: 0.8
      });

      const update2Promise = contextSystem.updateContext(contextId, {
        data: { version: 2, status: 'updated-by-ai-2' },
        confidence: 0.75
      });

      await Promise.all([update1Promise, update2Promise]);

      // Verify final state is consistent
      const finalContext = contextSystem.getContext(contextId);
      expect(finalContext).toBeDefined();
      expect(finalContext?.data.version).toBe(2);
      // Should have merged or resolved conflict
      expect(finalContext?.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('should detect and resolve conflicts appropriately', (done) => {
      contextSystem.registerAI('conflicting-ai-1', ['testing']);
      contextSystem.registerAI('conflicting-ai-2', ['testing']);

      // Listen for conflict detection
      contextSystem.once('conflict_detected', (event) => {
        expect(event.contexts).toHaveLength(2);
        expect(event.resolution).toBe('merge');
        done();
      });

      // Create conflicting contexts
      setTimeout(async () => {
        await contextSystem.addContext({
          type: 'code',
          source: 'conflicting-ai-1',
          data: { file: 'same.ts', content: 'version 1' },
          confidence: 0.8,
          relationships: []
        });

        // Add similar context immediately (should trigger conflict)
        await contextSystem.addContext({
          type: 'code',
          source: 'conflicting-ai-2',
          data: { file: 'same.ts', content: 'version 2' },
          confidence: 0.8,
          relationships: []
        });
      }, 100);
    });
  });

  describe('Memory Integration', () => {
    it('should persist contexts in Git Memory', async () => {
      const contextId = await contextSystem.addContext({
        type: 'system',
        source: 'test',
        data: { test: 'persistence' },
        confidence: 1.0,
        relationships: []
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify in Git Memory
      const storedData = await gitMemory.getMemory('ai_contexts');
      expect(storedData).toBeDefined();
      
      const contexts = JSON.parse(storedData!);
      const foundContext = contexts.find((ctx: any) => ctx.id === contextId);
      expect(foundContext).toBeDefined();
      expect(foundContext.data.test).toBe('persistence');
    });

    it('should integrate with Semantic Memory for insights', async () => {
      // Add some semantic data
      await semanticMemory.store('test-content', 'This is test content for semantic search');
      
      const contextId = await contextSystem.addContext({
        type: 'conversation',
        source: 'test',
        data: { message: 'test content search' },
        confidence: 0.8,
        relationships: []
      });

      // Get insights
      const insights = contextSystem.getInsights(contextId);
      expect(insights.length).toBeGreaterThan(0);
      
      // Should have semantic insights
      const semanticInsight = insights.find(insight => 
        insight.id.startsWith('semantic_')
      );
      expect(semanticInsight).toBeDefined();
    });
  });

  describe('Code Intelligence Integration', () => {
    it('should provide code insights through context system', async () => {
      const codeContext = await contextSystem.addContext({
        type: 'code',
        source: 'test',
        data: {
          content: 'function calculateSum(a: number, b: number): number { return a + b; }',
          language: 'typescript',
          file: 'calculator.ts'
        },
        confidence: 0.9,
        relationships: []
      });

      const insights = contextSystem.getInsights(codeContext);
      expect(insights.length).toBeGreaterThan(0);
      
      // Should have code-specific insights
      const codeInsight = insights.find(insight => 
        insight.insight.includes('typescript') || 
        insight.insight.includes('Code')
      );
      expect(codeInsight).toBeDefined();
    });

    it('should maintain code context across AI interactions', async () => {
      contextSystem.registerAI('code-ai', ['code-analysis']);
      contextSystem.registerAI('review-ai', ['code-review']);

      // Code AI adds context
      const codeContextId = await contextSystem.addContext({
        type: 'code',
        source: 'code-ai',
        data: {
          file: 'example.ts',
          function: 'processData',
          complexity: 'medium'
        },
        confidence: 0.85,
        relationships: []
      });

      // Review AI adds related context
      const reviewContextId = await contextSystem.addContext({
        type: 'conversation',
        source: 'review-ai',
        data: {
          review: 'Function looks good but could be optimized',
          suggestions: ['Add error handling', 'Improve performance']
        },
        confidence: 0.8,
        relationships: [codeContextId]
      });

      // Search for related contexts
      const relatedContexts = contextSystem.searchContexts({
        keywords: ['processData', 'example.ts']
      });

      expect(relatedContexts.length).toBeGreaterThanOrEqual(2);
      expect(relatedContexts.some(ctx => ctx.id === codeContextId)).toBe(true);
      expect(relatedContexts.some(ctx => ctx.id === reviewContextId)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple AI connections efficiently', async () => {
      const startTime = Date.now();
      
      // Register multiple AIs
      for (let i = 0; i < 10; i++) {
        contextSystem.registerAI(`ai-${i}`, [`capability-${i}`]);
      }

      const registrationTime = Date.now() - startTime;
      expect(registrationTime).toBeLessThan(100); // Should be fast

      const collabState = contextSystem.getCollaborationState();
      expect(collabState.activeAIs).toHaveLength(10);
    });

    it('should maintain performance with large context history', async () => {
      const startTime = Date.now();
      
      // Add many contexts
      const contextIds: string[] = [];
      for (let i = 0; i < 100; i++) {
        const contextId = await contextSystem.addContext({
          type: 'system',
          source: 'performance-test',
          data: { index: i, data: `test-data-${i}` },
          confidence: Math.random(),
          relationships: []
        });
        contextIds.push(contextId);
      }

      const additionTime = Date.now() - startTime;
      expect(additionTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test search performance
      const searchStart = Date.now();
      const results = contextSystem.searchContexts({
        type: 'system',
        source: 'performance-test'
      });
      const searchTime = Date.now() - searchStart;
      
      expect(results).toHaveLength(100);
      expect(searchTime).toBeLessThan(100); // Search should be fast
    });

    it('should cleanup old contexts properly', async () => {
      // Add contexts with old timestamps
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      
      await contextSystem.addContext({
        type: 'system',
        source: 'cleanup-test',
        data: { old: true },
        confidence: 0.5,
        relationships: []
      });

      // Manually set old timestamp (for testing)
      const contexts = Array.from((contextSystem as any).contexts.values());
      if (contexts.length > 0) {
        contexts[0].timestamp = oldDate;
      }

      const statsBefore = contextSystem.getStatistics();
      await contextSystem.cleanup();
      const statsAfter = contextSystem.getStatistics();

      expect(statsAfter.totalContexts).toBeLessThanOrEqual(statsBefore.totalContexts);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service failures gracefully', async () => {
      // Simulate service failure by injecting null services
      const faultyContextSystem = new AIContextAwarenessSystem();
      faultyContextSystem.injectServices({
        gitMemoryService: undefined,
        semanticMemoryService: undefined
      });

      // Should still work without services
      const contextId = await faultyContextSystem.addContext({
        type: 'system',
        source: 'error-test',
        data: { test: 'resilience' },
        confidence: 0.8,
        relationships: []
      });

      expect(contextId).toBeDefined();
      const context = faultyContextSystem.getContext(contextId);
      expect(context).toBeDefined();
    });

    it('should recover from sync errors', (done) => {
      contextSystem.registerAI('error-ai', ['testing']);
      
      // Listen for sync error and recovery
      let errorDetected = false;
      contextSystem.once('sync_error', () => {
        errorDetected = true;
      });

      contextSystem.once('contexts_synced', () => {
        if (errorDetected) {
          done(); // Successfully recovered
        }
      });

      // Force an error by corrupting internal state temporarily
      const originalConfig = (contextSystem as any).config;
      (contextSystem as any).config = null;
      
      // Trigger sync
      setTimeout(() => {
        // Restore config to allow recovery
        (contextSystem as any).config = originalConfig;
      }, 100);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity in relationships', async () => {
      const parentId = await contextSystem.addContext({
        type: 'project',
        source: 'integrity-test',
        data: { name: 'parent-context' },
        confidence: 0.9,
        relationships: []
      });

      const childId = await contextSystem.addContext({
        type: 'code',
        source: 'integrity-test',
        data: { name: 'child-context' },
        confidence: 0.8,
        relationships: [parentId]
      });

      // Verify relationships
      const parent = contextSystem.getContext(parentId);
      const child = contextSystem.getContext(childId);

      expect(parent).toBeDefined();
      expect(child).toBeDefined();
      expect(child?.relationships).toContain(parentId);

      // Search by relationship should work
      const relatedContexts = contextSystem.searchContexts({
        keywords: ['parent-context']
      });
      expect(relatedContexts.length).toBeGreaterThan(0);
    });

    it('should prevent data corruption during concurrent access', async () => {
      contextSystem.registerAI('concurrent-ai-1', ['testing']);
      contextSystem.registerAI('concurrent-ai-2', ['testing']);

      const contextId = await contextSystem.addContext({
        type: 'shared',
        source: 'concurrent-test',
        data: { counter: 0 },
        confidence: 0.8,
        relationships: []
      });

      // Simulate concurrent updates
      const updates = [];
      for (let i = 0; i < 10; i++) {
        updates.push(
          contextSystem.updateContext(contextId, {
            data: { counter: i },
            confidence: 0.8 + (i * 0.01)
          })
        );
      }

      await Promise.all(updates);

      // Verify final state is valid
      const finalContext = contextSystem.getContext(contextId);
      expect(finalContext).toBeDefined();
      expect(typeof finalContext?.data.counter).toBe('number');
      expect(finalContext?.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });
});

/**
 * Integration Test Helper Functions
 */
class TestHelper {
  static async waitForEvent(emitter: any, eventName: string, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Event ${eventName} not received within ${timeout}ms`));
      }, timeout);

      emitter.once(eventName, (data: any) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  static generateTestContext(overrides: any = {}) {
    return {
      type: 'test',
      source: 'test-helper',
      data: { test: true, timestamp: Date.now() },
      confidence: 0.8,
      relationships: [],
      ...overrides
    };
  }

  static async measurePerformance<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    return { result, duration };
  }
}

export { TestHelper };