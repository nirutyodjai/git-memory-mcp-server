/**
 * MCP Tools Configuration and Utilities
 * This file provides utilities for various MCP tools functionality
 */
export declare class WebFetcher {
    private static instance;
    private axiosInstance;
    private constructor();
    static getInstance(): WebFetcher;
    fetchHTML(url: string, options?: {
        headers?: Record<string, string>;
        proxy?: string;
        timeout?: number;
    }): Promise<{
        content: string;
        status: number;
        headers: Record<string, string>;
    }>;
    fetchJSON(url: string, options?: {
        headers?: Record<string, string>;
        proxy?: string;
        timeout?: number;
    }): Promise<any>;
    fetchText(url: string, options?: {
        headers?: Record<string, string>;
        proxy?: string;
        timeout?: number;
        extractContent?: boolean;
    }): Promise<string>;
    fetchMarkdown(url: string, options?: {
        headers?: Record<string, string>;
        proxy?: string;
        timeout?: number;
        extractContent?: boolean;
    }): Promise<string>;
    private parseProxy;
    private extractTextContent;
    private htmlToText;
    private htmlToMarkdown;
    private convertToMarkdown;
}
export declare class ContentProcessor {
    static chunkContent(content: string, maxSize?: number): {
        chunks: string[];
        totalSize: number;
    };
    static extractMetadata(html: string): {
        title?: string;
        description?: string;
        author?: string;
        publishDate?: string;
        keywords?: string[];
    };
}
export declare class RateLimiter {
    private requests;
    canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean;
    getRemainingRequests(key: string, maxRequests: number, windowMs: number): number;
}
export declare const webFetcher: WebFetcher;
export declare const rateLimiter: RateLimiter;
//# sourceMappingURL=mcp-tools.d.ts.map