/**
 * MCP Client Utility
 * Provides a unified interface for interacting with MCP servers
 */
import { MCPServerConfig } from './mcp-server';
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
export declare class MCPClient {
    private config;
    private registry;
    constructor(config?: MCPClientConfig);
    /**
     * Make a request to an MCP server
     */
    request<T = any>(request: MCPRequest): Promise<MCPResponse<T>>;
    /**
     * Get server status
     */
    getServerStatus(serverName: string): Promise<MCPResponse>;
    /**
     * Get all available servers
     */
    getAvailableServers(): MCPServerConfig[];
    /**
     * Check if a server is available
     */
    hasServer(serverName: string): boolean;
    /**
     * Get server capabilities
     */
    getServerCapabilities(serverName: string): string[];
    /**
     * Batch requests to multiple servers
     */
    batchRequest(requests: MCPRequest[]): Promise<MCPResponse[]>;
    /**
     * Stream request for long-running operations
     */
    streamRequest(request: MCPRequest, onData: (data: any) => void): Promise<MCPResponse>;
}
export declare class MultiFetchClient extends MCPClient {
    fetchHtml(url: string, options?: {
        startCursor?: number;
        headers?: Record<string, string>;
        contentSizeLimit?: number;
        extractContent?: boolean;
    }): Promise<MCPResponse>;
    fetchJson(url: string, options?: {
        startCursor?: number;
        headers?: Record<string, string>;
    }): Promise<MCPResponse>;
    fetchText(url: string, options?: {
        startCursor?: number;
        extractContent?: boolean;
    }): Promise<MCPResponse>;
    fetchMarkdown(url: string, options?: {
        startCursor?: number;
        extractContent?: boolean;
    }): Promise<MCPResponse>;
}
export declare class BlenderClient extends MCPClient {
    getSceneInfo(): Promise<MCPResponse>;
    getObjectInfo(objectName: string): Promise<MCPResponse>;
    takeScreenshot(maxSize?: number): Promise<MCPResponse>;
    executeCode(code: string): Promise<MCPResponse>;
    searchPolyhavenAssets(assetType?: string, categories?: string): Promise<MCPResponse>;
    generateHyper3DModel(textPrompt: string, bboxCondition?: number[]): Promise<MCPResponse>;
}
export declare class ThinkingClient extends MCPClient {
    getTemplates(): Promise<MCPResponse>;
    createProcess(templateId: string, title: string, description?: string): Promise<MCPResponse>;
    getProcess(processId: string): Promise<MCPResponse>;
    startProcess(processId: string): Promise<MCPResponse>;
    completeStep(processId: string, stepId: string, result: any): Promise<MCPResponse>;
    getProgress(processId: string): Promise<MCPResponse>;
}
export declare class PlaywrightClient extends MCPClient {
    initBrowser(options?: {
        headless?: boolean;
        browserType?: 'chromium' | 'firefox' | 'webkit';
    }): Promise<MCPResponse>;
    closeBrowser(sessionId: string): Promise<MCPResponse>;
    navigateToUrl(sessionId: string, url: string, options?: {
        timeout?: number;
        waitUntil?: string;
    }): Promise<MCPResponse>;
    clickElement(sessionId: string, selector: string, options?: {
        timeout?: number;
    }): Promise<MCPResponse>;
    fillInput(sessionId: string, selector: string, value: string, options?: {
        timeout?: number;
    }): Promise<MCPResponse>;
    waitForElement(sessionId: string, selector: string, options?: {
        timeout?: number;
    }): Promise<MCPResponse>;
    extractText(sessionId: string, selector: string): Promise<MCPResponse>;
    getScreenshot(sessionId: string, options?: {
        fullPage?: boolean;
        format?: 'png' | 'jpeg';
    }): Promise<MCPResponse>;
    getFullDOM(sessionId: string): Promise<MCPResponse>;
    executeCode(sessionId: string, code: string): Promise<MCPResponse>;
    validateSelectors(sessionId: string, selectors: string[]): Promise<MCPResponse>;
    generateTestCode(testCase: any): Promise<MCPResponse>;
    runTest(sessionId: string, testCode: string): Promise<MCPResponse>;
    getSessions(): Promise<MCPResponse>;
    getContext(sessionId: string): Promise<MCPResponse>;
    cleanup(): Promise<MCPResponse>;
}
export declare class MemoryClient extends MCPClient {
    set(key: string, value: any, options?: {
        ttl?: number;
        tags?: string[];
        namespace?: string;
        priority?: 'low' | 'medium' | 'high';
    }): Promise<MCPResponse>;
    get(key: string, namespace?: string): Promise<MCPResponse>;
    delete(key: string, namespace?: string): Promise<MCPResponse>;
    query(query: {
        namespace?: string;
        tags?: string[];
        pattern?: string;
        limit?: number;
        offset?: number;
    }): Promise<MCPResponse>;
    search(searchTerm: string, options?: {
        namespace?: string;
        limit?: number;
        fuzzy?: boolean;
    }): Promise<MCPResponse>;
    bulkSet(entries: Array<{
        key: string;
        value: any;
        options?: {
            ttl?: number;
            tags?: string[];
            namespace?: string;
            priority?: 'low' | 'medium' | 'high';
        };
    }>): Promise<MCPResponse>;
    bulkGet(keys: string[], namespace?: string): Promise<MCPResponse>;
    getStats(): Promise<MCPResponse>;
    backup(namespace?: string): Promise<MCPResponse>;
    restore(backup: any, namespace?: string): Promise<MCPResponse>;
    clear(namespace?: string): Promise<MCPResponse>;
}
export declare const mcpClient: MCPClient;
export declare const multiFetchClient: MultiFetchClient;
export declare const blenderClient: BlenderClient;
export declare const thinkingClient: ThinkingClient;
export declare const playwrightClient: PlaywrightClient;
export declare const memoryClient: MemoryClient;
//# sourceMappingURL=mcp-client.d.ts.map