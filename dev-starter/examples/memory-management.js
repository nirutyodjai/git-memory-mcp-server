#!/usr/bin/env node

/**
 * Memory Management Example
 * 
 * This example demonstrates how to use the memory management tools
 * provided by the git-memory-mcp-server.
 */

const { GitMemoryServer } = require('../dist/index.js');

async function demonstrateMemoryManagement() {
  console.log('🧠 Git Memory MCP Server - Memory Management Demo\n');
  
  const server = new GitMemoryServer();
  
  try {
    // Initialize the server
    await server.connect();
    console.log('✅ Server connected successfully\n');
    
    // Example 1: Store project information
    console.log('💾 Storing project information...');
    await server.handleMemoryStore({
      key: 'project-info',
      content: 'Git Memory MCP Server - A powerful tool for Git operations and memory management',
      metadata: {
        category: 'project',
        priority: 'high',
        tags: ['git', 'mcp', 'memory']
      }
    });
    console.log('✅ Project information stored\n');
    
    // Example 2: Store development notes
    console.log('📝 Storing development notes...');
    await server.handleMemoryStore({
      key: 'dev-notes',
      content: 'Remember to update documentation when adding new features',
      metadata: {
        category: 'notes',
        priority: 'medium',
        author: 'developer'
      }
    });
    console.log('✅ Development notes stored\n');
    
    // Example 3: Store configuration
    console.log('⚙️ Storing configuration...');
    await server.handleMemoryStore({
      key: 'config',
      content: JSON.stringify({
        maxCommits: 10,
        autoSave: true,
        theme: 'dark'
      }),
      metadata: {
        category: 'config',
        type: 'json'
      }
    });
    console.log('✅ Configuration stored\n');
    
    // Example 4: List all stored memories
    console.log('📋 Listing all stored memories...');
    const allMemories = await server.handleMemoryList();
    console.log('All memories:', JSON.stringify(allMemories, null, 2));
    console.log('');
    
    // Example 5: Retrieve specific memory
    console.log('🔍 Retrieving project information...');
    const projectInfo = await server.handleMemoryRetrieve({ key: 'project-info' });
    console.log('Project info:', JSON.stringify(projectInfo, null, 2));
    console.log('');
    
    // Example 6: Update existing memory
    console.log('✏️ Updating development notes...');
    await server.handleMemoryStore({
      key: 'dev-notes',
      content: 'Remember to update documentation and write tests when adding new features',
      metadata: {
        category: 'notes',
        priority: 'high',
        author: 'developer',
        updated: new Date().toISOString()
      }
    });
    console.log('✅ Development notes updated\n');
    
    // Example 7: Retrieve updated memory
    console.log('🔍 Retrieving updated notes...');
    const updatedNotes = await server.handleMemoryRetrieve({ key: 'dev-notes' });
    console.log('Updated notes:', JSON.stringify(updatedNotes, null, 2));
    console.log('');
    
    // Example 8: Delete a memory entry
    console.log('🗑️ Deleting configuration...');
    await server.handleMemoryDelete({ key: 'config' });
    console.log('✅ Configuration deleted\n');
    
    // Example 9: List memories after deletion
    console.log('📋 Listing memories after deletion...');
    const remainingMemories = await server.handleMemoryList();
    console.log('Remaining memories:', JSON.stringify(remainingMemories, null, 2));
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
  demonstrateMemoryManagement().catch(console.error);
}

module.exports = { demonstrateMemoryManagement };