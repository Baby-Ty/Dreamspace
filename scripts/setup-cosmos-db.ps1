# PowerShell script to set up Azure Cosmos DB for DreamSpace
# Run this after creating your Static Web App

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "dreamspace-rg",
    
    [Parameter(Mandatory=$true)]
    [string]$CosmosAccountName = "dreamspace-cosmos-$(Get-Random -Maximum 9999)",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US 2"
)

Write-Host "🚀 Setting up Azure Cosmos DB for DreamSpace..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Cosmos Account: $CosmosAccountName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow

# Check if Azure CLI is installed and logged in
try {
    $account = az account show --query "name" -o tsv 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Please login to Azure CLI first: az login" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Logged in to Azure as: $account" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Create Cosmos DB account
Write-Host "📦 Creating Cosmos DB account..." -ForegroundColor Blue
$createResult = az cosmosdb create `
    --name $CosmosAccountName `
    --resource-group $ResourceGroupName `
    --default-consistency-level "Eventual" `
    --locations regionName="$Location" failoverPriority=0 isZoneRedundant=False `
    --enable-free-tier true `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Cosmos DB account" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cosmos DB account created successfully!" -ForegroundColor Green

# Create database
Write-Host "📊 Creating database 'dreamspace'..." -ForegroundColor Blue
az cosmosdb sql database create `
    --account-name $CosmosAccountName `
    --resource-group $ResourceGroupName `
    --name "dreamspace" `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database 'dreamspace' created!" -ForegroundColor Green

# Create container
Write-Host "📋 Creating container 'users'..." -ForegroundColor Blue
az cosmosdb sql container create `
    --account-name $CosmosAccountName `
    --database-name "dreamspace" `
    --resource-group $ResourceGroupName `
    --name "users" `
    --partition-key-path "/userId" `
    --throughput 400 `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create container" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container 'users' created!" -ForegroundColor Green

# Get connection details
Write-Host "🔑 Getting connection details..." -ForegroundColor Blue
$keys = az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroupName --type keys --output json | ConvertFrom-Json
$endpoint = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --query "documentEndpoint" -o tsv

Write-Host ""
Write-Host "🎉 Cosmos DB Setup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Connection Details (save these for later):" -ForegroundColor Yellow
Write-Host "Endpoint: $endpoint" -ForegroundColor White
Write-Host "Primary Key: $($keys.primaryMasterKey)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to your Azure Static Web App in the portal" -ForegroundColor White
Write-Host "2. Navigate to Configuration > Application settings" -ForegroundColor White
Write-Host "3. Add these environment variables:" -ForegroundColor White
Write-Host "   VITE_COSMOS_ENDPOINT=$endpoint" -ForegroundColor Cyan
Write-Host "   VITE_COSMOS_KEY=$($keys.primaryMasterKey)" -ForegroundColor Cyan
Write-Host "   VITE_APP_ENV=production" -ForegroundColor Cyan
Write-Host ""
Write-Host "💰 Estimated monthly cost: ~`$24 (400 RU/s provisioned throughput)" -ForegroundColor Yellow
Write-Host "💡 Free tier includes 400 RU/s and 5GB storage for the first account" -ForegroundColor Green
