# Dreamspace Teams Bot - Azure Setup Script
# This script provisions all Azure resources needed for the Teams bot

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-dreamspace",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$BotName = "dreamspace-teams-bot",
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionApp = "dreamspace-bot-func",
    
    [Parameter(Mandatory=$false)]
    [string]$CosmosAccountName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipCosmosContainers
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dreamspace Teams Bot - Azure Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate Azure CLI is installed
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Not logged into Azure. Running 'az login'..." -ForegroundColor Yellow
    az login
}

Write-Host "Current Azure subscription:" -ForegroundColor Green
az account show --query "{Name:name, SubscriptionId:id}" -o table
Write-Host ""

$continue = Read-Host "Continue with this subscription? (y/n)"
if ($continue -ne "y") {
    Write-Host "Exiting..." -ForegroundColor Yellow
    exit 0
}

# Generate unique storage account name
$randomSuffix = Get-Random -Maximum 9999
$StorageAccount = "dreamspacebot$randomSuffix"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "Location: $Location" -ForegroundColor White
Write-Host "Bot Name: $BotName" -ForegroundColor White
Write-Host "Function App: $FunctionApp" -ForegroundColor White
Write-Host "Storage Account: $StorageAccount" -ForegroundColor White
Write-Host ""

# Step 1: Create or verify Resource Group
Write-Host "Step 1: Checking resource group..." -ForegroundColor Cyan
$rgExists = az group exists -n $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor Yellow
    az group create -n $ResourceGroup -l $Location -o none
    Write-Host "✓ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✓ Resource group already exists" -ForegroundColor Green
}
Write-Host ""

# Step 2: Create Storage Account
Write-Host "Step 2: Creating storage account..." -ForegroundColor Cyan
az storage account create -n $StorageAccount -g $ResourceGroup -l $Location --sku Standard_LRS -o none
Write-Host "✓ Storage account created: $StorageAccount" -ForegroundColor Green
Write-Host ""

# Step 3: Create Function App
Write-Host "Step 3: Creating Function App..." -ForegroundColor Cyan
az functionapp create -g $ResourceGroup -n $FunctionApp `
    --storage-account $StorageAccount `
    --consumption-plan-location $Location `
    --runtime node `
    --runtime-version 18 `
    --functions-version 4 `
    -o none
Write-Host "✓ Function App created: $FunctionApp" -ForegroundColor Green
Write-Host ""

# Step 4: Create Azure AD App Registration
Write-Host "Step 4: Creating Azure AD App Registration..." -ForegroundColor Cyan
$AppName = "Dreamspace Teams Bot"
$AppId = az ad app create --display-name "$AppName" `
    --sign-in-audience AzureADMultipleOrgs `
    --query appId -o tsv

if (-not $AppId) {
    Write-Host "ERROR: Failed to create App Registration" -ForegroundColor Red
    exit 1
}

Write-Host "✓ App Registration created: $AppId" -ForegroundColor Green

# Create app secret
$AppSecret = az ad app credential reset --id $AppId --append `
    --display-name "bot-secret" `
    --query password -o tsv

Write-Host "✓ App secret generated" -ForegroundColor Green
Write-Host ""

# Step 5: Create Azure Bot Registration
Write-Host "Step 5: Creating Azure Bot..." -ForegroundColor Cyan
$BotEndpoint = "https://$FunctionApp.azurewebsites.net/api/messages"

az bot create --kind registration -g $ResourceGroup -n $BotName `
    --appid $AppId `
    --password "$AppSecret" `
    --endpoint $BotEndpoint `
    -o none

Write-Host "✓ Azure Bot created: $BotName" -ForegroundColor Green
Write-Host ""

# Step 6: Enable Teams Channel
Write-Host "Step 6: Enabling Teams channel..." -ForegroundColor Cyan
az bot msteams create -g $ResourceGroup -n $BotName -o none
Write-Host "✓ Teams channel enabled" -ForegroundColor Green
Write-Host ""

# Step 7: Get Cosmos DB credentials
Write-Host "Step 7: Retrieving Cosmos DB credentials..." -ForegroundColor Cyan

if (-not $CosmosAccountName) {
    Write-Host "Please enter your existing Cosmos DB account name:" -ForegroundColor Yellow
    $CosmosAccountName = Read-Host
}

