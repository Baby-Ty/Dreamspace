# Start Local Development with Production Cosmos DB
# This script starts both the frontend and backend services

Write-Host "Starting DreamSpace Local Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if local.settings.json exists
if (-not (Test-Path "api/local.settings.json")) {
    Write-Host "ERROR: api/local.settings.json not found!" -ForegroundColor Red
    Write-Host "This file contains your Cosmos DB credentials." -ForegroundColor Yellow
    Write-Host "Please run the setup again or contact support." -ForegroundColor Yellow
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local not found!" -ForegroundColor Red
    Write-Host "This file contains your frontend environment configuration." -ForegroundColor Yellow
    Write-Host "Please run the setup again or contact support." -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuration files found" -ForegroundColor Green
Write-Host ""

# Display configuration info
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:7071" -ForegroundColor Gray
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor Gray
Write-Host "  Cosmos DB:   cosmos-dreamspace-prod-20251013" -ForegroundColor Gray
Write-Host "  Storage:     stdreamspace" -ForegroundColor Gray
Write-Host ""

Write-Host "WARNING: Using PRODUCTION Cosmos DB data!" -ForegroundColor Yellow
Write-Host "Be careful when testing - changes affect real data." -ForegroundColor Yellow
Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
}

if (-not (Test-Path "api/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Push-Location api
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start the backend in a new window
Write-Host "Starting Backend API (Azure Functions)..." -ForegroundColor Green
$backendPath = Join-Path $PWD "api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend API Starting...' -ForegroundColor Cyan; npm start"

# Wait a bit for backend to start
Write-Host "Waiting for backend to initialize (10 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Start the frontend in a new window
Write-Host "Starting Frontend (Vite Dev Server)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Frontend Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify backend is running:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:7071/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  Check browser console (F12) for connection status" -ForegroundColor Gray
Write-Host "  Look for: Using Azure Cosmos DB for data persistence" -ForegroundColor Gray
Write-Host "  Both terminal windows will stay open for logs" -ForegroundColor Gray
Write-Host "  Press Ctrl+C in each window to stop services" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation: See LOCAL_DEV_SETUP.md" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
