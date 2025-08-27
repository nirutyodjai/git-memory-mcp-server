@echo off
echo ========================================
echo   MCP Proxy Server 500 - Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if required dependencies are installed
if not exist "..\node_modules" (
    echo 📦 Installing dependencies...
    cd ..
    npm install
    cd scripts
    if %errorlevel% neq 0 (
        echo ❌ Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if MCP Proxy Server file exists
if not exist "..\mcp-proxy\mcp-proxy-server-500.js" (
    echo ❌ Error: mcp-proxy-server-500.js not found
    echo Please ensure the MCP Proxy Server file is in the mcp-proxy directory
    pause
    exit /b 1
)

REM Check if configuration file exists
if not exist "..\config\mcp-servers-config.json" (
    echo ⚠️  Warning: mcp-servers-config.json not found
    echo Using default configuration...
)

REM Set environment variables
set MCP_CONFIG_PATH=..\config\mcp-servers-config.json
set MCP_LOG_LEVEL=info
set MCP_MAX_SERVERS=500
set MCP_PORT=9090

echo 🚀 Starting MCP Proxy Server 500...
echo.
echo Configuration:
echo - Max Servers: %MCP_MAX_SERVERS%
echo - Port: %MCP_PORT%
echo - Config File: %MCP_CONFIG_PATH%
echo - Log Level: %MCP_LOG_LEVEL%
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the MCP Proxy Server
node ..\mcp-proxy\mcp-proxy-server-500.js

REM If the server stops, show exit message
echo.
echo ========================================
echo   MCP Proxy Server 500 - Stopped
echo ========================================
pause