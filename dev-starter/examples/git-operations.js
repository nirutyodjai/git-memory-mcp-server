#!/usr/bin/env node

/**
 * Git Operations Example
 * 
 * This example demonstrates how to use the Git operations tools
 * provided by the git-memory-mcp-server.
 */

const { GitMemoryServer } = require('../dist/index.js');

async function demonstrateGitOperations() {
  console.log('🔧 Git Memory MCP Server - Git Operations Demo\n');
  
  const server = new GitMemoryServer();
  
  try {
    // Initialize the server
    await server.connect();
    console.log('✅ Server connected successfully\n');
    
    // Example 1: Get repository status
    console.log('📊 Getting repository status...');
    const status = await server.handleGitStatus();
    console.log('Status:', status);
    console.log('');
    
    // Example 2: Get commit history (last 5 commits)
    console.log('📜 Getting last 5 commits...');
    const log = await server.handleGitLog({ maxCount: 5 });
    console.log('Recent commits:', log);
    console.log('');
    
    // Example 3: Get unstaged changes
    console.log('🔍 Checking for unstaged changes...');
    const unstagedDiff = await server.handleGitDiff({ staged: false });
    console.log('Unstaged changes:', unstagedDiff);
    console.log('');
    
    // Example 4: Get staged changes
    console.log('🔍 Checking for staged changes...');
    const stagedDiff = await server.handleGitDiff({ staged: true });
    console.log('Staged changes:', stagedDiff);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Clean up
    await server.close();
    console.log('🔌 Server disconnected');
  }
}

// Run the demo
if (require.main === module) {
  demonstrateGitOperations().catch(console.error);
}

module.exports = { demonstrateGitOperations };