"use strict";
/**
 * MCP Tools Configuration and Utilities
 * This file provides utilities for various MCP tools functionality
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.webFetcher = exports.RateLimiter = exports.ContentProcessor = exports.WebFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const jsdom_1 = require("jsdom");
// Web Fetching Utilities
class WebFetcher {
    constructor() {
        this.axiosInstance = axios_1.default.create({
            timeout: 30000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
    }
    static getInstance() {
        if (!WebFetcher.instance) {
            WebFetcher.instance = new WebFetcher();
        }
        return WebFetcher.instance;
    }
    async fetchHTML(url, options = {}) {
        try {
            const response = await this.axiosInstance.get(url, {
                headers: options.headers,
                timeout: options.timeout || 30000,
                ...(options.proxy && { proxy: this.parseProxy(options.proxy) })
            });
            return {
                content: response.data,
                status: response.status,
                headers: response.headers
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch ${url}: ${error}`);
        }
    }
    async fetchJSON(url, options = {}) {
        try {
            const response = await this.axiosInstance.get(url, {
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                },
                timeout: options.timeout || 30000,
                ...(options.proxy && { proxy: this.parseProxy(options.proxy) })
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch JSON from ${url}: ${error}`);
        }
    }
    async fetchText(url, options = {}) {
        const htmlResponse = await this.fetchHTML(url, options);
        if (options.extractContent) {
            return this.extractTextContent(htmlResponse.content);
        }
        return this.htmlToText(htmlResponse.content);
    }
    async fetchMarkdown(url, options = {}) {
        const htmlResponse = await this.fetchHTML(url, options);
        return this.htmlToMarkdown(htmlResponse.content, options.extractContent);
    }
    parseProxy(proxyString) {
        const url = new URL(proxyString);
        return {
            protocol: url.protocol.replace(':', ''),
            host: url.hostname,
            port: parseInt(url.port),
            ...(url.username && { auth: { username: url.username, password: url.password } })
        };
    }
    extractTextContent(html) {
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, footer, aside');
        scripts.forEach(el => el.remove());
        // Try to find main content
        const mainContent = document.querySelector('main, article, .content, #content, .post, .entry');
        const content = mainContent || document.body;
        return content?.textContent?.trim() || '';
    }
    htmlToText(html) {
        const $ = cheerio.load(html);
        // Remove unwanted elements
        $('script, style, nav, footer, aside, .advertisement, .ads').remove();
        return $.text().replace(/\s+/g, ' ').trim();
    }
    htmlToMarkdown(html, extractContent = false) {
        const $ = cheerio.load(html);
        if (extractContent) {
            // Focus on main content areas
            const mainContent = $('main, article, .content, #content, .post, .entry').first();
            if (mainContent.length) {
                return this.convertToMarkdown(mainContent);
            }
        }
        // Remove unwanted elements
        $('script, style, nav, footer, aside, .advertisement, .ads').remove();
        return this.convertToMarkdown($('body'));
    }
    convertToMarkdown($element) {
        let markdown = '';
        $element.contents().each((_, node) => {
            if (node.type === 'text') {
                markdown += $(node).text();
            }
            else if (node.type === 'tag') {
                const $node = $(node);
                const tagName = node.tagName.toLowerCase();
                switch (tagName) {
                    case 'h1':
                        markdown += `\n# ${$node.text()}\n\n`;
                        break;
                    case 'h2':
                        markdown += `\n## ${$node.text()}\n\n`;
                        break;
                    case 'h3':
                        markdown += `\n### ${$node.text()}\n\n`;
                        break;
                    case 'h4':
                        markdown += `\n#### ${$node.text()}\n\n`;
                        break;
                    case 'h5':
                        markdown += `\n##### ${$node.text()}\n\n`;
                        break;
                    case 'h6':
                        markdown += `\n###### ${$node.text()}\n\n`;
                        break;
                    case 'p':
                        markdown += `\n${$node.text()}\n\n`;
                        break;
                    case 'a':
                        const href = $node.attr('href');
                        markdown += `[${$node.text()}](${href || '#'})`;
                        break;
                    case 'strong':
                    case 'b':
                        markdown += `**${$node.text()}**`;
                        break;
                    case 'em':
                    case 'i':
                        markdown += `*${$node.text()}*`;
                        break;
                    case 'code':
                        markdown += `\`${$node.text()}\``;
                        break;
                    case 'pre':
                        markdown += `\n\`\`\`\n${$node.text()}\n\`\`\`\n\n`;
                        break;
                    case 'ul':
                        $node.find('li').each((_, li) => {
                            markdown += `- ${$(li).text()}\n`;
                        });
                        markdown += '\n';
                        break;
                    case 'ol':
                        $node.find('li').each((i, li) => {
                            markdown += `${i + 1}. ${$(li).text()}\n`;
                        });
                        markdown += '\n';
                        break;
                    case 'blockquote':
                        markdown += `\n> ${$node.text()}\n\n`;
                        break;
                    case 'br':
                        markdown += '\n';
                        break;
                    default:
                        markdown += this.convertToMarkdown($node);
                }
            }
        });
        return markdown;
    }
}
exports.WebFetcher = WebFetcher;
// Content Processing Utilities
class ContentProcessor {
    static chunkContent(content, maxSize = 50000) {
        const chunks = [];
        let currentChunk = '';
        const lines = content.split('\n');
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 > maxSize) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
            }
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        return {
            chunks,
            totalSize: content.length
        };
    }
    static extractMetadata(html) {
        const $ = cheerio.load(html);
        return {
            title: $('title').text() || $('meta[property="og:title"]').attr('content') || $('h1').first().text(),
            description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'),
            author: $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content'),
            publishDate: $('meta[property="article:published_time"]').attr('content') || $('time').attr('datetime'),
            keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim())
        };
    }
}
exports.ContentProcessor = ContentProcessor;
// Rate Limiting Utility
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }
    canMakeRequest(key, maxRequests, windowMs) {
        const now = Date.now();
        const requests = this.requests.get(key) || [];
        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < windowMs);
        if (validRequests.length >= maxRequests) {
            return false;
        }
        validRequests.push(now);
        this.requests.set(key, validRequests);
        return true;
    }
    getRemainingRequests(key, maxRequests, windowMs) {
        const now = Date.now();
        const requests = this.requests.get(key) || [];
        const validRequests = requests.filter(time => now - time < windowMs);
        return Math.max(0, maxRequests - validRequests.length);
    }
}
exports.RateLimiter = RateLimiter;
// Export singleton instances
exports.webFetcher = WebFetcher.getInstance();
exports.rateLimiter = new RateLimiter();
//# sourceMappingURL=mcp-tools.js.map