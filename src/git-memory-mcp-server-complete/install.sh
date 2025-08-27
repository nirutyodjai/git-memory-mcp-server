#!/bin/bash

echo "Installing Git Memory MCP Server..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${BLUE}Node.js version: $NODE_VERSION${NC}"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not available${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${BLUE}npm version: $NPM_VERSION${NC}"
echo ""

# Install from tarball if exists, otherwise from npm
if [ -f "git-memory-mcp-server-1.0.0.tgz" ]; then
    echo -e "${YELLOW}Installing from local tarball...${NC}"
    npm install -g git-memory-mcp-server-1.0.0.tgz
else
    echo -e "${YELLOW}Installing from npm registry...${NC}"
    npm install -g git-memory-mcp-server
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Installation failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Git Memory MCP Server installed successfully!${NC}"
echo ""
echo -e "${CYAN}To use the server:${NC}"
echo "1. Copy .env.example to .env and configure your settings"
echo "2. Run: git-memory-mcp"
echo ""
echo -e "${YELLOW}For more information, see README.md${NC}"
echo ""