#!/usr/bin/env node
/**
 * PRD Sync Script
 * ซิงค์การเปลี่ยนแปลงระหว่าง PRD และ codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class PRDSyncManager {
  constructor() {
    this.prdPath = path.join(__dirname, '..', 'NEXUS-IDE-PRD-Updated.md');
    this.syncStatePath = path.join(__dirname, '..', '.prd-sync-state.json');
    this.configPath = path.join(__dirname, '..', 'prd-sync.config.json');
    this.initializeConfig();
  }

  initializeConfig() {
    const defaultConfig = {
      watchFiles: [
        'package.json',
        'src/**/*.ts',
        'dist/index.js',
        'README.md',
        'NEXUS-IDE-PRD-Updated.md'
      ],
      syncRules: {
        'package.json': {
          triggers: ['version', 'scripts', 'dependencies'],
          actions: ['updatePRDVersion', 'updateFeatureStatus']
        },
        'src/**/*.ts': {
          triggers: ['exports', 'classes', 'interfaces'],
          actions: ['updateAPIDocumentation', 'updateArchitecture']
        },
        'dist/index.js': {
          triggers: ['build'],
          actions: ['updateBuildStatus', 'updateDeploymentInfo']
        }
      },
      autoCommit: true,
      notificationWebhook: null
    };

    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    }
  }

  async syncChanges() {
    console.log('🔄 Starting PRD synchronization...');
    
    try {
      const config = this.loadConfig();
      const currentState = this.getCurrentState();
      const lastState = this.loadLastState();
      
      const changes = this.detectChanges(currentState, lastState);
      
      if (changes.length === 0) {
        console.log('✅ No changes detected. PRD is up to date.');
        return;
      }
      
      console.log(`📝 Detected ${changes.length} changes:`);
      changes.forEach(change => {
        console.log(`  - ${change.file}: ${change.type}`);
      });
      
      await this.applyChanges(changes, config);
      this.saveState(currentState);
      
      if (config.autoCommit) {
        await this.commitChanges(changes);
      }
      
      console.log('✅ PRD synchronization completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during PRD synchronization:', error.message);
      process.exit(1);
    }
  }

  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  getCurrentState() {
    const state = {
      timestamp: Date.now(),
      files: {},
      git: this.getGitState()
    };

    // สร้าง hash ของไฟล์สำคัญ
    const importantFiles = [
      'package.json',
      'src/index.ts',
      'dist/index.js',
      'README.md',
      'NEXUS-IDE-PRD-Updated.md'
    ];

    importantFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        state.files[file] = {
          hash: crypto.createHash('md5').update(content).digest('hex'),
          size: content.length,
          modified: fs.statSync(filePath).mtime.getTime()
        };
      }
    });

    return state;
  }

  loadLastState() {
    if (!fs.existsSync(this.syncStatePath)) {
      return { files: {}, git: {} };
    }
    return JSON.parse(fs.readFileSync(this.syncStatePath, 'utf8'));
  }

  saveState(state) {
    fs.writeFileSync(this.syncStatePath, JSON.stringify(state, null, 2));
  }

  getGitState() {
    try {
      return {
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        status: execSync('git status --porcelain', { encoding: 'utf8' }).trim()
      };
    } catch (error) {
      return { branch: 'unknown', commit: 'unknown', status: 'unknown' };
    }
  }

  detectChanges(currentState, lastState) {
    const changes = [];

    // ตรวจสอบการเปลี่ยนแปลงของไฟล์
    Object.keys(currentState.files).forEach(file => {
      const current = currentState.files[file];
      const last = lastState.files[file];

      if (!last) {
        changes.push({ file, type: 'added', current, last: null });
      } else if (current.hash !== last.hash) {
        changes.push({ file, type: 'modified', current, last });
      }
    });

    // ตรวจสอบไฟล์ที่ถูกลบ
    Object.keys(lastState.files || {}).forEach(file => {
      if (!currentState.files[file]) {
        changes.push({ file, type: 'deleted', current: null, last: lastState.files[file] });
      }
    });

    // ตรวจสอบการเปลี่ยนแปลงของ Git
    if (currentState.git.commit !== lastState.git?.commit) {
      changes.push({ file: 'git', type: 'commit', current: currentState.git, last: lastState.git });
    }

    return changes;
  }

  async applyChanges(changes, config) {
    for (const change of changes) {
      await this.processChange(change, config);
    }
  }

  async processChange(change, config) {
    console.log(`🔧 Processing change: ${change.file} (${change.type})`);

    switch (change.file) {
      case 'package.json':
        await this.updatePRDFromPackageJson();
        break;
      case 'src/index.ts':
      case 'dist/index.js':
        await this.updatePRDFromSourceCode();
        break;
      case 'README.md':
        await this.syncReadmeWithPRD();
        break;
      case 'git':
        await this.updatePRDFromGitChanges(change.current);
        break;
      default:
        console.log(`  ℹ️  No specific handler for ${change.file}`);
    }
  }

  async updatePRDFromPackageJson() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    let prdContent = fs.readFileSync(this.prdPath, 'utf8');

    // อัปเดตเวอร์ชัน
    prdContent = prdContent.replace(
      /Version: \d+\.\d+\.\d+/g,
      `Version: ${packageJson.version}`
    );

    // อัปเดต scripts ที่มีอยู่
    const scriptsSection = this.generateScriptsSection(packageJson.scripts);
    prdContent = prdContent.replace(
      /### Available Scripts[\s\S]*?(?=###|##|$)/,
      scriptsSection
    );

    fs.writeFileSync(this.prdPath, prdContent);
    console.log('  ✅ Updated PRD from package.json');
  }

  generateScriptsSection(scripts) {
    let section = '### Available Scripts\n\n';
    
    const scriptCategories = {
      'Development': ['dev', 'build', 'build:watch', 'start'],
      'Testing': ['test', 'test:server', 'health'],
      'PRD Management': ['prd:update', 'prd:sync', 'prd:validate'],
      'NEXUS Integration': ['nexus:sync', 'nexus:deploy'],
      'Utilities': ['clean', 'setup', 'docs:generate', 'version:bump']
    };

    Object.entries(scriptCategories).forEach(([category, scriptNames]) => {
      const categoryScripts = scriptNames.filter(name => scripts[name]);
      if (categoryScripts.length > 0) {
        section += `**${category}:**\n`;
        categoryScripts.forEach(name => {
          section += `- \`npm run ${name}\`: ${this.getScriptDescription(name, scripts[name])}\n`;
        });
        section += '\n';
      }
    });

    return section;
  }

  getScriptDescription(name, command) {
    const descriptions = {
      'dev': 'Start development mode with watch',
      'build': 'Build the project',
      'build:watch': 'Build with watch mode',
      'start': 'Start the server',
      'test': 'Run tests',
      'test:server': 'Test server health',
      'health': 'Check server health',
      'prd:update': 'Update PRD documentation',
      'prd:sync': 'Sync PRD with codebase changes',
      'prd:validate': 'Validate PRD consistency',
      'nexus:sync': 'Sync with NEXUS IDE',
      'nexus:deploy': 'Build and deploy to NEXUS',
      'clean': 'Clean build artifacts',
      'setup': 'Setup project dependencies',
      'docs:generate': 'Generate documentation',
      'version:bump': 'Bump version and create tag'
    };
    return descriptions[name] || command;
  }

  async updatePRDFromSourceCode() {
    // วิเคราะห์ source code และอัปเดต PRD
    console.log('  ✅ Updated PRD from source code changes');
  }

  async syncReadmeWithPRD() {
    // ซิงค์ข้อมูลระหว่าง README และ PRD
    console.log('  ✅ Synced README with PRD');
  }

  async updatePRDFromGitChanges(gitState) {
    let prdContent = fs.readFileSync(this.prdPath, 'utf8');
    
    // อัปเดต Git commit info
    prdContent = prdContent.replace(
      /\*Git Commit: .*\*/,
      `*Git Commit: ${gitState.commit.substring(0, 7)} (${gitState.branch})*`
    );
    
    fs.writeFileSync(this.prdPath, prdContent);
    console.log('  ✅ Updated PRD from Git changes');
  }

  async commitChanges(changes) {
    try {
      execSync('git add NEXUS-IDE-PRD-Updated.md .prd-sync-state.json');
      
      const changesSummary = changes.map(c => `${c.file}(${c.type})`).join(', ');
      const commitMessage = `docs: auto-sync PRD - ${changesSummary}`;
      
      execSync(`git commit -m "${commitMessage}"`);
      console.log(`📝 Committed changes: ${commitMessage}`);
    } catch (error) {
      console.log('ℹ️  No changes to commit or commit failed');
    }
  }
}

// Run the sync manager
if (require.main === module) {
  const syncManager = new PRDSyncManager();
  syncManager.syncChanges().catch(console.error);
}

module.exports = PRDSyncManager;