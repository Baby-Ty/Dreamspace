# Configure Azure Function App with Cosmos DB Credentials
# This script retrieves Cosmos DB credentials and configures the Function App

param(
    [Parameter(Mandatory=$false)]
    [string]$FunctionAppName = "func-dreamspace-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$CosmosAccountName,
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountName
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Azure Function App - Cosmos DB Configuration Script       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "🔍 Checking Azure CLI installation..." -ForegroundColor Yellow
$azVersion = az version 2>$null | ConvertFrom-Json
if (-not $azVersion) {
    Write-Host "❌ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "📥 Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Azure CLI installed: $($azVersion.'azure-cli')" -ForegroundColor Green

# Check if logged in to Azure
Write-Host "🔐 Checking Azure login..." -ForegroundColor Yellow
$accountInfo = az account show 2>$null | ConvertFrom-Json
if (-not $accountInfo) {
    Write-Host "⚠️  Not logged in to Azure. Opening browser for authentication..." -ForegroundColor Yellow
    az login
    $accountInfo = az account show | ConvertFrom-Json
}
Write-Host "✅ Logged in as: $($accountInfo.user.name)" -ForegroundColor Green
Write-Host "✅ Subscription: $($accountInfo.name)" -ForegroundColor Green
Write-Host ""

# If Resource Group not provided, try to find it
if (-not $ResourceGroupName) {
    Write-Host "🔍 Finding Function App resource group..." -ForegroundColor Yellow
    $functionApp = az functionapp list --query "[?name=='$FunctionAppName'] | [0]" | ConvertFrom-Json
    if ($functionApp) {
        $ResourceGroupName = $functionApp.resourceGroup
        Write-Host "✅ Found Function App in resource group: $ResourceGroupName" -ForegroundColor Green
    } else {
        Write-Host "❌ Function App '$FunctionAppName' not found!" -ForegroundColor Red
        Write-Host "💡 Available Function Apps in subscription:" -ForegroundColor Yellow
        az functionapp list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table
        exit 1
    }
}

# If Cosmos Account not provided, try to find it
if (-not $CosmosAccountName) {
    Write-Host "🔍 Finding Cosmos DB account..." -ForegroundColor Yellow
    $cosmosAccounts = az cosmosdb list --resource-group $ResourceGroupName --query "[].name" -o tsv
    if ($cosmosAccounts) {
        $cosmosAccountsArray = $cosmosAccounts -split "`n"
        if ($cosmosAccountsArray.Count -eq 1) {
            $CosmosAccountName = $cosmosAccountsArray[0].Trim()
            Write-Host "✅ Found Cosmos DB account: $CosmosAccountName" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Multiple Cosmos DB accounts found:" -ForegroundColor Yellow
            $cosmosAccountsArray | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
            Write-Host "Please specify the account name with -CosmosAccountName parameter" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "❌ No Cosmos DB account found in resource group: $ResourceGroupName" -ForegroundColor Red
        exit 1
    }
}

# If Storage Account not provided, try to find it
if (-not $StorageAccountName) {
    Write-Host "🔍 Finding Storage account..." -ForegroundColor Yellow
    $storageAccounts = az storage account list --resource-group $ResourceGroupName --query "[].name" -o tsv
    if ($storageAccounts) {
        $storageAccountsArray = $storageAccounts -split "`n"
        if ($storageAccountsArray.Count -eq 1) {
            $StorageAccountName = $storageAccountsArray[0].Trim()
            Write-Host "✅ Found Storage account: $StorageAccountName" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Multiple Storage accounts found:" -ForegroundColor Yellow
            $storageAccountsArray | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
            Write-Host "Please specify the account name with -StorageAccountName parameter" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "❌ No Storage account found in resource group: $ResourceGroupName" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "   Function App:    $FunctionAppName" -ForegroundColor White
Write-Host "   Resource Group:  $ResourceGroupName" -ForegroundColor White
Write-Host "   Cosmos DB:       $CosmosAccountName" -ForegroundColor White
Write-Host "   Storage Account: $StorageAccountName" -ForegroundColor White
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Proceed with configuration? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "❌ Configuration cancelled" -ForegroundColor Yellow
    exit 0
}

# Get Cosmos DB credentials
Write-Host ""
Write-Host "📦 Retrieving Cosmos DB credentials..." -ForegroundColor Yellow
try {
    $cosmosEndpoint = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --query "documentEndpoint" -o tsv
    if (-not $cosmosEndpoint) {
        throw "Failed to retrieve Cosmos DB endpoint"
    }
    Write-Host "✅ Cosmos DB Endpoint: $cosmosEndpoint" -ForegroundColor Green
    
    $cosmosKey = az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroupName --query "primaryMasterKey" -o tsv
    if (-not $cosmosKey) {
        throw "Failed to retrieve Cosmos DB key"
    }
    Write-Host "✅ Cosmos DB Key: $($cosmosKey.Substring(0, 10))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to retrieve Cosmos DB credentials: $_" -ForegroundColor Red
    exit 1
}

# Get Storage connection string
Write-Host ""
Write-Host "📦 Retrieving Storage Account connection string..." -ForegroundColor Yellow
try {
    $storageConnectionString = az storage account show-connection-string --name $StorageAccountName --resource-group $ResourceGroupName --query "connectionString" -o tsv
    if (-not $storageConnectionString) {
        throw "Failed to retrieve Storage connection string"
    }
    Write-Host "✅ Storage connection string retrieved" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to retrieve Storage connection string: $_" -ForegroundColor Red
    exit 1
}

# Set environment variables in Function App
Write-Host ""
Write-Host "⚙️  Configuring Function App environment variables..." -ForegroundColor Yellow
try {
    az functionapp config appsettings set `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --settings `
            "COSMOS_ENDPOINT=$cosmosEndpoint" `
            "COSMOS_KEY=$cosmosKey" `
            "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString" `
        --output none
    
    Write-Host "✅ Environment variables configured successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to configure environment variables: $_" -ForegroundColor Red
    exit 1
}

# Display success message
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   ✅ Configuration Complete!                 ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Function App is restarting..." -ForegroundColor Yellow
Write-Host "⏳ Wait 30-60 seconds before testing..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Test the health endpoint:" -ForegroundColor Cyan
Write-Host "   https://$FunctionAppName.azurewebsites.net/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📝 What was configured:" -ForegroundColor Cyan
Write-Host "   ✅ COSMOS_ENDPOINT" -ForegroundColor Green
Write-Host "   ✅ COSMOS_KEY" -ForegroundColor Green
Write-Host "   ✅ AZURE_STORAGE_CONNECTION_STRING" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your API should now be able to save user data to Cosmos DB!" -ForegroundColor Green
Write-Host ""

# Offer to open health endpoint
$openHealth = Read-Host "Open health endpoint in browser? (Y/N)"
if ($openHealth -eq 'Y' -or $openHealth -eq 'y') {
    $healthUrl = "https://$FunctionAppName.azurewebsites.net/api/health"
    Start-Process $healthUrl
}

