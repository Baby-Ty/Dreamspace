# Script to create the prompts container in Cosmos DB
# Usage: .\scripts\setup-prompts-container.ps1

param(
    [string]$CosmosAccountName = "",
    [string]$ResourceGroupName = ""
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorText {
    param([string]$Text, [string]$Color)
    Write-Host $Text -ForegroundColor $Color
}

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-ColorText "[ERROR] Azure CLI not found. Please install it first." $Red
    exit 1
}

# Get Cosmos account name from environment or parameter
if ([string]::IsNullOrEmpty($CosmosAccountName)) {
    $CosmosAccountName = $env:COSMOS_ACCOUNT_NAME
    if ([string]::IsNullOrEmpty($CosmosAccountName)) {
        Write-ColorText "[WARNING] Cosmos account name not provided. Please set COSMOS_ACCOUNT_NAME environment variable or pass -CosmosAccountName parameter" $Yellow
        $CosmosAccountName = Read-Host "Enter Cosmos DB account name"
    }
}

# Get resource group from environment or parameter
if ([string]::IsNullOrEmpty($ResourceGroupName)) {
    $ResourceGroupName = $env:RESOURCE_GROUP_NAME
    if ([string]::IsNullOrEmpty($ResourceGroupName)) {
        Write-ColorText "[WARNING] Resource group not provided. Please set RESOURCE_GROUP_NAME environment variable or pass -ResourceGroupName parameter" $Yellow
        $ResourceGroupName = Read-Host "Enter Resource Group name"
    }
}

Write-ColorText "[INFO] Setting up prompts container in Cosmos DB" $Blue
Write-ColorText "   Account: $CosmosAccountName" $Blue
Write-ColorText "   Resource Group: $ResourceGroupName" $Blue
Write-ColorText "   Database: dreamspace" $Blue
Write-Host ""

# Check if database exists
Write-ColorText "[INFO] Verifying 'dreamspace' database exists..." $Blue
try {
    $database = az cosmosdb sql database show --account-name $CosmosAccountName --resource-group $ResourceGroupName --name "dreamspace" --output json 2>$null | ConvertFrom-Json
    if (-not $database) {
        Write-ColorText "[ERROR] Database 'dreamspace' not found. Please create it first." $Red
        exit 1
    }
    Write-ColorText "[SUCCESS] Database 'dreamspace' exists" $Green
} catch {
    Write-ColorText "[ERROR] Error checking database" $Red
    exit 1
}

# Check if prompts container exists
Write-ColorText "[INFO] Checking if 'prompts' container exists..." $Blue
try {
    $promptsContainer = az cosmosdb sql container show --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "prompts" --output json 2>$null | ConvertFrom-Json
    if (-not $promptsContainer) {
        Write-ColorText "[INFO] Creating 'prompts' container..." $Blue
        az cosmosdb sql container create `
            --account-name $CosmosAccountName `
            --database-name "dreamspace" `
            --resource-group $ResourceGroupName `
            --name "prompts" `
            --partition-key-path "/partitionKey" `
            --throughput 400 `
            --output none
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "[ERROR] Failed to create 'prompts' container" $Red
            exit 1
        }
        Write-ColorText "[SUCCESS] Created 'prompts' container with partition key '/partitionKey'" $Green
    } else {
        Write-ColorText "[SUCCESS] Container 'prompts' already exists" $Green
    }
} catch {
    Write-ColorText "[ERROR] Error checking/creating 'prompts' container" $Red
    exit 1
}

Write-Host ""
Write-ColorText "[SUCCESS] Prompts container setup complete!" $Green
Write-ColorText "   Container: prompts" $Green
Write-ColorText "   Partition Key: /partitionKey" $Green
Write-Host ""
Write-ColorText "[INFO] The prompts container will be automatically seeded with default prompts on first use." $Blue
