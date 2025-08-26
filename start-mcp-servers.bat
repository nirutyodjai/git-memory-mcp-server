@echo off
echo Starting MCP Servers...
echo.

echo === Starting TypeScript Servers ===
echo.

echo Starting Filesystem Server...
start "Filesystem Server" /min cmd /k "cd src\filesystem && node dist\index.js"
timeout /t 2 /nobreak >nul

echo Starting Simple Memory Server...
start "Simple Memory Server" /min cmd /k "cd src\simple-memory && node dist\index.js"
timeout /t 2 /nobreak >nul

echo Starting Sequential Thinking Server...
start "Sequential Thinking Server" /min cmd /k "cd src\sequentialthinking && node dist\index.js"
timeout /t 2 /nobreak >nul

echo Starting Everything Server...
start "Everything Server" /min cmd /k "cd src\everything && node dist\index.js"
timeout /t 2 /nobreak >nul

echo.
echo === Starting Python Servers ===
echo.

echo Starting Fetch Server...
start "Fetch Server" /min cmd /k "cd src\fetch && python -m mcp_server_fetch"
timeout /t 2 /nobreak >nul

echo Starting Git Server...
start "Git Server" /min cmd /k "cd src\git && python -m mcp_server_git"
timeout /t 2 /nobreak >nul

echo Starting Time Server...
start "Time Server" /min cmd /k "cd src\time && python -m mcp_server_time"
timeout /t 2 /nobreak >nul

echo.
echo === All MCP Servers Started ===
echo Servers are running in minimized windows.
echo Check the trae-mcp.json file for server configurations.
echo.
pause