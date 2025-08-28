"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightTools = void 0;
const playwright_1 = require("playwright");
const mcp_tools_1 = require("./mcp-tools");
class PlaywrightTools {
    constructor(config) {
        this.sessions = new Map();
        this.defaultTimeout = 30000;
        this.config = config;
        this.rateLimiter = new mcp_tools_1.RateLimiter(30, 15 * 60 * 1000); // 30 requests per 15 minutes
    }
    async initBrowser(sessionId) {
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
        const session = {
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
    async closeBrowser(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        try {
            if (this.config.enableTracing) {
                await session.context.tracing.stop({ path: `./test-results/trace-${sessionId}.zip` });
            }
            await session.context.close();
            await session.browser.close();
        }
        catch (error) {
            console.error('Error closing browser session:', error);
        }
        finally {
            this.sessions.delete(sessionId);
        }
    }
    async executeAction(sessionId, action) {
        const startTime = Date.now();
        try {
            await this.rateLimiter.checkLimit('playwright');
            const session = this.sessions.get(sessionId);
            if (!session) {
                throw new Error(`Browser session ${sessionId} not found`);
            }
            session.lastUsed = new Date();
            const { page } = session;
            let result;
            let screenshot;
            switch (action.type) {
                case 'navigate':
                    if (!action.url)
                        throw new Error('URL is required for navigate action');
                    await page.goto(action.url, { timeout: action.timeout || this.defaultTimeout });
                    result = { url: page.url(), title: await page.title() };
                    break;
                case 'click':
                    if (!action.selector)
                        throw new Error('Selector is required for click action');
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
                    if (!action.selector)
                        throw new Error('Selector is required for wait action');
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
                    if (!action.selector)
                        throw new Error('Selector is required for extract action');
                    const elements = await page.$$(action.selector);
                    result = await Promise.all(elements.map(async (el) => {
                        const tagName = await el.evaluate(node => node.tagName.toLowerCase());
                        const textContent = await el.textContent();
                        const attributes = await el.evaluate(node => {
                            const attrs = {};
                            for (const attr of node.attributes) {
                                attrs[attr.name] = attr.value;
                            }
                            return attrs;
                        });
                        return { tagName, textContent, attributes };
                    }));
                    break;
                case 'execute':
                    if (!action.code)
                        throw new Error('Code is required for execute action');
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
        }
        catch (error) {
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
    async getFullDOM(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session)
                return null;
            const domTree = await session.page.evaluate(() => {
                function serializeElement(element) {
                    const result = {
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
        }
        catch (error) {
            console.error('Error getting full DOM:', error);
            return null;
        }
    }
    async validateSelectors(sessionId, selectors) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session)
                return {};
            const results = {};
            for (const selector of selectors) {
                try {
                    const element = await session.page.$(selector);
                    results[selector] = element !== null;
                }
                catch (error) {
                    results[selector] = false;
                }
            }
            return results;
        }
        catch (error) {
            console.error('Error validating selectors:', error);
            return {};
        }
    }
    async generateTestCode(testCase) {
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
                    }
                    else {
                        code += `  await expect(page.locator('${assertion.selector}')).toHaveAttribute('${assertion.property}', '${assertion.expected}');\n`;
                    }
                    break;
            }
        }
        code += `});\n`;
        return code;
    }
    async runTest(sessionId, testCode) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    getActiveSessions() {
        return Array.from(this.sessions.keys());
    }
    getSessionInfo(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        return {
            id: session.id,
            createdAt: session.createdAt,
            lastUsed: session.lastUsed
        };
    }
    async cleanup() {
        const sessionIds = Array.from(this.sessions.keys());
        await Promise.all(sessionIds.map(id => this.closeBrowser(id)));
    }
    getBrowserType() {
        switch (this.config.browserType) {
            case 'firefox':
                return playwright_1.firefox;
            case 'webkit':
                return playwright_1.webkit;
            case 'chromium':
            default:
                return playwright_1.chromium;
        }
    }
}
exports.PlaywrightTools = PlaywrightTools;
exports.default = PlaywrightTools;
//# sourceMappingURL=playwright-tools.js.map