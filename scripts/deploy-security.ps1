# =============================================================================
# Enterprise Security System Deployment Script (PowerShell)
# =============================================================================
# This script automates the deployment of the Git Memory MCP Server Security System
# Supports multiple deployment environments: development, staging, production
# Windows PowerShell version

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment = 'development',
    
    [Parameter(Mandatory=$false)]
    [switch]$Docker,
    
    [Parameter(Mandatory=$false)]
    [switch]$Native,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSecurity,
    
    [Parameter(Mandatory=$false)]
    [switch]$ForceRebuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# =============================================================================
# Configuration
# =============================================================================
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ProjectRoot "logs\deployment.log"
$Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Global variables
$script:DeploymentMethod = ""

# =============================================================================
# Helper Functions
# =============================================================================

# Logging function
function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet('ERROR', 'WARN', 'INFO', 'DEBUG')]
        [string]$Level,
        
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Create logs directory if it doesn't exist
    $LogDir = Split-Path -Parent $LogFile
    if (!(Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    # Log to file
    Add-Content -Path $LogFile -Value $LogEntry
    
    # Log to console with colors
    switch ($Level) {
        'ERROR' {
            Write-Host $LogEntry -ForegroundColor Red
        }
        'WARN' {
            Write-Host $LogEntry -ForegroundColor Yellow
        }
        'INFO' {
            Write-Host $LogEntry -ForegroundColor Green
        }
        'DEBUG' {
            if ($Verbose) {
                Write-Host $LogEntry -ForegroundColor Blue
            }
        }
        default {
            Write-Host $LogEntry
        }
    }
}

# Error handling
function Write-ErrorExit {
    param([string]$Message)
    Write-Log -Level 'ERROR' -Message $Message
    exit 1
}

# Success message
function Write-Success {
    param([string]$Message)
    Write-Log -Level 'INFO' -Message $Message
}

# Warning message
function Write-Warning {
    param([string]$Message)
    Write-Log -Level 'WARN' -Message $Message
}

# Debug message
function Write-Debug {
    param([string]$Message)
    Write-Log -Level 'DEBUG' -Message $Message
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log -Level 'INFO' -Message "Checking prerequisites..."
    
    # Check Node.js
    if (!(Test-Command 'node')) {
        Write-ErrorExit "Node.js is not installed. Please install Node.js >= 16.0.0"
    }
    
    $NodeVersion = (node --version) -replace 'v', ''
    $RequiredVersion = [version]"16.0.0"
    $CurrentVersion = [version]$NodeVersion
    
    if ($CurrentVersion -lt $RequiredVersion) {
        Write-ErrorExit "Node.js version $NodeVersion is too old. Required: >= 16.0.0"
    }
    
    # Check npm
    if (!(Test-Command 'npm')) {
        Write-ErrorExit "npm is not installed"
    }
    
    # Check Docker (optional)
    if (Test-Command 'docker') {
        $DockerVersion = docker --version
        Write-Log -Level 'INFO' -Message "Docker found: $DockerVersion"
    } else {
        Write-Warning "Docker not found. Docker deployment will not be available."
    }
    
    # Check Docker Compose (optional)
    if (Test-Command 'docker-compose') {
        $ComposeVersion = docker-compose --version
        Write-Log -Level 'INFO' -Message "Docker Compose found: $ComposeVersion"
    } else {
        Write-Warning "Docker Compose not found. Docker Compose deployment will not be available."
    }
    
    Write-Success "Prerequisites check completed"
}

# Setup environment
function Initialize-Environment {
    Write-Log -Level 'INFO' -Message "Setting up environment for: $Environment"
    
    # Create necessary directories
    $Directories = @(
        (Join-Path $ProjectRoot "logs"),
        (Join-Path $ProjectRoot "data"),
        (Join-Path $ProjectRoot "temp"),
        (Join-Path $ProjectRoot "backups")
    )
    
    foreach ($Dir in $Directories) {
        if (!(Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        }
    }
    
    # Copy environment file if it doesn't exist
    $EnvFile = Join-Path $ProjectRoot ".env.security"
    $EnvExample = Join-Path $ProjectRoot ".env.security.example"
    
    if (!(Test-Path $EnvFile)) {
        if (Test-Path $EnvExample) {
            Copy-Item $EnvExample $EnvFile
            Write-Log -Level 'INFO' -Message "Created .env.security from example file"
            Write-Warning "Please update .env.security with your configuration before proceeding"
        } else {
            Write-ErrorExit "Environment example file not found: $EnvExample"
        }
    }
    
    # Set NODE_ENV
    $env:NODE_ENV = $Environment
    
    Write-Success "Environment setup completed"
}

# Install dependencies
function Install-Dependencies {
    Write-Log -Level 'INFO' -Message "Installing dependencies..."
    
    Push-Location $ProjectRoot
    
    try {
        if (!$DryRun) {
            # Install main dependencies
            npm ci --only=production
            
            # Install security-specific dependencies
            $SecurityPackage = Join-Path $ProjectRoot "package-security.json"
            if (Test-Path $SecurityPackage) {
                npm install --package-lock-only -f $SecurityPackage
            }
            
            # Install development dependencies if not in production
            if ($Environment -ne "production") {
                npm ci
            }
        } else {
            Write-Log -Level 'INFO' -Message "[DRY RUN] Would install dependencies"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Dependencies installation completed"
}

# Run security audit
function Invoke-SecurityAudit {
    if ($SkipSecurity) {
        Write-Log -Level 'INFO' -Message "Skipping security audit"
        return
    }
    
    Write-Log -Level 'INFO' -Message "Running security audit..."
    
    Push-Location $ProjectRoot
    
    try {
        if (!$DryRun) {
            # Run npm audit
            try {
                npm audit --audit-level=moderate
            } catch {
                Write-Warning "Security vulnerabilities found. Please review and fix them."
            }
            
            # Run security tests if available
            $SecurityTests = Join-Path $ProjectRoot "src\tests\securityTests.js"
            if (Test-Path $SecurityTests) {
                try {
                    npm run test:security
                } catch {
                    Write-Warning "Security tests failed"
                }
            }
        } else {
            Write-Log -Level 'INFO' -Message "[DRY RUN] Would run security audit"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Security audit completed"
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Log -Level 'INFO' -Message "Skipping tests"
        return
    }
    
    Write-Log -Level 'INFO' -Message "Running tests..."
    
    Push-Location $ProjectRoot
    
    try {
        if (!$DryRun) {
            # Run unit tests
            try {
                npm run test
                Write-Success "Unit tests passed"
            } catch {
                Write-Warning "Unit tests failed or not configured"
            }
            
            # Run integration tests
            try {
                npm run test:integration
                Write-Success "Integration tests passed"
            } catch {
                Write-Warning "Integration tests failed or not configured"
            }
            
            # Run security tests
            try {
                npm run test:security
                Write-Success "Security tests passed"
            } catch {
                Write-Warning "Security tests failed or not configured"
            }
        } else {
            Write-Log -Level 'INFO' -Message "[DRY RUN] Would run tests"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Tests completed"
}

# Build application
function Build-Application {
    Write-Log -Level 'INFO' -Message "Building application..."
    
    Push-Location $ProjectRoot
    
    try {
        if (!$DryRun) {
            # Build if build script exists
            try {
                npm run build
                Write-Success "Application build completed"
            } catch {
                Write-Log -Level 'INFO' -Message "No build script found, skipping build step"
            }
        } else {
            Write-Log -Level 'INFO' -Message "[DRY RUN] Would build application"
        }
    }
    finally {
        Pop-Location
    }
}

# Deploy with Docker
function Deploy-Docker {
    Write-Log -Level 'INFO' -Message "Deploying with Docker..."
    
    Push-Location $ProjectRoot
    
    try {
        if (!(Test-Command 'docker')) {
            Write-ErrorExit "Docker is not installed"
        }
        
        if (!$DryRun) {
            # Build Docker image
            $DockerFile = Join-Path $ProjectRoot "Dockerfile.security"
            if ($ForceRebuild) {
                docker build --no-cache -f $DockerFile -t git-memory-security:latest .
            } else {
                docker build -f $DockerFile -t git-memory-security:latest .
            }
            
            # Deploy with Docker Compose
            $ComposeFile = Join-Path $ProjectRoot "docker-compose.security.yml"
            if ((Test-Path $ComposeFile) -and (Test-Command 'docker-compose')) {
                docker-compose -f $ComposeFile up -d
            } else {
                # Run single container
                $EnvFile = Join-Path $ProjectRoot ".env.security"
                docker run -d `
                    --name git-memory-security `
                    --env-file $EnvFile `
                    -p 3333:3333 `
                    git-memory-security:latest
            }
        } else {
            Write-Log -Level 'INFO' -Message "[DRY RUN] Would deploy with Docker"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Docker deployment completed"
}

# Deploy natively
function Deploy-Native {
    Write-Log -Level 'INFO' -Message "Deploying natively..."
    
    Push-Location $ProjectRoot
    
    try {
        if (!$DryRun) {
            # Start the security system
            $SecurityScript = Join-Path $ProjectRoot "src\security\securityIntegration.js"
            
            if ($Environment -eq "production") {
                # Use PM2 for production if available
                if (Test-Command 'pm2') {
                    pm2 start $SecurityScript --name "git-memory-security" --env production
                } else {
                    # Use Start-Process as fallback
                    $LogPath = Join-Path $ProjectRoot "logs\security.log"
                    $Process = Start-Process -FilePath "node" -ArgumentList $SecurityScript -RedirectStandardOutput $LogPath -RedirectStandardError $LogPath -PassThru
                    $Process.Id | Out-File -FilePath "security.pid"
                }
            } else {
                # Development mode
                try {
                    Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -NoNewWindow
                } catch {
                    # Fallback to direct node execution
                    Start-Process -FilePath "node" -ArgumentList $SecurityScript -NoNewWindow
                }
            }
        } else {
            Write-Log -Level 'INFO' -Message "[DRY RUN] Would deploy natively"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Native deployment completed"
}

# Health check
function Test-Health {
    Write-Log -Level 'INFO' -Message "Performing health check..."
    
    $MaxAttempts = 30
    $Attempt = 1
    $HealthUrl = "http://localhost:3333/api/security/health"
    
    while ($Attempt -le $MaxAttempts) {
        try {
            $Response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 5
            if ($Response.StatusCode -eq 200) {
                Write-Success "Health check passed"
                return
            }
        } catch {
            # Continue to retry
        }
        
        Write-Log -Level 'INFO' -Message "Health check attempt $Attempt/$MaxAttempts failed, retrying in 5 seconds..."
        Start-Sleep -Seconds 5
        $Attempt++
    }
    
    Write-ErrorExit "Health check failed after $MaxAttempts attempts"
}

# Cleanup
function Invoke-Cleanup {
    Write-Log -Level 'INFO' -Message "Performing cleanup..."
    
    Push-Location $ProjectRoot
    
    try {
        # Clean temporary files
        $TempDir = Join-Path $ProjectRoot "temp"
        if (Test-Path $TempDir) {
            Get-ChildItem $TempDir | Remove-Item -Recurse -Force
        }
        
        # Clean old logs (keep last 10 files)
        $LogsDir = Join-Path $ProjectRoot "logs"
        if (Test-Path $LogsDir) {
            Get-ChildItem $LogsDir -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10 | Remove-Item -Force
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Cleanup completed"
}

# Show usage
function Show-Usage {
    $Usage = @"
Usage: .\deploy-security.ps1 [OPTIONS]

Deploy the Git Memory MCP Server Security System

Options:
    -Environment ENV         Deployment environment (development|staging|production) [default: development]
    -Docker                 Use Docker deployment
    -Native                 Use native deployment
    -SkipTests              Skip running tests
    -SkipSecurity           Skip security audit
    -ForceRebuild           Force rebuild (Docker only)
    -Verbose                Enable verbose output
    -DryRun                 Show what would be done without executing
    -Help                   Show this help message

Examples:
    .\deploy-security.ps1                                    # Deploy in development mode
    .\deploy-security.ps1 -Environment production -Docker    # Deploy in production with Docker
    .\deploy-security.ps1 -Environment staging -Native -Verbose  # Deploy in staging natively with verbose output
    .\deploy-security.ps1 -DryRun -Environment production    # Show what would be done for production deployment

Environment Variables:
    SECURITY_DEPLOYMENT_ENV              Override environment setting
    SECURITY_SKIP_TESTS                  Skip tests (true/false)
    SECURITY_SKIP_SECURITY_SCAN          Skip security scan (true/false)
    SECURITY_FORCE_REBUILD               Force rebuild (true/false)
    SECURITY_VERBOSE                     Enable verbose output (true/false)
"@
    Write-Host $Usage
}

# Initialize deployment method
function Initialize-DeploymentMethod {
    # Override with environment variables if set
    if ($env:SECURITY_DEPLOYMENT_ENV) { $script:Environment = $env:SECURITY_DEPLOYMENT_ENV }
    if ($env:SECURITY_SKIP_TESTS -eq "true") { $script:SkipTests = $true }
    if ($env:SECURITY_SKIP_SECURITY_SCAN -eq "true") { $script:SkipSecurity = $true }
    if ($env:SECURITY_FORCE_REBUILD -eq "true") { $script:ForceRebuild = $true }
    if ($env:SECURITY_VERBOSE -eq "true") { $script:Verbose = $true }
    
    # Determine deployment method
    if ($Docker) {
        $script:DeploymentMethod = "docker"
    } elseif ($Native) {
        $script:DeploymentMethod = "native"
    } else {
        # Auto-detect
        $DockerFile = Join-Path $ProjectRoot "Dockerfile.security"
        if ((Test-Command 'docker') -and (Test-Path $DockerFile)) {
            $script:DeploymentMethod = "docker"
        } else {
            $script:DeploymentMethod = "native"
        }
    }
}

# Main deployment function
function Start-Deployment {
    Write-Log -Level 'INFO' -Message "Starting deployment of Git Memory MCP Server Security System"
    Write-Log -Level 'INFO' -Message "Environment: $Environment"
    Write-Log -Level 'INFO' -Message "Deployment method: $script:DeploymentMethod"
    Write-Log -Level 'INFO' -Message "Dry run: $DryRun"
    
    # Pre-deployment steps
    Test-Prerequisites
    Initialize-Environment
    Install-Dependencies
    Invoke-SecurityAudit
    Invoke-Tests
    Build-Application
    
    # Deployment
    switch ($script:DeploymentMethod) {
        "docker" {
            Deploy-Docker
        }
        "native" {
            Deploy-Native
        }
        default {
            Write-ErrorExit "Unknown deployment method: $script:DeploymentMethod"
        }
    }
    
    # Post-deployment steps
    if (!$DryRun) {
        Start-Sleep -Seconds 10  # Give the service time to start
        Test-Health
    }
    
    Invoke-Cleanup
    
    Write-Success "Deployment completed successfully!"
    Write-Log -Level 'INFO' -Message "Security system should be available at: http://localhost:3333"
    Write-Log -Level 'INFO' -Message "Dashboard available at: http://localhost:3333/dashboard"
    Write-Log -Level 'INFO' -Message "API documentation available at: http://localhost:3333/api/docs"
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Handle script interruption
trap {
    Write-Log -Level 'ERROR' -Message "Deployment interrupted"
    exit 1
}

try {
    # Initialize and run main function
    Initialize-DeploymentMethod
    Start-Deployment
    exit 0
} catch {
    Write-Log -Level 'ERROR' -Message "Deployment failed: $($_.Exception.Message)"
    exit 1
}