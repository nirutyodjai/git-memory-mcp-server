import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { RateLimiter } from './mcp-tools';

export interface PlaywrightConfig {
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  viewport: {
    width: number;
    height: number;
  };
  enableScreenshots: boolean;
  enableTracing: boolean;
  enableVideo: boolean;
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
}

export interface BrowserSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  createdAt: Date;
  lastUsed: Date;
}

export interface PlaywrightAction {
  type: 'navigate' | 'click' | 'fill' | 'wait' | 'screenshot' | 'extract' | 'execute';
  selector?: string;
  value?: string;
  url?: string;
  code?: string;
  timeout?: number;
  options?: any;
}

export interface PlaywrightResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
  timing?: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface DOMElement {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  attributes: Record<string, string>;
  children?: DOMElement[];
}

export interface TestCase {
  name: string;
  description: string;
  steps: PlaywrightAction[];
  assertions: {
    selector: string;
    property: string;
    expected: any;
    operator: 'equals' | 'contains' | 'exists' | 'visible';
  }[];
}

export class PlaywrightTools {
  private sessions: Map<string, BrowserSession> = new Map();
  private rateLimiter: RateLimiter;
  private config: PlaywrightConfig;
  private defaultTimeout = 30000;

  constructor(config: PlaywrightConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(30, 15 * 60 * 1000); // 30 requests per 15 minutes
  }

