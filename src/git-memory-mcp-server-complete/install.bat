@echo off
echo Installing Git Memory MCP Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

REM Install from tarball if exists, otherwise from npm
if exist "git-memory-mcp-server-1.0.0.tgz" (
    echo Installing from local tarball...
    npm install -g git-memory-mcp-server-1.0.0.tgz
) else (
    echo Installing from npm registry...
    npm install -g git-memory-mcp-server
)

if %errorlevel% neq 0 (
    echo Error: Installation failed
    pause
    exit /b 1
)

echo.
echo ✅ Git Memory MCP Server installed successfully!
echo.
echo To use the server:
echo 1. Copy .env.example to .env and configure your settings
echo 2. Run: git-memory-mcp
echo.
echo For more information, see README.md
echo.
pause