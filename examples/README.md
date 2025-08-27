# Examples

This directory contains practical examples demonstrating how to use the Git Memory MCP Server.

## Files Overview

### 1. `git-operations.js`
Demonstrates Git-related operations:
- Getting repository status
- Retrieving commit history
- Viewing staged and unstaged changes

**Usage:**
```bash
node examples/git-operations.js
```

### 2. `memory-management.js`
Shows memory management capabilities:
- Storing information with metadata
- Retrieving stored data
- Listing all memories
- Updating existing entries
- Deleting memories

**Usage:**
```bash
node examples/memory-management.js
```

### 3. `claude-desktop-config.json`
Example configuration for Claude Desktop integration:
- MCP server setup
- Environment variables
- Global shortcuts

**Usage:**
1. Copy the content to your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Restart Claude Desktop
3. The Git Memory tools will be available in your conversations

## Prerequisites

Before running the examples:

1. **Install the package:**
   ```bash
   npm install -g git-memory-mcp-server
   ```

2. **Ensure you're in a Git repository** (for git-operations.js):
   ```bash
   git init  # if not already a Git repository
   ```

3. **Node.js version:**
   - Requires Node.js >= 18.0.0

## Running Examples

### Git Operations Example
```bash
# Navigate to your project directory
cd /path/to/your/git/repository

# Run the Git operations demo
node examples/git-operations.js
```

**Expected Output:**
```
🔧 Git Memory MCP Server - Git Operations Demo

✅ Server connected successfully

📊 Getting repository status...
Status: { clean: true, files: [] }

📜 Getting last 5 commits...
Recent commits: [commit data...]
```

### Memory Management Example
```bash
# Run from any directory
node examples/memory-management.js
```

**Expected Output:**
```
🧠 Git Memory MCP Server - Memory Management Demo

✅ Server connected successfully

💾 Storing project information...
✅ Project information stored

📋 Listing all stored memories...
All memories: [memory data...]
```

## Integration Examples

### With Claude Desktop

1. **Setup Configuration:**
   ```json
   {
     "mcpServers": {
       "git-memory": {
         "command": "git-memory-mcp-server",
         "args": []
       }
     }
   }
   ```

2. **Example Prompts:**
   - "Show me the current Git status"
   - "Get the last 3 commits from this repository"
   - "Store this project requirement in memory with key 'requirements'"
   - "List all my stored memories"

### With Other MCP Clients

The server follows the standard MCP protocol and can be integrated with any MCP-compatible client:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'git-memory-mcp-server',
  args: []
});

const client = new Client({
  name: 'example-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);
```

## Troubleshooting

### Common Issues

**"Module not found" error:**
```bash
# Make sure you're running from the correct directory
cd /path/to/git-memory-mcp-server
node examples/git-operations.js
```

**Git operations failing:**
```bash
# Ensure you're in a Git repository
git status  # Should not show "not a git repository"
```

**Permission errors:**
```bash
# Check write permissions for memory storage
ls -la .git-memory.json  # Should be writable
```

### Debug Mode

Run examples with debug output:
```bash
DEBUG=git-memory-mcp-server node examples/git-operations.js
```

## Next Steps

- Explore the main [README.md](../README.md) for detailed API documentation
- Check out the [CHANGELOG.md](../CHANGELOG.md) for version history
- Consider contributing new examples or improvements

## Contributing

Want to add more examples? Please:
1. Follow the existing code style
2. Add comprehensive comments
3. Include error handling
4. Update this README with your new example
5. Submit a pull request