  async initBrowser(sessionId?: string): Promise<BrowserSession> {
    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Close existing session if it exists
    if (this.sessions.has(id)) {
      await this.closeBrowser(id);
    }

    const browserType = this.getBrowserType();
    const browser = await browserType.launch({
      headless: this.config.headless,
      timeout: this.config.timeout,
    });

    const context = await browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.userAgent,
      locale: this.config.locale,
      timezoneId: this.config.timezoneId,
      recordVideo: this.config.enableVideo ? {
        dir: './test-results/videos/',
        size: this.config.viewport
      } : undefined,
    });

    if (this.config.enableTracing) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }

    const page = await context.newPage();
    page.setDefaultTimeout(this.config.timeout);

    const session: BrowserSession = {
      id,
      browser,
      context,
      page,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    this.sessions.set(id, session);
    return session;
  }

  async closeBrowser(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      if (this.config.enableTracing) {
        await session.context.tracing.stop({ path: `./test-results/trace-${sessionId}.zip` });
      }
      await session.context.close();
      await session.browser.close();
    } catch (error) {
      console.error('Error closing browser session:', error);
    } finally {
      this.sessions.delete(sessionId);
    }
  }

  async executeAction(sessionId: string, action: PlaywrightAction): Promise<PlaywrightResult> {
    const startTime = Date.now();
    
    try {
      await this.rateLimiter.checkLimit('playwright');
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Browser session ${sessionId} not found`);
      }

      session.lastUsed = new Date();
      const { page } = session;

      let result: any;
      let screenshot: string | undefined;

      switch (action.type) {
        case 'navigate':
          if (!action.url) throw new Error('URL is required for navigate action');
          await page.goto(action.url, { timeout: action.timeout || this.defaultTimeout });
          result = { url: page.url(), title: await page.title() };
          break;

        case 'click':
          if (!action.selector) throw new Error('Selector is required for click action');
          await page.click(action.selector, { timeout: action.timeout || this.defaultTimeout });
          result = { clicked: true };
          break;

        case 'fill':
          if (!action.selector || action.value === undefined) {
            throw new Error('Selector and value are required for fill action');
          }
          await page.fill(action.selector, action.value, { timeout: action.timeout || this.defaultTimeout });
          result = { filled: true, value: action.value };
          break;

        case 'wait':
          if (!action.selector) throw new Error('Selector is required for wait action');
          await page.waitForSelector(action.selector, { timeout: action.timeout || this.defaultTimeout });
          result = { waited: true };
          break;

        case 'screenshot':
          const screenshotBuffer = await page.screenshot({ 
            fullPage: action.options?.fullPage || false,
            type: action.options?.type || 'png'
          });
          screenshot = screenshotBuffer.toString('base64');
          result = { screenshot: true };
          break;

        case 'extract':
          if (!action.selector) throw new Error('Selector is required for extract action');
          const elements = await page.$$(action.selector);
          result = await Promise.all(elements.map(async (el) => {
            const tagName = await el.evaluate(node => node.tagName.toLowerCase());
            const textContent = await el.textContent();
            const attributes = await el.evaluate(node => {
              const attrs: Record<string, string> = {};
              for (const attr of node.attributes) {
                attrs[attr.name] = attr.value;
              }
              return attrs;
            });
            return { tagName, textContent, attributes };
          }));
          break;

        case 'execute':
          if (!action.code) throw new Error('Code is required for execute action');
          result = await page.evaluate(action.code);
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      if (this.config.enableScreenshots && action.type !== 'screenshot') {
        const screenshotBuffer = await page.screenshot({ type: 'png' });
        screenshot = screenshotBuffer.toString('base64');
      }

      const endTime = Date.now();
      return {
        success: true,
        data: result,
        screenshot,
        timing: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime
        }
      };

    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timing: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime
        }
      };
    }
  }

  async getFullDOM(sessionId: string): Promise<DOMElement | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return null;

      const domTree = await session.page.evaluate(() => {
        function serializeElement(element: Element): any {
          const result: any = {
            tagName: element.tagName.toLowerCase(),
            textContent: element.textContent?.trim() || '',
            attributes: {}
          };

          // Get attributes
          for (const attr of element.attributes) {
            result.attributes[attr.name] = attr.value;
          }

          // Get children
          const children = Array.from(element.children)
            .map(child => serializeElement(child))
            .filter(child => child !== null);
          
          if (children.length > 0) {
            result.children = children;
          }

          return result;
        }

        return serializeElement(document.documentElement);
      });

      return domTree;
    } catch (error) {
      console.error('Error getting full DOM:', error);
      return null;
    }
  }

  async validateSelectors(sessionId: string, selectors: string[]): Promise<Record<string, boolean>> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return {};

      const results: Record<string, boolean> = {};
      
      for (const selector of selectors) {
        try {
          const element = await session.page.$(selector);
          results[selector] = element !== null;
        } catch (error) {
          results[selector] = false;
        }
      }

      return results;
    } catch (error) {
      console.error('Error validating selectors:', error);
      return {};
    }
  }

  async generateTestCode(testCase: TestCase): Promise<string> {
    const { name, description, steps, assertions } = testCase;
    
    let code = `// Test: ${name}\n// Description: ${description}\n\n`;
    code += `import { test, expect } from '@playwright/test';\n\n`;
    code += `test('${name}', async ({ page }) => {\n`;
    
    for (const step of steps) {
      switch (step.type) {
        case 'navigate':
          code += `  await page.goto('${step.url}');\n`;
          break;
        case 'click':
          code += `  await page.click('${step.selector}');\n`;
          break;
        case 'fill':
          code += `  await page.fill('${step.selector}', '${step.value}');\n`;
          break;
        case 'wait':
          code += `  await page.waitForSelector('${step.selector}');\n`;
          break;
        case 'screenshot':
          code += `  await page.screenshot({ path: 'screenshot.png' });\n`;
          break;
      }
    }

    for (const assertion of assertions) {
      switch (assertion.operator) {
        case 'exists':
          code += `  await expect(page.locator('${assertion.selector}')).toBeVisible();\n`;
          break;
        case 'visible':
          code += `  await expect(page.locator('${assertion.selector}')).toBeVisible();\n`;
          break;
        case 'contains':
          code += `  await expect(page.locator('${assertion.selector}')).toContainText('${assertion.expected}');\n`;
          break;
        case 'equals':
          if (assertion.property === 'text') {
            code += `  await expect(page.locator('${assertion.selector}')).toHaveText('${assertion.expected}');\n`;
          } else {
            code += `  await expect(page.locator('${assertion.selector}')).toHaveAttribute('${assertion.property}', '${assertion.expected}');\n`;
          }
          break;
      }
    }

    code += `});\n`;
    return code;
  }

  async runTest(sessionId: string, testCode: string): Promise<PlaywrightResult> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Browser session ${sessionId} not found`);
      }

      // This is a simplified test runner - in production you'd use Playwright's test runner
      const result = await session.page.evaluate(testCode);
      
      return {
        success: true,
        data: { result, message: 'Test executed successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  getSessionInfo(sessionId: string): Partial<BrowserSession> | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed
    };
  }

  async cleanup(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    await Promise.all(sessionIds.map(id => this.closeBrowser(id)));
  }

  private getBrowserType() {
    switch (this.config.browserType) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      case 'chromium':
      default:
        return chromium;
    }
  }
}

export default PlaywrightTools;