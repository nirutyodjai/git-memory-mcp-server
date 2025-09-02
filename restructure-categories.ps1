Param(
    [string]$ServersBasePath
)

$ErrorActionPreference = 'Stop'

if (-not $ServersBasePath -or $ServersBasePath.Trim() -eq '') {
    $ServersBasePath = Join-Path $PSScriptRoot 'servers'
}

if (-not (Test-Path $ServersBasePath)) {
    throw "Servers base path not found: $ServersBasePath"
}

$categories = @('ai-ml','browser','code','data','design','git','web')

Write-Host "Starting restructure for categories: $($categories -join ', ')" -ForegroundColor Cyan
Write-Host "Base: $ServersBasePath" -ForegroundColor Cyan

foreach ($cat in $categories) {
    $destRoot = Join-Path $ServersBasePath $cat
    if (-not (Test-Path $destRoot)) {
        New-Item -ItemType Directory -Path $destRoot | Out-Null
        Write-Host "Created: $destRoot" -ForegroundColor DarkGreen
    }

    $pattern = "$cat-*"
    $items = Get-ChildItem -Path $ServersBasePath -Directory -Filter $pattern -ErrorAction SilentlyContinue

    foreach ($item in $items) {
        $src = $item.FullName
        $name = $item.Name

        if ($name -match '^[a-z0-9\-]+-(\d+)$') {
            $num = [int]$Matches[1]
            $numStr = $num.ToString()
            $dest = Join-Path $destRoot $numStr

            if (Test-Path $dest) {
                Write-Host "SKIP: $name -> $cat/$numStr (already exists)" -ForegroundColor Yellow
                continue
            }

            Write-Host "MOVE: $name -> $cat/$numStr" -ForegroundColor Green
            Move-Item -LiteralPath $src -Destination $dest
        }
        else {
            Write-Warning "WARN: $name does not match expected pattern for category '$cat'"
        }
    }
}

Write-Host "\nSummary:" -ForegroundColor Cyan
foreach ($cat in $categories) {
    $destRoot = Join-Path $ServersBasePath $cat
    if (Test-Path $destRoot) {
        $count = (Get-ChildItem -Path $destRoot -Directory -ErrorAction SilentlyContinue).Count
        Write-Host (" - {0}: {1}" -f $cat, $count)
    }
}