# NEXUS IDE Complete System Starter - PowerShell Version
# เริ่มต้นระบบครบครันพร้อม Proxy และ Load Balancer

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 NEXUS IDE Complete System Starter" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Starting complete system with:" -ForegroundColor Green
Write-Host "✓ Git Memory MCP Server (1000 servers)" -ForegroundColor White
Write-Host "✓ API Gateway with Proxy" -ForegroundColor White
Write-Host "✓ Distributed Load Balancer" -ForegroundColor White
Write-Host "✓ Health Monitoring" -ForegroundColor White
Write-Host "✓ System Dashboard" -ForegroundColor White
Write-Host "`nPlease wait...`n" -ForegroundColor Yellow

# Change to the correct directory
Set-Location "d:\Ai Server\git-memory-mcp-server"

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if required files exist
if (-not (Test-Path "start-with-proxy-loadbalancer.js")) {
    Write-Host "❌ Error: start-with-proxy-loadbalancer.js not found" -ForegroundColor Red
    Write-Host "Please make sure you're in the correct directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-Host "`n🛑 Shutting down NEXUS IDE System..." -ForegroundColor Yellow
}

try {
    # Start the complete system
    Write-Host "🚀 Starting NEXUS IDE Complete System..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the system`n" -ForegroundColor Gray
    
    # Run the Node.js starter
    & node "start-with-proxy-loadbalancer.js"
    
} catch {
    Write-Host "`n❌ Error starting system: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host "`n⚠️  System has stopped" -ForegroundColor Yellow
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}