# Git Memory MCP Server & Coordinator System

> A comprehensive MCP (Model Context Protocol) server for Git repository management with persistent memory capabilities and MCP Coordinator System that supports scaling up to 1000 MCP servers with Git-based memory sharing.

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
├── 📁 scripts/          # MCP Coordinator Scripts
│   ├── deploy-batch.js      # Batch deployment system
│   ├── health-check.js      # Health monitoring
│   ├── scale-system.js      # System scaling
│   └── start-mcp-proxy-500.bat
├── 📁 src/              # Source code
│   └── index.ts
├── 📁 tests/            # Test files
│   ├── git-operations.test.ts
│   ├── memory-operations.test.ts
│   ├── setup.ts
│   └── simple.test.ts
├── 📁 dist/             # Compiled output
├── mcp-coordinator.js           # Main MCP Coordinator
├── mcp-proxy-server.js          # HTTP Proxy Server
├── mcp-coordinator-config.json  # Coordinator Configuration
└── mcp-coordinator-architecture.md  # Architecture Documentation
```

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Basic Usage
```bash
# Start the main MCP server
npm start

# Start MCP Coordinator System
npm run coordinator

# Start HTTP Proxy Server
npm run proxy

# Start Dashboard
npm run dashboard

# Deploy MCP servers in batches
npm run deploy:batch

# Check system health
npm run health:check

# Scale system
npm run scale:system

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

### Core Features
- **Git Operations**: Complete Git repository management
- **Persistent Memory**: Store and retrieve information across sessions with Git-based sharing
- **MCP Coordinator**: Central coordination system for managing multiple MCP servers
- **Batch Deployment**: Deploy MCP servers in batches of 50 with automatic scaling
- **Health Monitoring**: Real-time health checks and system monitoring
- **Category Management**: Organize servers by categories (Database, API, AI/ML, etc.)

### Scaling Capabilities
- **500+ MCP Servers**: Support for massive MCP server connections
- **1000 Server Target**: Designed to scale up to 1000 MCP servers
- **Auto-scaling**: Intelligent scaling based on system health and capacity
- **Load Balancing**: Distribute workload across server categories

### Enterprise Features
- **High Performance**: Optimized for enterprise-scale deployments
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Dashboard**: Web-based management interface
- **API Integration**: RESTful API for system management
- **Monitoring & Logging**: Comprehensive system monitoring and logging

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.