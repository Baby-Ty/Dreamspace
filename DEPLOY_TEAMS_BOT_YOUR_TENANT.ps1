# Dreamspace Teams Bot - Deploy to YOUR Tenant
# Main app stays in production tenant, bot runs in your tenant

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipBotSetup,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipAPI
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dreamspace Teams Bot - Your Tenant Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will deploy the bot to YOUR tenant while keeping" -ForegroundColor Yellow
Write-Host "the main app in the production tenant." -ForegroundColor Yellow
Write-Host ""

# ============================================
# YOUR TENANT CONFIGURATION
# ============================================
Write-Host "Enter YOUR tenant configuration:" -ForegroundColor Cyan
Write-Host ""

$YOUR_SUBSCRIPTION = Read-Host "Your Subscription ID (or press Enter to use current)"
if (-not $YOUR_SUBSCRIPTION) {
    $YOUR_SUBSCRIPTION = az account show --query id -o tsv
}

$YOUR_RG = Read-Host "Your Resource Group name (e.g., rg-yourname-test)"
if (-not $YOUR_RG) {
    $YOUR_RG = "rg-dreamspace-bot-test"
}

$YOUR_LOCATION = Read-Host "Your Location (e.g., eastus, westeurope) [default: eastus]"
if (-not $YOUR_LOCATION) {
    $YOUR_LOCATION = "eastus"
}

$BOT_FUNCTION_APP = Read-Host "Bot Function App name [default: dreamspace-bot-yourname]"
if (-not $BOT_FUNCTION_APP) {
    $BOT_FUNCTION_APP = "dreamspace-bot-$(Get-Random -Maximum 9999)"
}

$BOT_NAME = Read-Host "Bot name [default: dreamspace-teams-bot-test]"
if (-not $BOT_NAME) {
    $BOT_NAME = "dreamspace-teams-bot-test"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Configuration Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Your Tenant Bot:" -ForegroundColor Cyan
Write-Host "  Subscription: $YOUR_SUBSCRIPTION"
Write-Host "  Resource Group: $YOUR_RG"
Write-Host "  Location: $YOUR_LOCATION"
Write-Host "  Bot Function App: $BOT_FUNCTION_APP"
Write-Host "  Bot Name: $BOT_NAME"
Write-Host ""
Write-Host "Production Tenant (unchanged):" -ForegroundColor Cyan
Write-Host "  Main Function App: func-dreamspace-prod"
Write-Host "  Web App: dreamspace.tylerstewart.co.za"
Write-Host "  Cosmos DB: (will be accessed from your tenant)"
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Exiting..." -ForegroundColor Yellow
    exit 0
}

# ============================================
# COSMOS DB CREDENTIALS (from production)
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cosmos DB Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The bot needs access to the PRODUCTION Cosmos DB." -ForegroundColor Yellow
Write-Host ""

$PROD_SUBSCRIPTION = Read-Host "Production Subscription ID"
$PROD_RG = Read-Host "Production Resource Group [default: rg-dreamspace]"
if (-not $PROD_RG) {
    $PROD_RG = "rg-dreamspace"
}

$COSMOS_ACCOUNT = Read-Host "Cosmos DB Account Name"

Write-Host ""
Write-Host "Retrieving Cosmos DB credentials from production..." -ForegroundColor Yellow

# Switch to production subscription temporarily
az account set --subscription $PROD_SUBSCRIPTION

$COSMOS_ENDPOINT = az cosmosdb show -n $COSMOS_ACCOUNT -g $PROD_RG --query documentEndpoint -o tsv
$COSMOS_KEY = az cosmosdb keys list -n $COSMOS_ACCOUNT -g $PROD_RG --query primaryMasterKey -o tsv

