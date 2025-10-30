# Setup script for local development environment
# This script helps configure local.settings.json and .env.local

Write-Host "DreamSpace Local Development Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed and logged in
Write-Host "Checking Azure CLI..." -ForegroundColor Yellow
try {
    $account = az account show 2>&1 | ConvertFrom-Json
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "Subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "Azure CLI not logged in or not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "You have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install Azure CLI and login (automated setup)" -ForegroundColor White
    Write-Host "  1. Install: https://aka.ms/installazurecliwindows" -ForegroundColor Gray
    Write-Host "  2. Run: az login" -ForegroundColor Gray
    Write-Host "  3. Run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Manual setup" -ForegroundColor White
    Write-Host "  Continue with manual configuration (press Enter)" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to continue with manual setup, or Ctrl+C to exit"
}

Write-Host ""
Write-Host "Step 1: Setting up api/local.settings.json" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if local.settings.json already exists
if (Test-Path "api/local.settings.json") {
    Write-Host "api/local.settings.json already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping backend configuration" -ForegroundColor Gray
    } else {
        Remove-Item "api/local.settings.json"
    }
}

if (-not (Test-Path "api/local.settings.json")) {
    # Try to get credentials from Azure
    $cosmosEndpoint = $null
    $cosmosKey = $null
    $storageConnectionString = $null
    
    if ($account) {
        Write-Host "Attempting to retrieve credentials from Azure..." -ForegroundColor Yellow
        
        try {
            $cosmosEndpoint = "https://cosmos-dreamspace-prod-20251013.documents.azure.com:443/"
            $cosmosKey = az cosmosdb keys list --name cosmos-dreamspace-prod-20251013 --resource-group rg_dreams2025dev --query "primaryMasterKey" -o tsv 2>$null
            $storageConnectionString = az storage account show-connection-string --name stdreamspace --resource-group rg_dreams2025dev --query "connectionString" -o tsv 2>$null
            
            if ($cosmosKey -and $storageConnectionString) {
                Write-Host "Successfully retrieved credentials from Azure!" -ForegroundColor Green
            }
        } catch {
            Write-Host "Could not retrieve credentials automatically" -ForegroundColor Yellow
        }
    }
    
    # If automated retrieval failed, prompt for manual entry
    if (-not $cosmosKey) {
        Write-Host ""
        Write-Host "Manual credential entry required" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Get these from Azure Portal:" -ForegroundColor White
        Write-Host "  1. Go to: https://portal.azure.com" -ForegroundColor Gray
        Write-Host "  2. Find your Cosmos DB account: cosmos-dreamspace-prod-20251013" -ForegroundColor Gray
        Write-Host "  3. Click 'Keys' -> Copy URI and PRIMARY KEY" -ForegroundColor Gray
        Write-Host ""
        
        $cosmosEndpoint = Read-Host "Enter Cosmos DB Endpoint (URI)"
        $cosmosKey = Read-Host "Enter Cosmos DB Primary Key"
        
        Write-Host ""
        Write-Host "For Storage Account:" -ForegroundColor White
        Write-Host "  1. Find: stdreamspace" -ForegroundColor Gray
        Write-Host "  2. Go to 'Access keys' -> Copy connection string" -ForegroundColor Gray
        Write-Host ""
        $storageConnectionString = Read-Host "Enter Storage Connection String (or press Enter to skip)"
        
        if (-not $storageConnectionString) {
            $storageConnectionString = ""
        }
    }
    
    # Create local.settings.json
    $localSettings = @{
        IsEncrypted = $false
        Values = @{
            AzureWebJobsStorage = $storageConnectionString
            FUNCTIONS_WORKER_RUNTIME = "node"
            COSMOS_ENDPOINT = $cosmosEndpoint
            COSMOS_KEY = $cosmosKey
            AZURE_STORAGE_CONNECTION_STRING = $storageConnectionString
        }
        Host = @{
            CORS = "*"
            CORSCredentials = $false
        }
    }
    
    $localSettings | ConvertTo-Json -Depth 5 | Out-File -FilePath "api/local.settings.json" -Encoding UTF8
    Write-Host "Created api/local.settings.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Setting up .env.local" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".env.local") {
    Write-Host ".env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping frontend configuration" -ForegroundColor Gray
    } else {
        Remove-Item ".env.local"
    }
}

if (-not (Test-Path ".env.local")) {
    $envContent = @"
# Local Development Environment Variables
# Uses PRODUCTION Cosmos DB data

# Environment mode
VITE_APP_ENV=production

# Azure Cosmos DB Configuration
VITE_COSMOS_ENDPOINT=https://cosmos-dreamspace-prod-20251013.documents.azure.com:443/

# Azure AD Authentication (MSAL)
VITE_AZURE_CLIENT_ID=ebe60b7a-93c9-4b12-8375-4ab3181000e8
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "Created .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the created files if needed" -ForegroundColor White
Write-Host "  2. Run: .\START_LOCAL_DEV.ps1" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see: LOCAL_DEV_SETUP.md" -ForegroundColor Cyan
Write-Host ""

