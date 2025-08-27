#!/usr/bin/env node

/**
 * Advanced Usage Example for Git Memory MCP Server
 * 
 * This example demonstrates advanced features including:
 * - Smart commits with AI assistance
 * - Pattern analysis
 * - Memory-based insights
 * - Workflow optimization
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AdvancedGitMemoryClient {
  constructor() {
    this.server = null;
    this.requestId = 1;
  }

  async start() {
    console.log('🚀 Starting Advanced Git Memory MCP Server Demo...');
    
    this.server = spawn('node', ['../dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      console.log('Server:', data.toString());
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Server started successfully!');
    
    await this.runAdvancedExamples();
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n';
      this.server.stdin.write(requestStr);

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.server.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async runAdvancedExamples() {
    console.log('\n🧠 Running Advanced Git Memory Examples\n');

    try {
      // Example 1: Store development decisions and patterns
      await this.storeProjectKnowledge();
      
      // Example 2: Analyze repository patterns
      await this.analyzeRepositoryPatterns();
      
      // Example 3: Smart commit demonstration
      await this.demonstrateSmartCommit();
      
      // Example 4: Advanced context search
      await this.performAdvancedSearch();
      
      // Example 5: Generate project insights
      await this.generateProjectInsights();
      
      console.log('\n✅ All advanced examples completed!');
      
    } catch (error) {
      console.error('❌ Error in advanced examples:', error.message);
    }

    this.server.kill();
    console.log('\n🛑 Server stopped.');
  }

  async storeProjectKnowledge() {
    console.log('1️⃣ Storing project knowledge and decisions...');
    
    const knowledgeEntries = [
      {
        key: 'architecture-decision-microservices',
        content: 'Decided to adopt microservices architecture for better scalability and maintainability. This allows independent deployment and scaling of different services.',
        tags: ['architecture', 'microservices', 'scalability', 'decision'],
        metadata: {
          impact: 'high',
          stakeholders: ['tech-lead', 'architect', 'dev-team'],
          date: '2024-01-15',
          status: 'approved'
        }
      },
      {
        key: 'coding-standards-typescript',
        content: 'Established TypeScript coding standards including strict type checking, consistent naming conventions, and comprehensive JSDoc documentation.',
        tags: ['coding-standards', 'typescript', 'documentation', 'quality'],
        metadata: {
          impact: 'medium',
          enforcement: 'automated',
          tools: ['eslint', 'prettier', 'tsc']
        }
      },
      {
        key: 'performance-optimization-caching',
        content: 'Implemented Redis caching layer to improve API response times by 60%. Cache invalidation strategy based on data modification timestamps.',
        tags: ['performance', 'caching', 'redis', 'optimization'],
        metadata: {
          improvement: '60% faster response times',
          implementation_date: '2024-01-20',
          metrics: {
            before: '500ms avg response',
            after: '200ms avg response'
          }
        }
      }
    ];

    for (const entry of knowledgeEntries) {
      const result = await this.sendRequest('tools/call', {
        name: 'memory_store',
        arguments: entry
      });
      console.log(`   ✓ Stored: ${entry.key}`);
    }
  }

  async analyzeRepositoryPatterns() {
    console.log('\n2️⃣ Analyzing repository patterns...');
    
    const analysisTypes = [
      'commit_patterns',
      'branch_patterns', 
      'file_patterns',
      'author_patterns'
    ];

    for (const analysisType of analysisTypes) {
      try {
        const result = await this.sendRequest('tools/call', {
          name: 'pattern_analysis',
          arguments: {
            analysisType
          }
        });
        
        console.log(`   📊 ${analysisType.replace('_', ' ').toUpperCase()}:`);
        const analysis = JSON.parse(result.result?.content?.[0]?.text || '{}');
        
        if (analysis.summary) {
          console.log(`      Summary: ${analysis.summary}`);
        }
        if (analysis.patterns && analysis.patterns.length > 0) {
          console.log(`      Top patterns: ${analysis.patterns.slice(0, 3).join(', ')}`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Could not analyze ${analysisType}: ${error.message}`);
      }
    }
  }

  async demonstrateSmartCommit() {
    console.log('\n3️⃣ Demonstrating smart commit (simulation)...');
    
    // Note: This would normally create an actual commit
    // For demo purposes, we'll show what a smart commit would do
    
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'smart_commit',
        arguments: {
          userMessage: 'Improve caching performance',
          addAll: false // Don't actually commit in demo
        }
      });
      
      console.log('   🤖 Smart commit analysis:');
      const commitInfo = result.result?.content?.[0]?.text;
      if (commitInfo) {
        console.log(`      ${commitInfo}`);
      } else {
        console.log('      Smart commit would analyze changes and suggest improvements');
      }
      
    } catch (error) {
      console.log(`   ℹ️  Smart commit simulation: ${error.message}`);
      console.log('      (This is expected in demo mode)');
    }
  }

  async performAdvancedSearch() {
    console.log('\n4️⃣ Performing advanced context search...');
    
    const searchQueries = [
      'architecture decisions microservices',
      'performance optimization caching',
      'typescript coding standards',
      'scalability improvements'
    ];

    for (const query of searchQueries) {
      try {
        const result = await this.sendRequest('tools/call', {
          name: 'context_search',
          arguments: {
            query,
            includeCommits: true,
            includeMemory: true
          }
        });
        
        console.log(`   🔍 Search: "${query}"`);
        const searchResults = result.result?.content?.[0]?.text;
        if (searchResults) {
          const results = JSON.parse(searchResults);
          console.log(`      Found ${results.total_results || 0} relevant items`);
          if (results.insights && results.insights.length > 0) {
            console.log(`      Key insight: ${results.insights[0]}`);
          }
        }
        
      } catch (error) {
        console.log(`   ⚠️  Search failed for "${query}": ${error.message}`);
      }
    }
  }

  async generateProjectInsights() {
    console.log('\n5️⃣ Generating project insights...');
    
    // Search for all stored memories to generate insights
    try {
      const allMemories = await this.sendRequest('tools/call', {
        name: 'memory_search',
        arguments: {
          query: 'project development architecture performance',
          limit: 20
        }
      });
      
      console.log('   📈 Project Insights Generated:');
      console.log('      • Architecture: Microservices adoption improving scalability');
      console.log('      • Performance: Caching implementation showing 60% improvement');
      console.log('      • Code Quality: TypeScript standards enforced with automation');
      console.log('      • Development Patterns: Consistent commit messaging and branching');
      
      // Store the insights as a new memory entry
      await this.sendRequest('tools/call', {
        name: 'memory_store',
        arguments: {
          key: 'project-insights-summary',
          content: 'Project showing strong architectural decisions with measurable performance improvements. Development practices are well-established with good tooling support.',
          tags: ['insights', 'summary', 'project-health'],
          metadata: {
            generated_at: new Date().toISOString(),
            confidence: 'high',
            data_points: 3
          }
        }
      });
      
      console.log('   ✓ Insights stored for future reference');
      
    } catch (error) {
      console.log(`   ⚠️  Could not generate insights: ${error.message}`);
    }
  }
}

// Run the advanced example
if (require.main === module) {
  const client = new AdvancedGitMemoryClient();
  client.start().catch(console.error);
}

module.exports = AdvancedGitMemoryClient;