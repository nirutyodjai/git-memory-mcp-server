# Git Memory MCP Server

[![npm version](https://badge.fury.io/js/git-memory-mcp-server.svg)](https://badge.fury.io/js/git-memory-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful Model Context Protocol (MCP) server that combines Git repository management with intelligent memory capabilities. This innovative server provides both traditional Git operations and advanced memory features for AI assistants, making it the first of its kind to integrate version control with semantic memory management.

## 🌟 Key Features

### 🔧 Git Operations
- **Repository Management**: Complete Git repository status and information
- **Commit History**: View and analyze commit history with filtering options
- **Diff Analysis**: Show differences between commits, staged changes, and working tree
- **Branch Management**: Create, delete, list, and switch between branches
- **File Operations**: Stage files and create commits with intelligent suggestions
- **Repository Initialization**: Initialize new Git repositories

### 🧠 Memory Capabilities
- **Semantic Search**: Advanced semantic search across commit messages and code changes
- **Persistent Storage**: Long-term storage of repository patterns and insights
- **Intelligent Suggestions**: AI-powered commit message suggestions based on history
- **Pattern Recognition**: Automatic detection of branch patterns and development workflows
- **Context Preservation**: Maintain context of code changes and development decisions
- **Tagging System**: Organize memories with flexible tagging for easy retrieval

### 🚀 Integrated Features
- **Smart Commits**: Memory-enhanced Git operations with AI assistance
- **Historical Analysis**: Deep analysis of repository patterns and trends
- **Context-Aware Search**: Combined Git and memory search capabilities
- **Workflow Insights**: Generate actionable insights from development patterns
- **Automated Learning**: Continuously learn from repository activity

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git installed on your system

### Install from npm

```bash
npm install -g git-memory-mcp-server
```

### Install from source

```bash
git clone https://github.com/your-username/git-memory-mcp-server.git
cd git-memory-mcp-server
npm install
npm run build
```

## 🚀 Quick Start

### Basic Usage

```bash
# Start the server
npm start

# Or if installed globally
git-memory-mcp-server
```

### With Custom Configuration

```bash
# Set environment variables
export GIT_REPO_PATH="/path/to/your/repo"
export MEMORY_DB_PATH="./custom-memory.db"
export MAX_MEMORY_ENTRIES=20000

# Start the server
npm start
```

## ⚙️ Configuration

The server can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|----------|
| `GIT_REPO_PATH` | Path to the Git repository | Current directory |
| `MEMORY_DB_PATH` | Path to the memory database | `./memory.db` |
| `MAX_MEMORY_ENTRIES` | Maximum number of memory entries | `10000` |
| `MEMORY_SIMILARITY_THRESHOLD` | Similarity threshold for search | `0.3` |
| `AUTO_SAVE_INTERVAL` | Auto-save interval in milliseconds | `30000` |

### Configuration File

Create a `.env` file in your project root:

```env
GIT_REPO_PATH=/path/to/your/repository
MEMORY_DB_PATH=./data/memory.db
MAX_MEMORY_ENTRIES=15000
MEMORY_SIMILARITY_THRESHOLD=0.4
AUTO_SAVE_INTERVAL=60000
```

## 🛠️ Available Tools

### Git Tools

#### `git_status`
Get the current status of the Git repository.

```json
{
  "name": "git_status",
  "arguments": {
    "path": "/optional/repo/path"
  }
}
```

#### `git_log`
View commit history with optional filtering.

```json
{
  "name": "git_log",
  "arguments": {
    "path": "/repo/path",
    "maxCount": 10,
    "oneline": true
  }
}
```

#### `git_diff`
Show differences between commits, staged changes, or specific files.

```json
{
  "name": "git_diff",
  "arguments": {
    "path": "/repo/path",
    "staged": true,
    "file": "src/index.ts"
  }
}
```

#### `git_commit`
Create a new commit with the specified message.

```json
{
  "name": "git_commit",
  "arguments": {
    "message": "Add new feature",
    "path": "/repo/path",
    "addAll": true
  }
}
```

#### `git_branch`
Manage branches (list, create, delete, checkout).

```json
{
  "name": "git_branch",
  "arguments": {
    "action": "create",
    "branchName": "feature/new-feature",
    "path": "/repo/path"
  }
}
```

### Memory Tools

#### `memory_store`
Store information in memory with semantic indexing.

```json
{
  "name": "memory_store",
  "arguments": {
    "key": "feature-implementation",
    "content": "Implemented user authentication with JWT tokens",
    "tags": ["authentication", "security", "jwt"],
    "metadata": {
      "author": "developer",
      "priority": "high"
    }
  }
}
```

#### `memory_search`
Search stored memories using semantic similarity.

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "authentication implementation",
    "limit": 5,
    "tags": ["security"]
  }
}
```

#### `memory_recall`
Recall specific memory by key.

```json
{
  "name": "memory_recall",
  "arguments": {
    "key": "feature-implementation"
  }
}
```

### Integrated Tools

#### `smart_commit`
Create an AI-enhanced commit with memory-based suggestions.

```json
{
  "name": "smart_commit",
  "arguments": {
    "path": "/repo/path",
    "userMessage": "Optional user message",
    "addAll": true
  }
}
```

#### `pattern_analysis`
Analyze repository patterns using Git history and memory.

```json
{
  "name": "pattern_analysis",
  "arguments": {
    "path": "/repo/path",
    "analysisType": "commit_patterns"
  }
}
```

Available analysis types:
- `commit_patterns`: Analyze commit message patterns
- `branch_patterns`: Analyze branch naming and usage patterns
- `file_patterns`: Analyze file change patterns
- `author_patterns`: Analyze author contribution patterns

#### `context_search`
Search with combined Git and memory context.

```json
{
  "name": "context_search",
  "arguments": {
    "query": "bug fix authentication",
    "path": "/repo/path",
    "includeCommits": true,
    "includeMemory": true
  }
}
```

## 📚 Usage Examples

### Example 1: Smart Commit Workflow

```javascript
// 1. Check repository status
const status = await callTool('git_status', { path: '/my/repo' });

