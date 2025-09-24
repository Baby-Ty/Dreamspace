# Simple PowerShell Script to Set Up Teams Container for People Hub
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$CosmosAccountName
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up Cosmos DB containers for People Hub..." -ForegroundColor Blue
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Cosmos Account: $CosmosAccountName" -ForegroundColor Yellow

# Check if logged in to Azure
Write-Host "Checking Azure CLI authentication..." -ForegroundColor Blue
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Host "Not logged in to Azure CLI. Please run 'az login' first." -ForegroundColor Red
        exit 1
    }
    Write-Host "Authenticated as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "Azure CLI not found or not logged in. Please install Azure CLI and run 'az login'." -ForegroundColor Red
    exit 1
}

# Check if Cosmos account exists
Write-Host "Verifying Cosmos DB account exists..." -ForegroundColor Blue
try {
    $cosmosAccount = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --output json 2>$null | ConvertFrom-Json
    if (-not $cosmosAccount) {
        Write-Host "Cosmos DB account '$CosmosAccountName' not found in resource group '$ResourceGroupName'" -ForegroundColor Red
        exit 1
    }
    Write-Host "Found Cosmos DB account: $($cosmosAccount.name)" -ForegroundColor Green
} catch {
    Write-Host "Error checking Cosmos DB account. Please verify the account name and resource group." -ForegroundColor Red
    exit 1
}

# Check if dreamspace database exists
Write-Host "Checking if 'dreamspace' database exists..." -ForegroundColor Blue
try {
    $database = az cosmosdb sql database show --account-name $CosmosAccountName --resource-group $ResourceGroupName --name "dreamspace" --output json 2>$null | ConvertFrom-Json
    if (-not $database) {
        Write-Host "Database 'dreamspace' not found. Creating it..." -ForegroundColor Yellow
        az cosmosdb sql database create --account-name $CosmosAccountName --resource-group $ResourceGroupName --name "dreamspace" --output none
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to create database 'dreamspace'" -ForegroundColor Red
            exit 1
        }
        Write-Host "Created database 'dreamspace'" -ForegroundColor Green
    } else {
        Write-Host "Database 'dreamspace' already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking/creating database" -ForegroundColor Red
    exit 1
}

# Check if teams container exists
Write-Host "Checking if 'teams' container exists..." -ForegroundColor Blue
try {
    $teamsContainer = az cosmosdb sql container show --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "teams" --output json 2>$null | ConvertFrom-Json
    if (-not $teamsContainer) {
        Write-Host "Creating 'teams' container..." -ForegroundColor Blue
        az cosmosdb sql container create --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "teams" --partition-key-path "/managerId" --throughput 400 --output none
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to create 'teams' container" -ForegroundColor Red
            exit 1
        }
        Write-Host "Created 'teams' container with partition key '/managerId'" -ForegroundColor Green
    } else {
        Write-Host "Container 'teams' already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking/creating 'teams' container" -ForegroundColor Red
    exit 1
}

# Check if users container exists
Write-Host "Verifying 'users' container exists..." -ForegroundColor Blue
try {
    $usersContainer = az cosmosdb sql container show --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "users" --output json 2>$null | ConvertFrom-Json
    if (-not $usersContainer) {
        Write-Host "'users' container not found. Creating it..." -ForegroundColor Yellow
        az cosmosdb sql container create --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "users" --partition-key-path "/userId" --throughput 400 --output none
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to create 'users' container" -ForegroundColor Red
            exit 1
        }
        Write-Host "Created 'users' container with partition key '/userId'" -ForegroundColor Green
    } else {
        Write-Host "Container 'users' already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking/creating 'users' container" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "People Hub Cosmos DB Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "Database: dreamspace" -ForegroundColor White
Write-Host "Containers:" -ForegroundColor White
Write-Host "  • users (partition key: /userId)" -ForegroundColor White
Write-Host "  • teams (partition key: /managerId)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy your application to Azure Static Web Apps" -ForegroundColor White
Write-Host "2. Test the People Hub with live data" -ForegroundColor White
Write-Host ""
Write-Host "Script completed successfully!" -ForegroundColor Green
