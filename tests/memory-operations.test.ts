const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock the GitMemoryServer class
class MockGitMemoryServer {
  constructor() {
    this.memoryData = new Map();
  }

  async handleMemoryStore(args) {
    const { key, content, metadata } = args;
    this.memoryData.set(key, { content, metadata, timestamp: new Date().toISOString() });
    return {
      content: [{
        type: 'text',
        text: `Memory stored successfully with key: ${key}`
      }]
    };
  }

  async handleMemoryRetrieve(args) {
    const { key } = args;
    const data = this.memoryData.get(key);
    if (!data) {
      throw new Error(`Memory not found for key: ${key}`);
    }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }]
    };
  }

  async handleMemoryList() {
    const keys = Array.from(this.memoryData.keys());
    return {
      content: [{
        type: 'text',
        text: `Available memory keys: ${keys.join(', ')}`
      }]
    };
  }

  async handleMemorySearch(args) {
    const { query } = args;
    const results = [];
    for (const [key, data] of this.memoryData.entries()) {
      if (data.content.toLowerCase().includes(query.toLowerCase()) ||
          key.toLowerCase().includes(query.toLowerCase())) {
        results.push({ key, ...data });
      }
    }
    return {
      content: [{
        type: 'text',
        text: `Found ${results.length} results for query: ${query}`
      }]
    };
  }

  async handleMemoryFilter(args) {
    const { criteria } = args;
    const results = [];
    for (const [key, data] of this.memoryData.entries()) {
      let matches = true;
      if (criteria.type && data.metadata?.type !== criteria.type) {
        matches = false;
      }
      if (criteria.tags && !criteria.tags.every(tag => data.metadata?.tags?.includes(tag))) {
        matches = false;
      }
      if (matches) {
        results.push({ key, ...data });
      }
    }
    return {
      content: [{
        type: 'text',
        text: `Filtered ${results.length} results`
      }]
    };
  }

  async handleMemoryDelete(args) {
    const { key } = args;
    if (!this.memoryData.has(key)) {
      throw new Error(`Memory not found for key: ${key}`);
    }
    this.memoryData.delete(key);
    return {
      content: [{
        type: 'text',
        text: `Memory deleted successfully for key: ${key}`
      }]
    };
  }
}

describe('Memory Operations Tests', () => {
  let server;
  let testDir;
  let memoryFile;

  beforeEach(() => {
    server = new MockGitMemoryServer();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-test-'));
    memoryFile = path.join(testDir, 'memory.json');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('memory_store', () => {
    it('should store memory successfully', async () => {
      const result = await server.handleMemoryStore({
        key: 'test-key',
        content: 'test content',
        metadata: { type: 'note', tags: ['test'] }
      });
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Memory stored successfully');
      expect(result.content[0].text).toContain('test-key');
    });

    it('should handle complex content', async () => {
      const complexContent = {
        title: 'Test Note',
        body: 'This is a test note with complex content',
        data: [1, 2, 3, 4, 5]
      };
      
      const result = await server.handleMemoryStore({
        key: 'complex-key',
        content: JSON.stringify(complexContent),
        metadata: { type: 'structured', format: 'json' }
      });
      
      expect(result.content[0].text).toContain('complex-key');
    });
  });

  describe('memory_retrieve', () => {
    beforeEach(async () => {
      await server.handleMemoryStore({
        key: 'retrieve-test',
        content: 'content to retrieve',
        metadata: { type: 'test' }
      });
    });

    it('should retrieve stored memory', async () => {
      const result = await server.handleMemoryRetrieve({ key: 'retrieve-test' });
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('content to retrieve');
    });

    it('should throw error for non-existent key', async () => {
      await expect(server.handleMemoryRetrieve({ key: 'non-existent' }))
        .rejects.toThrow('Memory not found');
    });
  });

  describe('memory_list', () => {
    beforeEach(async () => {
      await server.handleMemoryStore({ key: 'key1', content: 'content1', metadata: {} });
      await server.handleMemoryStore({ key: 'key2', content: 'content2', metadata: {} });
      await server.handleMemoryStore({ key: 'key3', content: 'content3', metadata: {} });
    });

    it('should list all memory keys', async () => {
      const result = await server.handleMemoryList();
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('key1');
      expect(result.content[0].text).toContain('key2');
      expect(result.content[0].text).toContain('key3');
    });
  });

  describe('memory_search', () => {
    beforeEach(async () => {
      await server.handleMemoryStore({
        key: 'search-test-1',
        content: 'This is a test document about JavaScript',
        metadata: { type: 'document' }
      });
      await server.handleMemoryStore({
        key: 'search-test-2',
        content: 'Python programming guide',
        metadata: { type: 'guide' }
      });
    });

    it('should search by content', async () => {
      const result = await server.handleMemorySearch({ query: 'JavaScript' });
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Found');
      expect(result.content[0].text).toContain('JavaScript');
    });

    it('should search by key', async () => {
      const result = await server.handleMemorySearch({ query: 'search-test-1' });
      
      expect(result.content[0].text).toContain('Found');
    });
  });

  describe('memory_filter', () => {
    beforeEach(async () => {
      await server.handleMemoryStore({
        key: 'filter-test-1',
        content: 'Document content',
        metadata: { type: 'document', tags: ['important', 'work'] }
      });
      await server.handleMemoryStore({
        key: 'filter-test-2',
        content: 'Note content',
        metadata: { type: 'note', tags: ['personal'] }
      });
    });

    it('should filter by type', async () => {
      const result = await server.handleMemoryFilter({ criteria: { type: 'document' } });
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Filtered');
    });

    it('should filter by tags', async () => {
      const result = await server.handleMemoryFilter({ 
        criteria: { tags: ['important'] } 
      });
      
      expect(result.content[0].text).toContain('Filtered');
    });
  });

  describe('memory_delete', () => {
    beforeEach(async () => {
      await server.handleMemoryStore({
        key: 'delete-test',
        content: 'content to delete',
        metadata: {}
      });
    });

    it('should delete existing memory', async () => {
      const result = await server.handleMemoryDelete({ key: 'delete-test' });
      
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Memory deleted successfully');
      expect(result.content[0].text).toContain('delete-test');
    });

    it('should throw error for non-existent key', async () => {
      await expect(server.handleMemoryDelete({ key: 'non-existent' }))
        .rejects.toThrow('Memory not found');
    });

    it('should verify deletion', async () => {
      await server.handleMemoryDelete({ key: 'delete-test' });
      
      await expect(server.handleMemoryRetrieve({ key: 'delete-test' }))
        .rejects.toThrow('Memory not found');
    });
  });
});