# Deploy API fixes to Azure Function App
# This deploys the updated function.json files with authLevel: "anonymous"

Write-Host "Deploying API fixes to Azure..." -ForegroundColor Cyan
Write-Host ""

$functionAppName = "func-dreamspace-prod"
$resourceGroup = "rg_Dreams2025Dev"

# Check if Azure CLI is installed
$azInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azInstalled) {
    Write-Host "[ERROR] Azure CLI is not installed!" -ForegroundColor Red
    exit 1
}

# Check if logged in
$account = az account show 2>&1 | ConvertFrom-Json
if (-not $account) {
    Write-Host "[ERROR] Not logged into Azure!" -ForegroundColor Red
    Write-Host "   Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Navigate to api directory
$apiPath = Join-Path $PSScriptRoot "api"
if (-not (Test-Path $apiPath)) {
    Write-Host "[ERROR] API directory not found: $apiPath" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying functions from: $apiPath" -ForegroundColor Cyan
Write-Host ""

try {
    # Deploy using Azure Functions Core Tools or zip deploy
    Write-Host "Creating deployment package..." -ForegroundColor Cyan
    
    # Change to api directory
    Push-Location $apiPath
    
    # Create a zip file for deployment
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $zipFile = Join-Path $env:TEMP "dreamspace-api-$timestamp.zip"
    
    Write-Host "   Packaging files to: $zipFile" -ForegroundColor Gray
    Compress-Archive -Path * -DestinationPath $zipFile -Force
    
    Write-Host "   Package created successfully" -ForegroundColor Green
    Write-Host ""
    
    # Deploy to Azure
    Write-Host "Deploying to Function App: $functionAppName" -ForegroundColor Cyan
    az functionapp deployment source config-zip `
        --resource-group $resourceGroup `
        --name $functionAppName `
        --src $zipFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Deployment completed!" -ForegroundColor Green
        Write-Host ""
        
        # Wait a moment for deployment to finish
        Write-Host "Waiting for deployment to complete..." -ForegroundColor Cyan
        Start-Sleep -Seconds 10
        
        # Restart Function App
        Write-Host "Restarting Function App..." -ForegroundColor Cyan
        az functionapp restart --name $functionAppName --resource-group $resourceGroup --output none
        
        Write-Host "[OK] Function App restarted" -ForegroundColor Green
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Deployment Summary:" -ForegroundColor Yellow
        Write-Host "   Function App: $functionAppName" -ForegroundColor White
        Write-Host "   Resource Group: $resourceGroup" -ForegroundColor White
        Write-Host "   Status: Deployed successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Changes deployed:" -ForegroundColor Yellow
        Write-Host "   - saveItem: authLevel changed to 'anonymous'" -ForegroundColor White
        Write-Host "   - batchSaveItems: authLevel changed to 'anonymous'" -ForegroundColor White
        Write-Host "   - getItems: authLevel changed to 'anonymous'" -ForegroundColor White
        Write-Host "   - deleteItem: authLevel changed to 'anonymous'" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Wait 30 seconds for deployment to fully complete" -ForegroundColor White
        Write-Host "   2. Test the API: .\TEST_SAVE_GOAL_API.ps1" -ForegroundColor White
        Write-Host "   3. Try saving a goal on the live site: https://dreamspace.tylerstewart.co.za" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "[ERROR] Deployment failed!" -ForegroundColor Red
        Write-Host "   Check the error messages above" -ForegroundColor Yellow
    }
    
    # Clean up
    Remove-Item $zipFile -Force -ErrorAction SilentlyContinue
    Pop-Location
    
} catch {
    Write-Host "[ERROR] Deployment failed:" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Yellow
    Pop-Location
}

Write-Host ""




