#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';

class PlaywrightServer {
  private server: Server;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-playwright',
        version: '0.6.3',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'launch_browser',
          description: 'Launch a new browser instance',
          inputSchema: {
            type: 'object',
            properties: {
              headless: {
                type: 'boolean',
                description: 'Run browser in headless mode',
                default: true
              }
            }
          }
        },
        {
          name: 'navigate_to',
          description: 'Navigate to a specific URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to navigate to'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'take_screenshot',
          description: 'Take a screenshot of the current page',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to save the screenshot'
              },
              fullPage: {
                type: 'boolean',
                description: 'Capture full page',
                default: false
              }
            }
          }
        },
        {
          name: 'get_page_content',
          description: 'Get the HTML content of the current page',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'click_element',
          description: 'Click on an element by selector',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the element to click'
              }
            },
            required: ['selector']
          }
        },
        {
          name: 'fill_input',
          description: 'Fill an input field with text',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the input field'
              },
              text: {
                type: 'string',
                description: 'Text to fill in the input field'
              }
            },
            required: ['selector', 'text']
          }
        },
        {
          name: 'wait_for_element',
          description: 'Wait for an element to appear on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the element to wait for'
              },
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
                default: 30000
              }
            },
            required: ['selector']
          }
        },
        {
          name: 'close_browser',
          description: 'Close the browser instance',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'launch_browser':
            return await this.launchBrowser((args?.headless as boolean) ?? true);
          
          case 'navigate_to':
            return await this.navigateTo(args?.url as string);
          
          case 'take_screenshot':
            return await this.takeScreenshot(args?.path as string, args?.fullPage as boolean);
          
          case 'get_page_content':
            return await this.getPageContent();
          
          case 'click_element':
            return await this.clickElement(args?.selector as string);
          
          case 'fill_input':
            return await this.fillInput(args?.selector as string, args?.text as string);
          
          case 'wait_for_element':
            return await this.waitForElement(args?.selector as string, args?.timeout as number);
          
          case 'close_browser':
            return await this.closeBrowser();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async launchBrowser(headless: boolean = true) {
    if (this.browser) {
      await this.browser.close();
    }
    
    this.browser = await chromium.launch({ headless });
    this.page = await this.browser.newPage();
    
    return {
      content: [
        {
          type: 'text',
          text: `Browser launched successfully in ${headless ? 'headless' : 'headed'} mode`
        }
      ]
    };
  }

  private async navigateTo(url: string) {
    if (!this.page) {
      throw new Error('Browser not launched. Please launch browser first.');
    }
    
    await this.page.goto(url);
    
    return {
      content: [
        {
          type: 'text',
          text: `Navigated to: ${url}`
        }
      ]
    };
  }

  private async takeScreenshot(path?: string, fullPage: boolean = false) {
    if (!this.page) {
      throw new Error('Browser not launched. Please launch browser first.');
    }
    
    const screenshot = await this.page.screenshot({ 
      path, 
      fullPage,
      type: 'png'
    });
    
    return {
      content: [
        {
          type: 'text',
          text: path ? `Screenshot saved to: ${path}` : 'Screenshot taken'
        }
      ]
    };
  }

  private async getPageContent() {
    if (!this.page) {
      throw new Error('Browser not launched. Please launch browser first.');
    }
    
    const content = await this.page.content();
    
    return {
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    };
  }

  private async clickElement(selector: string) {
    if (!this.page) {
      throw new Error('Browser not launched. Please launch browser first.');
    }
    
    await this.page.click(selector);
    
    return {
      content: [
        {
          type: 'text',
          text: `Clicked element: ${selector}`
        }
      ]
    };
  }

  private async fillInput(selector: string, text: string) {
    if (!this.page) {
      throw new Error('Browser not launched. Please launch browser first.');
    }
    
    await this.page.fill(selector, text);
    
    return {
      content: [
        {
          type: 'text',
          text: `Filled input ${selector} with: ${text}`
        }
      ]
    };
  }

  private async waitForElement(selector: string, timeout: number = 30000) {
    if (!this.page) {
      throw new Error('Browser not launched. Please launch browser first.');
    }
    
    await this.page.waitForSelector(selector, { timeout });
    
    return {
      content: [
        {
          type: 'text',
          text: `Element found: ${selector}`
        }
      ]
    };
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: 'Browser closed successfully'
        }
      ]
    };
  }

  private async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP server running on stdio');
  }
}

const server = new PlaywrightServer();
server.run().catch(console.error);