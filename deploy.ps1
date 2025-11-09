# Blood Stock Management System - Windows Deployment Script

Write-Host "🚀 Starting Blood Stock Management System deployment..." -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found! Please copy .env.production.example to .env and configure it." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -and $_ -notmatch "^#") {
        $name, $value = $_.split('=', 2)
        if ($name -and $value) {
            [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
        }
    }
}

# Validate required environment variables
$required_vars = @("DB_PASSWORD", "JWT_SECRET")
foreach ($var in $required_vars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        Write-Host "❌ Required environment variable $var is not set!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 Environment variables validated" -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "🐳 Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running! Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose version | Out-Null
} catch {
    Write-Host "❌ docker-compose not found! Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Pull latest images
Write-Host "📦 Pulling latest images..." -ForegroundColor Cyan
docker-compose pull postgres

# Build application images
Write-Host "🔨 Building application images..." -ForegroundColor Cyan
docker-compose build --no-cache

# Stop existing services
Write-Host "🛑 Stopping existing services..." -ForegroundColor Yellow
docker-compose down

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Green
docker-compose up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Cyan
$timeout = 300
$counter = 0

while ($counter -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    
    $counter += 5
    Write-Host "⏳ Waiting for backend... ($counter/$timeout seconds)" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if ($counter -ge $timeout) {
    Write-Host "❌ Backend failed to become healthy within $timeout seconds" -ForegroundColor Red
    docker-compose logs backend
    exit 1
}

# Check frontend
$frontendPort = [Environment]::GetEnvironmentVariable("FRONTEND_PORT")
if (-not $frontendPort) { $frontendPort = "80" }

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend may not be accessible yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
Write-Host "📍 Access points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3002" -ForegroundColor White  
Write-Host "   Health Check: http://localhost:3002/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📊 View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop services: docker-compose down" -ForegroundColor Yellow