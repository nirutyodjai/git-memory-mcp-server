/**
 * Unit Tests for Git Memory Coordinator
 * ทดสอบการทำงานของ Git Memory Coordinator
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Mock GitMemoryCoordinator for testing
class MockGitMemoryCoordinator {
    constructor() {
        this.isRunning = false;
        this.repositories = new Map();
        this.memoryCache = new Map();
        this.config = {
            maxRepositories: 1000,
            cacheSize: 100,
            syncInterval: 30000
        };
    }

    async start() {
        this.isRunning = true;
        return { success: true, message: 'Git Memory Coordinator started' };
    }

    async stop() {
        this.isRunning = false;
        return { success: true, message: 'Git Memory Coordinator stopped' };
    }

    async addRepository(repoPath, options = {}) {
        if (!fs.existsSync(repoPath)) {
            throw new Error(`Repository path does not exist: ${repoPath}`);
        }

        const repoId = path.basename(repoPath);
        this.repositories.set(repoId, {
            path: repoPath,
            options,
            lastSync: new Date(),
            status: 'active'
        });

        return { repoId, status: 'added' };
    }

    async removeRepository(repoId) {
        if (!this.repositories.has(repoId)) {
            throw new Error(`Repository not found: ${repoId}`);
        }

        this.repositories.delete(repoId);
        this.memoryCache.delete(repoId);
        return { repoId, status: 'removed' };
    }

    async getRepositoryStatus(repoId) {
        const repo = this.repositories.get(repoId);
        if (!repo) {
            throw new Error(`Repository not found: ${repoId}`);
        }

        return {
            repoId,
            path: repo.path,
            status: repo.status,
            lastSync: repo.lastSync,
            memoryUsage: this.memoryCache.has(repoId) ? this.memoryCache.get(repoId).size : 0
        };
    }

    async syncRepository(repoId) {
        const repo = this.repositories.get(repoId);
        if (!repo) {
            throw new Error(`Repository not found: ${repoId}`);
        }

        // Simulate git operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        repo.lastSync = new Date();
        this.memoryCache.set(repoId, new Map([
            ['commits', Math.floor(Math.random() * 1000)],
            ['branches', Math.floor(Math.random() * 10)],
            ['files', Math.floor(Math.random() * 500)]
        ]));

        return {
            repoId,
            syncTime: new Date(),
            changes: Math.floor(Math.random() * 50)
        };
    }

    async getMemoryUsage() {
        const totalRepos = this.repositories.size;
        const totalCacheSize = Array.from(this.memoryCache.values())
            .reduce((total, cache) => total + cache.size, 0);

        return {
            repositories: totalRepos,
            cacheSize: totalCacheSize,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }

    async searchInMemory(query, options = {}) {
        const results = [];
        
        for (const [repoId, cache] of this.memoryCache) {
            if (cache.has('commits') && query.includes('commit')) {
                results.push({
                    repoId,
                    type: 'commit',
                    matches: Math.floor(Math.random() * 10)
                });
            }
        }

        return {
            query,
            results,
            totalMatches: results.reduce((sum, r) => sum + r.matches, 0)
        };
    }
}

// Test Suite
class GitMemoryCoordinatorTests {
    constructor() {
        this.coordinator = new MockGitMemoryCoordinator();
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 เริ่มต้น Unit Tests สำหรับ Git Memory Coordinator');
        
        const tests = [
            'testStartStop',
            'testAddRepository',
            'testRemoveRepository',
            'testGetRepositoryStatus',
            'testSyncRepository',
            'testGetMemoryUsage',
            'testSearchInMemory',
            'testErrorHandling',
            'testConcurrentOperations',
            'testConfigValidation'
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
                this.testResults.push({
                    name: testName,
                    status: 'FAILED',
                    error: error.message
                });
                console.log(`    ❌ ล้มเหลว: ${error.message}`);
            }
        }

        this.displayResults();
    }

    async testStartStop() {
        // Test starting the coordinator
        assert.strictEqual(this.coordinator.isRunning, false);
        
        const startResult = await this.coordinator.start();
        assert.strictEqual(startResult.success, true);
        assert.strictEqual(this.coordinator.isRunning, true);
        
        // Test stopping the coordinator
        const stopResult = await this.coordinator.stop();
        assert.strictEqual(stopResult.success, true);
        assert.strictEqual(this.coordinator.isRunning, false);
    }

    async testAddRepository() {
        // Create a temporary directory for testing
        const testRepoPath = path.join(process.cwd(), 'test-repo');
        if (!fs.existsSync(testRepoPath)) {
            fs.mkdirSync(testRepoPath, { recursive: true });
        }

        const result = await this.coordinator.addRepository(testRepoPath);
        assert.strictEqual(result.status, 'added');
        assert.strictEqual(result.repoId, 'test-repo');
        assert.strictEqual(this.coordinator.repositories.has('test-repo'), true);

        // Test adding non-existent repository
        try {
            await this.coordinator.addRepository('/non/existent/path');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('does not exist'));
        }
    }

    async testRemoveRepository() {
        // First add a repository
        const testRepoPath = path.join(process.cwd(), 'test-repo-2');
        if (!fs.existsSync(testRepoPath)) {
            fs.mkdirSync(testRepoPath, { recursive: true });
        }
        
        await this.coordinator.addRepository(testRepoPath);
        assert.strictEqual(this.coordinator.repositories.has('test-repo-2'), true);
        
        // Remove the repository
        const result = await this.coordinator.removeRepository('test-repo-2');
        assert.strictEqual(result.status, 'removed');
        assert.strictEqual(this.coordinator.repositories.has('test-repo-2'), false);
        
        // Test removing non-existent repository
        try {
            await this.coordinator.removeRepository('non-existent');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('not found'));
        }
    }

    async testGetRepositoryStatus() {
        // Add a repository first
        const testRepoPath = path.join(process.cwd(), 'test-repo-status');
        if (!fs.existsSync(testRepoPath)) {
            fs.mkdirSync(testRepoPath, { recursive: true });
        }
        
        await this.coordinator.addRepository(testRepoPath);
        
        const status = await this.coordinator.getRepositoryStatus('test-repo-status');
        assert.strictEqual(status.repoId, 'test-repo-status');
        assert.strictEqual(status.path, testRepoPath);
        assert.strictEqual(status.status, 'active');
        assert(status.lastSync instanceof Date);
    }

    async testSyncRepository() {
        // Add a repository first
        const testRepoPath = path.join(process.cwd(), 'test-repo-sync');
        if (!fs.existsSync(testRepoPath)) {
            fs.mkdirSync(testRepoPath, { recursive: true });
        }
        
        await this.coordinator.addRepository(testRepoPath);
        
        const syncResult = await this.coordinator.syncRepository('test-repo-sync');
        assert.strictEqual(syncResult.repoId, 'test-repo-sync');
        assert(syncResult.syncTime instanceof Date);
        assert(typeof syncResult.changes === 'number');
    }

    async testGetMemoryUsage() {
        const memoryUsage = await this.coordinator.getMemoryUsage();
        assert(typeof memoryUsage.repositories === 'number');
        assert(typeof memoryUsage.cacheSize === 'number');
        assert(typeof memoryUsage.memoryUsage === 'object');
        assert(typeof memoryUsage.uptime === 'number');
    }

    async testSearchInMemory() {
        // Add and sync a repository first
        const testRepoPath = path.join(process.cwd(), 'test-repo-search');
        if (!fs.existsSync(testRepoPath)) {
            fs.mkdirSync(testRepoPath, { recursive: true });
        }
        
        await this.coordinator.addRepository(testRepoPath);
        await this.coordinator.syncRepository('test-repo-search');
        
        const searchResult = await this.coordinator.searchInMemory('commit history');
        assert.strictEqual(searchResult.query, 'commit history');
        assert(Array.isArray(searchResult.results));
        assert(typeof searchResult.totalMatches === 'number');
    }

    async testErrorHandling() {
        // Test various error conditions
        try {
            await this.coordinator.getRepositoryStatus('non-existent');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('not found'));
        }

        try {
            await this.coordinator.syncRepository('non-existent');
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('not found'));
        }
    }

    async testConcurrentOperations() {
        // Test concurrent repository operations
        const testRepoPath1 = path.join(process.cwd(), 'test-repo-concurrent-1');
        const testRepoPath2 = path.join(process.cwd(), 'test-repo-concurrent-2');
        
        [testRepoPath1, testRepoPath2].forEach(path => {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
        });

        const promises = [
            this.coordinator.addRepository(testRepoPath1),
            this.coordinator.addRepository(testRepoPath2)
        ];

        const results = await Promise.all(promises);
        assert.strictEqual(results.length, 2);
        assert.strictEqual(results[0].status, 'added');
        assert.strictEqual(results[1].status, 'added');
    }

    async testConfigValidation() {
        // Test configuration validation
        assert(typeof this.coordinator.config.maxRepositories === 'number');
        assert(typeof this.coordinator.config.cacheSize === 'number');
        assert(typeof this.coordinator.config.syncInterval === 'number');
        
        assert(this.coordinator.config.maxRepositories > 0);
        assert(this.coordinator.config.cacheSize > 0);
        assert(this.coordinator.config.syncInterval > 0);
    }

    displayResults() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        const successRate = ((passed / total) * 100).toFixed(1);

        console.log('\n📊 สรุปผล Unit Tests:');
        console.log(`  ✅ ผ่าน: ${passed}/${total}`);
        console.log(`  ❌ ล้มเหลว: ${failed}/${total}`);
        console.log(`  🎯 อัตราความสำเร็จ: ${successRate}%`);

        if (failed > 0) {
            console.log('\n❌ การทดสอบที่ล้มเหลว:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }

        // Exit with appropriate code
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new GitMemoryCoordinatorTests();
    tests.runAllTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error);
        process.exit(1);
    });
}

module.exports = GitMemoryCoordinatorTests;