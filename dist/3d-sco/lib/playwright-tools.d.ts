import { Browser, BrowserContext, Page } from 'playwright';
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
export declare class PlaywrightTools {
    private sessions;
    private rateLimiter;
    private config;
    private defaultTimeout;
    constructor(config: PlaywrightConfig);
    initBrowser(sessionId?: string): Promise<BrowserSession>;
    closeBrowser(sessionId: string): Promise<void>;
    executeAction(sessionId: string, action: PlaywrightAction): Promise<PlaywrightResult>;
    getFullDOM(sessionId: string): Promise<DOMElement | null>;
    validateSelectors(sessionId: string, selectors: string[]): Promise<Record<string, boolean>>;
    generateTestCode(testCase: TestCase): Promise<string>;
    runTest(sessionId: string, testCode: string): Promise<PlaywrightResult>;
    getActiveSessions(): string[];
    getSessionInfo(sessionId: string): Partial<BrowserSession> | null;
    cleanup(): Promise<void>;
    private getBrowserType;
}
export default PlaywrightTools;
//# sourceMappingURL=playwright-tools.d.ts.map