# ============================================================================
# Configure Azure Function App with Cosmos DB Settings
# ============================================================================
# This script adds the required Cosmos DB environment variables to your
# Azure Function App so it can connect to the database.
# ============================================================================

param(
    [string]$ResourceGroup = "rg-dreamspace-prod-eastus",
    [string]$FunctionAppName = "",  # Will auto-detect if not provided
    [string]$CosmosEndpoint = "",    # Will auto-detect if not provided
    [string]$CosmosKey = ""          # Will auto-detect if not provided
)

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  Configure Cosmos DB Settings for Azure Function App" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Find Function App
# ============================================================================
Write-Host "🔍 Looking for Function App in resource group: $ResourceGroup" -ForegroundColor Yellow

if ([string]::IsNullOrEmpty($FunctionAppName)) {
    $functionApps = az functionapp list `
        --resource-group $ResourceGroup `
        --query "[].name" `
        --output tsv
    
    if ([string]::IsNullOrEmpty($functionApps)) {
        Write-Host "❌ No Function Apps found in resource group: $ResourceGroup" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available resource groups:" -ForegroundColor Yellow
        az group list --query "[].name" --output table
        exit 1
    }
    
    $FunctionAppName = $functionApps.Split([Environment]::NewLine)[0].Trim()
}

Write-Host "✅ Found Function App: $FunctionAppName" -ForegroundColor Green

# ============================================================================
# STEP 2: Get Current Settings
# ============================================================================
Write-Host ""
Write-Host "📋 Checking current Function App settings..." -ForegroundColor Yellow

$currentSettings = az functionapp config appsettings list `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --output json | ConvertFrom-Json

$currentCosmosEndpoint = ($currentSettings | Where-Object { $_.name -eq "COSMOS_ENDPOINT" }).value
$currentCosmosKey = ($currentSettings | Where-Object { $_.name -eq "COSMOS_KEY" }).value

if ($currentCosmosEndpoint) {
    Write-Host "   Current COSMOS_ENDPOINT: $currentCosmosEndpoint" -ForegroundColor Gray
} else {
    Write-Host "   COSMOS_ENDPOINT: Not set ❌" -ForegroundColor Red
}

if ($currentCosmosKey) {
    Write-Host "   Current COSMOS_KEY: ****$(($currentCosmosKey.Substring([Math]::Max(0, $currentCosmosKey.Length - 4))))" -ForegroundColor Gray
} else {
    Write-Host "   COSMOS_KEY: Not set ❌" -ForegroundColor Red
}

# ============================================================================
# STEP 3: Find Cosmos DB Account
# ============================================================================
Write-Host ""
Write-Host "🔍 Looking for Cosmos DB account..." -ForegroundColor Yellow

if ([string]::IsNullOrEmpty($CosmosEndpoint) -or [string]::IsNullOrEmpty($CosmosKey)) {
    $cosmosAccounts = az cosmosdb list `
        --resource-group $ResourceGroup `
        --query "[].name" `
        --output tsv
    
    if ([string]::IsNullOrEmpty($cosmosAccounts)) {
        Write-Host "❌ No Cosmos DB accounts found in resource group: $ResourceGroup" -ForegroundColor Red
        
        if ([string]::IsNullOrEmpty($CosmosEndpoint) -or [string]::IsNullOrEmpty($CosmosKey)) {
            Write-Host ""
            Write-Host "Please provide Cosmos DB credentials manually:" -ForegroundColor Yellow
            Write-Host "  -CosmosEndpoint 'https://your-account.documents.azure.com:443/'" -ForegroundColor Gray
            Write-Host "  -CosmosKey 'your-primary-key'" -ForegroundColor Gray
            exit 1
        }
    } else {
        $cosmosAccountName = $cosmosAccounts.Split([Environment]::NewLine)[0].Trim()
        Write-Host "✅ Found Cosmos DB: $cosmosAccountName" -ForegroundColor Green
        
        # Get endpoint
        if ([string]::IsNullOrEmpty($CosmosEndpoint)) {
            $CosmosEndpoint = az cosmosdb show `
                --name $cosmosAccountName `
                --resource-group $ResourceGroup `
                --query "documentEndpoint" `
                --output tsv
        }
        
        # Get key
        if ([string]::IsNullOrEmpty($CosmosKey)) {
            $CosmosKey = az cosmosdb keys list `
                --name $cosmosAccountName `
                --resource-group $ResourceGroup `
                --query "primaryMasterKey" `
                --output tsv
        }
        
        Write-Host "   Endpoint: $CosmosEndpoint" -ForegroundColor Gray
        Write-Host "   Key: ****$(($CosmosKey.Substring([Math]::Max(0, $CosmosKey.Length - 4))))" -ForegroundColor Gray
    }
}

# ============================================================================
# STEP 4: Update Function App Settings
# ============================================================================
Write-Host ""
Write-Host "⚙️  Configuring Function App settings..." -ForegroundColor Yellow

az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings `
        "COSMOS_ENDPOINT=$CosmosEndpoint" `
        "COSMOS_KEY=$CosmosKey" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App settings configured successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure Function App settings" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 5: Verify Settings
# ============================================================================
Write-Host ""
Write-Host "✔️  Verifying configuration..." -ForegroundColor Yellow

$verifySettings = az functionapp config appsettings list `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --output json | ConvertFrom-Json

$verifiedEndpoint = ($verifySettings | Where-Object { $_.name -eq "COSMOS_ENDPOINT" }).value
$verifiedKey = ($verifySettings | Where-Object { $_.name -eq "COSMOS_KEY" }).value

Write-Host ""
Write-Host "Current Function App settings:" -ForegroundColor Green
Write-Host "  COSMOS_ENDPOINT: $verifiedEndpoint" -ForegroundColor Gray
Write-Host "  COSMOS_KEY: ****$(($verifiedKey.Substring([Math]::Max(0, $verifiedKey.Length - 4))))" -ForegroundColor Gray

# ============================================================================
# STEP 6: Restart Function App
# ============================================================================
Write-Host ""
Write-Host "🔄 Restarting Function App to apply changes..." -ForegroundColor Yellow

az functionapp restart `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App restarted successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to restart Function App (you may need to restart manually)" -ForegroundColor Yellow
}

# ============================================================================
# SUCCESS
# ============================================================================
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  ✅ Configuration Complete!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 30-60 seconds for Function App to restart" -ForegroundColor White
Write-Host "  2. Test the API endpoint:" -ForegroundColor White
Write-Host "     https://$FunctionAppName.azurewebsites.net/api/health" -ForegroundColor Gray
Write-Host "  3. Refresh your web application" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors:" -ForegroundColor Yellow
Write-Host "  - Check Azure Portal → Function App → Configuration" -ForegroundColor White
Write-Host "  - Verify COSMOS_ENDPOINT and COSMOS_KEY are set" -ForegroundColor White
Write-Host "  - Check Function App logs for detailed errors" -ForegroundColor White
Write-Host ""

