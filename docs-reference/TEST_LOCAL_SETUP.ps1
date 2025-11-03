# Test Local Development Setup
# Verifies that all required files and services are configured correctly

Write-Host "🔍 Testing Local Development Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Test 1: Check configuration files
Write-Host "1️⃣  Checking configuration files..." -ForegroundColor Yellow

if (Test-Path "api/local.settings.json") {
    Write-Host "   ✅ api/local.settings.json exists" -ForegroundColor Green
    
    # Check if it has the required keys
    $config = Get-Content "api/local.settings.json" | ConvertFrom-Json
    if ($config.Values.COSMOS_ENDPOINT -and $config.Values.COSMOS_KEY) {
        Write-Host "   ✅ Cosmos DB credentials configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Cosmos DB credentials missing" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "   ❌ api/local.settings.json NOT found" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_APP_ENV=production" -and $envContent -match "VITE_COSMOS_ENDPOINT") {
        Write-Host "   ✅ Frontend environment configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Frontend environment incomplete" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env.local NOT found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 2: Check dependencies
Write-Host "2️⃣  Checking dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend dependencies NOT installed (run: npm install)" -ForegroundColor Yellow
    $allGood = $false
}

if (Test-Path "api/node_modules") {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend dependencies NOT installed (run: cd api && npm install)" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Test 3: Check Azure Functions Core Tools
Write-Host "3️⃣  Checking Azure Functions Core Tools..." -ForegroundColor Yellow

try {
    $funcVersion = & func --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Azure Functions Core Tools installed (version: $funcVersion)" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ❌ Azure Functions Core Tools NOT installed" -ForegroundColor Red
    Write-Host "      Install with: npm install -g azure-functions-core-tools@4 --unsafe-perm true" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Test 4: Check Azure CLI (optional)
Write-Host "4️⃣  Checking Azure CLI (optional)..." -ForegroundColor Yellow

try {
    $azVersion = & az --version 2>&1 | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Azure CLI installed" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ⚠️  Azure CLI not installed (optional, but useful)" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Test backend connection (if running)
Write-Host "5️⃣  Testing backend API connection..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:7071/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $health = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Backend API is running!" -ForegroundColor Green
    Write-Host "      Status: $($health.status)" -ForegroundColor Gray
    
    if ($health.checks.cosmosdb.status -eq "healthy") {
        Write-Host "   ✅ Cosmos DB connection is healthy!" -ForegroundColor Green
        Write-Host "      Response time: $($health.checks.cosmosdb.responseTime)ms" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Cosmos DB connection failed!" -ForegroundColor Red
        Write-Host "      Status: $($health.checks.cosmosdb.status)" -ForegroundColor Gray
        $allGood = $false
    }
} catch {
    Write-Host "   ⚠️  Backend API not running (start it with: cd api && npm start)" -ForegroundColor Yellow
}

Write-Host ""

# Test 6: Test frontend (if running)
Write-Host "6️⃣  Testing frontend dev server..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Frontend dev server is running!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Frontend not running (start it with: npm run dev)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Final summary
if ($allGood) {
    Write-Host "ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to start development!" -ForegroundColor Cyan
    Write-Host "   Run: .\START_LOCAL_DEV.ps1" -ForegroundColor Gray
} else {
    Write-Host "SOME ISSUES FOUND" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please fix the issues above before starting development." -ForegroundColor Yellow
    Write-Host "See LOCAL_DEV_SETUP.md for detailed instructions." -ForegroundColor Cyan
}

Write-Host ""

