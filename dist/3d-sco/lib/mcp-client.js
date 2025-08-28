"use strict";
/**
 * MCP Client Utility
 * Provides a unified interface for interacting with MCP servers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryClient = exports.playwrightClient = exports.thinkingClient = exports.blenderClient = exports.multiFetchClient = exports.mcpClient = exports.MemoryClient = exports.PlaywrightClient = exports.ThinkingClient = exports.BlenderClient = exports.MultiFetchClient = exports.MCPClient = void 0;
const mcp_server_1 = require("./mcp-server");
class MCPClient {
    constructor(config = {}) {
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
        this.registry = new mcp_server_1.MCPServerRegistry();
    }
    /**
     * Make a request to an MCP server
     */
    async request(request) {
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
        let lastError = null;
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
            }
            catch (error) {
                lastError = error;
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
    async getServerStatus(serverName) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get all available servers
     */
    getAvailableServers() {
        return this.registry.getAllServers();
    }
    /**
     * Check if a server is available
     */
    hasServer(serverName) {
        return this.registry.hasServer(serverName);
    }
    /**
     * Get server capabilities
     */
    getServerCapabilities(serverName) {
        const server = this.registry.getServer(serverName);
        return server?.capabilities || [];
    }
    /**
     * Batch requests to multiple servers
     */
    async batchRequest(requests) {
        const promises = requests.map(request => this.request(request));
        return Promise.all(promises);
    }
    /**
     * Stream request for long-running operations
     */
    async streamRequest(request, onData) {
        // This would be implemented for streaming responses
        // For now, we'll use regular request
        const response = await this.request(request);
        if (response.success && response.data) {
            onData(response.data);
        }
        return response;
    }
}
exports.MCPClient = MCPClient;
// Convenience methods for specific MCP servers
class MultiFetchClient extends MCPClient {
    async fetchHtml(url, options = {}) {
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
    async fetchJson(url, options = {}) {
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
    async fetchText(url, options = {}) {
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
    async fetchMarkdown(url, options = {}) {
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
exports.MultiFetchClient = MultiFetchClient;
class BlenderClient extends MCPClient {
    async getSceneInfo() {
        return this.request({
            server: 'blender',
            action: 'get_scene_info'
        });
    }
    async getObjectInfo(objectName) {
        return this.request({
            server: 'blender',
            action: 'get_object_info',
            params: { object_name: objectName }
        });
    }
    async takeScreenshot(maxSize = 800) {
        return this.request({
            server: 'blender',
            action: 'get_viewport_screenshot',
            params: { max_size: maxSize }
        });
    }
    async executeCode(code) {
        return this.request({
            server: 'blender',
            action: 'execute_blender_code',
            params: { code }
        });
    }
    async searchPolyhavenAssets(assetType = 'all', categories) {
        return this.request({
            server: 'blender',
            action: 'search_polyhaven_assets',
            params: { asset_type: assetType, categories }
        });
    }
    async generateHyper3DModel(textPrompt, bboxCondition) {
        return this.request({
            server: 'blender',
            action: 'generate_hyper3d_model_via_text',
            params: { text_prompt: textPrompt, bbox_condition: bboxCondition }
        });
    }
}
exports.BlenderClient = BlenderClient;
class ThinkingClient extends MCPClient {
    async getTemplates() {
        return this.request({
            server: 'sequential-thinking',
            action: 'get_templates'
        });
    }
    async createProcess(templateId, title, description) {
        return this.request({
            server: 'sequential-thinking',
            action: 'create_process',
            params: { templateId, title, description }
        });
    }
    async getProcess(processId) {
        return this.request({
            server: 'sequential-thinking',
            action: 'get_process',
            params: { processId }
        });
    }
    async startProcess(processId) {
        return this.request({
            server: 'sequential-thinking',
            action: 'start_process',
            params: { processId }
        });
    }
    async completeStep(processId, stepId, result) {
        return this.request({
            server: 'sequential-thinking',
            action: 'complete_step',
            params: { processId, stepId, result }
        });
    }
    async getProgress(processId) {
        return this.request({
            server: 'sequential-thinking',
            action: 'get_progress',
            params: { processId }
        });
    }
}
exports.ThinkingClient = ThinkingClient;
class PlaywrightClient extends MCPClient {
    async initBrowser(options) {
        return this.request({
            server: 'playwright',
            action: 'init_browser',
            params: options
        });
    }
    async closeBrowser(sessionId) {
        return this.request({
            server: 'playwright',
            action: 'close_browser',
            params: { sessionId }
        });
    }
    async navigateToUrl(sessionId, url, options) {
        return this.request({
            server: 'playwright',
            action: 'navigate_to_url',
            params: { sessionId, url, ...options }
        });
    }
    async clickElement(sessionId, selector, options) {
        return this.request({
            server: 'playwright',
            action: 'click_element',
            params: { sessionId, selector, ...options }
        });
    }
    async fillInput(sessionId, selector, value, options) {
        return this.request({
            server: 'playwright',
            action: 'fill_input',
            params: { sessionId, selector, value, ...options }
        });
    }
    async waitForElement(sessionId, selector, options) {
        return this.request({
            server: 'playwright',
            action: 'wait_for_element',
            params: { sessionId, selector, ...options }
        });
    }
    async extractText(sessionId, selector) {
        return this.request({
            server: 'playwright',
            action: 'extract_text',
            params: { sessionId, selector }
        });
    }
    async getScreenshot(sessionId, options) {
        return this.request({
            server: 'playwright',
            action: 'get_screenshot',
            params: { sessionId, options }
        });
    }
    async getFullDOM(sessionId) {
        return this.request({
            server: 'playwright',
            action: 'get_full_dom',
            params: { sessionId }
        });
    }
    async executeCode(sessionId, code) {
        return this.request({
            server: 'playwright',
            action: 'execute_code',
            params: { sessionId, code }
        });
    }
    async validateSelectors(sessionId, selectors) {
        return this.request({
            server: 'playwright',
            action: 'validate_selectors',
            params: { sessionId, selectors }
        });
    }
    async generateTestCode(testCase) {
        return this.request({
            server: 'playwright',
            action: 'generate_test_code',
            params: { testCase }
        });
    }
    async runTest(sessionId, testCode) {
        return this.request({
            server: 'playwright',
            action: 'run_test',
            params: { sessionId, testCode }
        });
    }
    async getSessions() {
        return this.request({
            server: 'playwright',
            action: 'get_sessions'
        });
    }
    async getContext(sessionId) {
        return this.request({
            server: 'playwright',
            action: 'get_context',
            params: { sessionId }
        });
    }
    async cleanup() {
        return this.request({
            server: 'playwright',
            action: 'cleanup'
        });
    }
}
exports.PlaywrightClient = PlaywrightClient;
class MemoryClient extends MCPClient {
    async set(key, value, options) {
        return this.request({
            server: 'memory',
            action: 'set',
            params: { key, value, options }
        });
    }
    async get(key, namespace) {
        return this.request({
            server: 'memory',
            action: 'get',
            params: { key, namespace }
        });
    }
    async delete(key, namespace) {
        return this.request({
            server: 'memory',
            action: 'delete',
            params: { key, namespace }
        });
    }
    async query(query) {
        return this.request({
            server: 'memory',
            action: 'query',
            params: { query }
        });
    }
    async search(searchTerm, options) {
        return this.request({
            server: 'memory',
            action: 'search',
            params: { searchTerm, options }
        });
    }
    async bulkSet(entries) {
        return this.request({
            server: 'memory',
            action: 'bulk_set',
            params: { entries }
        });
    }
    async bulkGet(keys, namespace) {
        return this.request({
            server: 'memory',
            action: 'bulk_get',
            params: { keys, namespace }
        });
    }
    async getStats() {
        return this.request({
            server: 'memory',
            action: 'stats'
        });
    }
    async backup(namespace) {
        return this.request({
            server: 'memory',
            action: 'backup',
            params: { namespace }
        });
    }
    async restore(backup, namespace) {
        return this.request({
            server: 'memory',
            action: 'restore',
            params: { backup, namespace }
        });
    }
    async clear(namespace) {
        return this.request({
            server: 'memory',
            action: 'clear',
            params: { namespace }
        });
    }
}
exports.MemoryClient = MemoryClient;
// Default client instances
exports.mcpClient = new MCPClient();
exports.multiFetchClient = new MultiFetchClient();
exports.blenderClient = new BlenderClient();
exports.thinkingClient = new ThinkingClient();
exports.playwrightClient = new PlaywrightClient();
exports.memoryClient = new MemoryClient();
// React hooks for MCP integration
if (typeof window !== 'undefined') {
    // Client-side only hooks would go here
    // These would be implemented in a separate file for React integration
}
//# sourceMappingURL=mcp-client.js.map