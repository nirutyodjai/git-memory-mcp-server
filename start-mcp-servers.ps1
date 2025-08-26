# MCP Servers Startup Script for Windows PowerShell
#  This script starts all MCP servers based on the trae-mcp.json configuration

Write-Host "Starting MCP Servers..." -ForegroundColor Green

# Function to start a server in background
function Start-MCPServer {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    Write-Host "Starting $Name server..." -ForegroundColor Yellow
    
    if ($WorkingDirectory) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; $Command" -WindowStyle Minimized
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "$Command" -WindowStyle Minimized
    }
    
    Start-Sleep -Seconds 2
    Write-Host "$Name server started" -ForegroundColor Green
}

# Start TypeScript Servers
Write-Host "\n=== Starting TypeScript Servers ===" -ForegroundColor Cyan

# Filesystem Server
Start-MCPServer -Name "Filesystem" -Command "node dist/index.js" -WorkingDirectory "src/filesystem"

# Memory Server  
Start-MCPServer -Name "Memory" -Command "node dist/index.js" -WorkingDirectory "src/memory"

# Sequential Thinking Server
Start-MCPServer -Name "Sequential Thinking" -Command "node dist/index.js" -WorkingDirectory "src/sequentialthinking"

# Everything Server
Start-MCPServer -Name "Everything" -Command "node dist/index.js" -WorkingDirectory "src/everything"

# Start Python Servers
Write-Host "\n=== Starting Python Servers ===" -ForegroundColor Cyan

# Fetch Server
Start-MCPServer -Name "Fetch" -Command "python -m mcp_server_fetch" -WorkingDirectory "src/fetch"

# Git Server
Start-MCPServer -Name "Git" -Command "python -m mcp_server_git" -WorkingDirectory "src/git"

# Time Server
Start-MCPServer -Name "Time" -Command "python -m mcp_server_time" -WorkingDirectory "src/time"

Write-Host "\n=== All MCP Servers Started ===" -ForegroundColor Green
Write-Host "Servers are running in minimized windows." -ForegroundColor Yellow
Write-Host "Check the trae-mcp.json file for server configurations." -ForegroundColor Yellow
Write-Host "\nPress any key to exit..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")