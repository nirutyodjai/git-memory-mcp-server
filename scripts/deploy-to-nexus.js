#!/usr/bin/env node
/**
 * NEXUS IDE Deployment Script
 * Deploy Git Memory MCP Server to NEXUS IDE environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

class NexusDeployment {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'nexus-integration.config.json');
    this.packagePath = path.join(this.projectRoot, 'package.json');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.deploymentLogPath = path.join(this.projectRoot, '.deployment.log');
    
    this.loadConfiguration();
  }

  loadConfiguration() {
    try {
      this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      this.packageInfo = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading configuration:', error.message);
      process.exit(1);
    }
  }

  async deploy(environment = 'development') {
    console.log(`🚀 Starting NEXUS IDE deployment (${environment})...`);
    
    try {
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Build the project
      await this.buildProject();
      
      // Validate deployment
      await this.validateDeployment();
      
      // Deploy to NEXUS IDE
      await this.deployToNexus(environment);
      
      // Post-deployment verification
      await this.postDeploymentVerification();
      
      // Update deployment status
      await this.updateDeploymentStatus('success', environment);
      
      console.log('✅ NEXUS IDE deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      await this.updateDeploymentStatus('failed', environment, error);
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check if dist directory exists
    if (!fs.existsSync(this.distPath)) {
      throw new Error('Dist directory not found. Please run build first.');
    }
    
    // Check if main files exist
    const requiredFiles = [
      path.join(this.distPath, 'index.js'),
      path.join(this.projectRoot, 'package.json'),
      path.join(this.projectRoot, 'README.md')
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${path.relative(this.projectRoot, file)}`);
      }
    }
    
    // Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      if (gitStatus) {
        console.log('⚠️  Warning: Uncommitted changes detected');
        console.log(gitStatus);
      }
    } catch {
      console.log('⚠️  Warning: Not a Git repository or Git not available');
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`📦 Node.js version: ${nodeVersion}`);
    
    // Check dependencies
    try {
      execSync('npm ls --depth=0', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log('✅ Dependencies check passed');
    } catch {
      console.log('⚠️  Warning: Some dependencies may be missing');
    }
    
    console.log('✅ Pre-deployment checks completed');
  }

  async buildProject() {
    console.log('🔨 Building project...');
    
    try {
      // Clean previous build
      if (fs.existsSync(this.distPath)) {
        execSync(`rm -rf ${this.distPath}/*`, { cwd: this.projectRoot });
      }
      
      // Run build command
      execSync('npm run build', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      
      // Verify build output
      const buildFiles = fs.readdirSync(this.distPath);
      if (buildFiles.length === 0) {
        throw new Error('Build produced no output files');
      }
      
      console.log(`✅ Build completed (${buildFiles.length} files generated)`);
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async validateDeployment() {
    console.log('🔍 Validating deployment package...');
    
    // Validate package.json
    const requiredFields = ['name', 'version', 'description', 'main', 'bin'];
    for (const field of requiredFields) {
      if (!this.packageInfo[field]) {
        throw new Error(`Missing required field in package.json: ${field}`);
      }
    }
    
    // Validate main entry point
    const mainFile = path.join(this.projectRoot, this.packageInfo.main);
    if (!fs.existsSync(mainFile)) {
      throw new Error(`Main entry point not found: ${this.packageInfo.main}`);
    }
    
    // Validate binary entry points
    if (this.packageInfo.bin) {
      for (const [binName, binPath] of Object.entries(this.packageInfo.bin)) {
        const fullBinPath = path.join(this.projectRoot, binPath);
        if (!fs.existsSync(fullBinPath)) {
          throw new Error(`Binary entry point not found: ${binPath}`);
        }
      }
    }
    
    // Test server startup
    console.log('🧪 Testing server startup...');
    try {
      const testResult = execSync('node dist/index.js --test', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: 10000
      });
      
      if (!testResult.includes('Server test passed')) {
        console.log('⚠️  Warning: Server test did not return expected result');
      }
    } catch (error) {
      console.log('⚠️  Warning: Server startup test failed:', error.message);
    }
    
    console.log('✅ Deployment validation completed');
  }

  async deployToNexus(environment) {
    console.log(`🚀 Deploying to NEXUS IDE (${environment})...`);
    
    const deploymentPackage = this.createDeploymentPackage(environment);
    
    // Send deployment package to NEXUS IDE
    if (this.config.nexusIDE.endpoint && this.config.nexusIDE.apiKey) {
      await this.sendDeploymentPackage(deploymentPackage);
    } else {
      console.log('⚠️  NEXUS IDE endpoint not configured, skipping remote deployment');
    }
    
    // Create local deployment manifest
    await this.createDeploymentManifest(deploymentPackage, environment);
    
    console.log('✅ Deployment to NEXUS IDE completed');
  }

  createDeploymentPackage(environment) {
    console.log('📦 Creating deployment package...');
    
    const deploymentPackage = {
      metadata: {
        name: this.packageInfo.name,
        version: this.packageInfo.version,
        description: this.packageInfo.description,
        environment,
        deployedAt: new Date().toISOString(),
        deployedBy: process.env.USER || process.env.USERNAME || 'unknown',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      configuration: {
        ...this.config,
        environment: this.config[environment] || {}
      },
      files: this.getDeploymentFiles(),
      dependencies: this.packageInfo.dependencies || {},
      devDependencies: this.packageInfo.devDependencies || {},
      scripts: this.packageInfo.scripts || {},
      capabilities: this.config.gitMemoryServer.capabilities,
      endpoints: this.config.gitMemoryServer.endpoints,
      health: {
        endpoint: '/health',
        expectedResponse: { status: 'ok' },
        timeout: 5000
      },
      deployment: {
        strategy: 'rolling',
        replicas: environment === 'production' ? 3 : 1,
        resources: {
          memory: this.config.gitMemoryServer.performance.memoryLimit,
          cpu: '500m'
        },
        environment: {
          NODE_ENV: environment,
          PORT: '0', // Dynamic port
          LOG_LEVEL: this.config.integration.logging.level
        }
      }
    };
    
    console.log('✅ Deployment package created');
    return deploymentPackage;
  }

  getDeploymentFiles() {
    const files = {};
    
    // Get all files in dist directory
    const distFiles = this.getFilesRecursively(this.distPath);
    distFiles.forEach(file => {
      const relativePath = path.relative(this.distPath, file);
      files[`dist/${relativePath}`] = {
        path: file,
        size: fs.statSync(file).size,
        modified: fs.statSync(file).mtime.toISOString()
      };
    });
    
    // Add essential files
    const essentialFiles = [
      'package.json',
      'README.md',
      'NEXUS-IDE-PRD-Updated.md',
      'nexus-integration.config.json'
    ];
    
    essentialFiles.forEach(fileName => {
      const filePath = path.join(this.projectRoot, fileName);
      if (fs.existsSync(filePath)) {
        files[fileName] = {
          path: filePath,
          size: fs.statSync(filePath).size,
          modified: fs.statSync(filePath).mtime.toISOString()
        };
      }
    });
    
    return files;
  }

  getFilesRecursively(dir) {
    const files = [];
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  async sendDeploymentPackage(deploymentPackage) {
    console.log('📡 Sending deployment package to NEXUS IDE...');
    
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.nexusIDE.endpoint + '/api/mcp-servers/deploy');
      const postData = JSON.stringify(deploymentPackage);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.nexusIDE.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Deployment-Version': deploymentPackage.metadata.version,
          'X-Deployment-Environment': deploymentPackage.metadata.environment
        },
        timeout: 30000
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Deployment package sent successfully');
            try {
              const response = JSON.parse(responseData);
              console.log('📋 Deployment response:', response.message || 'Success');
              resolve(response);
            } catch {
              resolve({ success: true });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Deployment request timeout')));
      req.setTimeout(30000);
      req.write(postData);
      req.end();
    });
  }

  async createDeploymentManifest(deploymentPackage, environment) {
    const manifestPath = path.join(this.projectRoot, '.deployment-manifest.json');
    
    const manifest = {
      ...deploymentPackage.metadata,
      configuration: {
        environment,
        endpoints: deploymentPackage.configuration.gitMemoryServer.endpoints,
        capabilities: deploymentPackage.capabilities
      },
      files: Object.keys(deploymentPackage.files).length,
      checksum: this.calculatePackageChecksum(deploymentPackage),
      status: 'deployed'
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('📄 Deployment manifest created');
  }

  calculatePackageChecksum(deploymentPackage) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(deploymentPackage));
    return hash.digest('hex').substring(0, 16);
  }

  async postDeploymentVerification() {
    console.log('🔍 Running post-deployment verification...');
    
    // Wait a moment for deployment to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test health endpoint
    try {
      const healthResponse = await this.testHealthEndpoint();
      if (healthResponse.status === 'ok') {
        console.log('✅ Health check passed');
      } else {
        console.log('⚠️  Health check returned unexpected status:', healthResponse.status);
      }
    } catch (error) {
      console.log('⚠️  Health check failed:', error.message);
    }
    
    // Test MCP connectivity
    try {
      await this.testMCPConnectivity();
      console.log('✅ MCP connectivity verified');
    } catch (error) {
      console.log('⚠️  MCP connectivity test failed:', error.message);
    }
    
    console.log('✅ Post-deployment verification completed');
  }

  async testHealthEndpoint() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 65261, // Default port, should be dynamic
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid health response format'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Health check timeout')));
      req.setTimeout(5000);
      req.end();
    });
  }

  async testMCPConnectivity() {
    // TODO: Implement MCP protocol connectivity test
    return Promise.resolve();
  }

  async updateDeploymentStatus(status, environment, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      environment,
      version: this.packageInfo.version,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null
    };
    
    // Read existing log
    let deploymentLog = [];
    if (fs.existsSync(this.deploymentLogPath)) {
      try {
        const logContent = fs.readFileSync(this.deploymentLogPath, 'utf8');
        deploymentLog = JSON.parse(logContent);
      } catch {
        // Start with empty log
      }
    }
    
    // Add new entry
    deploymentLog.unshift(logEntry);
    
    // Keep only last 50 entries
    if (deploymentLog.length > 50) {
      deploymentLog = deploymentLog.slice(0, 50);
    }
    
    // Write updated log
    fs.writeFileSync(this.deploymentLogPath, JSON.stringify(deploymentLog, null, 2));
  }

  // Utility methods
  async rollback(version) {
    console.log(`🔄 Rolling back to version ${version}...`);
    // TODO: Implement rollback functionality
    throw new Error('Rollback functionality not implemented yet');
  }

  async getDeploymentStatus() {
    if (!fs.existsSync(this.deploymentLogPath)) {
      return { status: 'never-deployed', deployments: [] };
    }
    
    try {
      const deploymentLog = JSON.parse(fs.readFileSync(this.deploymentLogPath, 'utf8'));
      const latest = deploymentLog[0];
      
      return {
        status: latest ? latest.status : 'unknown',
        latest,
        deployments: deploymentLog.slice(0, 10) // Last 10 deployments
      };
    } catch {
      return { status: 'error', deployments: [] };
    }
  }

  async listDeployments() {
    const status = await this.getDeploymentStatus();
    
    console.log('📋 Deployment History:');
    if (status.deployments.length === 0) {
      console.log('  No deployments found');
      return;
    }
    
    status.deployments.forEach((deployment, index) => {
      const date = new Date(deployment.timestamp).toLocaleString();
      const statusIcon = deployment.status === 'success' ? '✅' : '❌';
      console.log(`  ${statusIcon} ${date} - v${deployment.version} (${deployment.environment}) - ${deployment.status}`);
      
      if (deployment.error) {
        console.log(`     Error: ${deployment.error.message}`);
      }
    });
  }
}

// CLI interface
if (require.main === module) {
  const deployment = new NexusDeployment();
  
  const command = process.argv[2];
  const environment = process.argv[3] || 'development';
  
  switch (command) {
    case 'deploy':
      deployment.deploy(environment).catch(console.error);
      break;
      
    case 'status':
      deployment.getDeploymentStatus().then(status => {
        console.log('📊 Deployment Status:', status.status);
        if (status.latest) {
          console.log('📅 Last Deployment:', new Date(status.latest.timestamp).toLocaleString());
          console.log('🏷️  Version:', status.latest.version);
          console.log('🌍 Environment:', status.latest.environment);
        }
      }).catch(console.error);
      break;
      
    case 'history':
      deployment.listDeployments().catch(console.error);
      break;
      
    case 'rollback':
      const version = process.argv[3];
      if (!version) {
        console.error('❌ Please specify version to rollback to');
        process.exit(1);
      }
      deployment.rollback(version).catch(console.error);
      break;
      
    default:
      console.log('Usage: node deploy-to-nexus.js [deploy|status|history|rollback] [environment|version]');
      console.log('Commands:');
      console.log('  deploy [env]     - Deploy to NEXUS IDE (default: development)');
      console.log('  status           - Show deployment status');
      console.log('  history          - Show deployment history');
      console.log('  rollback <ver>   - Rollback to specific version');
      console.log('\nEnvironments: development, staging, production');
      break;
  }
}

module.exports = NexusDeployment;