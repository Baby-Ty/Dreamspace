# Simple Configuration Script for Azure Function App
# Configures Cosmos DB credentials

param(
    [string]$FunctionAppName = "func-dreamspace-prod",
    [string]$ResourceGroupName,
    [string]$CosmosAccountName,
    [string]$StorageAccountName
)

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Azure Function App - Cosmos DB Configuration" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking Azure CLI installation..." -ForegroundColor Yellow
try {
    $azCheck = az version 2>$null
    if (-not $azCheck) {
        Write-Host "ERROR: Azure CLI is not installed!" -ForegroundColor Red
        Write-Host "Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Azure CLI is not installed!" -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
Write-Host "Checking Azure login..." -ForegroundColor Yellow
try {
    $accountCheck = az account show 2>$null
    if (-not $accountCheck) {
        Write-Host "Not logged in. Opening browser for authentication..." -ForegroundColor Yellow
        az login
        $accountCheck = az account show
    }
    $account = $accountCheck | ConvertFrom-Json
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "Subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to login to Azure" -ForegroundColor Red
    exit 1
}

Write-Host ""

# If Resource Group not provided, find it
if (-not $ResourceGroupName) {
    Write-Host "Finding Function App resource group..." -ForegroundColor Yellow
    $funcApps = az functionapp list | ConvertFrom-Json
    $targetApp = $funcApps | Where-Object { $_.name -eq $FunctionAppName }
    
    if ($targetApp) {
        $ResourceGroupName = $targetApp.resourceGroup
        Write-Host "Found Function App in resource group: $ResourceGroupName" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Function App '$FunctionAppName' not found!" -ForegroundColor Red
        Write-Host "Available Function Apps:" -ForegroundColor Yellow
        $funcApps | ForEach-Object { Write-Host "  - $($_.name) (Resource Group: $($_.resourceGroup))" }
        exit 1
    }
}

# If Cosmos Account not provided, find it
if (-not $CosmosAccountName) {
    Write-Host "Finding Cosmos DB account..." -ForegroundColor Yellow
    $cosmosAccounts = az cosmosdb list --resource-group $ResourceGroupName | ConvertFrom-Json
    
    if ($cosmosAccounts.Count -eq 1) {
        $CosmosAccountName = $cosmosAccounts[0].name
        Write-Host "Found Cosmos DB account: $CosmosAccountName" -ForegroundColor Green
    } elseif ($cosmosAccounts.Count -gt 1) {
        Write-Host "Multiple Cosmos DB accounts found:" -ForegroundColor Yellow
        $cosmosAccounts | ForEach-Object { Write-Host "  - $($_.name)" }
        Write-Host "Please specify the account name with -CosmosAccountName parameter" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "ERROR: No Cosmos DB account found in resource group: $ResourceGroupName" -ForegroundColor Red
        exit 1
    }
}

# If Storage Account not provided, find it
if (-not $StorageAccountName) {
    Write-Host "Finding Storage account..." -ForegroundColor Yellow
    $storageAccounts = az storage account list --resource-group $ResourceGroupName | ConvertFrom-Json
    
    if ($storageAccounts.Count -eq 1) {
        $StorageAccountName = $storageAccounts[0].name
        Write-Host "Found Storage account: $StorageAccountName" -ForegroundColor Green
    } elseif ($storageAccounts.Count -gt 1) {
        Write-Host "Multiple Storage accounts found:" -ForegroundColor Yellow
        $storageAccounts | ForEach-Object { Write-Host "  - $($_.name)" }
        Write-Host "Please specify the account name with -StorageAccountName parameter" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "ERROR: No Storage account found in resource group: $ResourceGroupName" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "  Function App:    $FunctionAppName" -ForegroundColor White
Write-Host "  Resource Group:  $ResourceGroupName" -ForegroundColor White
Write-Host "  Cosmos DB:       $CosmosAccountName" -ForegroundColor White
Write-Host "  Storage Account: $StorageAccountName" -ForegroundColor White
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Proceed with configuration? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Configuration cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Get Cosmos DB credentials
Write-Host "Retrieving Cosmos DB credentials..." -ForegroundColor Yellow
try {
    $cosmosEndpoint = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --query "documentEndpoint" -o tsv
    if (-not $cosmosEndpoint) {
        throw "Failed to retrieve Cosmos DB endpoint"
    }
    Write-Host "Cosmos DB Endpoint: $cosmosEndpoint" -ForegroundColor Green
    
    $cosmosKey = az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroupName --query "primaryMasterKey" -o tsv
    if (-not $cosmosKey) {
        throw "Failed to retrieve Cosmos DB key"
    }
    $keyPreview = $cosmosKey.Substring(0, [Math]::Min(10, $cosmosKey.Length))
    Write-Host "Cosmos DB Key: ${keyPreview}..." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to retrieve Cosmos DB credentials: $_" -ForegroundColor Red
    exit 1
}

# Get Storage connection string
Write-Host "Retrieving Storage Account connection string..." -ForegroundColor Yellow
try {
    $storageConnectionString = az storage account show-connection-string --name $StorageAccountName --resource-group $ResourceGroupName --query "connectionString" -o tsv
    if (-not $storageConnectionString) {
        throw "Failed to retrieve Storage connection string"
    }
    Write-Host "Storage connection string retrieved" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to retrieve Storage connection string: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set environment variables in Function App
Write-Host "Configuring Function App environment variables..." -ForegroundColor Yellow
try {
    az functionapp config appsettings set `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --settings `
            "COSMOS_ENDPOINT=$cosmosEndpoint" `
            "COSMOS_KEY=$cosmosKey" `
            "AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString" `
        --output none
    
    Write-Host "Environment variables configured successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to configure environment variables: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " Configuration Complete!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Function App is restarting..." -ForegroundColor Yellow
Write-Host "Wait 30-60 seconds before testing..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Test the health endpoint:" -ForegroundColor Cyan
$healthUrl = "https://$FunctionAppName.azurewebsites.net/api/health"
Write-Host "  $healthUrl" -ForegroundColor White
Write-Host ""
Write-Host "What was configured:" -ForegroundColor Cyan
Write-Host "  COSMOS_ENDPOINT" -ForegroundColor Green
Write-Host "  COSMOS_KEY" -ForegroundColor Green
Write-Host "  AZURE_STORAGE_CONNECTION_STRING" -ForegroundColor Green
Write-Host ""
Write-Host "Your API should now be able to save user data to Cosmos DB!" -ForegroundColor Green
Write-Host ""

# Offer to open health endpoint
$openHealth = Read-Host "Open health endpoint in browser? (Y/N)"
if ($openHealth -eq "Y" -or $openHealth -eq "y") {
    Start-Process $healthUrl
}




