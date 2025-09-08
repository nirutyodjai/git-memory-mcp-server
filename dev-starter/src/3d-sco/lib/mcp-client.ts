/**
 * MCP Client Utility
 * Provides a unified interface for interacting with MCP servers
 */

import { MCPServerRegistry, MCPServerConfig } from './mcp-server';

export interface MCPClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface MCPRequest {
  server: string;
  action: string;
  params?: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
  };
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    server: string;
    action: string;
    timestamp: string;
    duration: number;
    retries: number;
  };
}

export class MCPClient {
  private config: Required<MCPClientConfig>;
  private registry: MCPServerRegistry;

  constructor(config: MCPClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
    };
    this.registry = new MCPServerRegistry();
  }

  /**
   * Make a request to an MCP server
   */
  async request<T = any>(request: MCPRequest): Promise<MCPResponse<T>> {
    const startTime = Date.now();
    const server = this.registry.getServer(request.server);
    
    if (!server) {
      return {
        success: false,
        error: `Unknown MCP server: ${request.server}`,
        metadata: {
          server: request.server,
          action: request.action,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          retries: 0
        }
      };
    }

    const url = `${this.config.baseUrl}${server.endpoint}`;
    const timeout = request.options?.timeout || this.config.timeout;
    const maxRetries = request.options?.retries || this.config.retries;
    const headers = {
      ...this.config.headers,
      ...request.options?.headers
    };

    let lastError: Error | null = null;
    let retries = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: request.action,
            ...request.params
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        return {
          success: true,
          data,
          metadata: {
            server: request.server,
            action: request.action,
            timestamp: new Date().toISOString(),
            duration,
            retries
          }
        };
      } catch (error) {
        lastError = error as Error;
        retries = attempt;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      metadata: {
        server: request.server,
        action: request.action,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        retries
      }
    };
  }

  /**
   * Get server status
   */
  async getServerStatus(serverName: string): Promise<MCPResponse> {
    const server = this.registry.getServer(serverName);
    if (!server) {
      return {
        success: false,
        error: `Unknown MCP server: ${serverName}`
      };
    }

    try {
      const url = `${this.config.baseUrl}${server.endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.config.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get all available servers
   */
  getAvailableServers(): MCPServerConfig[] {
    return this.registry.getAllServers();
  }

  /**
   * Check if a server is available
   */
  hasServer(serverName: string): boolean {
    return this.registry.hasServer(serverName);
  }

  /**
   * Get server capabilities
   */
  getServerCapabilities(serverName: string): string[] {
    const server = this.registry.getServer(serverName);
    return server?.capabilities || [];
  }

  /**
   * Batch requests to multiple servers
   */
  async batchRequest(requests: MCPRequest[]): Promise<MCPResponse[]> {
    const promises = requests.map(request => this.request(request));
    return Promise.all(promises);
  }

  /**
   * Stream request for long-running operations
   */
  async streamRequest(request: MCPRequest, onData: (data: any) => void): Promise<MCPResponse> {
    // This would be implemented for streaming responses
    // For now, we'll use regular request
    const response = await this.request(request);
    if (response.success && response.data) {
      onData(response.data);
    }
    return response;
  }
}

// Convenience methods for specific MCP servers
export class MultiFetchClient extends MCPClient {
  async fetchHtml(url: string, options: {
    startCursor?: number;
    headers?: Record<string, string>;
    contentSizeLimit?: number;
    extractContent?: boolean;
  } = {}): Promise<MCPResponse> {
    return this.request({
      server: 'multi-fetch',
      action: 'fetch_html',
      params: {
        url,
        startCursor: options.startCursor || 0,
        headers: options.headers,
        contentSizeLimit: options.contentSizeLimit,
        extractContent: options.extractContent
      }
    });
  }

  async fetchJson(url: string, options: {
    startCursor?: number;
    headers?: Record<string, string>;
  } = {}): Promise<MCPResponse> {
    return this.request({
      server: 'multi-fetch',
      action: 'fetch_json',
      params: {
        url,
        startCursor: options.startCursor || 0,
        headers: options.headers
      }
    });
  }

  async fetchText(url: string, options: {
    startCursor?: number;
    extractContent?: boolean;
  } = {}): Promise<MCPResponse> {
    return this.request({
      server: 'multi-fetch',
      action: 'fetch_txt',
      params: {
        url,
        startCursor: options.startCursor || 0,
        extractContent: options.extractContent
      }
    });
  }

  async fetchMarkdown(url: string, options: {
    startCursor?: number;
    extractContent?: boolean;
  } = {}): Promise<MCPResponse> {
    return this.request({
      server: 'multi-fetch',
      action: 'fetch_markdown',
      params: {
        url,
        startCursor: options.startCursor || 0,
        extractContent: options.extractContent
      }
    });
  }
}

export class BlenderClient extends MCPClient {
  async getSceneInfo(): Promise<MCPResponse> {
    return this.request({
      server: 'blender',
      action: 'get_scene_info'
    });
  }

  async getObjectInfo(objectName: string): Promise<MCPResponse> {
    return this.request({
      server: 'blender',
      action: 'get_object_info',
      params: { object_name: objectName }
    });
  }

  async takeScreenshot(maxSize: number = 800): Promise<MCPResponse> {
    return this.request({
      server: 'blender',
      action: 'get_viewport_screenshot',
      params: { max_size: maxSize }
    });
  }

  async executeCode(code: string): Promise<MCPResponse> {
    return this.request({
      server: 'blender',
      action: 'execute_blender_code',
      params: { code }
    });
  }

  async searchPolyhavenAssets(assetType: string = 'all', categories?: string): Promise<MCPResponse> {
    return this.request({
      server: 'blender',
      action: 'search_polyhaven_assets',
      params: { asset_type: assetType, categories }
    });
  }

  async generateHyper3DModel(textPrompt: string, bboxCondition?: number[]): Promise<MCPResponse> {
    return this.request({
      server: 'blender',
      action: 'generate_hyper3d_model_via_text',
      params: { text_prompt: textPrompt, bbox_condition: bboxCondition }
    });
  }
}

export class ThinkingClient extends MCPClient {
  async getTemplates(): Promise<MCPResponse> {
    return this.request({
      server: 'sequential-thinking',
      action: 'get_templates'
    });
  }

  async createProcess(templateId: string, title: string, description?: string): Promise<MCPResponse> {
    return this.request({
      server: 'sequential-thinking',
      action: 'create_process',
      params: { templateId, title, description }
    });
  }

  async getProcess(processId: string): Promise<MCPResponse> {
    return this.request({
      server: 'sequential-thinking',
      action: 'get_process',
      params: { processId }
    });
  }

  async startProcess(processId: string): Promise<MCPResponse> {
    return this.request({
      server: 'sequential-thinking',
      action: 'start_process',
      params: { processId }
    });
  }

  async completeStep(processId: string, stepId: string, result: any): Promise<MCPResponse> {
    return this.request({
      server: 'sequential-thinking',
      action: 'complete_step',
      params: { processId, stepId, result }
    });
  }

  async getProgress(processId: string): Promise<MCPResponse> {
    return this.request({
      server: 'sequential-thinking',
      action: 'get_progress',
      params: { processId }
    });
  }
}

export class PlaywrightClient extends MCPClient {
  async initBrowser(options?: { headless?: boolean; browserType?: 'chromium' | 'firefox' | 'webkit' }): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'init_browser',
      params: options
    });
  }

  async closeBrowser(sessionId: string): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'close_browser',
      params: { sessionId }
    });
  }

  async navigateToUrl(sessionId: string, url: string, options?: { timeout?: number; waitUntil?: string }): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'navigate_to_url',
      params: { sessionId, url, ...options }
    });
  }

  async clickElement(sessionId: string, selector: string, options?: { timeout?: number }): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'click_element',
      params: { sessionId, selector, ...options }
    });
  }

  async fillInput(sessionId: string, selector: string, value: string, options?: { timeout?: number }): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'fill_input',
      params: { sessionId, selector, value, ...options }
    });
  }

  async waitForElement(sessionId: string, selector: string, options?: { timeout?: number }): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'wait_for_element',
      params: { sessionId, selector, ...options }
    });
  }

  async extractText(sessionId: string, selector: string): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'extract_text',
      params: { sessionId, selector }
    });
  }

  async getScreenshot(sessionId: string, options?: { fullPage?: boolean; format?: 'png' | 'jpeg' }): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'get_screenshot',
      params: { sessionId, options }
    });
  }

  async getFullDOM(sessionId: string): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'get_full_dom',
      params: { sessionId }
    });
  }

  async executeCode(sessionId: string, code: string): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'execute_code',
      params: { sessionId, code }
    });
  }

  async validateSelectors(sessionId: string, selectors: string[]): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'validate_selectors',
      params: { sessionId, selectors }
    });
  }

  async generateTestCode(testCase: any): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'generate_test_code',
      params: { testCase }
    });
  }

  async runTest(sessionId: string, testCode: string): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'run_test',
      params: { sessionId, testCode }
    });
  }

  async getSessions(): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'get_sessions'
    });
  }

  async getContext(sessionId: string): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'get_context',
      params: { sessionId }
    });
  }

  async cleanup(): Promise<MCPResponse> {
    return this.request({
      server: 'playwright',
      action: 'cleanup'
    });
  }
}

export class MemoryClient extends MCPClient {
  async set(key: string, value: any, options?: {
    ttl?: number;
    tags?: string[];
    namespace?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'set',
      params: { key, value, options }
    });
  }

  async get(key: string, namespace?: string): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'get',
      params: { key, namespace }
    });
  }

  async delete(key: string, namespace?: string): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'delete',
      params: { key, namespace }
    });
  }

  async query(query: {
    namespace?: string;
    tags?: string[];
    pattern?: string;
    limit?: number;
    offset?: number;
  }): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'query',
      params: { query }
    });
  }

  async search(searchTerm: string, options?: {
    namespace?: string;
    limit?: number;
    fuzzy?: boolean;
  }): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'search',
      params: { searchTerm, options }
    });
  }

  async bulkSet(entries: Array<{
    key: string;
    value: any;
    options?: {
      ttl?: number;
      tags?: string[];
      namespace?: string;
      priority?: 'low' | 'medium' | 'high';
    };
  }>): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'bulk_set',
      params: { entries }
    });
  }

  async bulkGet(keys: string[], namespace?: string): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'bulk_get',
      params: { keys, namespace }
    });
  }

  async getStats(): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'stats'
    });
  }

  async backup(namespace?: string): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'backup',
      params: { namespace }
    });
  }

  async restore(backup: any, namespace?: string): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'restore',
      params: { backup, namespace }
    });
  }

  async clear(namespace?: string): Promise<MCPResponse> {
    return this.request({
      server: 'memory',
      action: 'clear',
      params: { namespace }
    });
  }
}

// Default client instances
export const mcpClient = new MCPClient();
export const multiFetchClient = new MultiFetchClient();
export const blenderClient = new BlenderClient();
export const thinkingClient = new ThinkingClient();
export const playwrightClient = new PlaywrightClient();
export const memoryClient = new MemoryClient();

// React hooks for MCP integration
if (typeof window !== 'undefined') {
  // Client-side only hooks would go here
  // These would be implemented in a separate file for React integration
}