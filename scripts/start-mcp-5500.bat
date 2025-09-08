@echo off
REM Git Memory MCP Server 5500 - Windows Batch Startup Script
REM Trae Agent Integration Server
REM Version 1.0.0

setlocal EnableDelayedExpansion

REM Set console title
title Git Memory MCP Server 5500 - Trae Agent Integration

REM Set console colors (Green background, White text)
color 0A

REM Clear screen
cls

echo.
echo ===============================================================================
echo                    Git Memory MCP Server 5500 Startup
echo                      Trae Agent Integration Server
echo ===============================================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Display Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js Version: %NODE_VERSION%

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available
    echo Please ensure npm is installed with Node.js
    echo.
    pause
    exit /b 1
)

REM Display npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [INFO] npm Version: %NPM_VERSION%
echo.

REM Set environment variables
set NODE_ENV=development
set MCP_PORT=5500
set MCP_HOST=localhost
set DEBUG=mcp:*

REM Display configuration
echo [CONFIG] Environment: %NODE_ENV%
echo [CONFIG] Host: %MCP_HOST%
echo [CONFIG] Port: %MCP_PORT%
echo [CONFIG] Debug Mode: %DEBUG%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Please run this script from the project root directory
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules directory not found
    echo Installing dependencies...
    echo.
    
    npm install
    
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    
    echo [SUCCESS] Dependencies installed successfully
    echo.
)

REM Check if start-mcp-5500.js exists
if not exist "start-mcp-5500.js" (
    echo [ERROR] start-mcp-5500.js not found
    echo Please ensure the MCP server startup script exists
    echo.
    pause
    exit /b 1
)

REM Check if trae-mcp-config.yaml exists
if not exist "trae-mcp-config.yaml" (
    echo [WARNING] trae-mcp-config.yaml not found
    echo The server will use default configuration
    echo.
)

REM Display startup message
echo ===============================================================================
echo                        Starting MCP Server 5500...
echo ===============================================================================
echo.
echo [INFO] Server will be available at: http://%MCP_HOST%:%MCP_PORT%
echo [INFO] Health check endpoint: http://%MCP_HOST%:%MCP_PORT%/health
echo [INFO] API base path: http://%MCP_HOST%:%MCP_PORT%/api/v1
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ===============================================================================
echo.

REM Start the MCP server
node start-mcp-5500.js

REM Check exit code
if errorlevel 1 (
    echo.
    echo ===============================================================================
    echo [ERROR] MCP Server 5500 exited with error code: %errorlevel%
    echo ===============================================================================
    echo.
) else (
    echo.
    echo ===============================================================================
    echo [INFO] MCP Server 5500 stopped gracefully
    echo ===============================================================================
    echo.
)

REM Pause to keep window open
echo Press any key to close this window...
pause >nul

endlocal
exit /b %errorlevel%