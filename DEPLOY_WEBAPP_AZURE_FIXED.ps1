# ============================================================================
# Azure Static Web App Deployment for Dreamspace
# ============================================================================
# This script deploys Dreamspace to Azure Static Web Apps with Functions API
# Works with React + Vite frontend and Azure Functions backend
# ============================================================================

# STEP 1: UPDATE THESE VALUES
$TenantId = "5da736f8-138e-4b36-adab-2236f975b6f1"
$SubscriptionId = "9957e02a-2d39-48ad-abdd-e6a027bff827"
$GitHubRepo = "Baby-Ty/Dreamspace"
$GitHubToken = "YOUR_GITHUB_PAT"

# Resource Configuration
$ResourceGroup = "rg_Dreams2025Dev"
$Location = "eastus2"
$Timestamp = Get-Date -Format "yyyyMMdd"
$StaticWebAppName = "swa-dreamspace-prod"
$CosmosAccount = ""

# ============================================================================
# STEP 2: VALIDATE PREREQUISITES
# ============================================================================
Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    $azVersion = az version --query """azure-cli""" --output tsv 2>$null
    Write-Host "✓ Azure CLI version: $azVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Azure CLI is not installed. Please install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Check if Static Web Apps extension is installed
Write-Host "Checking for Static Web Apps extension..." -ForegroundColor Gray
az extension add --name staticwebapp --upgrade --only-show-errors 2>$null
Write-Host "✓ Static Web Apps extension ready" -ForegroundColor Green

# ============================================================================
# STEP 3: LOGIN TO AZURE
# ============================================================================
Write-Host "`n🔐 Logging in to Azure..." -ForegroundColor Cyan
az login --tenant $TenantId --only-show-errors
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Azure login failed" -ForegroundColor Red
    exit 1
}

az account set --subscription $SubscriptionId
$currentAccount = az account show --query "{Name:name, SubscriptionId:id, TenantId:tenantId}" --output json | ConvertFrom-Json

Write-Host "✓ Logged in successfully" -ForegroundColor Green
Write-Host "  Subscription: $($currentAccount.Name)" -ForegroundColor Gray
Write-Host "  Tenant ID: $($currentAccount.TenantId)" -ForegroundColor Gray

# ============================================================================
# STEP 4: VERIFY RESOURCE GROUP AND COSMOS DB
# ============================================================================
Write-Host "`n📦 Verifying existing resources..." -ForegroundColor Cyan

# Check if resource group exists
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "❌ Resource group '$ResourceGroup' not found" -ForegroundColor Red
    Write-Host "Please run QUICK_START_AZURE.ps1 first to create Cosmos DB" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Resource group found: $ResourceGroup" -ForegroundColor Green

# Auto-detect Cosmos DB account if not specified
if ([string]::IsNullOrEmpty($CosmosAccount)) {
    Write-Host "Auto-detecting Cosmos DB account..." -ForegroundColor Gray
    $cosmosAccounts = az cosmosdb list --resource-group $ResourceGroup --query "[].name" --output tsv
    if ($cosmosAccounts) {
        $CosmosAccount = $cosmosAccounts.Split("`n")[0].Trim()
        Write-Host "✓ Found Cosmos DB: $CosmosAccount" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  No Cosmos DB account found in resource group" -ForegroundColor Yellow
        Write-Host "API functions will need Cosmos DB credentials configured later" -ForegroundColor Yellow
    }
}

# ============================================================================
# STEP 5: CREATE STATIC WEB APP
# ============================================================================
Write-Host "`n🌐 Creating Azure Static Web App..." -ForegroundColor Cyan
Write-Host "Name: $StaticWebAppName" -ForegroundColor Gray
Write-Host "This will take 2-3 minutes..." -ForegroundColor Gray

# Create Static Web App
$swaCreate = az staticwebapp create --name $StaticWebAppName --resource-group $ResourceGroup --location $Location --sku Standard --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Static Web App" -ForegroundColor Red
    Write-Host $swaCreate -ForegroundColor Red
    exit 1
}

$swa = $swaCreate | ConvertFrom-Json
$StaticWebAppUrl = $swa.defaultHostname

Write-Host "✓ Static Web App created successfully" -ForegroundColor Green
Write-Host "  URL: https://$StaticWebAppUrl" -ForegroundColor Gray

# ============================================================================
# STEP 6: GET DEPLOYMENT TOKEN
# ============================================================================
Write-Host "`n🔑 Retrieving deployment token..." -ForegroundColor Cyan

$deploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" --output tsv

if ([string]::IsNullOrEmpty($deploymentToken)) {
    Write-Host "⚠️  Could not retrieve deployment token automatically" -ForegroundColor Yellow
    Write-Host "You can get it manually from Azure Portal later" -ForegroundColor Yellow
}
else {
    Write-Host "✓ Deployment token retrieved" -ForegroundColor Green
}

# ============================================================================
# STEP 7: CONFIGURE ENVIRONMENT VARIABLES
# ============================================================================
Write-Host "`n⚙️  Configuring application settings..." -ForegroundColor Cyan

if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
    # Get Cosmos DB credentials
    $CosmosEndpoint = az cosmosdb show --name $CosmosAccount --resource-group $ResourceGroup --query "documentEndpoint" --output tsv
    
    $CosmosPrimaryKey = az cosmosdb keys list --name $CosmosAccount --resource-group $ResourceGroup --type keys --query "primaryMasterKey" --output tsv
    
    # Configure settings
    Write-Host "Setting Cosmos DB connection for API functions..." -ForegroundColor Gray
    
    az staticwebapp appsettings set --name $StaticWebAppName --resource-group $ResourceGroup --setting-names "COSMOS_ENDPOINT=$CosmosEndpoint" "COSMOS_KEY=$CosmosPrimaryKey" "VITE_APP_ENV=production" "VITE_COSMOS_ENDPOINT=$CosmosEndpoint" --output table
    
    Write-Host "✓ Cosmos DB credentials configured" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Skipping Cosmos DB configuration (not found)" -ForegroundColor Yellow
}

