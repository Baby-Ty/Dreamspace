# ============================================================================
# QUICK START: Azure Dreamspace Setup
# ============================================================================
# Copy and paste this into PowerShell ISE, update the variables, and run!
# ============================================================================

# ⚠️ STEP 1: UPDATE THESE VALUES
$TenantId = "YOUR_TENANT_ID_HERE"           # Required
$SubscriptionId = "YOUR_SUBSCRIPTION_ID_HERE"  # Required

# Optional: Customize resource names
$ResourceGroup = "rg-dreamspace-prod-eastus"
$Location = "eastus"
$Timestamp = Get-Date -Format "yyyyMMdd"
$CosmosAccount = "cosmos-dreamspace-prod-$Timestamp"

# ============================================================================
# STEP 2: LOGIN TO AZURE
# ============================================================================
Write-Host "`n🔐 Logging in to Azure..." -ForegroundColor Cyan
az login --tenant $TenantId
az account set --subscription $SubscriptionId
az account show --output table

# ============================================================================
# STEP 3: CREATE RESOURCES
# ============================================================================

# Create Resource Group
Write-Host "`n📦 Creating Resource Group..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output table

# Create Cosmos DB (takes 5-10 minutes)
Write-Host "`n💾 Creating Cosmos DB (this will take 5-10 minutes)..." -ForegroundColor Cyan
Write-Host "Start: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
az cosmosdb create `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --locations regionName=$Location `
    --default-consistency-level Session `
    --enable-free-tier true `
    --output table
Write-Host "End: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray

# Create Database
Write-Host "`n🗄️ Creating Database..." -ForegroundColor Cyan
az cosmosdb sql database create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --name dreamspace `
    --throughput 400 `
    --output table

# Create Users Container
Write-Host "`n📝 Creating Users Container..." -ForegroundColor Cyan
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name users `
    --partition-key-path "/id" `
    --output table

# Create Teams Container
Write-Host "`n👥 Creating Teams Container..." -ForegroundColor Cyan
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name teams `
    --partition-key-path "/managerId" `
    --output table

# ============================================================================
# STEP 4: GET CREDENTIALS
# ============================================================================
Write-Host "`n🔑 Retrieving Credentials..." -ForegroundColor Cyan

$CosmosEndpoint = az cosmosdb show `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --query "documentEndpoint" `
    --output tsv

$CosmosPrimaryKey = az cosmosdb keys list `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --type keys `
    --query "primaryMasterKey" `
    --output tsv

# ============================================================================
# STEP 5: DISPLAY RESULTS
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ AZURE RESOURCES CREATED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

Write-Host "`n📋 Copy these values:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Resource Group:   $ResourceGroup"
Write-Host "Cosmos Account:   $CosmosAccount"
Write-Host ""
Write-Host "Cosmos Endpoint:" -ForegroundColor Cyan
Write-Host "$CosmosEndpoint" -ForegroundColor White
Write-Host ""
Write-Host "Cosmos Key (KEEP SECURE):" -ForegroundColor Cyan
Write-Host "$CosmosPrimaryKey" -ForegroundColor White
Write-Host ""

# Save to file
$credFile = "credentials-$Timestamp.txt"
@"
COSMOS_ENDPOINT=$CosmosEndpoint
COSMOS_KEY=$CosmosPrimaryKey

Resource Group: $ResourceGroup
Cosmos Account: $CosmosAccount
"@ | Out-File $credFile -Encoding UTF8

Write-Host "💾 Saved to: $credFile" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Portal: https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Next Steps: docs-new-tenant-deployment/NEW_TENANT_DEPLOYMENT.md Part 2" -ForegroundColor Yellow
Write-Host ""

