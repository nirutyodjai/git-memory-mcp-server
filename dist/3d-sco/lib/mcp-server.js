"use strict";
/**
 * MCP Server Configuration and Management
 * This file provides utilities for managing MCP (Model Context Protocol) servers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpClient = exports.mcpRegistry = exports.MCPClient = exports.MCPServerRegistry = void 0;
exports.getMCPServerList = getMCPServerList;
exports.getMCPServerDocumentation = getMCPServerDocumentation;
exports.validateMCPRequest = validateMCPRequest;
// MCP Server Registry
class MCPServerRegistry {
    constructor() {
        this.servers = new Map();
        this.initializeDefaultServers();
    }
    static getInstance() {
        if (!MCPServerRegistry.instance) {
            MCPServerRegistry.instance = new MCPServerRegistry();
        }
        return MCPServerRegistry.instance;
    }
    initializeDefaultServers() {
        // Playwright MCP Server
        this.registerServer({
            name: 'Playwright',
            description: 'Browser automation and web testing with Playwright integration for Trae AI',
            version: '1.0.0',
            baseUrl: '/api/mcp/playwright',
            rateLimits: {
                windowMs: 60000,
                maxRequests: 30
            },
            authentication: {
                type: 'none',
                required: false
            },
            capabilities: [
                'get_context',
                'get_full_dom',
                'get_screenshot',
                'execute_code',
                'init_browser',
                'validate_selectors',
                'navigate_to_url',
                'click_element',
                'fill_input',
                'wait_for_element',
                'extract_text',
                'generate_test_code',
                'run_test'
            ],
            endpoints: [
                {
                    name: 'init_browser',
                    path: '/api/mcp/playwright',
                    method: 'POST',
                    description: 'Initialize a new browser session for automation',
                    parameters: [
                        { name: 'action', type: 'string', required: true, description: 'Action to perform', enum: ['init_browser'] },
                        { name: 'headless', type: 'boolean', required: false, description: 'Run browser in headless mode', default: true },
                        { name: 'browserType', type: 'string', required: false, description: 'Browser type to use', enum: ['chromium', 'firefox', 'webkit'], default: 'chromium' }
                    ],
                    examples: [
                        {
                            name: 'Initialize browser session',
                            description: 'Create a new browser session for automation',
                            request: {
                                action: 'init_browser',
                                headless: true,
                                browserType: 'chromium'
                            },
                            response: {
                                success: true,
                                sessionId: 'session_123',
                                browserType: 'chromium'
                            }
                        }
                    ]
                },
                {
                    name: 'navigate_to_url',
                    path: '/api/mcp/playwright',
                    method: 'POST',
                    description: 'Navigate to a specific URL',
                    parameters: [
                        { name: 'action', type: 'string', required: true, description: 'Action to perform', enum: ['navigate_to_url'] },
                        { name: 'sessionId', type: 'string', required: true, description: 'Browser session ID' },
                        { name: 'url', type: 'string', required: true, description: 'URL to navigate to' },
                        { name: 'waitUntil', type: 'string', required: false, description: 'When to consider navigation complete', enum: ['load', 'domcontentloaded', 'networkidle'], default: 'load' }
                    ],
                    examples: [
                        {
                            name: 'Navigate to URL',
                            description: 'Navigate to a specific URL',
                            request: {
                                action: 'navigate_to_url',
                                sessionId: 'session_123',
                                url: 'https://example.com',
                                waitUntil: 'load'
                            },
                            response: {
                                success: true,
                                url: 'https://example.com',
                                title: 'Example Domain'
                            }
                        }
                    ]
                },
                {
                    name: 'get_screenshot',
                    path: '/api/mcp/playwright',
                    method: 'POST',
                    description: 'Capture a screenshot of the current page',
                    parameters: [
                        { name: 'action', type: 'string', required: true, description: 'Action to perform', enum: ['get_screenshot'] },
                        { name: 'sessionId', type: 'string', required: true, description: 'Browser session ID' },
                        { name: 'fullPage', type: 'boolean', required: false, description: 'Capture full page screenshot', default: false },
                        { name: 'format', type: 'string', required: false, description: 'Screenshot format', enum: ['png', 'jpeg'], default: 'png' }
                    ],
                    examples: [
                        {
                            name: 'Take screenshot',
                            description: 'Capture a screenshot of the current page',
                            request: {
                                action: 'get_screenshot',
                                sessionId: 'session_123',
                                fullPage: true,
                                format: 'png'
                            },
                            response: {
                                success: true,
                                screenshot: 'base64_encoded_image_data',
                                format: 'png'
                            }
                        }
                    ]
                }
            ]
        });
        // Multi Fetch MCP Server
        this.registerServer({
            name: 'Multi Fetch',
            description: 'Web content fetching and processing tools',
            version: '1.0.0',
            baseUrl: '/api/mcp/fetch',
            rateLimits: {
                windowMs: 60000,
                maxRequests: 50
            },
            authentication: {
                type: 'none',
                required: false
            },
            capabilities: [
                'fetch_html',
                'fetch_json',
                'fetch_txt',
                'fetch_markdown',
                'fetch_plaintext',
                'content_extraction',
                'proxy_support',
                'browser_mode',
                'content_chunking'
            ],
            endpoints: [
                {
                    name: 'fetch_html',
                    path: '/api/mcp/fetch',
                    method: 'POST',
                    description: 'Fetch a website and return the content as HTML',
                    parameters: [
                        { name: 'url', type: 'string', required: true, description: 'URL of the website to fetch' },
                        { name: 'startCursor', type: 'number', required: true, description: 'Starting cursor position in bytes' },
                        { name: 'headers', type: 'object', required: false, description: 'Optional headers to include in the request' },
                        { name: 'proxy', type: 'string', required: false, description: 'Optional proxy server to use' },
                        { name: 'timeout', type: 'number', required: false, description: 'Optional timeout in milliseconds', default: 30000 },
                        { name: 'useBrowser', type: 'boolean', required: false, description: 'Use headless browser for fetching', default: false },
                        { name: 'contentSizeLimit', type: 'number', required: false, description: 'Maximum content size in bytes', default: 50000 },
                        { name: 'extractContent', type: 'boolean', required: false, description: 'Enable intelligent content extraction', default: false }
                    ],
                    examples: [
                        {
                            name: 'Basic HTML fetch',
                            description: 'Fetch HTML content from a website',
                            request: {
                                action: 'fetch_html',
                                url: 'https://example.com',
                                startCursor: 0
                            },
                            response: {
                                success: true,
                                content: '<html>...</html>',
                                metadata: { title: 'Example', size: 1024 }
                            }
                        }
                    ]
                }
            ]
        });
        // Blender MCP Server
        this.registerServer({
            name: 'Blender',
            description: '3D modeling and rendering tools integration',
            version: '1.0.0',
            baseUrl: '/api/mcp/blender',
            rateLimits: {
                windowMs: 60000,
                maxRequests: 30
            },
            authentication: {
                type: 'none',
                required: false
            },
            capabilities: [
                'scene_info',
                'object_manipulation',
                'viewport_screenshot',
                'python_execution',
                'polyhaven_integration',
                'sketchfab_integration',
                'hyper3d_generation'
            ],
            endpoints: [
                {
                    name: 'get_scene_info',
                    path: '/api/mcp/blender',
                    method: 'POST',
                    description: 'Get detailed information about the current Blender scene',
                    parameters: [
                        { name: 'action', type: 'string', required: true, description: 'Action to perform', enum: ['get_scene_info'] }
                    ],
                    examples: [
                        {
                            name: 'Get scene information',
                            description: 'Retrieve current Blender scene details',
                            request: { action: 'get_scene_info' },
                            response: {
                                success: true,
                                scene: { name: 'Scene', objects: [], cameras: [], lights: [] }
                            }
                        }
                    ]
                }
            ]
        });
        // Sequential Thinking MCP Server
        this.registerServer({
            name: 'Sequential Thinking',
            description: 'Structured thinking and problem-solving processes',
            version: '1.0.0',
            baseUrl: '/api/mcp/thinking',
            rateLimits: {
                windowMs: 60000,
                maxRequests: 100
            },
            authentication: {
                type: 'none',
                required: false
            },
            capabilities: [
                'template_management',
                'process_creation',
                'step_tracking',
                'progress_monitoring',
                'export_import'
            ],
            endpoints: [
                {
                    name: 'create_process',
                    path: '/api/mcp/thinking',
                    method: 'POST',
                    description: 'Create a new thinking process from a template',
                    parameters: [
                        { name: 'action', type: 'string', required: true, description: 'Action to perform', enum: ['create_process'] },
                        { name: 'templateId', type: 'string', required: true, description: 'ID of the template to use' },
                        { name: 'title', type: 'string', required: true, description: 'Title of the process' },
                        { name: 'description', type: 'string', required: false, description: 'Description of the process' }
                    ],
                    examples: [
                        {
                            name: 'Create problem-solving process',
                            description: 'Create a new process using the problem-solving template',
                            request: {
                                action: 'create_process',
                                templateId: 'problem-solving',
                                title: 'Fix API Performance Issue',
                                description: 'Analyze and resolve slow API response times'
                            },
                            response: {
                                success: true,
                                process: { id: 'proc_123', title: 'Fix API Performance Issue', status: 'created' }
                            }
                        }
                    ]
                }
            ]
        });
        // Memory MCP Server
        this.registerServer({
            name: 'Memory',
            description: 'Memory management and data storage tools',
            version: '1.0.0',
            baseUrl: '/api/mcp/memory',
            rateLimits: {
                windowMs: 60000,
                maxRequests: 100
            },
            authentication: {
                type: 'none',
                required: false
            },
            capabilities: [
                'data_storage',
                'memory_management',
                'query_system',
                'backup_restore',
                'statistics',
                'bulk_operations'
            ],
            endpoints: [
                {
                    name: 'set',
                    path: '/api/mcp/memory',
                    method: 'POST',
                    description: 'Store a value in memory with optional metadata',
                    parameters: [
                        { name: 'action', type: 'string', required: true, description: 'Action to perform', enum: ['set'] },
                        { name: 'key', type: 'string', required: true, description: 'Key to store the value under' },
                        { name: 'value', type: 'object', required: true, description: 'Value to store' },
                        { name: 'options', type: 'object', required: false, description: 'Storage options (tags, namespace, priority, ttl)' }
                    ],
                    examples: [
                        {
                            name: 'Store user data',
                            description: 'Store user information with tags and namespace',
                            request: {
                                action: 'set',
                                key: 'user_123',
                                value: { name: 'John Doe', email: 'john@example.com' },
                                options: {
                                    tags: ['user', 'profile'],
                                    namespace: 'users',
                                    priority: 'high',
                                    ttl: 3600000
                                }
                            },
                            response: {
                                success: true,
                                result: { id: 'mem_123', key: 'user_123', metadata: {} }
                            }
                        }
                    ]
                }
            ]
        });
    }
    registerServer(config) {
        this.servers.set(config.name, config);
    }
    getServer(name) {
        return this.servers.get(name);
    }
    getAllServers() {
        return Array.from(this.servers.values());
    }
    getServersByCapability(capability) {
        return Array.from(this.servers.values())
            .filter(server => server.capabilities.includes(capability));
    }
    removeServer(name) {
        return this.servers.delete(name);
    }
    getServerStatus() {
        const status = {};
        for (const [name, config] of this.servers.entries()) {
            status[name] = {
                available: true, // In a real implementation, you'd check if the server is actually running
                endpoints: config.endpoints.length,
                capabilities: config.capabilities.length
            };
        }
        return status;
    }
}
exports.MCPServerRegistry = MCPServerRegistry;
// MCP Client for making requests to MCP servers
class MCPClient {
    constructor(baseUrl = '', headers = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
    }
    async request(serverName, action, params = {}, options = {}) {
        const registry = MCPServerRegistry.getInstance();
        const server = registry.getServer(serverName);
        if (!server) {
            throw new Error(`MCP server '${serverName}' not found`);
        }
        const url = `${this.baseUrl}${server.baseUrl}`;
        const method = options.method || 'POST';
        const headers = { ...this.defaultHeaders, ...options.headers };
        const requestBody = method === 'GET' ? undefined : JSON.stringify({
            action,
            ...params
        });
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: requestBody,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    // Convenience methods for specific MCP servers
    async multiFetch(action, params) {
        return this.request('Multi Fetch', action, params);
    }
    async blender(action, params) {
        return this.request('Blender', action, params);
    }
    async thinking(action, params) {
        return this.request('Sequential Thinking', action, params);
    }
    async memory(action, params) {
        return this.request('Memory', action, params);
    }
}
exports.MCPClient = MCPClient;
// Export singleton instances
exports.mcpRegistry = MCPServerRegistry.getInstance();
exports.mcpClient = new MCPClient();
// Utility functions
function getMCPServerList() {
    return exports.mcpRegistry.getAllServers().map(server => ({
        name: server.name,
        description: server.description,
        capabilities: server.capabilities
    }));
}
function getMCPServerDocumentation(serverName) {
    return exports.mcpRegistry.getServer(serverName) || null;
}
function validateMCPRequest(serverName, action, params) {
    const server = exports.mcpRegistry.getServer(serverName);
    if (!server) {
        return { valid: false, errors: [`Server '${serverName}' not found`] };
    }
    const endpoint = server.endpoints.find(ep => ep.name === action);
    if (!endpoint) {
        return { valid: false, errors: [`Action '${action}' not found in server '${serverName}'`] };
    }
    const errors = [];
    // Check required parameters
    for (const param of endpoint.parameters) {
        if (param.required && !(param.name in params)) {
            errors.push(`Required parameter '${param.name}' is missing`);
        }
        if (param.name in params) {
            const value = params[param.name];
            const expectedType = param.type;
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (expectedType !== actualType && !(expectedType === 'object' && actualType === 'object')) {
                errors.push(`Parameter '${param.name}' should be of type '${expectedType}', got '${actualType}'`);
            }
            if (param.enum && !param.enum.includes(value)) {
                errors.push(`Parameter '${param.name}' should be one of: ${param.enum.join(', ')}`);
            }
        }
    }
    return { valid: errors.length === 0, errors };
}
