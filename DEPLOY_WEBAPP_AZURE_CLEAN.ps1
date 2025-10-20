﻿# ============================================================================
# Azure Static Web App Deployment for Dreamspace
# ============================================================================
# This script deploys Dreamspace to Azure Static Web Apps with Functions API
# Works with React + Vite frontend and Azure Functions backend
# ============================================================================

# âš ï¸ STEP 1: UPDATE THESE VALUES
$TenantId = "5da736f8-138e-4b36-adab-2236f975b6f1"           # Required: Your Azure AD Tenant ID
$SubscriptionId = "9957e02a-2d39-48ad-abdd-e6a027bff827"  # Required: Your Azure Subscription ID
$GitHubRepo = "Baby-Ty/Dreamspace"  # e.g., "username/Dreamspace"
$GitHubToken = "YOUR_GITHUB_PAT"  # Optional: Personal Access Token for GitHub integration

# Resource Configuration
$ResourceGroup = "rg_Dreams2025Dev"  # Should match your Cosmos DB resource group
$Location = "eastus2"  # Use same region as Cosmos DB for best performance
$Timestamp = Get-Date -Format "yyyyMMdd"
$StaticWebAppName = "swa-dreamspace-prod"  # Globally unique name for Static Web App
$CosmosAccount = ""  # Leave empty to auto-detect from resource group

# ============================================================================
# STEP 2: VALIDATE PREREQUISITES
# ============================================================================
Write-Host "`nðŸ” Checking prerequisites..." -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    $azVersion = az version --query '"azure-cli"' --output tsv 2>$null
    Write-Host "âœ“ Azure CLI version: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "âŒ Azure CLI is not installed. Please install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Check if Static Web Apps extension is installed
Write-Host "Checking for Static Web Apps extension..." -ForegroundColor Gray
az extension add --name staticwebapp --upgrade --only-show-errors 2>$null
Write-Host "âœ“ Static Web Apps extension ready" -ForegroundColor Green

# ============================================================================
# STEP 3: LOGIN TO AZURE
# ============================================================================
Write-Host "`nðŸ” Logging in to Azure..." -ForegroundColor Cyan
az login --tenant $TenantId --only-show-errors
if ($LASTEXITCODE -ne 0) {
    Write-Host "âŒ Azure login failed" -ForegroundColor Red
    exit 1
}

az account set --subscription $SubscriptionId
$currentAccount = az account show --query "{Name:name, SubscriptionId:id, TenantId:tenantId}" --output json | ConvertFrom-Json

Write-Host "âœ“ Logged in successfully" -ForegroundColor Green
Write-Host "  Subscription: $($currentAccount.Name)" -ForegroundColor Gray
Write-Host "  Tenant ID: $($currentAccount.TenantId)" -ForegroundColor Gray

# ============================================================================
# STEP 4: VERIFY RESOURCE GROUP AND COSMOS DB
# ============================================================================
Write-Host "`nðŸ“¦ Verifying existing resources..." -ForegroundColor Cyan

# Check if resource group exists
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "âŒ Resource group '$ResourceGroup' not found" -ForegroundColor Red
    Write-Host "Please run QUICK_START_AZURE.ps1 first to create Cosmos DB" -ForegroundColor Yellow
    exit 1
}
Write-Host "âœ“ Resource group found: $ResourceGroup" -ForegroundColor Green

# Auto-detect Cosmos DB account if not specified
if ([string]::IsNullOrEmpty($CosmosAccount)) {
    Write-Host "Auto-detecting Cosmos DB account..." -ForegroundColor Gray
    $cosmosAccounts = az cosmosdb list --resource-group $ResourceGroup --query "[].name" --output tsv
    if ($cosmosAccounts) {
        $CosmosAccount = $cosmosAccounts.Split("`n")[0].Trim()
        Write-Host "âœ“ Found Cosmos DB: $CosmosAccount" -ForegroundColor Green
    } else {
        Write-Host "âš ï¸  No Cosmos DB account found in resource group" -ForegroundColor Yellow
        Write-Host "API functions will need Cosmos DB credentials configured later" -ForegroundColor Yellow
    }
}

