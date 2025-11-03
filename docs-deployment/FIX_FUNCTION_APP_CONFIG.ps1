# Script to configure Azure Function App with Cosmos DB settings
# This fixes the empty response issue from saveItem API

param(
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppName = "func-dreamspace-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-dreamspace-prod"
)

Write-Host "🔧 Configuring Azure Function App: $FunctionAppName" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azInstalled) {
    Write-Host "❌ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "   Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$account = az account show 2>&1 | ConvertFrom-Json
if (-not $account) {
    Write-Host "❌ Not logged into Azure!" -ForegroundColor Red
    Write-Host "   Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Get Cosmos DB details
Write-Host "📋 Finding Cosmos DB account..." -ForegroundColor Cyan
$cosmosAccounts = az cosmosdb list --query "[?contains(name, 'dreamspace')]" | ConvertFrom-Json

if ($cosmosAccounts.Count -eq 0) {
    Write-Host "❌ No Cosmos DB accounts found matching 'dreamspace'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available Cosmos DB accounts:" -ForegroundColor Yellow
    az cosmosdb list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table
    Write-Host ""
    Write-Host "Please enter your Cosmos DB details manually:" -ForegroundColor Cyan
    $cosmosEndpoint = Read-Host "Enter COSMOS_ENDPOINT (e.g., https://your-account.documents.azure.com:443/)"
    $cosmosKey = Read-Host "Enter COSMOS_KEY (from Azure Portal → Cosmos DB → Keys)" -AsSecureString
    $cosmosKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($cosmosKey))
} else {
    # Use the first matching account
    $cosmosAccount = $cosmosAccounts[0]
    Write-Host "✅ Found Cosmos DB: $($cosmosAccount.name)" -ForegroundColor Green
    
    # Get endpoint
    $cosmosEndpoint = $cosmosAccount.documentEndpoint
    Write-Host "   Endpoint: $cosmosEndpoint" -ForegroundColor Gray
    
    # Get primary key
    Write-Host "   Getting access key..." -ForegroundColor Gray
    $keys = az cosmosdb keys list --name $cosmosAccount.name --resource-group $cosmosAccount.resourceGroup | ConvertFrom-Json
    $cosmosKeyPlain = $keys.primaryMasterKey
    Write-Host "   ✅ Access key retrieved" -ForegroundColor Green
}

Write-Host ""

# Get Storage Account details (for profile pictures)
Write-Host "📋 Finding Storage Account..." -ForegroundColor Cyan
$storageAccounts = az storage account list --query "[?contains(name, 'dreamspace')]" | ConvertFrom-Json

if ($storageAccounts.Count -gt 0) {
    $storageAccount = $storageAccounts[0]
    Write-Host "✅ Found Storage Account: $($storageAccount.name)" -ForegroundColor Green
    
    # Get connection string
    Write-Host "   Getting connection string..." -ForegroundColor Gray
    $storageKeys = az storage account keys list --account-name $storageAccount.name --resource-group $storageAccount.resourceGroup | ConvertFrom-Json
    $storageConnectionString = "DefaultEndpointsProtocol=https;AccountName=$($storageAccount.name);AccountKey=$($storageKeys[0].value);EndpointSuffix=core.windows.net"
    Write-Host "   ✅ Connection string retrieved" -ForegroundColor Green
} else {
    Write-Host "⚠️  No Storage Account found" -ForegroundColor Yellow
    Write-Host "   Profile picture uploads will not work until you configure storage" -ForegroundColor Yellow
    $storageConnectionString = $null
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Configure Function App
Write-Host "⚙️  Configuring Function App..." -ForegroundColor Cyan
Write-Host ""

try {
    # Set Cosmos DB endpoint
    Write-Host "   Setting COSMOS_ENDPOINT..." -ForegroundColor Gray
    az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroup --settings "COSMOS_ENDPOINT=$cosmosEndpoint" --output none
    Write-Host "   ✅ COSMOS_ENDPOINT configured" -ForegroundColor Green
    
    # Set Cosmos DB key
    Write-Host "   Setting COSMOS_KEY..." -ForegroundColor Gray
    az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroup --settings "COSMOS_KEY=$cosmosKeyPlain" --output none
    Write-Host "   ✅ COSMOS_KEY configured" -ForegroundColor Green
    
    # Set Storage connection string (if available)
    if ($storageConnectionString) {
        Write-Host "   Setting AZURE_STORAGE_CONNECTION_STRING..." -ForegroundColor Gray
        az functionapp config appsettings set --name $FunctionAppName --resource-group $ResourceGroup --settings "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString" --output none
        Write-Host "   ✅ AZURE_STORAGE_CONNECTION_STRING configured" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Function App configured successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Restart Function App to apply changes
    Write-Host "🔄 Restarting Function App to apply changes..." -ForegroundColor Cyan
    az functionapp restart --name $FunctionAppName --resource-group $ResourceGroup --output none
    Write-Host "✅ Function App restarted" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✨ Configuration complete!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Test the API: https://$FunctionAppName.azurewebsites.net/api/health" -ForegroundColor White
    Write-Host "   2. Try saving a goal on the live site" -ForegroundColor White
    Write-Host "   3. Check logs if issues persist:" -ForegroundColor White
    Write-Host "      az functionapp log tail --name $FunctionAppName --resource-group $ResourceGroup" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Error configuring Function App:" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can configure manually:" -ForegroundColor Cyan
    Write-Host "   1. Go to Azure Portal" -ForegroundColor White
    Write-Host "   2. Navigate to Function App: $FunctionAppName" -ForegroundColor White
    Write-Host "   3. Go to Settings → Configuration" -ForegroundColor White
    Write-Host "   4. Add these Application settings:" -ForegroundColor White
    Write-Host "      - COSMOS_ENDPOINT: $cosmosEndpoint" -ForegroundColor Gray
    Write-Host "      - COSMOS_KEY: [from Cosmos DB Keys]" -ForegroundColor Gray
    if ($storageConnectionString) {
        Write-Host "      - AZURE_STORAGE_CONNECTION_STRING: [from Storage Account]" -ForegroundColor Gray
    }
    Write-Host "   5. Save and restart the Function App" -ForegroundColor White
    Write-Host ""
}




