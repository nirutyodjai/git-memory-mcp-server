# Git Memory MCP Server - Deployment Guide

This guide provides multiple ways to install and deploy the Git Memory MCP Server.

## 📦 Installation Methods

### Method 1: From npm Registry (Recommended)

```bash
# Install globally
npm install -g git-memory-mcp-server

# Or install locally in your project
npm install git-memory-mcp-server
```

### Method 2: From Tarball (Offline Installation)

1. Download the `git-memory-mcp-server-1.0.0.tgz` file
2. Run the installation:

```bash
# Install globally from tarball
npm install -g git-memory-mcp-server-1.0.0.tgz

# Or install locally
npm install git-memory-mcp-server-1.0.0.tgz
```

### Method 3: Using Installation Scripts

#### Windows (Command Prompt)
```cmd
install.bat
```

#### Windows (PowerShell)
```powershell
.\install.ps1
```

#### Linux/macOS
```bash
chmod +x install.sh
./install.sh
```

### Method 4: From Source Code

1. Clone or download the source code
2. Navigate to the project directory
3. Install dependencies and build:

```bash
npm install
npm run build
npm link  # For global installation
```

## 🚀 Quick Start

1. **Configure Environment**:
   ```bash
   cp examples/.env.example .env
   # Edit .env with your settings
   ```

2. **Start the Server**:
   ```bash
   git-memory-mcp
   ```

3. **Test the Installation**:
   ```bash
   # The server should start on port 3001 by default
   curl http://localhost:3001/health
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
HOST=localhost

# Git Configuration
GIT_REPO_PATH=./
GIT_DEFAULT_BRANCH=main

# Memory Configuration
MEMORY_DB_PATH=./memory.db
MEMORY_MAX_ENTRIES=10000
MEMORY_CLEANUP_INTERVAL=3600000

# Search Configuration
SEARCH_MAX_RESULTS=50
SEARCH_MIN_SCORE=0.1

# Logging
LOG_LEVEL=info
LOG_FILE=./git-memory-mcp.log
```

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "git-memory": {
      "command": "git-memory-mcp",
      "args": [],
      "env": {
        "PORT": "3001"
      }
    }
  }
}
```

## 🐳 Docker Deployment

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  git-memory-mcp:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./git-memory-mcp-server-1.0.0.tgz:/app/package.tgz
      - ./data:/app/data
      - ./.env:/app/.env
    ports:
      - "3001:3001"
    command: |
      sh -c '
        npm install -g /app/package.tgz &&
        git-memory-mcp
      '
    environment:
      - NODE_ENV=production
```

Run with:
```bash
docker-compose up -d
```

### Using Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package and install
COPY git-memory-mcp-server-1.0.0.tgz .
RUN npm install -g git-memory-mcp-server-1.0.0.tgz

# Create data directory
RUN mkdir -p /app/data

# Copy configuration
COPY .env .

EXPOSE 3001

CMD ["git-memory-mcp"]
```

Build and run:
```bash
docker build -t git-memory-mcp .
docker run -d -p 3001:3001 -v $(pwd)/data:/app/data git-memory-mcp
```

## 🔍 Verification

### Health Check
```bash
curl http://localhost:3001/health
```

### Test Git Operations
```bash
curl -X POST http://localhost:3001/git/status \
  -H "Content-Type: application/json" \
  -d '{"path": "./"}'
```

### Test Memory Operations
```bash
curl -X POST http://localhost:3001/memory/store \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "content": "Hello World", "metadata": {"type": "test"}}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Change port in .env file
   PORT=3002
   ```

2. **Permission Denied**:
   ```bash
   # On Linux/macOS, you might need sudo for global installation
   sudo npm install -g git-memory-mcp-server
   ```

3. **Node.js Version**:
   ```bash
   # Ensure Node.js >= 18.0.0
   node --version
   ```

4. **Database Issues**:
   ```bash
   # Remove and recreate database
   rm memory.db
   # Restart the server
   ```

### Logs

Check logs for debugging:
```bash
# If LOG_FILE is set in .env
tail -f git-memory-mcp.log

# Or check console output
git-memory-mcp --verbose
```

## 📊 Monitoring

### Health Monitoring

The server provides health endpoints:
- `GET /health` - Basic health check
- `GET /metrics` - Performance metrics
- `GET /status` - Detailed status information

### Performance Monitoring

Monitor key metrics:
- Memory usage
- Database size
- Response times
- Git operation frequency

## 🔄 Updates

### Updating the Server

```bash
# From npm
npm update -g git-memory-mcp-server

# From tarball
npm install -g git-memory-mcp-server-1.1.0.tgz
```

### Backup and Migration

```bash
# Backup memory database
cp memory.db memory.db.backup

# Backup configuration
cp .env .env.backup
```

## 🤝 Support

For issues and support:
- Check the [README.md](README.md) for usage instructions
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub
- Check the logs for error messages

---

**Note**: This server requires Node.js 18+ and npm for installation and operation.