# ============================================================================
# STEP 5: CREATE STATIC WEB APP
# ============================================================================
Write-Host "`nðŸŒ Creating Azure Static Web App..." -ForegroundColor Cyan
Write-Host "Name: $StaticWebAppName" -ForegroundColor Gray
Write-Host "This will take 2-3 minutes..." -ForegroundColor Gray

# Create Static Web App with manual deployment (no GitHub integration yet)
$swaCreate = az staticwebapp create `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "âŒ Failed to create Static Web App" -ForegroundColor Red
    Write-Host $swaCreate -ForegroundColor Red
    exit 1
}

$swa = $swaCreate | ConvertFrom-Json
$StaticWebAppUrl = $swa.defaultHostname

Write-Host "âœ“ Static Web App created successfully" -ForegroundColor Green
Write-Host "  URL: https://$StaticWebAppUrl" -ForegroundColor Gray

# ============================================================================
# STEP 6: GET DEPLOYMENT TOKEN
# ============================================================================
Write-Host "`nðŸ”‘ Retrieving deployment token..." -ForegroundColor Cyan

$deploymentToken = az staticwebapp secrets list `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" `
    --output tsv

if ([string]::IsNullOrEmpty($deploymentToken)) {
    Write-Host "âš ï¸  Could not retrieve deployment token automatically" -ForegroundColor Yellow
    Write-Host "You can get it manually from Azure Portal later" -ForegroundColor Yellow
} else {
    Write-Host "âœ“ Deployment token retrieved" -ForegroundColor Green
}

# ============================================================================
# STEP 7: CONFIGURE ENVIRONMENT VARIABLES
# ============================================================================
Write-Host "`nâš™ï¸  Configuring application settings..." -ForegroundColor Cyan

if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
    # Get Cosmos DB credentials
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
    
    # Configure both frontend and backend settings
    Write-Host "Setting Cosmos DB connection for API functions..." -ForegroundColor Gray
    
    az staticwebapp appsettings set `
        --name $StaticWebAppName `
        --resource-group $ResourceGroup `
        --setting-names `
            "COSMOS_ENDPOINT=$CosmosEndpoint" `
            "COSMOS_KEY=$CosmosPrimaryKey" `
            "VITE_APP_ENV=production" `
            "VITE_COSMOS_ENDPOINT=$CosmosEndpoint" `
        --output table
    
    Write-Host "âœ“ Cosmos DB credentials configured" -ForegroundColor Green
} else {
    Write-Host "âš ï¸  Skipping Cosmos DB configuration (not found)" -ForegroundColor Yellow
}

# ============================================================================
# STEP 8: SETUP GITHUB INTEGRATION (OPTIONAL)
# ============================================================================
Write-Host "`nðŸ”„ GitHub Integration Setup" -ForegroundColor Cyan

if (-not [string]::IsNullOrEmpty($GitHubToken) -and $GitHubToken -ne "YOUR_GITHUB_PAT") {
    Write-Host "Configuring GitHub Actions deployment..." -ForegroundColor Gray
    
    # This requires the GitHub token and will create a workflow file
    # Note: This is optional - deployment token can be added to GitHub manually
    Write-Host "âš ï¸  Automated GitHub setup requires additional configuration" -ForegroundColor Yellow
    Write-Host "Please follow manual setup in documentation" -ForegroundColor Yellow
} else {
    Write-Host "â„¹ï¸  GitHub integration not configured (token not provided)" -ForegroundColor Cyan
    Write-Host "To enable automated deployments:" -ForegroundColor White
    Write-Host "  1. Go to GitHub repo â†’ Settings â†’ Secrets â†’ Actions" -ForegroundColor White
    Write-Host "  2. Add secret: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
    Write-Host "  3. Value: [deployment token shown below]" -ForegroundColor White
}

# ============================================================================
# STEP 9: DISPLAY RESULTS AND NEXT STEPS
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Green
Write-Host "  âœ… STATIC WEB APP CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Green