if (-not $COSMOS_ENDPOINT -or -not $COSMOS_KEY) {
    Write-Host "ERROR: Could not retrieve Cosmos DB credentials" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Cosmos DB credentials retrieved" -ForegroundColor Green

# Switch back to your subscription
az account set --subscription $YOUR_SUBSCRIPTION

# ============================================
# PHASE 1: Create Bot Infrastructure in YOUR Tenant
# ============================================
if (-not $SkipBotSetup) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "PHASE 1: Create Bot in YOUR Tenant" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Create resource group if needed
    $rgExists = az group exists -n $YOUR_RG
    if ($rgExists -eq "false") {
        Write-Host "Creating resource group: $YOUR_RG" -ForegroundColor Yellow
        az group create -n $YOUR_RG -l $YOUR_LOCATION -o none
        Write-Host "✓ Resource group created" -ForegroundColor Green
    } else {
        Write-Host "✓ Resource group exists" -ForegroundColor Green
    }
    
    # Create storage account
    $STORAGE = "dreamspacebot$(Get-Random -Maximum 9999)"
    Write-Host ""
    Write-Host "Creating storage account: $STORAGE" -ForegroundColor Yellow
    az storage account create -n $STORAGE -g $YOUR_RG -l $YOUR_LOCATION --sku Standard_LRS -o none
    Write-Host "✓ Storage account created" -ForegroundColor Green
    
    # Create Function App
    Write-Host ""
    Write-Host "Creating Function App: $BOT_FUNCTION_APP" -ForegroundColor Yellow
    az functionapp create -g $YOUR_RG -n $BOT_FUNCTION_APP `
        --storage-account $STORAGE `
        --consumption-plan-location $YOUR_LOCATION `
        --runtime node `
        --runtime-version 18 `
        --functions-version 4 `
        -o none
    Write-Host "✓ Function App created" -ForegroundColor Green
    
    # Create Azure AD App Registration (multi-tenant)
    Write-Host ""
    Write-Host "Creating Azure AD App Registration (multi-tenant)..." -ForegroundColor Yellow
    $APP_NAME = "Dreamspace Teams Bot (Test)"
    $APP_ID = az ad app create --display-name "$APP_NAME" `
        --sign-in-audience AzureADMultipleOrgs `
        --query appId -o tsv
    
    if (-not $APP_ID) {
        Write-Host "ERROR: Failed to create App Registration" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ App Registration created: $APP_ID" -ForegroundColor Green
    
    # Create app secret
    Write-Host "Generating app secret..." -ForegroundColor Yellow
    $APP_SECRET = az ad app credential reset --id $APP_ID --append `
        --display-name "bot-secret" `
        --query password -o tsv
    Write-Host "✓ App secret generated" -ForegroundColor Green
    
    # Create Azure Bot
    Write-Host ""
    Write-Host "Creating Azure Bot: $BOT_NAME" -ForegroundColor Yellow
    $BOT_ENDPOINT = "https://$BOT_FUNCTION_APP.azurewebsites.net/api/messages"
    
    az bot create --kind registration -g $YOUR_RG -n $BOT_NAME `
        --appid $APP_ID `
        --password "$APP_SECRET" `
        --endpoint $BOT_ENDPOINT `
        -o none
    Write-Host "✓ Azure Bot created" -ForegroundColor Green
    
    # Enable Teams channel
    Write-Host ""
    Write-Host "Enabling Teams channel..." -ForegroundColor Yellow
    az bot msteams create -g $YOUR_RG -n $BOT_NAME -o none
    Write-Host "✓ Teams channel enabled" -ForegroundColor Green
    
    # Configure Function App with Cosmos DB from production
    Write-Host ""
    Write-Host "Configuring Function App with Cosmos DB access..." -ForegroundColor Yellow
    az functionapp config appsettings set -g $YOUR_RG -n $BOT_FUNCTION_APP --settings `
        MicrosoftAppId=$APP_ID `
        "MicrosoftAppPassword=$APP_SECRET" `
        MicrosoftAppType=MultiTenant `
        "COSMOS_ENDPOINT=$COSMOS_ENDPOINT" `
        "COSMOS_KEY=$COSMOS_KEY" `
        -o none
    Write-Host "✓ Function App configured" -ForegroundColor Green
    
    # Create Cosmos DB containers (in production)
    Write-Host ""
    Write-Host "Creating Cosmos DB containers in production..." -ForegroundColor Yellow
    
    # Switch to production subscription
    az account set --subscription $PROD_SUBSCRIPTION
    
    # Check if botConversations exists
    $botConvoExists = az cosmosdb sql container show `
        --account-name $COSMOS_ACCOUNT `
        --database-name dreamspace `
        --resource-group $PROD_RG `
        --name botConversations 2>$null
    
    if (-not $botConvoExists) {
        Write-Host "Creating container: botConversations" -ForegroundColor Yellow
        az cosmosdb sql container create `
            --account-name $COSMOS_ACCOUNT `
            --database-name dreamspace `
            --resource-group $PROD_RG `
            --name botConversations `
            --partition-key-path "/userId" `
            --throughput 400 `
            -o none
        Write-Host "✓ Container created: botConversations" -ForegroundColor Green
    } else {
        Write-Host "✓ Container already exists: botConversations" -ForegroundColor Green
    }
    
    # Check if checkins exists
    $checkinsExists = az cosmosdb sql container show `
        --account-name $COSMOS_ACCOUNT `
        --database-name dreamspace `
        --resource-group $PROD_RG `
        --name checkins 2>$null
    
    if (-not $checkinsExists) {
        Write-Host "Creating container: checkins" -ForegroundColor Yellow
        az cosmosdb sql container create `
            --account-name $COSMOS_ACCOUNT `
            --database-name dreamspace `
            --resource-group $PROD_RG `
            --name checkins `
            --partition-key-path "/userId" `
            --throughput 400 `
            -o none
        Write-Host "✓ Container created: checkins" -ForegroundColor Green
    } else {
        Write-Host "✓ Container already exists: checkins" -ForegroundColor Green
    }
    
    # Switch back to your subscription
    az account set --subscription $YOUR_SUBSCRIPTION
    
    # Display credentials
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "SAVE THESE CREDENTIALS NOW!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Bot Configuration:" -ForegroundColor Yellow
    Write-Host "  App ID: $APP_ID" -ForegroundColor White
    Write-Host "  App Secret: $APP_SECRET" -ForegroundColor White
    Write-Host "  Bot Endpoint: $BOT_ENDPOINT" -ForegroundColor White
    Write-Host ""
    Write-Host "Save these in your password manager!" -ForegroundColor Red
    Write-Host ""
    
    $saved = Read-Host "Have you saved the credentials? (yes/no)"
    if ($saved -ne "yes") {
        Write-Host "Please save them now. You can find them above." -ForegroundColor Yellow
        Read-Host "Press Enter when done"
    }
    
    # Deploy bot code
    Write-Host ""
    Write-Host "Deploying bot code to YOUR tenant..." -ForegroundColor Yellow
    Set-Location teams-bot
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Deploying to $BOT_FUNCTION_APP..." -ForegroundColor Yellow
    func azure functionapp publish $BOT_FUNCTION_APP
    
    Write-Host "✓ Bot code deployed" -ForegroundColor Green
    
    # Test bot endpoint
    Write-Host ""
    Write-Host "Testing bot endpoint..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    $botHealth = Invoke-RestMethod "https://$BOT_FUNCTION_APP.azurewebsites.net/api/messages" -ErrorAction SilentlyContinue
    if ($botHealth) {
        Write-Host "✓ Bot endpoint is healthy!" -ForegroundColor Green
        Write-Host "  Status: $($botHealth.status)"
        Write-Host "  Cosmos Configured: $($botHealth.cosmosConfigured)"
    } else {
        Write-Host "⚠ Could not reach bot endpoint (may take a few minutes to start)" -ForegroundColor Yellow
    }
    
    Set-Location ..
}

# ============================================
# PHASE 2: Configure Production API
# ============================================
if (-not $SkipAPI) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "PHASE 2: Configure Production API" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Now we need to add bot credentials to the PRODUCTION Function App" -ForegroundColor Yellow
    Write-Host "so it can send messages through your bot." -ForegroundColor Yellow
    Write-Host ""
    
    if ($APP_ID) {
        Write-Host "Using credentials from Phase 1..." -ForegroundColor Green
    } else {
        $APP_ID = Read-Host "Enter Bot App ID"
        $APP_SECRET = Read-Host "Enter Bot App Secret" -AsSecureString
        $APP_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($APP_SECRET)
        )
    }
    
    $PROD_FUNC_APP = "func-dreamspace-prod"
    
    Write-Host ""
    Write-Host "Adding bot credentials to $PROD_FUNC_APP (production)..." -ForegroundColor Yellow
    
    # Switch to production subscription
    az account set --subscription $PROD_SUBSCRIPTION
    
    az functionapp config appsettings set `
        -g $PROD_RG `
        -n $PROD_FUNC_APP `
        --settings `
            MicrosoftAppId="$APP_ID" `
            "MicrosoftAppPassword=$APP_SECRET" `
            MicrosoftAppType="MultiTenant" `
        -o none
    
    Write-Host "✓ Bot credentials added to production API" -ForegroundColor Green
    
    # Verify
    Write-Host ""
    Write-Host "Verifying settings..." -ForegroundColor Yellow
    $settings = az functionapp config appsettings list `
        -g $PROD_RG `
        -n $PROD_FUNC_APP `
        --query "[?name=='MicrosoftAppId'].{name:name,value:value}" -o json | ConvertFrom-Json
    
    if ($settings) {
        Write-Host "✓ MicrosoftAppId is set in production" -ForegroundColor Green
    }
    
    # Deploy API
    Write-Host ""
    Write-Host "Deploying updated API to production..." -ForegroundColor Yellow
    Set-Location api
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "Deploying to $PROD_FUNC_APP..." -ForegroundColor Yellow
    func azure functionapp publish $PROD_FUNC_APP
    
    Write-Host "✓ Production API deployed" -ForegroundColor Green
    
    Set-Location ..
}