# ============================================================================
# STEP 8: GITHUB INTEGRATION
# ============================================================================
Write-Host "`n🔄 GitHub Integration Setup" -ForegroundColor Cyan

if (-not [string]::IsNullOrEmpty($GitHubToken) -and $GitHubToken -ne "YOUR_GITHUB_PAT") {
    Write-Host "Configuring GitHub Actions deployment..." -ForegroundColor Gray
    Write-Host "⚠️  Automated GitHub setup requires additional configuration" -ForegroundColor Yellow
    Write-Host "Please follow manual setup in documentation" -ForegroundColor Yellow
}
else {
    Write-Host "ℹ️  GitHub integration not configured (token not provided)" -ForegroundColor Cyan
    Write-Host "To enable automated deployments:" -ForegroundColor White
    Write-Host "  1. Go to GitHub repo → Settings → Secrets → Actions" -ForegroundColor White
    Write-Host "  2. Add secret: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
    Write-Host "  3. Value: [deployment token shown below]" -ForegroundColor White
}

# ============================================================================
# STEP 9: DISPLAY RESULTS
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ STATIC WEB APP CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

Write-Host "`n📋 Deployment Information:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Static Web App Name:  " -NoNewline; Write-Host "$StaticWebAppName" -ForegroundColor White
Write-Host "Resource Group:       " -NoNewline; Write-Host "$ResourceGroup" -ForegroundColor White
Write-Host "Location:             " -NoNewline; Write-Host "$Location" -ForegroundColor White
if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
    Write-Host "Cosmos DB Account:    " -NoNewline; Write-Host "$CosmosAccount" -ForegroundColor White
}
Write-Host ""

Write-Host "🌐 Application URL:" -ForegroundColor Cyan
Write-Host "https://$StaticWebAppUrl" -ForegroundColor Green
Write-Host ""

Write-Host "🔑 Deployment Token (save this for GitHub):" -ForegroundColor Cyan
if (-not [string]::IsNullOrEmpty($deploymentToken)) {
    Write-Host $deploymentToken -ForegroundColor White
}
else {
    Write-Host "Get from: Azure Portal → $StaticWebAppName → Manage deployment token" -ForegroundColor White
}
Write-Host ""

Write-Host "📊 Azure Portal:" -ForegroundColor Cyan
$portalUrl = "https://portal.azure.com/#@$TenantId/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.Web/staticSites/$StaticWebAppName"
Write-Host $portalUrl -ForegroundColor White
Write-Host ""

# ============================================================================
# STEP 10: SAVE DEPLOYMENT INFORMATION
# ============================================================================
$deploymentFile = "static-web-app-deployment-$Timestamp.txt"

$cosmosInfo = ""
if (-not [string]::IsNullOrEmpty($CosmosAccount)) {
    $cosmosInfo = @"
Cosmos DB Account:   $CosmosAccount
Cosmos DB Endpoint:  $CosmosEndpoint
"@
}

$deploymentInfo = @"
╔═══════════════════════════════════════════════════════════╗
║        DREAMSPACE - AZURE STATIC WEB APP DEPLOYMENT        ║
╚═══════════════════════════════════════════════════════════╝

Deployment Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AZURE RESOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Static Web App Name: $StaticWebAppName
Resource Group:      $ResourceGroup
Location:            $Location
Subscription:        $SubscriptionId
Tenant ID:           $TenantId

Application URL:     https://$StaticWebAppUrl

$cosmosInfo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT TOKEN (Keep Secure!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$deploymentToken

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CONFIGURE GITHUB ACTIONS
   ────────────────────────────────────────────────────────────
   a) Go to: https://github.com/$GitHubRepo/settings/secrets/actions
   b) Click: New repository secret
   c) Name:  AZURE_STATIC_WEB_APPS_API_TOKEN
   d) Value: [paste deployment token from above]
   e) Click: Add secret

2. UPDATE AZURE AD REDIRECT URI
   ────────────────────────────────────────────────────────────
   a) Go to: Azure Portal → Microsoft Entra ID → App registrations
   b) Find app with Client ID: ebe60b7a-93c9-4b12-8375-4ab3181000e8
   c) Click: Authentication
   d) Add Redirect URI: https://$StaticWebAppUrl
   e) Click: Save

3. DEPLOY YOUR CODE
   ────────────────────────────────────────────────────────────
   Option A: Push to GitHub (if GitHub Actions configured)
     git add .
     git commit -m 'Configure Azure Static Web App'
     git push origin main

   Option B: Manual deployment using Azure CLI
     npm run build
     az staticwebapp deploy --name $StaticWebAppName --resource-group $ResourceGroup --source ./dist

4. VERIFY DEPLOYMENT
   ────────────────────────────────────────────────────────────
   a) Wait 2-3 minutes for deployment
   b) Visit: https://$StaticWebAppUrl
   c) Test login with Azure AD
   d) Check API health: https://$StaticWebAppUrl/api/health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Deployment fails: Check GitHub Actions logs
- Login fails: Verify redirect URI in Azure AD
- API errors: Check application settings in Static Web App
- Database errors: Verify Cosmos DB credentials

Documentation: docs-deployment/AZURE_DEPLOYMENT.md

"@

$deploymentInfo | Out-File $deploymentFile -Encoding UTF8

Write-Host "💾 Full deployment info saved to: $deploymentFile" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Next: Follow the steps above to complete deployment" -ForegroundColor Yellow
Write-Host ""

