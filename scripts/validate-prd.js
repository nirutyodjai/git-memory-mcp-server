#!/usr/bin/env node
/**
 * PRD Validation Script
 * ตรวจสอบความถูกต้องและความสอดคล้องของ PRD
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PRDValidator {
  constructor() {
    this.prdPath = path.join(__dirname, '..', 'NEXUS-IDE-PRD-Updated.md');
    this.packagePath = path.join(__dirname, '..', 'package.json');
    this.srcPath = path.join(__dirname, '..', 'src');
    this.distPath = path.join(__dirname, '..', 'dist');
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  async validate() {
    console.log('🔍 Starting PRD validation...');
    
    try {
      // โหลดข้อมูล
      const prdContent = this.loadPRD();
      const packageInfo = this.loadPackageInfo();
      const codebaseInfo = this.analyzeCodebase();
      
      // ตรวจสอบต่างๆ
      this.validateStructure(prdContent);
      this.validateVersionConsistency(prdContent, packageInfo);
      this.validateFeatureAlignment(prdContent, codebaseInfo);
      this.validateTechnicalSpecs(prdContent, packageInfo);
      this.validateDocumentationQuality(prdContent);
      this.validateGitIntegration(prdContent);
      
      // แสดงผลลัพธ์
      this.displayResults();
      
      // ส่งคืนสถานะ
      return {
        isValid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        suggestions: this.suggestions
      };
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  loadPRD() {
    if (!fs.existsSync(this.prdPath)) {
      this.errors.push('PRD file not found');
      return '';
    }
    return fs.readFileSync(this.prdPath, 'utf8');
  }

  loadPackageInfo() {
    if (!fs.existsSync(this.packagePath)) {
      this.errors.push('package.json not found');
      return {};
    }
    return JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
  }

  analyzeCodebase() {
    const info = {
      hasSource: fs.existsSync(this.srcPath),
      hasBuild: fs.existsSync(this.distPath),
      sourceFiles: [],
      exports: [],
      classes: [],
      interfaces: []
    };

    if (info.hasSource) {
      try {
        const files = this.getFilesRecursively(this.srcPath, '.ts');
        info.sourceFiles = files;
        
        // วิเคราะห์ exports, classes, interfaces
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          info.exports.push(...this.extractExports(content));
          info.classes.push(...this.extractClasses(content));
          info.interfaces.push(...this.extractInterfaces(content));
        });
      } catch (error) {
        this.warnings.push(`Failed to analyze source code: ${error.message}`);
      }
    }

    return info;
  }

  getFilesRecursively(dir, extension) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  extractExports(content) {
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|interface|const|let|var)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  extractClasses(content) {
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    return classes;
  }

  extractInterfaces(content) {
    const interfaces = [];
    const interfaceRegex = /interface\s+(\w+)/g;
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      interfaces.push(match[1]);
    }
    return interfaces;
  }

  validateStructure(prdContent) {
    console.log('📋 Validating PRD structure...');
    
    const requiredSections = [
      '# 🚀 NEXUS IDE - Product Requirements Document',
      '## 📋 Executive Summary',
      '## 🎯 Product Vision & Goals',
      '## 🏗️ System Architecture',
      '## 🎨 Core Features & Requirements',
      '## 🚀 Technical Requirements'
    ];

    requiredSections.forEach(section => {
      if (!prdContent.includes(section)) {
        this.errors.push(`Missing required section: ${section}`);
      }
    });

    // ตรวจสอบโครงสร้าง markdown
    const lines = prdContent.split('\n');
    let currentLevel = 0;
    
    lines.forEach((line, index) => {
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        if (level > currentLevel + 1) {
          this.warnings.push(`Heading level jump at line ${index + 1}: ${line}`);
        }
        currentLevel = level;
      }
    });
  }

  validateVersionConsistency(prdContent, packageInfo) {
    console.log('🔢 Validating version consistency...');
    
    if (!packageInfo.version) {
      this.errors.push('No version found in package.json');
      return;
    }

    // ตรวจสอบว่า PRD มีการอ้างอิงเวอร์ชันที่ถูกต้อง
    const versionMatches = prdContent.match(/version["']?\s*:?\s*["']?([\d\.]+)/gi);
    if (versionMatches) {
      versionMatches.forEach(match => {
        const version = match.match(/([\d\.]+)/)[1];
        if (version !== packageInfo.version) {
          this.warnings.push(`Version mismatch: PRD has ${version}, package.json has ${packageInfo.version}`);
        }
      });
    }
  }

  validateFeatureAlignment(prdContent, codebaseInfo) {
    console.log('🎯 Validating feature alignment...');
    
    // ตรวจสอบว่าฟีเจอร์ที่ระบุใน PRD มีการ implement จริงหรือไม่
    const featurePatterns = {
      'Git Memory MCP Server': ['GitMemoryServer', 'MCP', 'memory'],
      'Health Monitoring': ['health', 'monitor', 'status'],
      'Dynamic Port': ['port', 'dynamic', 'listen'],
      'WebSocket Support': ['websocket', 'ws', 'socket'],
      'REST API': ['express', 'fastify', 'api', 'router']
    };

    Object.entries(featurePatterns).forEach(([feature, patterns]) => {
      const mentioned = prdContent.toLowerCase().includes(feature.toLowerCase());
      const implemented = patterns.some(pattern => 
        codebaseInfo.exports.some(exp => exp.toLowerCase().includes(pattern.toLowerCase())) ||
        codebaseInfo.classes.some(cls => cls.toLowerCase().includes(pattern.toLowerCase()))
      );

      if (mentioned && !implemented) {
        this.warnings.push(`Feature "${feature}" mentioned in PRD but not found in codebase`);
      } else if (!mentioned && implemented) {
        this.suggestions.push(`Feature "${feature}" implemented but not documented in PRD`);
      }
    });
  }

  validateTechnicalSpecs(prdContent, packageInfo) {
    console.log('⚙️ Validating technical specifications...');
    
    // ตรวจสอบ dependencies
    if (packageInfo.dependencies) {
      const mentionedTech = this.extractTechnologies(prdContent);
      const actualDeps = Object.keys(packageInfo.dependencies);
      
      actualDeps.forEach(dep => {
        if (!mentionedTech.some(tech => tech.toLowerCase().includes(dep.toLowerCase()))) {
          this.suggestions.push(`Dependency "${dep}" not mentioned in technical specifications`);
        }
      });
    }

    // ตรวจสอบ Node.js version requirements
    if (packageInfo.engines && packageInfo.engines.node) {
      if (!prdContent.includes(packageInfo.engines.node)) {
        this.warnings.push(`Node.js version requirement not documented in PRD`);
      }
    }
  }

  extractTechnologies(content) {
    const techRegex = /(?:Node\.js|TypeScript|JavaScript|Express|Fastify|WebSocket|MongoDB|PostgreSQL|Redis|Docker|Kubernetes)/gi;
    return content.match(techRegex) || [];
  }

  validateDocumentationQuality(prdContent) {
    console.log('📚 Validating documentation quality...');
    
    // ตรวจสอบความยาวของเอกสาร
    const wordCount = prdContent.split(/\s+/).length;
    if (wordCount < 1000) {
      this.warnings.push(`PRD seems too short (${wordCount} words). Consider adding more details.`);
    } else if (wordCount > 10000) {
      this.warnings.push(`PRD seems very long (${wordCount} words). Consider breaking into sections.`);
    }

    // ตรวจสอบการใช้ emoji และ formatting
    const emojiCount = (prdContent.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    if (emojiCount === 0) {
      this.suggestions.push('Consider adding emojis to make the PRD more engaging');
    }

    // ตรวจสอบ code blocks
    const codeBlocks = prdContent.match(/```[\s\S]*?```/g) || [];
    if (codeBlocks.length === 0) {
      this.suggestions.push('Consider adding code examples to illustrate technical concepts');
    }

    // ตรวจสอบ links
    const links = prdContent.match(/\[.*?\]\(.*?\)/g) || [];
    if (links.length === 0) {
      this.suggestions.push('Consider adding relevant links to external resources');
    }
  }

  validateGitIntegration(prdContent) {
    console.log('🔗 Validating Git integration...');
    
    try {
      // ตรวจสอบ Git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (gitStatus.includes('NEXUS-IDE-PRD-Updated.md')) {
        this.warnings.push('PRD has uncommitted changes');
      }

      // ตรวจสอบ last commit
      const lastCommit = execSync('git log -1 --format="%s"', { encoding: 'utf8' }).trim();
      if (!lastCommit.toLowerCase().includes('prd') && !lastCommit.toLowerCase().includes('doc')) {
        this.suggestions.push('Consider committing PRD changes with descriptive commit message');
      }

    } catch (error) {
      this.warnings.push('Unable to check Git status');
    }
  }

  displayResults() {
    console.log('\n📊 Validation Results:');
    console.log('=' .repeat(50));
    
    if (this.errors.length === 0) {
      console.log('✅ No errors found!');
    } else {
      console.log(`❌ ${this.errors.length} error(s) found:`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warning(s):`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (this.suggestions.length > 0) {
      console.log(`\n💡 ${this.suggestions.length} suggestion(s):`);
      this.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }

    console.log('\n📈 Summary:');
    console.log(`  Errors: ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
    console.log(`  Suggestions: ${this.suggestions.length}`);
    
    const score = Math.max(0, 100 - (this.errors.length * 20) - (this.warnings.length * 5));
    console.log(`  Quality Score: ${score}/100`);
    
    if (score >= 90) {
      console.log('🏆 Excellent PRD quality!');
    } else if (score >= 70) {
      console.log('👍 Good PRD quality');
    } else if (score >= 50) {
      console.log('👌 Acceptable PRD quality');
    } else {
      console.log('👎 PRD needs improvement');
    }
  }
}

// Run the validator
if (require.main === module) {
  const validator = new PRDValidator();
  validator.validate().then(result => {
    process.exit(result.isValid ? 0 : 1);
  }).catch(console.error);
}

module.exports = PRDValidator;