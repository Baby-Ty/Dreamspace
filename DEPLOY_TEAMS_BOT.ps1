# Dreamspace Teams Bot - Automated Deployment Script
# This script uses YOUR actual Azure configuration

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipBotSetup,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipAPI,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipWeb
)

$ErrorActionPreference = "Stop"

# ============================================
# YOUR ACTUAL CONFIGURATION
# ============================================
$RESOURCE_GROUP = "rg-dreamspace"
$MAIN_FUNCTION_APP = "func-dreamspace-prod"
$LOCATION = "eastus"
$BOT_FUNCTION_APP = "dreamspace-bot-func"
$BOT_NAME = "dreamspace-teams-bot"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dreamspace Teams Bot Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Main Function App: $MAIN_FUNCTION_APP"
Write-Host "  Bot Function App: $BOT_FUNCTION_APP"
Write-Host "  Bot Name: $BOT_NAME"
Write-Host ""

# Check Azure CLI
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Azure CLI not found!" -ForegroundColor Red
    exit 1
}

# Check logged in
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Not logged into Azure. Running az login..." -ForegroundColor Yellow
    az login
}

Write-Host "Current subscription:" -ForegroundColor Green
az account show --query "{Name:name, SubscriptionId:id}" -o table
Write-Host ""

$continue = Read-Host "Continue with this subscription? (y/n)"
if ($continue -ne "y") {
    Write-Host "Exiting..." -ForegroundColor Yellow
    exit 0
}

# ============================================
# PHASE 1: Deploy Teams Bot Infrastructure
# ============================================
if (-not $SkipBotSetup) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "PHASE 1: Deploy Teams Bot" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "This will:" -ForegroundColor Yellow
    Write-Host "  1. Create bot Function App"
    Write-Host "  2. Create Azure AD App Registration"
    Write-Host "  3. Create Azure Bot"
    Write-Host "  4. Create Cosmos DB containers"
    Write-Host ""
    
    $runBotSetup = Read-Host "Run bot setup? (y/n)"
    if ($runBotSetup -eq "y") {
        Set-Location teams-bot
        
        Write-Host "Running bot setup script..." -ForegroundColor Yellow
        .\setup-azure-bot.ps1
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "CRITICAL: SAVE BOT CREDENTIALS NOW!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "The script above showed your:" -ForegroundColor Yellow
        Write-Host "  - App ID (GUID)"
        Write-Host "  - App Secret (long string)"
        Write-Host ""
        Write-Host "You MUST save these before continuing!" -ForegroundColor Red
        Write-Host "The App Secret CANNOT be retrieved later!" -ForegroundColor Red
        Write-Host ""
        
        $saved = Read-Host "Have you saved the credentials? (yes/no)"
        if ($saved -ne "yes") {
            Write-Host "Please save the credentials, then run this script again with -SkipBotSetup" -ForegroundColor Yellow
            exit 0
        }
        
        # Deploy bot code
        Write-Host ""
        Write-Host "Installing bot dependencies..." -ForegroundColor Yellow
        npm install
        
        Write-Host ""
        Write-Host "Deploying bot code..." -ForegroundColor Yellow
        func azure functionapp publish $BOT_FUNCTION_APP
        
        Write-Host ""
        Write-Host "Testing bot endpoint..." -ForegroundColor Yellow
        $botHealth = curl "https://$BOT_FUNCTION_APP.azurewebsites.net/api/messages" 2>$null
        if ($botHealth) {
            Write-Host "✓ Bot endpoint is healthy!" -ForegroundColor Green
        } else {
            Write-Host "⚠ Could not reach bot endpoint" -ForegroundColor Yellow
        }
        
        Set-Location ..
    }
}

# ============================================
# PHASE 2: Configure Main API
# ============================================
if (-not $SkipAPI) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "PHASE 2: Configure Main API" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "You need to add bot credentials to: $MAIN_FUNCTION_APP" -ForegroundColor Yellow
    Write-Host ""
    
    $appId = Read-Host "Enter Bot App ID (from Phase 1)"
    $appSecret = Read-Host "Enter Bot App Secret (from Phase 1)" -AsSecureString
    $appSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($appSecret)
    )
    
    Write-Host ""
    Write-Host "Adding bot credentials to $MAIN_FUNCTION_APP..." -ForegroundColor Yellow
    
    az functionapp config appsettings set `
        -g $RESOURCE_GROUP `
        -n $MAIN_FUNCTION_APP `
        --settings `
            MicrosoftAppId="$appId" `
            "MicrosoftAppPassword=$appSecretPlain" `
            MicrosoftAppType="MultiTenant" `
        -o none
    
    Write-Host "✓ Bot credentials added" -ForegroundColor Green
    
    # Verify
    Write-Host ""
    Write-Host "Verifying settings..." -ForegroundColor Yellow
    $settings = az functionapp config appsettings list `
        -g $RESOURCE_GROUP `
        -n $MAIN_FUNCTION_APP `
        --query "[?name=='MicrosoftAppId'].{name:name,value:value}" -o json | ConvertFrom-Json
    
    if ($settings) {
        Write-Host "✓ MicrosoftAppId is set" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not verify settings" -ForegroundColor Yellow
    }
    
    # Deploy API
    Write-Host ""
    Write-Host "Deploying updated API..." -ForegroundColor Yellow
    Set-Location api
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Deploying to $MAIN_FUNCTION_APP..." -ForegroundColor Yellow
    func azure functionapp publish $MAIN_FUNCTION_APP
    
    Write-Host "✓ API deployed" -ForegroundColor Green
    
    Set-Location ..
}

# ============================================
# PHASE 3: Deploy Web App
# ============================================
if (-not $SkipWeb) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "PHASE 3: Deploy Web App" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Building web app..." -ForegroundColor Yellow
    npm run build
    
    Write-Host ""
    Write-Host "✓ Web app built successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "The web app is built in the 'dist' folder." -ForegroundColor Yellow
    Write-Host "Deploy it using your normal method:" -ForegroundColor Yellow
    Write-Host "  - GitHub Actions (automatic)"
    Write-Host "  - Azure Static Web Apps CLI"
    Write-Host "  - Azure Portal"
    Write-Host ""
}

# ============================================
# PHASE 4: Teams App Manifest
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 4: Create Teams App Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Before creating the Teams app package, you need to:" -ForegroundColor Yellow
Write-Host "  1. Create bot icons (192x192 and 32x32)" -ForegroundColor Yellow
Write-Host "  2. Update manifest.json with your Bot App ID" -ForegroundColor Yellow
Write-Host ""

$iconsExist = Test-Path "teams-bot\manifest\color.png"
if (-not $iconsExist) {
    Write-Host "⚠ Icons not found in teams-bot\manifest\" -ForegroundColor Yellow
    Write-Host "Please create:" -ForegroundColor Yellow
    Write-Host "  - color.png (192x192px)"
    Write-Host "  - outline.png (32x32px)"
    Write-Host ""
} else {
    Write-Host "✓ Icons found" -ForegroundColor Green
}

$createPackage = Read-Host "Create Teams app package now? (y/n)"
if ($createPackage -eq "y") {
    $appId = Read-Host "Enter Bot App ID (to update manifest)"
    
    # Update manifest
    $manifestPath = "teams-bot\manifest\manifest.json"
    $manifest = Get-Content $manifestPath -Raw
    $manifest = $manifest -replace '\{\{MICROSOFT_APP_ID\}\}', $appId
    $manifest = $manifest -replace '\{\{FUNCTION_APP_DOMAIN\}\}', "$BOT_FUNCTION_APP.azurewebsites.net"
    $manifest | Set-Content $manifestPath
    
    Write-Host "✓ Manifest updated" -ForegroundColor Green
    
    # Create ZIP
    Set-Location teams-bot\manifest
    Compress-Archive -Path manifest.json,color.png,outline.png -DestinationPath dreamspace-teams-bot.zip -Force
    Write-Host "✓ Package created: teams-bot\manifest\dreamspace-teams-bot.zip" -ForegroundColor Green
    Set-Location ..\..
}

# ============================================
# SUMMARY
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload teams-bot\manifest\dreamspace-teams-bot.zip to Teams Developer Portal"
Write-Host "     https://dev.teams.microsoft.com/apps"
Write-Host ""
Write-Host "  2. Install the bot in Teams"
Write-Host ""
Write-Host "  3. Test the integration:"
Write-Host "     - Log in as a coach"
Write-Host "     - Open Dream Coach page"
Write-Host "     - Click a team member"
Write-Host "     - Click 'Send Teams Check-in'"
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  Bot: https://$BOT_FUNCTION_APP.azurewebsites.net/api/messages"
Write-Host "  API: https://$MAIN_FUNCTION_APP.azurewebsites.net/api/sendTeamsMessage"
Write-Host "  Web: https://dreamspace.tylerstewart.co.za"
Write-Host ""

