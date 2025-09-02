# Git Memory MCP Server

A Model Context Protocol (MCP) server that provides Git repository management capabilities combined with persistent memory functionality.

## Features

### Git Operations
- **git_status**: Get current repository status
- **git_log**: Retrieve commit history with configurable limits
- **git_diff**: View staged or unstaged changes
- **git_add**: Stage files for commit
- **git_commit**: Create commits with messages
- **git_push**: Push changes to remote repository
- **git_pull**: Pull changes from remote repository
- **git_branch**: List, create, or switch branches
- **git_merge**: Merge branches

### Memory Management
- **memory_store**: Store information with metadata
- **memory_retrieve**: Retrieve stored information by key
- **memory_list**: List all stored memory entries
- **memory_search**: Search through stored memories
- **memory_filter**: Filter memories by criteria
- **memory_delete**: Delete specific memory entries

## Installation

```bash
npm install -g git-memory-mcp-server
```

## Usage

### As MCP Server

Add to your MCP client configuration:

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

### Direct Usage

```bash
git-memory-mcp-server
```

## Quick Start

1. Install the package:
   ```bash
   npm install -g git-memory-mcp-server
   ```

2. Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
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

3. Restart Claude Desktop and start using Git and Memory tools!

## Examples

### Git Operations
```javascript
// Check repository status
await git_status();

// Get last 5 commits
await git_log({ maxCount: 5 });

// View unstaged changes
await git_diff({ staged: false });

// Stage files for commit
await git_add({ files: ['src/index.ts', 'README.md'] });

// Create a commit
await git_commit({ message: 'Add new features' });

// Push to remote
await git_push({ remote: 'origin', branch: 'main' });

// Pull from remote
await git_pull({ remote: 'origin', branch: 'main' });

// List branches
await git_branch();

// Create new branch
await git_branch({ create: true, name: 'feature-branch' });

// Merge branch
await git_merge({ branch: 'feature-branch' });
```

### Memory Management
```javascript
// Store project information
await memory_store({
  key: "project-notes",
  content: "This is a MCP server for Git operations",
  metadata: { category: "documentation", priority: "high", tags: ["mcp", "git"] }
});

// Retrieve stored information
const notes = await memory_retrieve({ key: "project-notes" });

// List all memories
const allMemories = await memory_list();

// Search through memories
const searchResults = await memory_search({ query: "Git operations" });

// Filter memories by criteria
const filteredMemories = await memory_filter({
  criteria: {
    type: "documentation",
    tags: ["mcp"]
  }
});

// Delete a memory
await memory_delete({ key: "project-notes" });
```

## Tools Reference

### Git Tools

#### git_status
Returns the current Git status of the repository.

#### git_log
Returns commit history.
- `maxCount` (optional): Maximum number of commits (default: 10)

#### git_diff
Returns Git diff output.
- `staged` (optional): Show staged changes if true (default: false)

#### git_add
Stages files for commit.
- `files` (optional): Array of file paths to stage (default: ['.'])

#### git_commit
Creates a commit with the specified message.
- `message` (required): Commit message

#### git_push
Pushes changes to remote repository.
- `remote` (optional): Remote name (default: 'origin')
- `branch` (optional): Branch name (default: current branch)

#### git_pull
Pulls changes from remote repository.
- `remote` (optional): Remote name (default: 'origin')
- `branch` (optional): Branch name (default: current branch)

#### git_branch
Manages Git branches.
- `create` (optional): Create new branch if true
- `name` (optional): Branch name for creation or switching
- `switch` (optional): Switch to specified branch if true

#### git_merge
Merges the specified branch into current branch.
- `branch` (required): Branch name to merge

### Memory Tools

#### memory_store
Stores information in persistent memory.
- `key` (required): Unique identifier
- `content` (required): Content to store
- `metadata` (optional): Additional metadata object

#### memory_retrieve
Retrieves stored information.
- `key` (required): Key of the entry to retrieve

#### memory_list
Lists all stored memory entries.

#### memory_search
Searches through stored memories.
- `query` (required): Search query string

#### memory_filter
Filters memories by specified criteria.
- `criteria` (required): Filter criteria object
  - `type` (optional): Filter by metadata type
  - `tags` (optional): Array of tags to filter by
  - `dateRange` (optional): Date range filter

#### memory_delete
Deletes a memory entry.


## Memory Storage

Memory entries are stored in `.git-memory.json` in the current working directory. Each entry includes:

- `id`: Unique identifier
- `content`: Stored content
- `metadata`: Additional metadata
- `timestamp`: Creation/update timestamp

## Testing

The project includes a comprehensive test suite covering all MCP tools:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/git-operations.test.ts
npm test -- tests/memory-operations.test.ts
```

### Test Coverage
- Git operations: status, log, diff, add, commit, push, pull, branch, merge
- Memory operations: store, retrieve, list, search, filter, delete
- Error handling and edge cases
- File system operations and cleanup

## Requirements

- Node.js >= 18.0.0
- Git repository (for Git operations)

## Troubleshooting

### Common Issues

**"Command not found" error:**
- Make sure you installed globally with `-g` flag
- Check if npm global bin directory is in your PATH

**Git operations not working:**
- Ensure you're in a Git repository directory
- Check if Git is installed and accessible

**Memory not persisting:**
- Verify write permissions in the current directory
- Check if `.git-memory.json` file is created

### Debug Mode

Run with debug output:
```bash
DEBUG=git-memory-mcp-server git-memory-mcp-server
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT - see [LICENSE](LICENSE) file for details.

## Repository

https://github.com/nirutyodjai/git-memory-mcp-server

## Acknowledgments

Special thanks to the **Trae IDE Team** for providing an excellent development environment that made this project possible.

## Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation