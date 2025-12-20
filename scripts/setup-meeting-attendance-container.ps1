# Setup Meeting Attendance Container in Cosmos DB
# Run this script to create the meeting_attendance container for storing team meeting attendance records

param(
    [string]$CosmosAccountName = $env:COSMOS_ACCOUNT_NAME,
    [string]$ResourceGroupName = $env:RESOURCE_GROUP_NAME
)

Write-Host "[INFO] Setting up Meeting Attendance Container" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Validate parameters
if (-not $CosmosAccountName) {
    Write-Host "[ERROR] Cosmos Account Name is required. Set COSMOS_ACCOUNT_NAME environment variable or pass -CosmosAccountName parameter" -ForegroundColor Red
    exit 1
}

if (-not $ResourceGroupName) {
    Write-Host "[ERROR] Resource Group Name is required. Set RESOURCE_GROUP_NAME environment variable or pass -ResourceGroupName parameter" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Cosmos Account: $CosmosAccountName" -ForegroundColor Gray
Write-Host "[INFO] Resource Group: $ResourceGroupName" -ForegroundColor Gray

# Check if Azure CLI is installed
try {
    $azVersion = az version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI not found"
    }
} catch {
    Write-Host "[ERROR] Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
$account = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Not logged in to Azure. Running az login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to log in to Azure" -ForegroundColor Red
        exit 1
    }
}

# Check if database exists
Write-Host "[INFO] Checking if dreamspace database exists..." -ForegroundColor Gray
$database = az cosmosdb sql database show --account-name $CosmosAccountName --resource-group $ResourceGroupName --name "dreamspace" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Database 'dreamspace' not found. Please create it first." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Database 'dreamspace' found" -ForegroundColor Green

# Create meeting_attendance container
$containerName = "meeting_attendance"
$partitionKey = "/teamId"

Write-Host "[INFO] Creating container '$containerName' with partition key '$partitionKey'..." -ForegroundColor Gray

$container = az cosmosdb sql container show --account-name $CosmosAccountName --resource-group $ResourceGroupName --database-name "dreamspace" --name $containerName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Container '$containerName' already exists" -ForegroundColor Yellow
} else {
    az cosmosdb sql container create `
        --account-name $CosmosAccountName `
        --resource-group $ResourceGroupName `
        --database-name "dreamspace" `
        --name $containerName `
        --partition-key-path $partitionKey `
        --throughput 400
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Container '$containerName' created successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create container '$containerName'" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[SUCCESS] Meeting Attendance Container Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] The meeting_attendance container will store:" -ForegroundColor Cyan
Write-Host "  - Meeting records with title, date, and attendees" -ForegroundColor White
Write-Host "  - Partitioned by teamId (managerId) for efficient queries" -ForegroundColor White
Write-Host "  - Each team's attendance history stored separately" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Coaches can now track meeting attendance for their teams!" -ForegroundColor Green

