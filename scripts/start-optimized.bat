
@echo off
echo Starting MCP System with Memory Optimization...

REM Set Node.js memory options
set NODE_OPTIONS=--max-old-space-size=8192 --max-semi-space-size=512 --initial-old-space-size=2048 --optimize-for-size --expose-gc

REM Start memory monitor
start "Memory Monitor" node memory-monitor.js

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start MCP Coordinator
start "MCP Coordinator" node mcp-coordinator.js

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start MCP Proxy
start "MCP Proxy" node mcp-proxy/mcp-proxy-server-500.js

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start new servers
start "New Servers" node start-new-servers.js

echo All services started with memory optimization!
echo Check memory-usage.log for monitoring data.
pause
