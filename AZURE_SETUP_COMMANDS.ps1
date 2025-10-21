# ============================================================================
# Azure Dreamspace Setup - PowerShell ISE Commands
# ============================================================================
# This script contains all commands needed to provision Azure resources
# for the new tenant deployment.
#
# Run these commands one section at a time in PowerShell ISE
# Review output after each section before proceeding to the next
# ============================================================================

# ============================================================================
# SECTION 1: PREREQUISITES CHECK
# ============================================================================
Write-Host "`n=== SECTION 1: Prerequisites Check ===" -ForegroundColor Cyan

# Check Azure CLI version
Write-Host "`nChecking Azure CLI..." -ForegroundColor Yellow
az version --output table

# If Azure CLI not installed, download from:
# https://aka.ms/InstallAzureCLIDirect

# ============================================================================
# SECTION 2: CONFIGURATION VARIABLES
# ============================================================================
Write-Host "`n=== SECTION 2: Configuration Variables ===" -ForegroundColor Cyan

# ⚠️ REQUIRED: Update these values for your environment
$TenantId = "YOUR_TENANT_ID_HERE"                    # Azure Tenant ID
$SubscriptionId = "YOUR_SUBSCRIPTION_ID_HERE"        # Azure Subscription ID

# Resource names (can customize or use defaults)
$ResourceGroup = "rg-dreamspace-prod-eastus"
$Location = "eastus"
$Timestamp = Get-Date -Format "yyyyMMdd"
$CosmosAccount = "cosmos-dreamspace-prod-$Timestamp"
$EnableFreeTier = $true  # Set to $false if free tier already used

# Display configuration
Write-Host "`nConfiguration:" -ForegroundColor Green
Write-Host "  Tenant ID: $TenantId"
Write-Host "  Subscription: $SubscriptionId"
Write-Host "  Resource Group: $ResourceGroup"
Write-Host "  Location: $Location"
Write-Host "  Cosmos Account: $CosmosAccount"
Write-Host "  Enable Free Tier: $EnableFreeTier"

# ============================================================================
# SECTION 3: AZURE LOGIN
# ============================================================================
Write-Host "`n=== SECTION 3: Azure Login ===" -ForegroundColor Cyan

# Login to Azure with your tenant
Write-Host "`nLogging in to Azure..." -ForegroundColor Yellow
az login --tenant $TenantId

# Set default subscription
Write-Host "`nSetting subscription..." -ForegroundColor Yellow
az account set --subscription $SubscriptionId

# Verify login
Write-Host "`nVerifying account..." -ForegroundColor Yellow
az account show --output table

# ============================================================================
# SECTION 4: CREATE RESOURCE GROUP
# ============================================================================
Write-Host "`n=== SECTION 4: Create Resource Group ===" -ForegroundColor Cyan

# Create resource group
Write-Host "`nCreating resource group: $ResourceGroup" -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $Location `
    --output table

# Verify resource group
Write-Host "`nVerifying resource group..." -ForegroundColor Yellow
az group show --name $ResourceGroup --output table

# ============================================================================
# SECTION 5: CREATE COSMOS DB ACCOUNT
# ============================================================================
Write-Host "`n=== SECTION 5: Create Cosmos DB Account ===" -ForegroundColor Cyan
Write-Host "⚠️  This will take 5-10 minutes" -ForegroundColor Yellow

# Build free tier parameter
$freeTierParam = if ($EnableFreeTier) { "--enable-free-tier true" } else { "--enable-free-tier false" }

# Create Cosmos DB account
Write-Host "`nCreating Cosmos DB account: $CosmosAccount" -ForegroundColor Yellow
Write-Host "Start time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray

$cosmosCreateCmd = @"
az cosmosdb create ``
    --name $CosmosAccount ``
    --resource-group $ResourceGroup ``
    --locations regionName=$Location ``
    --default-consistency-level Session ``
    $freeTierParam ``
    --output table
"@

Write-Host "`nCommand:" -ForegroundColor Gray
Write-Host $cosmosCreateCmd -ForegroundColor Gray
Write-Host ""

# Execute
Invoke-Expression $cosmosCreateCmd

Write-Host "End time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray

# Verify Cosmos account
Write-Host "`nVerifying Cosmos DB account..." -ForegroundColor Yellow
az cosmosdb show --name $CosmosAccount --resource-group $ResourceGroup --output table

