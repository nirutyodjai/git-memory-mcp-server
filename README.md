# Git Memory MCP Server

> A comprehensive MCP (Model Context Protocol) server for Git repository management with persistent memory capabilities and support for 500+ MCP server connections.

## 📁 Project Structure

This project has been organized into a clean, modular structure:

```
git-memory-mcp-server/
├── 📁 config/           # Configuration files
│   ├── jest.config.cjs
│   ├── tsconfig.json
│   ├── .npmignore
│   ├── mcp-servers-config.json
│   └── performance-config-500.json
├── 📁 docs/             # Documentation
│   ├── README.md        # Main documentation
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   ├── README-MCP-PROXY-500.md
│   └── email-to-trae-team.md
├── 📁 examples/         # Usage examples
│   ├── claude-desktop-config.json
│   ├── git-operations.js
│   └── memory-management.js
├── 📁 mcp-proxy/        # MCP Proxy Server (500 servers)
│   ├── mcp-proxy-server-500.js
│   ├── package-mcp-proxy-500.json
│   └── test-mcp-proxy-500.js
├── 📁 scripts/          # Utility scripts
│   └── start-mcp-proxy-500.bat
├── 📁 src/              # Source code
│   └── index.ts
├── 📁 tests/            # Test files
│   ├── git-operations.test.ts
│   ├── memory-operations.test.ts
│   ├── setup.ts
│   └── simple.test.ts
└── 📁 dist/             # Compiled output
```

## 🚀 Quick Start

### Installation
```bash
npm install -g git-memory-mcp-server
```

### Basic Usage
```bash
# Start the main MCP server
npm start

# Start the MCP Proxy Server (500 servers)
npm run start:mcp-proxy

# Run tests
npm test
```

## 📖 Documentation

For detailed documentation, please refer to:
- **[Main Documentation](docs/README.md)** - Complete feature guide
- **[MCP Proxy 500](docs/README-MCP-PROXY-500.md)** - 500 server proxy setup
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Development guidelines
- **[Changelog](docs/CHANGELOG.md)** - Version history

## 🔧 Configuration

All configuration files are located in the `config/` directory:
- `mcp-servers-config.json` - MCP server definitions
- `performance-config-500.json` - Performance settings for 500 servers
- `tsconfig.json` - TypeScript configuration
- `jest.config.cjs` - Test configuration

## 🎯 Features

- **Git Operations**: Complete Git repository management
- **Persistent Memory**: Store and retrieve information across sessions
- **500+ MCP Servers**: Support for massive MCP server connections
- **High Performance**: Optimized for enterprise-scale deployments
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.