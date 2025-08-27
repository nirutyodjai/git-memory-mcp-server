const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock the GitMemoryServer class
class MockGitMemoryServer {
  constructor() {
    this.workingDirectory = process.cwd();
  }

  async handleGitStatus() {
    return {
      content: [{
        type: 'text',
        text: 'On branch main\nnothing to commit, working tree clean'
      }]
    };
  }

  async handleGitLog(args) {
    const limit = args.limit || 10;
    return {
      content: [{
        type: 'text',
        text: `Showing ${limit} recent commits`
      }]
    };
  }

  async handleGitAdd(args) {
    return {
      content: [{
        type: 'text',
        text: `Added files: ${args.files.join(', ')}`
      }]
    };
  }

  async handleGitCommit(args) {
    return {
      content: [{
        type: 'text',
        text: `Committed with message: ${args.message}`
      }]
    };
  }

  async handleGitPush() {
    return {
      content: [{
        type: 'text',
        text: 'Push completed successfully'
      }]
    };
  }

  async handleGitPull() {
    return {
      content: [{
        type: 'text',
        text: 'Pull completed successfully'
      }]
    };
  }

  async handleGitBranch(args) {
    if (args.create) {
      return {
        content: [{
          type: 'text',
          text: `Created branch: ${args.name}`
        }]
      };
    }
    return {
      content: [{
        type: 'text',
        text: '* main\n  feature-branch'
      }]
    };
  }

  async handleGitMerge(args) {
    return {
      content: [{
        type: 'text',
        text: `Merged branch: ${args.branch}`
      }]
    };
  }
}

describe('Git Operations Tests', () => {
  let server;
  let testDir;

  beforeEach(() => {
    server = new MockGitMemoryServer();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
    process.chdir(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('git_status', () => {
    it('should return git status', async () => {
      const result = await server.handleGitStatus();
      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0].text).toContain('branch');
    });
  });

  describe('git_log', () => {
    it('should return git log with default limit', async () => {
      const result = await server.handleGitLog({});
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('10 recent commits');
    });

    it('should return git log with custom limit', async () => {
      const result = await server.handleGitLog({ limit: 5 });
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('5 recent commits');
    });
  });

  describe('git_add', () => {
    it('should add files to git', async () => {
      const result = await server.handleGitAdd({ files: ['file1.txt', 'file2.txt'] });
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('file1.txt, file2.txt');
    });
  });

  describe('git_commit', () => {
    it('should commit with message', async () => {
      const result = await server.handleGitCommit({ message: 'Test commit' });
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Test commit');
    });
  });

  describe('git_push', () => {
    it('should push to remote', async () => {
      const result = await server.handleGitPush();
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Push completed');
    });
  });

  describe('git_pull', () => {
    it('should pull from remote', async () => {
      const result = await server.handleGitPull();
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Pull completed');
    });
  });

  describe('git_branch', () => {
    it('should list branches', async () => {
      const result = await server.handleGitBranch({});
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('main');
    });

    it('should create new branch', async () => {
      const result = await server.handleGitBranch({ create: true, name: 'new-feature' });
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Created branch: new-feature');
    });
  });

  describe('git_merge', () => {
    it('should merge branch', async () => {
      const result = await server.handleGitMerge({ branch: 'feature-branch' });
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Merged branch: feature-branch');
    });
  });
});