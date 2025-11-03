# Complete DreamSpace Setup Script
# Run this after the deployment is done to finalize everything

param(
    [switch]$SkipTests
)

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " DreamSpace - Final Setup Steps" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$functionApp = "func-dreamspace-prod"
$resourceGroup = "rg_dreams2025dev"
$storageAccount = "stdreamspace"
$subscription = "NetsuritCIO"

# Step 1: Ensure correct subscription
Write-Host "Step 1: Setting Azure subscription..." -ForegroundColor Yellow
az account set --subscription $subscription
$currentSub = az account show --query "name" -o tsv
Write-Host "Current subscription: $currentSub" -ForegroundColor Green
Write-Host ""

# Step 2: Create blob storage container
Write-Host "Step 2: Creating profile-pictures container..." -ForegroundColor Yellow
try {
    $containerCheck = az storage container exists --name "profile-pictures" --account-name $storageAccount --auth-mode login 2>&1 | ConvertFrom-Json
    
    if ($containerCheck.exists) {
        Write-Host "Container already exists!" -ForegroundColor Green
    } else {
        az storage container create `
            --name "profile-pictures" `
            --account-name $storageAccount `
            --public-access blob `
            --auth-mode login `
            --only-show-errors | Out-Null
        Write-Host "Container created successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "Note: Container creation attempted (may already exist)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check Function App status
Write-Host "Step 3: Checking Function App status..." -ForegroundColor Yellow
$appState = az functionapp show `
    --name $functionApp `
    --resource-group $resourceGroup `
    --query "{Name:name, State:state, DefaultHostName:defaultHostName}" | ConvertFrom-Json

Write-Host "Function App: $($appState.Name)" -ForegroundColor White
Write-Host "State: $($appState.State)" -ForegroundColor $(if ($appState.State -eq "Running") { "Green" } else { "Yellow" })
Write-Host "URL: https://$($appState.DefaultHostName)" -ForegroundColor White
Write-Host ""

if ($appState.State -ne "Running") {
    Write-Host "WARNING: Function App is not running!" -ForegroundColor Red
    $restart = Read-Host "Would you like to restart it? (Y/N)"
    if ($restart -eq "Y" -or $restart -eq "y") {
        Write-Host "Restarting Function App..." -ForegroundColor Yellow
        az functionapp restart --name $functionApp --resource-group $resourceGroup | Out-Null
        Write-Host "Restart initiated. Waiting 30 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
}

if (-not $SkipTests) {
    # Step 4: Test health endpoint
    Write-Host "Step 4: Testing health endpoint..." -ForegroundColor Yellow
    $healthUrl = "https://$($appState.DefaultHostName)/api/health"
    Write-Host "Testing: $healthUrl" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 15
        
        Write-Host "Health Check Result:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 5 | Write-Host
        Write-Host ""
        
        if ($response.status -eq "healthy") {
            Write-Host "SUCCESS! API is healthy!" -ForegroundColor Green
            
            if ($response.checks.cosmosdb.status -eq "healthy") {
                Write-Host "Cosmos DB: Connected" -ForegroundColor Green
                Write-Host "Response Time: $($response.checks.cosmosdb.responseTime)ms" -ForegroundColor Green
            }
        } elseif ($response.status -eq "degraded") {
            Write-Host "WARNING: API is degraded" -ForegroundColor Yellow
            if ($response.checks.cosmosdb.message) {
                Write-Host "Issue: $($response.checks.cosmosdb.message)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "ERROR: API is unhealthy" -ForegroundColor Red
        }
    } catch {
        Write-Host "Could not reach health endpoint" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "This might mean:" -ForegroundColor Yellow
        Write-Host "  - Deployment is still in progress (wait 5-10 minutes)" -ForegroundColor White
        Write-Host "  - Function App needs to restart" -ForegroundColor White
        Write-Host "  - Functions need to be redeployed" -ForegroundColor White
    }
    Write-Host ""
    
    # Step 5: Test blob storage
    Write-Host "Step 5: Verifying blob storage setup..." -ForegroundColor Yellow
    try {
        $containerInfo = az storage container show `
            --name "profile-pictures" `
            --account-name $storageAccount `
            --query "{Name:name, PublicAccess:properties.publicAccess}" 2>&1 | ConvertFrom-Json
        
        Write-Host "Container Name: $($containerInfo.Name)" -ForegroundColor Green
        Write-Host "Public Access: $($containerInfo.PublicAccess)" -ForegroundColor Green
    } catch {
        Write-Host "Could not verify container (may still be creating)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Step 6: Show summary
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Resources:" -ForegroundColor Cyan
Write-Host "  Function App:  https://$($appState.DefaultHostName)" -ForegroundColor White
Write-Host "  Health Check:  https://$($appState.DefaultHostName)/api/health" -ForegroundColor White
Write-Host "  Live Site:     https://dreamspace.tylerstewart.co.za" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Visit your live site: https://dreamspace.tylerstewart.co.za" -ForegroundColor White
Write-Host "  2. Log out if you're logged in" -ForegroundColor White
Write-Host "  3. Log back in (this triggers avatar upload)" -ForegroundColor White
Write-Host "  4. Try adding a dream or making changes" -ForegroundColor White
Write-Host "  5. Refresh the page - data should persist!" -ForegroundColor White
Write-Host ""
Write-Host "Browser Console Logs to Look For:" -ForegroundColor Cyan
Write-Host "  - '📸 Attempting to upload profile picture to blob storage...'" -ForegroundColor White
Write-Host "  - '✅ Profile picture uploaded to blob storage'" -ForegroundColor White
Write-Host "  - '💾 Saving data for user ID: [your-id]'" -ForegroundColor White
Write-Host "  - '✅ Data saved to Cosmos DB for user: [your-id]'" -ForegroundColor White
Write-Host ""
Write-Host "If issues persist, see:" -ForegroundColor Cyan
Write-Host "  - COMPLETE_FIX_SUMMARY.md (complete overview)" -ForegroundColor White
Write-Host "  - FIX_COSMOS_DB_API.md (database issues)" -ForegroundColor White
Write-Host "  - FIX_AVATAR_BLOB_STORAGE.md (avatar issues)" -ForegroundColor White
Write-Host ""

# Offer to open health page
$openBrowser = Read-Host "Open health check in browser? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    $healthUrl = "https://$($appState.DefaultHostName)/api/health"
    Start-Process $healthUrl
}




