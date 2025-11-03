# ============================================================================
# Simple Azure Functions Deployment for DreamSpace
# ============================================================================
# This script deploys ONLY the Azure Functions API (not the web app)
# Use this when you just need to update/fix the API
# ============================================================================

param(
    [string]$FunctionAppName = "func-dreamspace-prod",
    [string]$ResourceGroup = "rg_Dreams2025Dev",
    [string]$CosmosEndpoint = "",  # Will auto-detect if empty
    [string]$CosmosKey = ""         # Will auto-detect if empty
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Deploy Azure Functions for DreamSpace                 ║" -ForegroundColor Cyan  
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check if Azure CLI is installed
try {
    $null = az version 2>&1
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if Functions Core Tools is installed
try {
    $null = func --version 2>&1
    Write-Host "✅ Azure Functions Core Tools is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure Functions Core Tools is not installed" -ForegroundColor Red
    Write-Host "Install with: npm install -g azure-functions-core-tools@4" -ForegroundColor Yellow
    exit 1
}

# Check if in correct directory
if (-not (Test-Path "api")) {
    Write-Host "❌ 'api' folder not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: Check if Function App exists
# ============================================================================
Write-Host "🔍 Checking if Function App exists..." -ForegroundColor Yellow

$functionAppExists = az functionapp show `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --query "name" `
    --output tsv 2>$null

if (-not $functionAppExists) {
    Write-Host "❌ Function App '$FunctionAppName' not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 To create the Function App, run these commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# Create storage account (required for Function App)" -ForegroundColor Gray
    Write-Host "az storage account create ``" -ForegroundColor White
    Write-Host "  --name stdreamspace ``" -ForegroundColor White
    Write-Host "  --resource-group $ResourceGroup ``" -ForegroundColor White
    Write-Host "  --location eastus2 ``" -ForegroundColor White
    Write-Host "  --sku Standard_LRS" -ForegroundColor White
    Write-Host ""
    Write-Host "# Create Function App" -ForegroundColor Gray
    Write-Host "az functionapp create ``" -ForegroundColor White
    Write-Host "  --resource-group $ResourceGroup ``" -ForegroundColor White
    Write-Host "  --consumption-plan-location eastus2 ``" -ForegroundColor White
    Write-Host "  --runtime node ``" -ForegroundColor White
    Write-Host "  --runtime-version 18 ``" -ForegroundColor White
    Write-Host "  --functions-version 4 ``" -ForegroundColor White
    Write-Host "  --name $FunctionAppName ``" -ForegroundColor White
    Write-Host "  --storage-account stdreamspace" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Function App found: $FunctionAppName" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 3: Get or Set Cosmos DB Credentials
# ============================================================================
Write-Host "🔍 Getting Cosmos DB credentials..." -ForegroundColor Yellow

# Auto-detect Cosmos DB account
$cosmosAccounts = az cosmosdb list `
    --resource-group $ResourceGroup `
    --query "[].name" `
    --output tsv

if ($cosmosAccounts) {
    $cosmosAccountName = $cosmosAccounts.Split([Environment]::NewLine)[0].Trim()
    Write-Host "✅ Found Cosmos DB: $cosmosAccountName" -ForegroundColor Green
    
    # Get endpoint and key
    if ([string]::IsNullOrEmpty($CosmosEndpoint)) {
        $CosmosEndpoint = az cosmosdb show `
            --name $cosmosAccountName `
            --resource-group $ResourceGroup `
            --query "documentEndpoint" `
            --output tsv
    }
    
    if ([string]::IsNullOrEmpty($CosmosKey)) {
        $CosmosKey = az cosmosdb keys list `
            --name $cosmosAccountName `
            --resource-group $ResourceGroup `
            --query "primaryMasterKey" `
            --output tsv
    }
    
    Write-Host "✅ Cosmos DB endpoint: $CosmosEndpoint" -ForegroundColor Green
    Write-Host "✅ Cosmos DB key: ****$(($CosmosKey.Substring($CosmosKey.Length - 4)))" -ForegroundColor Green
} else {
    Write-Host "⚠️  No Cosmos DB account found" -ForegroundColor Yellow
    if ([string]::IsNullOrEmpty($CosmosEndpoint) -or [string]::IsNullOrEmpty($CosmosKey)) {
        Write-Host "❌ Cosmos DB credentials required but not provided" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ============================================================================
# STEP 4: Configure Function App Settings
# ============================================================================
Write-Host "⚙️  Configuring Function App settings..." -ForegroundColor Yellow

az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings `
        COSMOS_ENDPOINT="$CosmosEndpoint" `
        COSMOS_KEY="$CosmosKey" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App settings configured" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure Function App settings" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 5: Deploy Functions
# ============================================================================
Write-Host "🚀 Deploying functions to Azure..." -ForegroundColor Yellow
Write-Host "This may take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

# Navigate to api folder
Push-Location api

# Deploy using func
func azure functionapp publish $FunctionAppName --javascript

$deploySuccess = $LASTEXITCODE -eq 0

# Return to root
Pop-Location

if ($deploySuccess) {
    Write-Host ""
    Write-Host "✅ Functions deployed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Function deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 6: Test the Deployment
# ============================================================================
Write-Host "🧪 Testing API endpoints..." -ForegroundColor Yellow

$functionAppUrl = az functionapp show `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --query "defaultHostName" `
    --output tsv

if ($functionAppUrl) {
    $healthUrl = "https://$functionAppUrl/api/health"
    Write-Host "Testing: $healthUrl" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health check passed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Health check returned: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not reach health endpoint (may take a minute to warm up)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================================================
# STEP 7: Show Results
# ============================================================================
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ DEPLOYMENT COMPLETE                                 ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Function App URL:" -ForegroundColor Cyan
Write-Host "  https://$functionAppUrl" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "  Health:        https://$functionAppUrl/api/health" -ForegroundColor White
Write-Host "  Get User Data: https://$functionAppUrl/api/getUserData/{userId}" -ForegroundColor White
Write-Host "  Save User Data: https://$functionAppUrl/api/saveUserData/{userId}" -ForegroundColor White
Write-Host "  Get All Users: https://$functionAppUrl/api/getAllUsers" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test the API: Visit https://$functionAppUrl/api/health" -ForegroundColor White
Write-Host "  2. Or use diagnostic page: https://dreamspace.tylerstewart.co.za/api-diagnostic.html" -ForegroundColor White
Write-Host "  3. Seed Sarah's data: node scripts/seed-sarah-demo-data.js" -ForegroundColor White
Write-Host "  4. Test demo login on your site" -ForegroundColor White
Write-Host ""

# Save deployment info
$deploymentInfo = @"
DREAMSPACE FUNCTIONS DEPLOYMENT
================================
Date: $(Get-Date)
Function App: $FunctionAppName
Resource Group: $ResourceGroup
URL: https://$functionAppUrl

Cosmos DB:
  Endpoint: $CosmosEndpoint
  
Endpoints:
  - https://$functionAppUrl/api/health
  - https://$functionAppUrl/api/getUserData/{userId}
  - https://$functionAppUrl/api/saveUserData/{userId}
  - https://$functionAppUrl/api/getAllUsers
  
Next Steps:
1. Test API: https://$functionAppUrl/api/health
2. Seed demo data: node scripts/seed-sarah-demo-data.js https://$functionAppUrl/api
3. Test demo login
"@

$deploymentFile = "DEPLOYMENT-FUNCTIONS-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$deploymentInfo | Out-File $deploymentFile -Encoding UTF8

Write-Host "💾 Deployment info saved to: $deploymentFile" -ForegroundColor Green
Write-Host ""