Write-Host "`nðŸ“‹ Deployment Information:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Static Web App Name:  " -NoNewline; Write-Host "$StaticWebAppName" -ForegroundColor White
Write-Host "Resource Group:       " -NoNewline; Write-Host "$ResourceGroup" -ForegroundColor White
Write-Host "Location:             " -NoNewline; Write-Host "$Location" -ForegroundColor White
if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
    Write-Host "Cosmos DB Account:    " -NoNewline; Write-Host "$CosmosAccount" -ForegroundColor White
}
Write-Host ""

Write-Host "ðŸŒ Application URL:" -ForegroundColor Cyan
Write-Host "https://$StaticWebAppUrl" -ForegroundColor Green
Write-Host ""

Write-Host "ðŸ”‘ Deployment Token (save this for GitHub):" -ForegroundColor Cyan
if (-not [string]::IsNullOrEmpty($deploymentToken)) {
    Write-Host $deploymentToken -ForegroundColor White
} else {
    Write-Host "Get from: Azure Portal â†’ $StaticWebAppName â†’ Manage deployment token" -ForegroundColor White
}
Write-Host ""

Write-Host "ðŸ“Š Azure Portal:" -ForegroundColor Cyan
$portalUrl = "https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.Web/staticSites/$StaticWebAppName"
Write-Host $portalUrl -ForegroundColor White
Write-Host ""

# ============================================================================
# STEP 10: SAVE DEPLOYMENT INFORMATION
# ============================================================================
$deploymentFile = "static-web-app-deployment-$Timestamp.txt"
$deploymentInfo = @"
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘        DREAMSPACE - AZURE STATIC WEB APP DEPLOYMENT        â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

Deployment Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
AZURE RESOURCES
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Static Web App Name: $StaticWebAppName
Resource Group:      $ResourceGroup
Location:            $Location
Subscription:        $SubscriptionId
Tenant ID:           $TenantId

Application URL:     https://$StaticWebAppUrl

$(if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
"Cosmos DB Account:   $CosmosAccount
Cosmos DB Endpoint:  $CosmosEndpoint
"})

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
DEPLOYMENT TOKEN (Keep Secure!)
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

$deploymentToken

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
NEXT STEPS
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

1. CONFIGURE GITHUB ACTIONS
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   a) Go to: https://github.com/$GitHubRepo/settings/secrets/actions
   b) Click: New repository secret
   c) Name:  AZURE_STATIC_WEB_APPS_API_TOKEN
   d) Value: [paste deployment token from above]
   e) Click: Add secret

2. UPDATE AZURE AD REDIRECT URI
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   a) Go to: Azure Portal â†’ Microsoft Entra ID â†’ App registrations
   b) Find app with Client ID: ebe60b7a-93c9-4b12-8375-4ab3181000e8
   c) Click: Authentication
   d) Add Redirect URI: https://$StaticWebAppUrl
   e) Click: Save

3. DEPLOY YOUR CODE
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Option A: Push to GitHub (if GitHub Actions configured)
     git add .
     git commit -m 'Configure Azure Static Web App'
     git push origin main

   Option B: Manual deployment using Azure CLI
     cd $(Get-Location)
     npm run build
     az staticwebapp deploy --name $StaticWebAppName --resource-group $ResourceGroup --source ./dist

4. VERIFY DEPLOYMENT
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   a) Wait 2-3 minutes for deployment
   b) Visit: https://$StaticWebAppUrl
   c) Test login with Azure AD
   d) Check API health: https://$StaticWebAppUrl/api/health

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
PORTAL LINKS
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Static Web App:
$portalUrl

Resource Group:
https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup

$(if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
"Cosmos DB:
https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.DocumentDB/databaseAccounts/$CosmosAccount
"})

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
TROUBLESHOOTING
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

- Deployment fails: Check GitHub Actions logs
- Login fails: Verify redirect URI in Azure AD
- API errors: Check application settings in Static Web App
- Database errors: Verify Cosmos DB credentials

Documentation: docs-deployment/AZURE_DEPLOYMENT.md

"@

$deploymentInfo | Out-File $deploymentFile -Encoding UTF8

Write-Host "ðŸ’¾ Full deployment info saved to: $deploymentFile" -ForegroundColor Green
Write-Host ""
Write-Host "ðŸ“– Next: Follow the steps above to complete deployment" -ForegroundColor Yellow
Write-Host ""





