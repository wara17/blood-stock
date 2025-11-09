# test-deployment.ps1 - Script to test deployment health on Windows

Write-Host "🔍 Testing Blood Stock App Deployment..." -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [int]$ExpectedCode = 200
    )
    
    Write-Host "Testing $Description... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedCode) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $statusCode)"
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $statusCode)"
            return $false
        }
    }
    catch {
        $errorCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Connection Failed" }
        
        if ($errorCode -eq $ExpectedCode) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $errorCode)"
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " ($errorCode)"
            return $false
        }
    }
    
    return $true
}

# Function to check container health
function Check-Container {
    param(
        [string]$ContainerName,
        [string]$Description
    )
    
    Write-Host "Checking $Description container... " -NoNewline
    
    try {
        $output = docker-compose ps --format "table {{.Name}}`t{{.Status}}" | Select-String $ContainerName
        
        if ($output -and $output.ToString().Contains("Up")) {
            Write-Host "✓ RUNNING" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ NOT RUNNING" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "✗ ERROR CHECKING" -ForegroundColor Red
        return $false
    }
}

# Set base URL (change if different)
$BaseUrl = "http://localhost"
$ApiUrl = "$BaseUrl/api"

Write-Host ""
Write-Host "1. Container Health Checks" -ForegroundColor Yellow
Write-Host "=========================="

Check-Container "postgres" "Database (PostgreSQL)"
Check-Container "backend" "Backend API"
Check-Container "frontend" "Frontend (Nginx)"

Write-Host ""
Write-Host "2. API Endpoint Tests" -ForegroundColor Yellow
Write-Host "===================="

# Test backend health
Test-Endpoint "$ApiUrl/health" "Backend Health Check"

# Test frontend
Test-Endpoint "$BaseUrl" "Frontend (Homepage)"

# Test API endpoints (these might return 401 but should be reachable)
Test-Endpoint "$ApiUrl/auth/profile" "Auth Profile Endpoint" 401

Write-Host ""
Write-Host "3. Database Connection Test" -ForegroundColor Yellow
Write-Host "=========================="

Write-Host "Testing database connection... " -NoNewline
try {
    $dbTest = docker-compose exec -T backend node -e "const { testConnection } = require('./config/database'); testConnection().then(() => console.log('OK')).catch(() => console.log('ERROR'));" 2>$null
    
    if ($dbTest -like "*OK*") {
        Write-Host "✓ CONNECTED" -ForegroundColor Green
    } else {
        Write-Host "✗ CONNECTION FAILED" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ TEST FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Resource Usage" -ForegroundColor Yellow
Write-Host "================="

Write-Host "Container resource usage:"
docker stats --no-stream --format "table {{.Container}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.NetIO}}"

Write-Host ""
Write-Host "5. Logs Summary" -ForegroundColor Yellow
Write-Host "==============="

Write-Host "Recent backend logs:"
docker-compose logs --tail=5 backend

Write-Host ""
Write-Host "Recent frontend logs:"
docker-compose logs --tail=5 frontend

Write-Host ""
Write-Host "🎯 Deployment Test Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application:"
Write-Host "📱 Frontend: $BaseUrl" -ForegroundColor Green
Write-Host "🔌 Backend API: $ApiUrl" -ForegroundColor Green
Write-Host "📊 Health Check: $ApiUrl/health" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "🔍 Monitor logs: docker-compose logs -f"
Write-Host "📈 Check status: docker-compose ps"
Write-Host "🔄 Restart: docker-compose restart"
Write-Host "🛑 Stop: docker-compose down"