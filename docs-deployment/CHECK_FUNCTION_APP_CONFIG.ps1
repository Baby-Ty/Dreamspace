# Script to check Azure Function App configuration
# This helps diagnose why saveItem API is returning empty responses

Write-Host "Checking Azure Function App Configuration..." -ForegroundColor Cyan
Write-Host ""

# Function App name (adjust if different)
$functionAppName = "func-dreamspace-prod"

# Auto-detect resource group
Write-Host "Finding Function App..." -ForegroundColor Cyan
$functionApps = az functionapp list --query "[?name=='$functionAppName']" | ConvertFrom-Json
if ($functionApps -and $functionApps.Count -gt 0) {
    $resourceGroup = $functionApps[0].resourceGroup
    Write-Host "[OK] Found Function App: $functionAppName in $resourceGroup" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Could not find Function App: $functionAppName" -ForegroundColor Red
    exit 1
}

Write-Host "Checking configuration for: $functionAppName" -ForegroundColor Yellow
Write-Host ""

# Check if Azure CLI is installed
$azInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azInstalled) {
    Write-Host "[ERROR] Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "   Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "Checking Azure login..." -ForegroundColor Cyan
$account = az account show 2>&1 | ConvertFrom-Json
if (-not $account) {
    Write-Host "[ERROR] Not logged into Azure!" -ForegroundColor Red
    Write-Host "   Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# List all function apps (to verify name)
Write-Host "Available Function Apps:" -ForegroundColor Cyan
az functionapp list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table
Write-Host ""

# Get function app settings
Write-Host "Current Configuration:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Gray

try {
    $settings = az functionapp config appsettings list --name $functionAppName --resource-group $resourceGroup 2>&1 | ConvertFrom-Json
    
    if ($settings) {
        # Check for required variables
        $cosmosEndpoint = $settings | Where-Object { $_.name -eq "COSMOS_ENDPOINT" }
        $cosmosKey = $settings | Where-Object { $_.name -eq "COSMOS_KEY" }
        $storageConnection = $settings | Where-Object { $_.name -eq "AZURE_STORAGE_CONNECTION_STRING" }
        
        Write-Host ""
        Write-Host "Required Environment Variables:" -ForegroundColor Yellow
        Write-Host ""
        
        # COSMOS_ENDPOINT
        if ($cosmosEndpoint) {
            Write-Host "  [OK] COSMOS_ENDPOINT: $($cosmosEndpoint.value.Substring(0, [Math]::Min(50, $cosmosEndpoint.value.Length)))..." -ForegroundColor Green
        } else {
            Write-Host "  [MISSING] COSMOS_ENDPOINT: NOT SET" -ForegroundColor Red
        }
        
        # COSMOS_KEY
        if ($cosmosKey) {
            Write-Host "  [OK] COSMOS_KEY: [CONFIGURED - $($cosmosKey.value.Length) chars]" -ForegroundColor Green
        } else {
            Write-Host "  [MISSING] COSMOS_KEY: NOT SET" -ForegroundColor Red
        }
        
        # AZURE_STORAGE_CONNECTION_STRING
        if ($storageConnection) {
            Write-Host "  [OK] AZURE_STORAGE_CONNECTION_STRING: [CONFIGURED]" -ForegroundColor Green
        } else {
            Write-Host "  [WARNING] AZURE_STORAGE_CONNECTION_STRING: NOT SET (needed for profile pictures)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Gray
        Write-Host ""
        
        if (-not $cosmosEndpoint -or -not $cosmosKey) {
            Write-Host "[ISSUE FOUND]" -ForegroundColor Red
            Write-Host "   The Function App is missing Cosmos DB configuration." -ForegroundColor Yellow
            Write-Host "   This is why saveItem API is returning empty responses!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "To fix this, you need to:" -ForegroundColor Cyan
            Write-Host "   1. Get your Cosmos DB connection details from Azure Portal" -ForegroundColor White
            Write-Host "   2. Run FIX_FUNCTION_APP_CONFIG.ps1 to set them up" -ForegroundColor White
            Write-Host "   OR manually add them in Azure Portal:" -ForegroundColor White
            Write-Host "      Portal -> Function App -> Settings -> Configuration -> Application settings" -ForegroundColor Gray
            Write-Host ""
        } else {
            Write-Host "[OK] All required variables are configured!" -ForegroundColor Green
            Write-Host ""
            Write-Host "If you're still seeing errors, check:" -ForegroundColor Cyan
            Write-Host "   1. Cosmos DB firewall settings (allow Azure services)" -ForegroundColor White
            Write-Host "   2. Function App logs:" -ForegroundColor White
            Write-Host "      az functionapp log tail --name $functionAppName --resource-group $resourceGroup" -ForegroundColor Gray
            Write-Host "   3. Restart the Function App:" -ForegroundColor White
            Write-Host "      az functionapp restart --name $functionAppName --resource-group $resourceGroup" -ForegroundColor Gray
            Write-Host ""
        }
        
    } else {
        Write-Host "[ERROR] Could not retrieve Function App settings" -ForegroundColor Red
        Write-Host "   Function App: $functionAppName" -ForegroundColor Yellow
        Write-Host "   Resource Group: $resourceGroup" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Make sure the Function App name and resource group are correct." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "[ERROR] Error checking Function App configuration:" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Check that:" -ForegroundColor Cyan
    Write-Host "   - Function App name is correct: $functionAppName" -ForegroundColor White
    Write-Host "   - Resource group is correct: $resourceGroup" -ForegroundColor White
    Write-Host "   - You have access to the resource" -ForegroundColor White
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Gray
Write-Host "Check complete!" -ForegroundColor Cyan
