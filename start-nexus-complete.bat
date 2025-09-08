@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 NEXUS IDE Complete System Starter
echo ========================================
echo.
echo Starting complete system with:
echo ✓ Git Memory MCP Server (1000 servers)
echo ✓ API Gateway with Proxy
echo ✓ Distributed Load Balancer  
echo ✓ Health Monitoring
echo ✓ System Dashboard
echo.
echo Please wait...
echo.

cd /d "d:\Ai Server\git-memory-mcp-server"

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if required files exist
if not exist "start-with-proxy-loadbalancer.js" (
    echo ❌ Error: start-with-proxy-loadbalancer.js not found
    echo Please make sure you're in the correct directory
    pause
    exit /b 1
)

REM Start the complete system
echo 🚀 Starting NEXUS IDE Complete System...
node start-with-proxy-loadbalancer.js

REM If we get here, the system has stopped
echo.
echo ⚠️  System has stopped
echo Press any key to exit...
pause >nul