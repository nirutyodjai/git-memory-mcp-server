/**
 * MCP Server Configuration and Management
 * This file provides utilities for managing MCP (Model Context Protocol) servers
 */
export interface MCPServerConfig {
    name: string;
    description: string;
    version: string;
    baseUrl: string;
    endpoints: MCPEndpoint[];
    rateLimits: {
        windowMs: number;
        maxRequests: number;
    };
    authentication?: {
        type: 'none' | 'api_key' | 'bearer' | 'basic';
        required: boolean;
    };
    capabilities: string[];
}
export interface MCPEndpoint {
    name: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    parameters: MCPParameter[];
    examples: MCPExample[];
}
export interface MCPParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default?: any;
    enum?: any[];
}
export interface MCPExample {
    name: string;
    description: string;
    request: any;
    response: any;
}
export declare class MCPServerRegistry {
    private static instance;
    private servers;
    private constructor();
    static getInstance(): MCPServerRegistry;
    private initializeDefaultServers;
    registerServer(config: MCPServerConfig): void;
    getServer(name: string): MCPServerConfig | undefined;
    getAllServers(): MCPServerConfig[];
    getServersByCapability(capability: string): MCPServerConfig[];
    removeServer(name: string): boolean;
    getServerStatus(): {
        [serverName: string]: {
            available: boolean;
            endpoints: number;
            capabilities: number;
        };
    };
}
export declare class MCPClient {
    private baseUrl;
    private defaultHeaders;
    constructor(baseUrl?: string, headers?: Record<string, string>);
    request(serverName: string, action: string, params?: any, options?: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        headers?: Record<string, string>;
        timeout?: number;
    }): Promise<any>;
    multiFetch(action: string, params: any): Promise<any>;
    blender(action: string, params: any): Promise<any>;
    thinking(action: string, params: any): Promise<any>;
    memory(action: string, params: any): Promise<any>;
}
export declare const mcpRegistry: MCPServerRegistry;
export declare const mcpClient: MCPClient;
export declare function getMCPServerList(): {
    name: string;
    description: string;
    capabilities: string[];
}[];
export declare function getMCPServerDocumentation(serverName: string): MCPServerConfig | null;
export declare function validateMCPRequest(serverName: string, action: string, params: any): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=mcp-server.d.ts.map