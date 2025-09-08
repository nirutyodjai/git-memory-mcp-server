/**
 * MCP Tools Configuration and Utilities
 * This file provides utilities for various MCP tools functionality
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

// Web Fetching Utilities
export class WebFetcher {
  private static instance: WebFetcher;
  private axiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }

  public static getInstance(): WebFetcher {
    if (!WebFetcher.instance) {
      WebFetcher.instance = new WebFetcher();
    }
    return WebFetcher.instance;
  }

  async fetchHTML(url: string, options: {
    headers?: Record<string, string>;
    proxy?: string;
    timeout?: number;
  } = {}): Promise<{
    content: string;
    status: number;
    headers: Record<string, string>;
  }> {
    try {
      const response = await this.axiosInstance.get(url, {
        headers: options.headers,
        timeout: options.timeout || 30000,
        ...(options.proxy && { proxy: this.parseProxy(options.proxy) })
      });

      return {
        content: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error}`);
    }
  }

  async fetchJSON(url: string, options: {
    headers?: Record<string, string>;
    proxy?: string;
    timeout?: number;
  } = {}): Promise<any> {
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
    } catch (error) {
      throw new Error(`Failed to fetch JSON from ${url}: ${error}`);
    }
  }

  async fetchText(url: string, options: {
    headers?: Record<string, string>;
    proxy?: string;
    timeout?: number;
    extractContent?: boolean;
  } = {}): Promise<string> {
    const htmlResponse = await this.fetchHTML(url, options);
    
    if (options.extractContent) {
      return this.extractTextContent(htmlResponse.content);
    }
    
    return this.htmlToText(htmlResponse.content);
  }

  async fetchMarkdown(url: string, options: {
    headers?: Record<string, string>;
    proxy?: string;
    timeout?: number;
    extractContent?: boolean;
  } = {}): Promise<string> {
    const htmlResponse = await this.fetchHTML(url, options);
    return this.htmlToMarkdown(htmlResponse.content, options.extractContent);
  }

  private parseProxy(proxyString: string) {
    const url = new URL(proxyString);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: parseInt(url.port),
      ...(url.username && { auth: { username: url.username, password: url.password } })
    };
  }

  private extractTextContent(html: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, nav, footer, aside');
    scripts.forEach(el => el.remove());
    
    // Try to find main content
    const mainContent = document.querySelector('main, article, .content, #content, .post, .entry');
    const content = mainContent || document.body;
    
    return content?.textContent?.trim() || '';
  }

  private htmlToText(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, footer, aside, .advertisement, .ads').remove();
    
    return $.text().replace(/\s+/g, ' ').trim();
  }

  private htmlToMarkdown(html: string, extractContent = false): string {
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

  private convertToMarkdown($element: cheerio.Cheerio<cheerio.Element>): string {
    let markdown = '';
    
    $element.contents().each((_, node) => {
      if (node.type === 'text') {
        markdown += $(node).text();
      } else if (node.type === 'tag') {
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

// Content Processing Utilities
export class ContentProcessor {
  static chunkContent(content: string, maxSize: number = 50000): {
    chunks: string[];
    totalSize: number;
  } {
    const chunks: string[] = [];
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

  static extractMetadata(html: string): {
    title?: string;
    description?: string;
    author?: string;
    publishDate?: string;
    keywords?: string[];
  } {
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

// Rate Limiting Utility
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
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
  
  getRemainingRequests(key: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < windowMs);
    return Math.max(0, maxRequests - validRequests.length);
  }
}

// Export singleton instances
export const webFetcher = WebFetcher.getInstance();
export const rateLimiter = new RateLimiter();