#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const BatchDeployer = require('./deploy-batch');
const HealthChecker = require('./health-check');

class SystemScaler {
  constructor() {
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.deployer = new BatchDeployer();
    this.healthChecker = new HealthChecker();
    this.scalingLimits = {
      maxServersPerCategory: 100,
      maxTotalServers: 1000,
      batchSize: 50,
      healthThreshold: 80 // Minimum health percentage to continue scaling
    };
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(chalk.red('❌ Failed to load configuration:'), error.message);
      throw error;
    }
  }

  async saveConfig(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Failed to save configuration:'), error.message);
      throw error;
    }
  }

  async getCurrentSystemStatus() {
    const config = await this.loadConfig();
    
    const status = {
      totalServers: config.mcpServers ? config.mcpServers.length : 0,
      serversByCategory: {},
      healthStatus: null,
      canScale: true,
      limitations: []
    };

    // Count servers by category
    if (config.mcpServers) {
      config.mcpServers.forEach(server => {
        if (!status.serversByCategory[server.category]) {
          status.serversByCategory[server.category] = 0;
        }
        status.serversByCategory[server.category]++;
      });
    }

    // Check health status
    try {
      const healthResults = await this.healthChecker.checkAllServers();
      status.healthStatus = {
        healthy: healthResults.results.healthy.length,
        total: healthResults.results.total,
        percentage: parseFloat(healthResults.summary.healthPercentage)
      };
      
      if (status.healthStatus.percentage < this.scalingLimits.healthThreshold) {
        status.canScale = false;
        status.limitations.push(`System health (${status.healthStatus.percentage}%) below threshold (${this.scalingLimits.healthThreshold}%)`);
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not check system health:'), error.message);
      status.healthStatus = { error: error.message };
    }

    // Check scaling limitations
    if (status.totalServers >= this.scalingLimits.maxTotalServers) {
      status.canScale = false;
      status.limitations.push(`Maximum total servers reached (${this.scalingLimits.maxTotalServers})`);
    }

    return status;
  }

  async scaleCategory(category, targetCount, options = {}) {
    console.log(chalk.blue(`🚀 Scaling category '${category}' to ${targetCount} servers...`));
    
    const config = await this.loadConfig();
    const currentServers = config.mcpServers ? 
      config.mcpServers.filter(s => s.category === category) : [];
    const currentCount = currentServers.length;
    
    if (targetCount <= currentCount) {
      console.log(chalk.yellow(`⚠️  Target count (${targetCount}) is not greater than current count (${currentCount})`));
      return { success: false, message: 'No scaling needed' };
    }

    const serversToAdd = targetCount - currentCount;
    
    // Check if category exists
    if (!config.categories[category]) {
      throw new Error(`Category '${category}' not found in configuration`);
    }

    // Check category limits
    if (targetCount > this.scalingLimits.maxServersPerCategory) {
      throw new Error(`Target count exceeds maximum servers per category (${this.scalingLimits.maxServersPerCategory})`);
    }

    // Check total system limits
    const totalServersAfterScaling = (config.mcpServers ? config.mcpServers.length : 0) + serversToAdd;
    if (totalServersAfterScaling > this.scalingLimits.maxTotalServers) {
      throw new Error(`Scaling would exceed maximum total servers (${this.scalingLimits.maxTotalServers})`);
    }

    console.log(chalk.cyan(`📊 Current: ${currentCount} servers, Adding: ${serversToAdd} servers`));
    
    // Deploy in batches
    const batchSize = options.batchSize || this.scalingLimits.batchSize;
    const batches = Math.ceil(serversToAdd / batchSize);
    
    let deployedCount = 0;
    const results = {
      success: true,
      deployedServers: [],
      failedDeployments: [],
      healthChecks: []
    };

    for (let batch = 0; batch < batches; batch++) {
      const remainingServers = serversToAdd - deployedCount;
      const currentBatchSize = Math.min(batchSize, remainingServers);
      
      console.log(chalk.blue(`\n📦 Deploying batch ${batch + 1}/${batches} (${currentBatchSize} servers)...`));
      
      try {
        // Deploy batch
        const batchResult = await this.deployer.deployBatch(category, currentBatchSize);
        
        if (batchResult.success) {
          deployedCount += currentBatchSize;
          results.deployedServers.push(...batchResult.deployedServers);
          
          console.log(chalk.green(`✅ Batch ${batch + 1} deployed successfully`));
          
          // Health check after each batch (if enabled)
          if (options.healthCheckAfterBatch !== false) {
            console.log(chalk.cyan('🏥 Running health check...'));
            
            // Wait a moment for servers to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const healthResult = await this.healthChecker.checkAllServers(category);
              results.healthChecks.push({
                batch: batch + 1,
                result: healthResult.summary
              });
              
              // Check if health is acceptable
              if (healthResult.summary.healthPercentage < this.scalingLimits.healthThreshold) {
                console.log(chalk.red(`❌ Health check failed: ${healthResult.summary.healthPercentage}% < ${this.scalingLimits.healthThreshold}%`));
                
                if (options.stopOnHealthFailure !== false) {
                  results.success = false;
                  results.message = `Scaling stopped due to health check failure after batch ${batch + 1}`;
                  break;
                }
              } else {
                console.log(chalk.green(`✅ Health check passed: ${healthResult.summary.healthPercentage}%`));
              }
            } catch (healthError) {
              console.warn(chalk.yellow('⚠️  Health check failed:'), healthError.message);
            }
          }
          
          // Wait between batches (if specified)
          if (options.delayBetweenBatches && batch < batches - 1) {
            console.log(chalk.gray(`⏳ Waiting ${options.delayBetweenBatches}ms before next batch...`));
            await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
          }
          
        } else {
          console.error(chalk.red(`❌ Batch ${batch + 1} deployment failed:`, batchResult.error));
          results.failedDeployments.push({
            batch: batch + 1,
            error: batchResult.error
          });
          
          if (options.stopOnFailure !== false) {
            results.success = false;
            results.message = `Scaling stopped due to deployment failure in batch ${batch + 1}`;
            break;
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error in batch ${batch + 1}:`), error.message);
        results.failedDeployments.push({
          batch: batch + 1,
          error: error.message
        });
        
        if (options.stopOnFailure !== false) {
          results.success = false;
          results.message = `Scaling stopped due to error in batch ${batch + 1}: ${error.message}`;
          break;
        }
      }
    }

    // Final summary
    console.log(chalk.blue('\n📋 Scaling Summary:'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log(chalk.green(`✅ Successfully deployed: ${results.deployedServers.length} servers`));
    
    if (results.failedDeployments.length > 0) {
      console.log(chalk.red(`❌ Failed deployments: ${results.failedDeployments.length}`));
    }
    
    const finalCount = currentCount + results.deployedServers.length;
    console.log(chalk.blue(`📊 Final count for '${category}': ${finalCount} servers`));
    
    return results;
  }

  async scaleToTarget(targetDistribution, options = {}) {
    console.log(chalk.blue('🎯 Scaling system to target distribution...'));
    
    const config = await this.loadConfig();
    const results = {
      success: true,
      categoryResults: {},
      totalDeployed: 0,
      errors: []
    };

    // Validate target distribution
    const totalTargetServers = Object.values(targetDistribution).reduce((sum, count) => sum + count, 0);
    if (totalTargetServers > this.scalingLimits.maxTotalServers) {
      throw new Error(`Target distribution exceeds maximum total servers (${this.scalingLimits.maxTotalServers})`);
    }

    console.log(chalk.cyan(`📊 Target distribution: ${JSON.stringify(targetDistribution)}`));
    console.log(chalk.cyan(`📊 Total target servers: ${totalTargetServers}`));

    // Scale each category
    for (const [category, targetCount] of Object.entries(targetDistribution)) {
      if (!config.categories[category]) {
        console.warn(chalk.yellow(`⚠️  Category '${category}' not found, skipping...`));
        continue;
      }

      try {
        console.log(chalk.blue(`\n🔄 Processing category: ${category}`));
        
        const categoryResult = await this.scaleCategory(category, targetCount, options);
        results.categoryResults[category] = categoryResult;
        
        if (categoryResult.success) {
          results.totalDeployed += categoryResult.deployedServers.length;
        } else {
          results.success = false;
          results.errors.push(`${category}: ${categoryResult.message || 'Unknown error'}`);
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Error scaling category '${category}':`), error.message);
        results.success = false;
        results.errors.push(`${category}: ${error.message}`);
        results.categoryResults[category] = {
          success: false,
          error: error.message
        };
      }
    }

    // Final system status
    console.log(chalk.blue('\n🏁 Final System Status:'));
    console.log(chalk.gray('=' .repeat(50)));
    
    const finalStatus = await this.getCurrentSystemStatus();
    console.log(chalk.blue(`📊 Total servers: ${finalStatus.totalServers}`));
    
    if (finalStatus.healthStatus && !finalStatus.healthStatus.error) {
      console.log(chalk.blue(`🏥 System health: ${finalStatus.healthStatus.percentage}%`));
    }
    
    console.log(chalk.cyan('📂 Servers by category:'));
    Object.entries(finalStatus.serversByCategory).forEach(([cat, count]) => {
      console.log(chalk.gray(`  ${cat}: ${count} servers`));
    });

    return results;
  }

  async autoScale(options = {}) {
    console.log(chalk.blue('🤖 Starting automatic scaling...'));
    
    const config = await this.loadConfig();
    const currentStatus = await this.getCurrentSystemStatus();
    
    if (!currentStatus.canScale) {
      console.log(chalk.red('❌ Cannot scale system:'));
      currentStatus.limitations.forEach(limitation => {
        console.log(chalk.red(`  • ${limitation}`));
      });
      return { success: false, limitations: currentStatus.limitations };
    }

    // Determine scaling strategy based on current state
    const targetDistribution = {};
    const categoriesWithServers = Object.keys(currentStatus.serversByCategory);
    
    if (categoriesWithServers.length === 0) {
      // No servers yet, start with initial distribution
      console.log(chalk.cyan('📋 No servers found, starting with initial distribution...'));
      
      const initialCategories = ['database', 'filesystem', 'api', 'ai-ml', 'version-control'];
      initialCategories.forEach(category => {
        if (config.categories[category]) {
          targetDistribution[category] = this.scalingLimits.batchSize;
        }
      });
    } else {
      // Scale existing categories
      console.log(chalk.cyan('📋 Scaling existing categories...'));
      
      categoriesWithServers.forEach(category => {
        const currentCount = currentStatus.serversByCategory[category];
        const targetCount = Math.min(
          currentCount + this.scalingLimits.batchSize,
          this.scalingLimits.maxServersPerCategory
        );
        
        if (targetCount > currentCount) {
          targetDistribution[category] = targetCount;
        }
      });
      
      // Add new categories if we haven't reached the limit
      if (currentStatus.totalServers < 500) {
        const availableCategories = Object.keys(config.categories)
          .filter(cat => !categoriesWithServers.includes(cat));
        
        if (availableCategories.length > 0) {
          const nextCategory = availableCategories[0];
          targetDistribution[nextCategory] = this.scalingLimits.batchSize;
          console.log(chalk.cyan(`➕ Adding new category: ${nextCategory}`));
        }
      }
    }

    if (Object.keys(targetDistribution).length === 0) {
      console.log(chalk.yellow('⚠️  No scaling needed or possible'));
      return { success: true, message: 'No scaling needed' };
    }

    return await this.scaleToTarget(targetDistribution, {
      healthCheckAfterBatch: true,
      stopOnHealthFailure: true,
      delayBetweenBatches: 3000,
      ...options
    });
  }

  async scaleToMilestone(milestone, options = {}) {
    console.log(chalk.blue(`🎯 Scaling to milestone: ${milestone} servers`));
    
    const validMilestones = [50, 100, 250, 500, 1000];
    if (!validMilestones.includes(milestone)) {
      throw new Error(`Invalid milestone. Valid milestones: ${validMilestones.join(', ')}`);
    }

    const config = await this.loadConfig();
    const currentStatus = await this.getCurrentSystemStatus();
    
    if (currentStatus.totalServers >= milestone) {
      console.log(chalk.yellow(`⚠️  Already at or above milestone (${currentStatus.totalServers} >= ${milestone})`));
      return { success: true, message: 'Milestone already reached' };
    }

    // Calculate distribution for milestone
    const categories = Object.keys(config.categories);
    const serversPerCategory = Math.floor(milestone / categories.length);
    const remainder = milestone % categories.length;
    
    const targetDistribution = {};
    categories.forEach((category, index) => {
      targetDistribution[category] = serversPerCategory + (index < remainder ? 1 : 0);
    });

    console.log(chalk.cyan(`📊 Milestone distribution for ${milestone} servers:`));
    Object.entries(targetDistribution).forEach(([cat, count]) => {
      console.log(chalk.gray(`  ${cat}: ${count} servers`));
    });

    return await this.scaleToTarget(targetDistribution, {
      healthCheckAfterBatch: true,
      stopOnHealthFailure: false, // Continue even if some batches fail
      delayBetweenBatches: 2000,
      ...options
    });
  }

  printSystemStatus(status) {
    console.log(chalk.blue('\n📊 Current System Status:'));
    console.log(chalk.gray('=' .repeat(50)));
    
    console.log(chalk.blue(`📊 Total servers: ${status.totalServers}`));
    
    if (status.healthStatus && !status.healthStatus.error) {
      const healthColor = status.healthStatus.percentage >= 80 ? 'green' : 
                         status.healthStatus.percentage >= 60 ? 'yellow' : 'red';
      console.log(chalk[healthColor](`🏥 System health: ${status.healthStatus.percentage}% (${status.healthStatus.healthy}/${status.healthStatus.total})`));
    }
    
    console.log(chalk.cyan('📂 Servers by category:'));
    Object.entries(status.serversByCategory).forEach(([category, count]) => {
      console.log(chalk.gray(`  ${category}: ${count} servers`));
    });
    
    console.log(chalk.blue(`🚀 Can scale: ${status.canScale ? 'Yes' : 'No'}`));
    
    if (status.limitations.length > 0) {
      console.log(chalk.red('⚠️  Limitations:'));
      status.limitations.forEach(limitation => {
        console.log(chalk.red(`  • ${limitation}`));
      });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const scaler = new SystemScaler();
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(chalk.yellow('Usage: node scale-system.js <command> [options]'));
    console.log(chalk.gray('\nCommands:'));
    console.log(chalk.gray('  status                     Show current system status'));
    console.log(chalk.gray('  auto                       Automatic scaling'));
    console.log(chalk.gray('  milestone <number>         Scale to milestone (50, 100, 250, 500, 1000)'));
    console.log(chalk.gray('  category <name> <count>    Scale specific category'));
    console.log(chalk.gray('\nOptions:'));
    console.log(chalk.gray('  --batch-size <number>      Batch size for deployment (default: 50)'));
    console.log(chalk.gray('  --no-health-check          Skip health checks'));
    console.log(chalk.gray('  --continue-on-failure      Continue even if batches fail'));
    console.log(chalk.gray('  --delay <ms>               Delay between batches in milliseconds'));
    process.exit(0);
  }
  
  const command = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--batch-size') {
      options.batchSize = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--no-health-check') {
      options.healthCheckAfterBatch = false;
    } else if (arg === '--continue-on-failure') {
      options.stopOnFailure = false;
      options.stopOnHealthFailure = false;
    } else if (arg === '--delay') {
      options.delayBetweenBatches = parseInt(args[i + 1]);
      i++;
    }
  }
  
  async function executeCommand() {
    try {
      switch (command) {
        case 'status':
          const status = await scaler.getCurrentSystemStatus();
          scaler.printSystemStatus(status);
          break;
          
        case 'auto':
          const autoResult = await scaler.autoScale(options);
          console.log(chalk.blue('\n🏁 Auto-scaling completed'));
          console.log(autoResult.success ? chalk.green('✅ Success') : chalk.red('❌ Failed'));
          break;
          
        case 'milestone':
          const milestone = parseInt(args[1]);
          if (isNaN(milestone)) {
            throw new Error('Milestone must be a number');
          }
          
          const milestoneResult = await scaler.scaleToMilestone(milestone, options);
          console.log(chalk.blue('\n🏁 Milestone scaling completed'));
          console.log(milestoneResult.success ? chalk.green('✅ Success') : chalk.red('❌ Failed'));
          break;
          
        case 'category':
          const category = args[1];
          const targetCount = parseInt(args[2]);
          
          if (!category || isNaN(targetCount)) {
            throw new Error('Usage: category <name> <count>');
          }
          
          const categoryResult = await scaler.scaleCategory(category, targetCount, options);
          console.log(chalk.blue('\n🏁 Category scaling completed'));
          console.log(categoryResult.success ? chalk.green('✅ Success') : chalk.red('❌ Failed'));
          break;
          
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  }
  
  executeCommand();
}

module.exports = SystemScaler;