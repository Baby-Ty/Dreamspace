# Azure Dreamspace New Tenant Provisioning Script
# This script automates the creation of Azure resources for a new tenant deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-dreamspace-prod-eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$CosmosAccountPrefix = "cosmos-dreamspace-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "swa-dreamspace-prod",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableFreeTier = $true
)

# Color output functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

# Ensure Azure CLI is installed
Write-Step "Checking Azure CLI installation"
$azVersion = az version --output json 2>$null | ConvertFrom-Json
if (-not $azVersion) {
    Write-Error "Azure CLI is not installed. Please install from: https://aka.ms/InstallAzureCLIDirect"
    exit 1
}
Write-Success "Azure CLI version $($azVersion.'azure-cli') found"

# Login to Azure
Write-Step "Logging in to Azure (Tenant: $TenantId)"
az login --tenant $TenantId --output none
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to login to Azure"
    exit 1
}
Write-Success "Logged in successfully"

# Generate unique suffix for Cosmos account
$timestamp = Get-Date -Format "yyyyMMdd"
$CosmosAccount = "$CosmosAccountPrefix-$timestamp"

Write-Info "Configuration:"
Write-Host "  Resource Group: $ResourceGroup"
Write-Host "  Location: $Location"
Write-Host "  Cosmos Account: $CosmosAccount"
Write-Host "  Static Web App: $StaticWebAppName"
Write-Host "  Free Tier: $EnableFreeTier"

# Confirm before proceeding
Write-Host "`nThis will create Azure resources that may incur costs."
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Info "Deployment cancelled"
    exit 0
}

# Create Resource Group
Write-Step "Creating Resource Group: $ResourceGroup"
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create resource group"
    exit 1
}
Write-Success "Resource group created"

# Create Cosmos DB Account
Write-Step "Creating Cosmos DB Account: $CosmosAccount (this may take 5-10 minutes)"
$freeTierParam = if ($EnableFreeTier) { "--enable-free-tier true" } else { "--enable-free-tier false" }
az cosmosdb create `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --locations regionName=$Location `
    --default-consistency-level Session `
    $freeTierParam `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create Cosmos DB account"
    exit 1
}
Write-Success "Cosmos DB account created"

# Create Database
Write-Step "Creating Cosmos DB database: dreamspace"
az cosmosdb sql database create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --name dreamspace `
    --throughput 400 `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create database"
    exit 1
}
Write-Success "Database created"

# Create users container with /id partition key
Write-Step "Creating container: users (partition key: /id)"
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name users `
    --partition-key-path "/id" `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create users container"
    exit 1
}
Write-Success "Users container created"

# Create teams container
Write-Step "Creating container: teams (partition key: /managerId)"
az cosmosdb sql container create `
    --account-name $CosmosAccount `
    --resource-group $ResourceGroup `
    --database-name dreamspace `
    --name teams `
    --partition-key-path "/managerId" `
    --output none

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create teams container"
    exit 1
}
Write-Success "Teams container created"

# Get Cosmos DB connection details
Write-Step "Retrieving Cosmos DB credentials"
$cosmosKeys = az cosmosdb keys list `
    --name $CosmosAccount `
    --resource-group $ResourceGroup `
    --type keys `
    --output json | ConvertFrom-Json

$cosmosEndpoint = "https://$CosmosAccount.documents.azure.com:443/"
$cosmosPrimaryKey = $cosmosKeys.primaryMasterKey

Write-Success "Cosmos DB credentials retrieved"

# Display summary
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

Write-Host "`nResource Group:" -ForegroundColor Cyan
Write-Host "  Name: $ResourceGroup"
Write-Host "  Location: $Location"

Write-Host "`nCosmos DB:" -ForegroundColor Cyan
Write-Host "  Account: $CosmosAccount"
Write-Host "  Endpoint: $cosmosEndpoint"
Write-Host "  Primary Key: $($cosmosPrimaryKey.Substring(0,10))..." -NoNewline
Write-Host " (hidden)" -ForegroundColor Yellow
Write-Host "  Database: dreamspace"
Write-Host "  Containers: users (/id), teams (/managerId)"

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Create Entra ID App Registration"
Write-Host "     - Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps"
Write-Host "     - Create new registration for single tenant"
Write-Host "     - Copy Application (client) ID"
Write-Host ""
Write-Host "  2. Create Azure Static Web App"
Write-Host "     - Go to: https://portal.azure.com/#create/Microsoft.StaticApp"
Write-Host "     - Name: $StaticWebAppName"
Write-Host "     - Resource Group: $ResourceGroup"
Write-Host "     - Region: East US 2"
Write-Host "     - Connect to GitHub: Baby-Ty/Dreamspace"
Write-Host ""
Write-Host "  3. Configure Static Web App settings"
Write-Host "     - Add these application settings:"
Write-Host "       VITE_APP_ENV=production"
Write-Host "       VITE_COSMOS_ENDPOINT=$cosmosEndpoint"
Write-Host "       COSMOS_ENDPOINT=$cosmosEndpoint"
Write-Host "       COSMOS_KEY=[use value below]"
Write-Host ""
Write-Host "  4. Update code configuration"
Write-Host "     - Update src/auth/authConfig.js with new client ID and tenant ID"
Write-Host "     - See NEW_TENANT_DEPLOYMENT.md for details"

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

# Save credentials to file
$outputFile = "deployment-credentials-$timestamp.txt"
Write-Step "Saving credentials to $outputFile"

@"
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
Endpoint: $cosmosEndpoint
Primary Key: $cosmosPrimaryKey
Database: dreamspace
Containers: 
  - users (partition key: /id)
  - teams (partition key: /managerId)

AZURE PORTAL LINKS
------------------
Resource Group: https://portal.azure.com/#@$TenantId/resource/subscriptions/SUBSCRIPTION_ID/resourceGroups/$ResourceGroup
Cosmos DB: https://portal.azure.com/#@$TenantId/resource/subscriptions/SUBSCRIPTION_ID/resourceGroups/$ResourceGroup/providers/Microsoft.DocumentDB/databaseAccounts/$CosmosAccount

NEXT STEPS
----------
1. Create Entra ID App Registration (Manual)
2. Create Azure Static Web App (Manual or via Portal)
3. Configure application settings with credentials above
4. Update code with new client ID and tenant ID
5. Deploy via GitHub Actions

See NEW_TENANT_DEPLOYMENT.md for complete instructions.
"@ | Out-File -FilePath $outputFile -Encoding UTF8

Write-Success "Credentials saved to $outputFile"
Write-Info "IMPORTANT: Add $outputFile to .gitignore to prevent committing secrets!"

Write-Host "`n✓ Infrastructure provisioning complete!" -ForegroundColor Green
Write-Host "  Follow the manual steps above to complete deployment.`n"