// 2. Create a smart commit (AI will analyze changes and suggest message)
const commit = await callTool('smart_commit', { 
  path: '/my/repo',
  addAll: true 
});

// 3. Search for similar commits in memory
const similar = await callTool('memory_search', {
  query: 'authentication bug fix',
  limit: 3
});
```

### Example 2: Repository Analysis

```javascript
// Analyze commit patterns
const commitPatterns = await callTool('pattern_analysis', {
  path: '/my/repo',
  analysisType: 'commit_patterns'
});

// Analyze branch patterns
const branchPatterns = await callTool('pattern_analysis', {
  path: '/my/repo',
  analysisType: 'branch_patterns'
});

// Get comprehensive context search
const context = await callTool('context_search', {
  query: 'performance optimization',
  includeCommits: true,
  includeMemory: true
});
```

### Example 3: Memory Management

```javascript
// Store important development decision
await callTool('memory_store', {
  key: 'architecture-decision-001',
  content: 'Decided to use microservices architecture for better scalability',
  tags: ['architecture', 'decision', 'scalability'],
  metadata: {
    date: '2024-01-15',
    impact: 'high',
    stakeholders: ['tech-lead', 'architect']
  }
});

// Search for architecture-related memories
const architectureMemories = await callTool('memory_search', {
  query: 'microservices architecture decision',
  tags: ['architecture']
});

// Recall specific decision
const decision = await callTool('memory_recall', {
  key: 'architecture-decision-001'
});
```

## 🏗️ Architecture

The Git Memory MCP Server consists of three main components:

### GitManager
Handles all Git-related operations:
- Repository status and information
- Commit operations and history
- Branch management
- Diff analysis
- File operations

### MemoryManager
Manages the intelligent memory system:
- Semantic indexing using TF-IDF
- Similarity search algorithms
- Persistent storage with JSON database
- Tag-based organization
- Metadata management

### IntegratedOperations
Combines Git and Memory capabilities:
- Smart commit message generation
- Pattern analysis across Git history and memory
- Context-aware search operations
- Workflow insights and recommendations

## 🔧 Development

### Building from Source

```bash
git clone https://github.com/your-username/git-memory-mcp-server.git
cd git-memory-mcp-server
npm install
npm run build
```

### Development Mode

```bash
npm run dev  # Starts TypeScript compiler in watch mode
```

### Testing

```bash
npm test
```

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── git-manager.ts        # Git operations manager
├── memory-manager.ts     # Memory system manager
└── integrated-operations.ts # Combined operations
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- Uses [simple-git](https://github.com/steveukx/git-js) for Git operations
- Powered by [natural](https://github.com/NaturalNode/natural) for text processing

## 📞 Support

- 📧 Email: support@git-memory-mcp.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/git-memory-mcp-server/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/git-memory-mcp-server/discussions)

## 🗺️ Roadmap

- [ ] Web UI for memory management
- [ ] Integration with popular IDEs
- [ ] Advanced AI-powered code analysis
- [ ] Team collaboration features
- [ ] Cloud synchronization
- [ ] Plugin system for extensibility

---

**Made with ❤️ by the MCP Community**