$CosmosEndpoint = az cosmosdb show -n $CosmosAccountName -g $ResourceGroup --query documentEndpoint -o tsv
$CosmosKey = az cosmosdb keys list -n $CosmosAccountName -g $ResourceGroup --query primaryMasterKey -o tsv

if (-not $CosmosEndpoint -or -not $CosmosKey) {
    Write-Host "ERROR: Could not retrieve Cosmos DB credentials" -ForegroundColor Red
    Write-Host "Please verify the Cosmos DB account name and resource group" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Cosmos DB credentials retrieved" -ForegroundColor Green
Write-Host ""

# Step 8: Configure Function App Settings
Write-Host "Step 8: Configuring Function App settings..." -ForegroundColor Cyan
az functionapp config appsettings set -g $ResourceGroup -n $FunctionApp --settings `
    MicrosoftAppId=$AppId `
    "MicrosoftAppPassword=$AppSecret" `
    MicrosoftAppType=MultiTenant `
    "COSMOS_ENDPOINT=$CosmosEndpoint" `
    "COSMOS_KEY=$CosmosKey" `
    -o none

Write-Host "✓ Function App configured" -ForegroundColor Green
Write-Host ""

# Step 9: Create Cosmos DB Containers
if (-not $SkipCosmosContainers) {
    Write-Host "Step 9: Creating Cosmos DB containers..." -ForegroundColor Cyan
    
    # Check if containers already exist
    $botConversationsExists = az cosmosdb sql container show `
        --account-name $CosmosAccountName `
        --database-name dreamspace `
        --resource-group $ResourceGroup `
        --name botConversations `
        2>$null
    
    if (-not $botConversationsExists) {
        Write-Host "Creating container: botConversations" -ForegroundColor Yellow
        az cosmosdb sql container create `
            --account-name $CosmosAccountName `
            --database-name dreamspace `
            --resource-group $ResourceGroup `
            --name botConversations `
            --partition-key-path "/userId" `
            --throughput 400 `
            -o none
        Write-Host "✓ Container created: botConversations" -ForegroundColor Green
    } else {
        Write-Host "✓ Container already exists: botConversations" -ForegroundColor Green
    }
    
    $checkinsExists = az cosmosdb sql container show `
        --account-name $CosmosAccountName `
        --database-name dreamspace `
        --resource-group $ResourceGroup `
        --name checkins `
        2>$null
    
    if (-not $checkinsExists) {
        Write-Host "Creating container: checkins" -ForegroundColor Yellow
        az cosmosdb sql container create `
            --account-name $CosmosAccountName `
            --database-name dreamspace `
            --resource-group $ResourceGroup `
            --name checkins `
            --partition-key-path "/userId" `
            --throughput 400 `
            -o none
        Write-Host "✓ Container created: checkins" -ForegroundColor Green
    } else {
        Write-Host "✓ Container already exists: checkins" -ForegroundColor Green
    }
    
    Write-Host ""
} else {
    Write-Host "Step 9: Skipping Cosmos DB container creation" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Bot Configuration:" -ForegroundColor Cyan
Write-Host "  Bot Name: $BotName" -ForegroundColor White
Write-Host "  Bot ID (App ID): $AppId" -ForegroundColor White
Write-Host "  Endpoint: $BotEndpoint" -ForegroundColor White
Write-Host "  Function App: $FunctionApp" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy your bot code to the Function App:" -ForegroundColor White
Write-Host "     func azure functionapp publish $FunctionApp" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Test the bot endpoint:" -ForegroundColor White
Write-Host "     $BotEndpoint" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Update manifest/manifest.json with:" -ForegroundColor White
Write-Host "     - Replace {{MICROSOFT_APP_ID}} with: $AppId" -ForegroundColor Yellow
Write-Host "     - Replace {{FUNCTION_APP_DOMAIN}} with: $FunctionApp.azurewebsites.net" -ForegroundColor Yellow
Write-Host ""
Write-Host "  4. Package and upload to Teams Developer Portal" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Save these credentials securely!" -ForegroundColor Red
Write-Host "  App ID: $AppId" -ForegroundColor White
Write-Host "  App Secret: $AppSecret" -ForegroundColor White
Write-Host ""

