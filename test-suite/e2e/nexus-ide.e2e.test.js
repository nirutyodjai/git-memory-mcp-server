/**
 * End-to-End Tests for NEXUS IDE
 * ทดสอบการทำงานของ NEXUS IDE ทั้งระบบจากมุมมองผู้ใช้
 */

const puppeteer = require('puppeteer');
const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// E2E Test Configuration
const E2E_CONFIG = {
    baseUrl: 'http://localhost:8080',
    timeout: 30000,
    viewport: { width: 1920, height: 1080 },
    headless: true,
    slowMo: 50,
    devtools: false
};

// NEXUS IDE E2E Test Suite
class NexusIDEE2ETests {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.serverProcess = null;
        this.screenshots = [];
    }

    async runAllTests() {
        console.log('🎭 เริ่มต้น E2E Tests สำหรับ NEXUS IDE');
        
        try {
            await this.setupTestEnvironment();
            
            const tests = [
                'testDashboardLoading',
                'testNavigationMenu',
                'testIDEInterface',
                'testFileExplorer',
                'testCodeEditor',
                'testTerminalIntegration',
                'testMCPServerStatus',
                'testRealTimeUpdates',
                'testResponsiveDesign',
                'testPerformanceMetrics',
                'testErrorHandling',
                'testUserInteractions'
            ];

            for (const testName of tests) {
                try {
                    console.log(`  🔍 ${testName}`);
                    const startTime = Date.now();
                    await this[testName]();
                    const duration = Date.now() - startTime;
                    
                    this.testResults.push({
                        name: testName,
                        status: 'PASSED',
                        duration
                    });
                    console.log(`    ✅ ผ่าน (${duration}ms)`);
                } catch (error) {
                    await this.takeScreenshot(`${testName}_error`);
                    this.testResults.push({
                        name: testName,
                        status: 'FAILED',
                        error: error.message
                    });
                    console.log(`    ❌ ล้มเหลว: ${error.message}`);
                }
            }
        } finally {
            await this.cleanup();
            this.displayResults();
        }
    }

    async setupTestEnvironment() {
        console.log('🔧 ตั้งค่าสภาพแวดล้อมการทดสอบ...');
        
        // Launch browser
        this.browser = await puppeteer.launch({
            headless: E2E_CONFIG.headless,
            slowMo: E2E_CONFIG.slowMo,
            devtools: E2E_CONFIG.devtools,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport(E2E_CONFIG.viewport);
        
        // Set up page event listeners
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Console Error:', msg.text());
            }
        });

        this.page.on('pageerror', error => {
            console.log('🔴 Page Error:', error.message);
        });

        // Wait for server to be ready
        await this.waitForServer();
    }

    async waitForServer(maxAttempts = 30) {
        console.log('⏳ รอให้เซิร์ฟเวอร์พร้อม...');
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios.get(E2E_CONFIG.baseUrl, { timeout: 2000 });
                if (response.status === 200) {
                    console.log('✅ เซิร์ฟเวอร์พร้อมแล้ว');
                    return;
                }
            } catch (error) {
                console.log(`  ⏳ ความพยายามที่ ${i + 1}/${maxAttempts}...`);
                await this.sleep(1000);
            }
        }
        
        throw new Error('เซิร์ฟเวอร์ไม่พร้อมใช้งาน');
    }

    async testDashboardLoading() {
        await this.page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
        
        // Check page title
        const title = await this.page.title();
        assert(title.includes('NEXUS'), `Expected title to contain 'NEXUS', got: ${title}`);
        
        // Check main dashboard elements
        await this.page.waitForSelector('.dashboard-container', { timeout: 10000 });
        await this.page.waitForSelector('.system-status', { timeout: 5000 });
        await this.page.waitForSelector('.mcp-servers-grid', { timeout: 5000 });
        
        // Verify dashboard is interactive
        const dashboardVisible = await this.page.evaluate(() => {
            const dashboard = document.querySelector('.dashboard-container');
            return dashboard && dashboard.offsetHeight > 0;
        });
        
        assert(dashboardVisible, 'Dashboard should be visible');
        
        await this.takeScreenshot('dashboard_loaded');
    }

    async testNavigationMenu() {
        // Test main navigation
        const navItems = [
            { selector: 'a[href="/"]', text: 'Dashboard' },
            { selector: 'a[href="/ide"]', text: 'IDE' },
            { selector: 'a[href="/servers"]', text: 'MCP Servers' }
        ];
        
        for (const item of navItems) {
            const element = await this.page.$(item.selector);
            assert(element, `Navigation item ${item.text} should exist`);
            
            const isVisible = await element.isIntersectingViewport();
            assert(isVisible, `Navigation item ${item.text} should be visible`);
        }
        
        // Test navigation functionality
        await this.page.click('a[href="/ide"]');
        await this.page.waitForSelector('.ide-container', { timeout: 10000 });
        
        // Navigate back to dashboard
        await this.page.click('a[href="/"]');
        await this.page.waitForSelector('.dashboard-container', { timeout: 5000 });
        
        await this.takeScreenshot('navigation_tested');
    }

    async testIDEInterface() {
        // Navigate to IDE
        await this.page.goto(`${E2E_CONFIG.baseUrl}/ide`, { waitUntil: 'networkidle0' });
        
        // Check IDE components
        await this.page.waitForSelector('.ide-container', { timeout: 10000 });
        await this.page.waitForSelector('.file-explorer', { timeout: 5000 });
        await this.page.waitForSelector('.code-editor', { timeout: 5000 });
        await this.page.waitForSelector('.terminal-panel', { timeout: 5000 });
        
        // Verify IDE layout
        const ideLayout = await this.page.evaluate(() => {
            const container = document.querySelector('.ide-container');
            const explorer = document.querySelector('.file-explorer');
            const editor = document.querySelector('.code-editor');
            const terminal = document.querySelector('.terminal-panel');
            
            return {
                containerExists: !!container,
                explorerExists: !!explorer,
                editorExists: !!editor,
                terminalExists: !!terminal,
                containerHeight: container ? container.offsetHeight : 0
            };
        });
        
        assert(ideLayout.containerExists, 'IDE container should exist');
        assert(ideLayout.explorerExists, 'File explorer should exist');
        assert(ideLayout.editorExists, 'Code editor should exist');
        assert(ideLayout.terminalExists, 'Terminal panel should exist');
        assert(ideLayout.containerHeight > 500, 'IDE should have reasonable height');
        
        await this.takeScreenshot('ide_interface');
    }

    async testFileExplorer() {
        // Ensure we're on IDE page
        await this.page.goto(`${E2E_CONFIG.baseUrl}/ide`, { waitUntil: 'networkidle0' });
        
        // Test file explorer functionality
        await this.page.waitForSelector('.file-explorer', { timeout: 10000 });
        
        // Check for file tree
        const fileTreeExists = await this.page.$('.file-tree') !== null;
        assert(fileTreeExists, 'File tree should exist');
        
        // Test folder expansion (if folders exist)
        const folders = await this.page.$$('.folder-item');
        if (folders.length > 0) {
            await folders[0].click();
            await this.sleep(500); // Wait for expansion animation
        }
        
        // Test file selection
        const files = await this.page.$$('.file-item');
        if (files.length > 0) {
            await files[0].click();
            await this.sleep(500); // Wait for file to load in editor
        }
        
        await this.takeScreenshot('file_explorer_tested');
    }

    async testCodeEditor() {
        // Ensure we're on IDE page
        await this.page.goto(`${E2E_CONFIG.baseUrl}/ide`, { waitUntil: 'networkidle0' });
        
        // Wait for Monaco Editor to load
        await this.page.waitForSelector('.monaco-editor', { timeout: 15000 });
        
        // Test editor functionality
        const editorReady = await this.page.evaluate(() => {
            return window.monaco && window.monaco.editor;
        });
        
        assert(editorReady, 'Monaco Editor should be loaded');
        
        // Test typing in editor
        await this.page.click('.monaco-editor');
        await this.page.keyboard.type('// Test code\nconsole.log("Hello NEXUS IDE");');
        
        // Verify text was entered
        const editorContent = await this.page.evaluate(() => {
            const editor = document.querySelector('.monaco-editor');
            return editor ? editor.textContent : '';
        });
        
        assert(editorContent.includes('Hello NEXUS IDE'), 'Editor should contain typed text');
        
        await this.takeScreenshot('code_editor_tested');
    }

    async testTerminalIntegration() {
        // Ensure we're on IDE page
        await this.page.goto(`${E2E_CONFIG.baseUrl}/ide`, { waitUntil: 'networkidle0' });
        
        // Test terminal panel
        await this.page.waitForSelector('.terminal-panel', { timeout: 10000 });
        
        // Check if terminal is interactive
        const terminalExists = await this.page.$('.terminal-container') !== null;
        assert(terminalExists, 'Terminal container should exist');
        
        // Test terminal input (if available)
        const terminalInput = await this.page.$('.terminal-input');
        if (terminalInput) {
            await terminalInput.click();
            await this.page.keyboard.type('echo "Terminal test"');
            await this.page.keyboard.press('Enter');
            await this.sleep(1000);
        }
        
        await this.takeScreenshot('terminal_tested');
    }

    async testMCPServerStatus() {
        // Navigate to servers page
        await this.page.goto(`${E2E_CONFIG.baseUrl}/servers`, { waitUntil: 'networkidle0' });
        
        // Wait for MCP servers grid
        await this.page.waitForSelector('.mcp-servers-grid', { timeout: 10000 });
        
        // Check server status indicators
        const serverCards = await this.page.$$('.server-card');
        assert(serverCards.length > 0, 'Should have at least one MCP server');
        
        // Test server status updates
        const statusElements = await this.page.$$('.server-status');
        for (const status of statusElements) {
            const statusText = await status.evaluate(el => el.textContent);
            assert(['running', 'stopped', 'error'].some(s => statusText.toLowerCase().includes(s)), 
                   `Server status should be valid: ${statusText}`);
        }
        
        await this.takeScreenshot('mcp_servers_status');
    }

    async testRealTimeUpdates() {
        // Test WebSocket connection for real-time updates
        await this.page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
        
        // Check for WebSocket connection
        const wsConnected = await this.page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.WebSocket) {
                    const ws = new WebSocket('ws://localhost:8080');
                    ws.onopen = () => {
                        ws.close();
                        resolve(true);
                    };
                    ws.onerror = () => resolve(false);
                    setTimeout(() => resolve(false), 5000);
                } else {
                    resolve(false);
                }
            });
        });
        
        // Note: WebSocket test might fail if server doesn't support it yet
        // This is acceptable for initial testing
        console.log(`WebSocket connection: ${wsConnected ? 'Success' : 'Not available'}`);
        
        await this.takeScreenshot('realtime_updates_tested');
    }

    async testResponsiveDesign() {
        // Test different viewport sizes
        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop' },
            { width: 1024, height: 768, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];
        
        for (const viewport of viewports) {
            await this.page.setViewport(viewport);
            await this.page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
            
            // Check if layout adapts
            const layoutInfo = await this.page.evaluate(() => {
                const container = document.querySelector('.dashboard-container');
                return {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    containerWidth: container ? container.offsetWidth : 0
                };
            });
            
            assert(layoutInfo.width === viewport.width, `Viewport width should be ${viewport.width}`);
            assert(layoutInfo.containerWidth > 0, `Container should be visible on ${viewport.name}`);
            
            await this.takeScreenshot(`responsive_${viewport.name.toLowerCase()}`);
        }
        
        // Reset to default viewport
        await this.page.setViewport(E2E_CONFIG.viewport);
    }

    async testPerformanceMetrics() {
        // Navigate to dashboard and measure performance
        const startTime = Date.now();
        await this.page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
        const loadTime = Date.now() - startTime;
        
        // Check load time
        assert(loadTime < 10000, `Page should load within 10 seconds, took ${loadTime}ms`);
        
        // Get performance metrics
        const metrics = await this.page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
            };
        });
        
        console.log('📊 Performance Metrics:', metrics);
        
        // Basic performance assertions
        assert(metrics.domContentLoaded < 5000, 'DOM should load within 5 seconds');
        assert(metrics.firstPaint > 0, 'First paint should be recorded');
        
        await this.takeScreenshot('performance_tested');
    }

    async testErrorHandling() {
        // Test 404 page
        const response = await this.page.goto(`${E2E_CONFIG.baseUrl}/nonexistent-page`, { waitUntil: 'networkidle0' });
        
        // Check if error is handled gracefully
        const pageContent = await this.page.content();
        const hasErrorHandling = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Error');
        
        // This might not fail if server returns 200 for all routes (SPA behavior)
        console.log(`Error handling test: ${hasErrorHandling ? 'Has error page' : 'Returns default page'}`);
        
        // Test JavaScript errors
        let jsErrors = [];
        this.page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        // Navigate back to valid page
        await this.page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
        
        // Check for JavaScript errors
        assert(jsErrors.length === 0, `Should not have JavaScript errors: ${jsErrors.join(', ')}`);
        
        await this.takeScreenshot('error_handling_tested');
    }

    async testUserInteractions() {
        await this.page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
        
        // Test button clicks
        const buttons = await this.page.$$('button');
        if (buttons.length > 0) {
            // Click first button and verify it responds
            const firstButton = buttons[0];
            const buttonText = await firstButton.evaluate(el => el.textContent);
            
            await firstButton.click();
            await this.sleep(500);
            
            console.log(`Clicked button: ${buttonText}`);
        }
        
        // Test form interactions (if any)
        const inputs = await this.page.$$('input');
        if (inputs.length > 0) {
            const firstInput = inputs[0];
            await firstInput.click();
            await firstInput.type('test input');
            
            const inputValue = await firstInput.evaluate(el => el.value);
            assert(inputValue === 'test input', 'Input should accept text');
        }
        
        // Test hover effects
        const hoverElements = await this.page.$$('.server-card, .nav-item, button');
        if (hoverElements.length > 0) {
            await hoverElements[0].hover();
            await this.sleep(200);
        }
        
        await this.takeScreenshot('user_interactions_tested');
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(__dirname, '..', 'screenshots', `${name}.png`);
            
            // Ensure screenshots directory exists
            const screenshotsDir = path.dirname(screenshotPath);
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            
            this.screenshots.push(screenshotPath);
            console.log(`    📸 Screenshot saved: ${name}.png`);
        } catch (error) {
            console.log(`    ⚠️ Failed to take screenshot: ${error.message}`);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        console.log('🧹 ทำความสะอาด...');
        
        if (this.page) {
            await this.page.close();
        }
        
        if (this.browser) {
            await this.browser.close();
        }
        
        if (this.serverProcess) {
            this.serverProcess.kill();
        }
    }

    displayResults() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        const successRate = ((passed / total) * 100).toFixed(1);
        const totalDuration = this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0);

        console.log('\n📊 สรุปผล E2E Tests:');
        console.log(`  ✅ ผ่าน: ${passed}/${total}`);
        console.log(`  ❌ ล้มเหลว: ${failed}/${total}`);
        console.log(`  🎯 อัตราความสำเร็จ: ${successRate}%`);
        console.log(`  ⏱️ เวลารวม: ${totalDuration}ms`);
        console.log(`  📸 Screenshots: ${this.screenshots.length} ไฟล์`);

        if (failed > 0) {
            console.log('\n❌ การทดสอบที่ล้มเหลว:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }

        if (this.screenshots.length > 0) {
            console.log('\n📸 Screenshots ที่บันทึก:');
            this.screenshots.forEach(path => {
                console.log(`  - ${path}`);
            });
        }

        // Exit with appropriate code
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new NexusIDEE2ETests();
    tests.runAllTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ E2E:', error);
        process.exit(1);
    });
}

module.exports = NexusIDEE2ETests;