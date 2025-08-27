#!/usr/bin/env powershell

Write-Host "Installing Git Memory MCP Server..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Blue
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Blue
} catch {
    Write-Host "Error: npm is not available" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Install from tarball if exists, otherwise from npm
if (Test-Path "git-memory-mcp-server-1.0.0.tgz") {
    Write-Host "Installing from local tarball..." -ForegroundColor Yellow
    npm install -g git-memory-mcp-server-1.0.0.tgz
} else {
    Write-Host "Installing from npm registry..." -ForegroundColor Yellow
    npm install -g git-memory-mcp-server
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Installation failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ Git Memory MCP Server installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To use the server:" -ForegroundColor Cyan
Write-Host "1. Copy .env.example to .env and configure your settings" -ForegroundColor White
Write-Host "2. Run: git-memory-mcp" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"