# ============================================
# SUMMARY
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Cross-Tenant Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Architecture:" -ForegroundColor Cyan
Write-Host "  ┌─ YOUR TENANT ─────────────────┐"
Write-Host "  │ Bot Function App              │"
Write-Host "  │ $BOT_FUNCTION_APP"
Write-Host "  │ Azure Bot Registration        │"
Write-Host "  └───────────────────────────────┘"
Write-Host "           ↓ (Bot Framework)"
Write-Host "  ┌─ PRODUCTION TENANT ───────────┐"
Write-Host "  │ Main Function App             │"
Write-Host "  │ func-dreamspace-prod          │"
Write-Host "  │ Web App                       │"
Write-Host "  │ dreamspace.tylerstewart.co.za │"
Write-Host "  │ Cosmos DB (shared)            │"
Write-Host "  └───────────────────────────────┘"
Write-Host "           ↓"
Write-Host "  ┌─ MICROSOFT TEAMS ─────────────┐"
Write-Host "  │ Users (any tenant)            │"
Write-Host "  └───────────────────────────────┘"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Create Teams app manifest:"
Write-Host "     - Update teams-bot/manifest/manifest.json with App ID: $APP_ID"
Write-Host "     - Add icons (color.png, outline.png)"
Write-Host "     - Create ZIP package"
Write-Host ""
Write-Host "  2. Upload to Teams Developer Portal:"
Write-Host "     https://dev.teams.microsoft.com/apps"
Write-Host ""
Write-Host "  3. Test:"
Write-Host "     - Install bot in Teams"
Write-Host "     - Send message to bot (creates conversation ref)"
Write-Host "     - Go to dreamspace.tylerstewart.co.za"
Write-Host "     - Click 'Send Teams Check-in' from Dream Coach page"
Write-Host "     - Message should be sent through YOUR bot!"
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  Your Bot: https://$BOT_FUNCTION_APP.azurewebsites.net/api/messages"
Write-Host "  Production API: https://func-dreamspace-prod.azurewebsites.net/api/sendTeamsMessage"
Write-Host ""