# ============================================================================
# SECTION 6: CREATE COSMOS DATABASE
# ============================================================================
Write-Host "`n=== SECTION 6: Create Cosmos Database ===" -ForegroundColor Cyan

# Create database with shared throughput
Write-Host "`nCreating database: dreamspace" -ForegroundColor Yellow
az cosmosdb sql database create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --name dreamspace `
    --throughput 400 `
    --output table

# Verify database
Write-Host "`nVerifying database..." -ForegroundColor Yellow
az cosmosdb sql database show `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --name dreamspace `
    --output table

# ============================================================================
# SECTION 7: CREATE USERS CONTAINER
# ============================================================================
Write-Host "`n=== SECTION 7: Create Users Container ===" -ForegroundColor Cyan

# Create users container with /id partition key
Write-Host "`nCreating container: users (partition key: /id)" -ForegroundColor Yellow
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name users `
    --partition-key-path "/id" `
    --output table

# ⚠️ CRITICAL: Partition key MUST be /id (not /userId)
Write-Host "`n⚠️  IMPORTANT: Partition key is /id" -ForegroundColor Red

# Verify container
Write-Host "`nVerifying users container..." -ForegroundColor Yellow
az cosmosdb sql container show `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name users `
    --output table

# ============================================================================
# SECTION 8: CREATE ITEMS CONTAINER
# ============================================================================
Write-Host "`n=== SECTION 8: Create Items Container ===" -ForegroundColor Cyan

# Create items container for dreams, goals, scoring entries, etc.
Write-Host "`nCreating container: items (partition key: /userId)" -ForegroundColor Yellow
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name items `
    --partition-key-path "/userId" `
    --output table

# Verify container
Write-Host "`nVerifying items container..." -ForegroundColor Yellow
az cosmosdb sql container show `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name items `
    --output table

# ============================================================================
# SECTION 9: CREATE TEAMS CONTAINER (OPTIONAL)
# ============================================================================
Write-Host "`n=== SECTION 9: Create Teams Container (Optional) ===" -ForegroundColor Cyan

# Create teams container
Write-Host "`nCreating container: teams (partition key: /managerId)" -ForegroundColor Yellow
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name teams `
    --partition-key-path "/managerId" `
    --output table

# Verify container
Write-Host "`nVerifying teams container..." -ForegroundColor Yellow
az cosmosdb sql container show `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name teams `
    --output table

# ============================================================================
# SECTION 10: GET COSMOS DB CREDENTIALS
# ============================================================================
Write-Host "`n=== SECTION 10: Get Cosmos DB Credentials ===" -ForegroundColor Cyan

# Get Cosmos endpoint
Write-Host "`nRetrieving Cosmos DB endpoint..." -ForegroundColor Yellow
$CosmosEndpoint = az cosmosdb show `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --query "documentEndpoint" `
    --output tsv

Write-Host "Cosmos Endpoint: $CosmosEndpoint" -ForegroundColor Green

# Get Cosmos primary key
Write-Host "`nRetrieving Cosmos DB primary key..." -ForegroundColor Yellow
$CosmosPrimaryKey = az cosmosdb keys list `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --type keys `
    --query "primaryMasterKey" `
    --output tsv

Write-Host "Primary Key: $($CosmosPrimaryKey.Substring(0,10))... (hidden)" -ForegroundColor Green

# ============================================================================
# SECTION 10: SAVE CREDENTIALS TO FILE
# ============================================================================
Write-Host "`n=== SECTION 10: Save Credentials ===" -ForegroundColor Cyan

$outputFile = "deployment-credentials-$Timestamp.txt"

$credentials = @"
DREAMSPACE DEPLOYMENT CREDENTIALS
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

⚠️  IMPORTANT: Keep this file secure and do not commit to source control!

RESOURCE GROUP
--------------
Name: $ResourceGroup
Location: $Location

COSMOS DB
---------
Account Name: $CosmosAccount
Endpoint: $CosmosEndpoint
Primary Key: $CosmosPrimaryKey
Database: dreamspace
Containers: 
  - users (partition key: /id)
  - teams (partition key: /managerId)

NEXT STEPS
----------
1. Create Entra ID App Registration (Manual - see docs)
2. Create Azure Static Web App (Manual - see docs)
3. Configure application settings with credentials above
4. Update code with new client ID and tenant ID
5. Deploy via GitHub Actions

See docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md for complete instructions.
"@

$credentials | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`nCredentials saved to: $outputFile" -ForegroundColor Green
Write-Host "⚠️  Add this file to .gitignore!" -ForegroundColor Red

# ============================================================================
# SECTION 11: SUMMARY
# ============================================================================
Write-Host "`n=== SECTION 11: Deployment Summary ===" -ForegroundColor Cyan

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  AZURE RESOURCES CREATED SUCCESSFULLY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

Write-Host "`nResource Group:" -ForegroundColor Cyan
Write-Host "  Name: $ResourceGroup"
Write-Host "  Location: $Location"

Write-Host "`nCosmos DB:" -ForegroundColor Cyan
Write-Host "  Account: $CosmosAccount"
Write-Host "  Endpoint: $CosmosEndpoint"
Write-Host "  Database: dreamspace"
Write-Host "  Containers: users (/id), teams (/managerId)"

Write-Host "`nCredentials File:" -ForegroundColor Cyan
Write-Host "  Location: $outputFile"
Write-Host "  ⚠️  Keep secure - contains Cosmos primary key"

Write-Host "`nAzure Portal Links:" -ForegroundColor Cyan
Write-Host "  Resource Group: https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup"
Write-Host "  Cosmos DB: https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.DocumentDB/databaseAccounts/$CosmosAccount"

Write-Host "`nNext Manual Steps:" -ForegroundColor Yellow
Write-Host "  1. Create Entra ID App Registration"
Write-Host "     - Single tenant authentication"
Write-Host "     - Copy Application (client) ID"
Write-Host "     - See: docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md Part 2"
Write-Host ""
Write-Host "  2. Create Azure Static Web App"
Write-Host "     - Connect to GitHub: Baby-Ty/Dreamspace"
Write-Host "     - Branch: new-tenant-deployment"
Write-Host "     - Get deployment token"
Write-Host "     - See: docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md Part 1.5"
Write-Host ""
Write-Host "  3. Configure Application Settings"
Write-Host "     - VITE_APP_ENV=production"
Write-Host "     - VITE_COSMOS_ENDPOINT=$CosmosEndpoint"
Write-Host "     - COSMOS_ENDPOINT=$CosmosEndpoint"
Write-Host "     - COSMOS_KEY=[from $outputFile]"
Write-Host ""
Write-Host "  4. Update Code Configuration"
Write-Host "     - File: src/auth/authConfig.js"
Write-Host "     - Update clientId with new Entra App ID"
Write-Host "     - Update authority with your tenant ID"
Write-Host ""
Write-Host "  5. Deploy Application"
Write-Host "     - Add GitHub secret: AZURE_STATIC_WEB_APPS_API_TOKEN_NEW_TENANT"
Write-Host "     - Merge to new-tenant-deployment branch or configure SWA"

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ============================================================================
# VERIFICATION COMMANDS (Run these to verify everything is created)
# ============================================================================
Write-Host "`n=== Verification Commands ===" -ForegroundColor Cyan
Write-Host "Run these commands to verify your deployment:`n"

Write-Host "# List all resources in resource group"
Write-Host "az resource list --resource-group $ResourceGroup --output table`n"

Write-Host "# Show Cosmos DB account details"
Write-Host "az cosmosdb show --name $CosmosAccount --resource-group $ResourceGroup --output table`n"

Write-Host "# List Cosmos databases"
Write-Host "az cosmosdb sql database list --account-name $CosmosAccount --resource-group $ResourceGroup --output table`n"

Write-Host "# List Cosmos containers"
Write-Host "az cosmosdb sql container list --account-name $CosmosAccount --resource-group $ResourceGroup --database-name dreamspace --output table`n"

Write-Host "# Open Azure Portal to Resource Group"
Write-Host "Start-Process 'https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup'`n"

# ============================================================================
# CLEANUP COMMANDS (In case you need to start over)
# ============================================================================
<#
Write-Host "`n=== Cleanup Commands (DANGER - Use with caution) ===" -ForegroundColor Red
Write-Host "Only run these if you need to delete everything and start over:`n"

Write-Host "# Delete entire resource group (deletes everything)"
Write-Host "az group delete --name $ResourceGroup --yes --no-wait`n"

Write-Host "# Check deletion status"
Write-Host "az group exists --name $ResourceGroup`n"
#>

Write-Host "`n✅ Azure infrastructure setup complete!" -ForegroundColor Green
Write-Host "📖 Next: Follow docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md Parts 2-7" -ForegroundColor Yellow
Write-Host ""

