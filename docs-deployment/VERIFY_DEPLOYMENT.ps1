# ============================================================================
# Azure Static Web App Deployment Verification Script
# ============================================================================
# This script verifies that your Dreamspace deployment is working correctly
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "swa-dreamspace-prod",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg_Dreams2025Dev"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║   DREAMSPACE DEPLOYMENT VERIFICATION                      ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$testResults = @()
$passCount = 0
$failCount = 0
$warnCount = 0

function Test-Result {
    param($TestName, $Status, $Message)
    
    $result = @{
        Test = $TestName
        Status = $Status
        Message = $Message
    }
    
    $script:testResults += $result
    
    switch ($Status) {
        "PASS" {
            Write-Host "✅ PASS: " -ForegroundColor Green -NoNewline
            Write-Host "$TestName" -ForegroundColor White
            if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
            $script:passCount++
        }
        "FAIL" {
            Write-Host "❌ FAIL: " -ForegroundColor Red -NoNewline
            Write-Host "$TestName" -ForegroundColor White
            if ($Message) { Write-Host "   $Message" -ForegroundColor Yellow }
            $script:failCount++
        }
        "WARN" {
            Write-Host "⚠️  WARN: " -ForegroundColor Yellow -NoNewline
            Write-Host "$TestName" -ForegroundColor White
            if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
            $script:warnCount++
        }
    }
}

# ============================================================================
# TEST 1: Azure CLI Availability
# ============================================================================
Write-Host "`n📋 Testing Prerequisites..." -ForegroundColor Cyan

try {
    $azVersion = az version --query '"azure-cli"' --output tsv 2>$null
    Test-Result "Azure CLI installed" "PASS" "Version: $azVersion"
} catch {
    Test-Result "Azure CLI installed" "FAIL" "Azure CLI not found. Install from: https://aka.ms/installazurecliwindows"
    exit 1
}

# ============================================================================
# TEST 2: Azure Login Status
# ============================================================================
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if ($account) {
        Test-Result "Azure authentication" "PASS" "Logged in as: $($account.user.name)"
    } else {
        Test-Result "Azure authentication" "FAIL" "Not logged in. Run: az login"
    }
} catch {
    Test-Result "Azure authentication" "FAIL" "Please run: az login"
}

# ============================================================================
# TEST 3: Resource Group Exists
# ============================================================================
Write-Host "`n🔍 Testing Azure Resources..." -ForegroundColor Cyan

try {
    $rgExists = az group exists --name $ResourceGroup
    if ($rgExists -eq "true") {
        Test-Result "Resource group exists" "PASS" "Found: $ResourceGroup"
    } else {
        Test-Result "Resource group exists" "FAIL" "Resource group '$ResourceGroup' not found"
    }
} catch {
    Test-Result "Resource group exists" "FAIL" "Error checking resource group"
}

# ============================================================================
# TEST 4: Static Web App Exists
# ============================================================================
try {
    $swa = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroup --output json 2>$null | ConvertFrom-Json
    if ($swa) {
        Test-Result "Static Web App exists" "PASS" "Name: $StaticWebAppName"
        
        # Get URL if not provided
        if ([string]::IsNullOrEmpty($StaticWebAppUrl)) {
            $StaticWebAppUrl = "https://$($swa.defaultHostname)"
        }
    } else {
        Test-Result "Static Web App exists" "FAIL" "Static Web App '$StaticWebAppName' not found"
    }
} catch {
    Test-Result "Static Web App exists" "FAIL" "Error checking Static Web App"
}

# ============================================================================
# TEST 5: Application Settings
# ============================================================================
if ($swa) {
    try {
        $settings = az staticwebapp appsettings list `
            --name $StaticWebAppName `
            --resource-group $ResourceGroup `
            --output json 2>$null | ConvertFrom-Json
        
        $settingsObj = $settings.properties
        
        # Check for Cosmos DB endpoint
        if ($settingsObj.COSMOS_ENDPOINT) {
            Test-Result "Cosmos DB endpoint configured" "PASS" "Endpoint set"
        } else {
            Test-Result "Cosmos DB endpoint configured" "WARN" "COSMOS_ENDPOINT not set in app settings"
        }
        
        # Check for Cosmos DB key
        if ($settingsObj.COSMOS_KEY) {
            Test-Result "Cosmos DB key configured" "PASS" "Key is set"
        } else {
            Test-Result "Cosmos DB key configured" "WARN" "COSMOS_KEY not set in app settings"
        }
        
        # Check for production environment
        if ($settingsObj.VITE_APP_ENV) {
            Test-Result "Environment configured" "PASS" "VITE_APP_ENV = $($settingsObj.VITE_APP_ENV)"
        } else {
            Test-Result "Environment configured" "WARN" "VITE_APP_ENV not set"
        }
        
    } catch {
        Test-Result "Application settings" "WARN" "Could not retrieve settings"
    }
}

# ============================================================================
# TEST 6: Cosmos DB Access
# ============================================================================
try {
    $cosmosAccounts = az cosmosdb list --resource-group $ResourceGroup --output json 2>$null | ConvertFrom-Json
    if ($cosmosAccounts -and $cosmosAccounts.Count -gt 0) {
        $cosmosAccount = $cosmosAccounts[0]
        Test-Result "Cosmos DB account found" "PASS" "Account: $($cosmosAccount.name)"
        
        # Check if account is accessible
        $cosmosStatus = az cosmosdb show `
            --name $cosmosAccount.name `
            --resource-group $ResourceGroup `
            --query "provisioningState" `
            --output tsv 2>$null
        
        if ($cosmosStatus -eq "Succeeded") {
            Test-Result "Cosmos DB status" "PASS" "Status: Succeeded"
        } else {
            Test-Result "Cosmos DB status" "WARN" "Status: $cosmosStatus"
        }
    } else {
        Test-Result "Cosmos DB account found" "WARN" "No Cosmos DB accounts found in resource group"
    }
} catch {
    Test-Result "Cosmos DB access" "WARN" "Could not check Cosmos DB"
}

# ============================================================================
# TEST 7: HTTP Tests
# ============================================================================
if (-not [string]::IsNullOrEmpty($StaticWebAppUrl)) {
    Write-Host "`n🌐 Testing HTTP Endpoints..." -ForegroundColor Cyan
    Write-Host "Target: $StaticWebAppUrl" -ForegroundColor Gray
    
    # Test 7a: Main page loads
    try {
        $response = Invoke-WebRequest -Uri $StaticWebAppUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Test-Result "Main page loads" "PASS" "Status: $($response.StatusCode)"
        } else {
            Test-Result "Main page loads" "FAIL" "Status: $($response.StatusCode)"
        }
    } catch {
        Test-Result "Main page loads" "FAIL" "Error: $($_.Exception.Message)"
    }
    
    # Test 7b: Health endpoint
    try {
        $healthUrl = "$StaticWebAppUrl/api/health"
        $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
        $healthData = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq 200) {
            Test-Result "Health endpoint" "PASS" "Status: healthy"
            
            # Check Cosmos DB connection
            if ($healthData.cosmos -and $healthData.cosmos.connected) {
                Test-Result "Cosmos DB connectivity" "PASS" "Database is connected"
            } elseif ($healthData.cosmos -and -not $healthData.cosmos.connected) {
                Test-Result "Cosmos DB connectivity" "WARN" "Database not connected: $($healthData.cosmos.error)"
            }
        } else {
            Test-Result "Health endpoint" "FAIL" "Status: $($response.StatusCode)"
        }
    } catch {
        Test-Result "Health endpoint" "WARN" "Could not reach /api/health - this is normal if not deployed yet"
    }
    
    # Test 7c: API test endpoint
    try {
        $testUrl = "$StaticWebAppUrl/api/test"
        $response = Invoke-WebRequest -Uri $testUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Test-Result "API test endpoint" "PASS" "API functions are working"
        }
    } catch {
        Test-Result "API test endpoint" "WARN" "Could not test API - might not be deployed yet"
    }
    
    # Test 7d: HTTPS redirect
    if ($StaticWebAppUrl -match "^https://") {
        Test-Result "HTTPS enabled" "PASS" "Site uses HTTPS"
    } else {
        Test-Result "HTTPS enabled" "WARN" "Site should use HTTPS"
    }
    
} else {
    Write-Host "`n⚠️  Skipping HTTP tests - URL not available" -ForegroundColor Yellow
}

# ============================================================================
# TEST 8: GitHub Integration (Optional)
# ============================================================================
Write-Host "`n🔄 Testing GitHub Integration..." -ForegroundColor Cyan

# Check if GitHub CLI is installed
try {
    $ghVersion = gh --version 2>$null
    if ($ghVersion) {
        Test-Result "GitHub CLI installed" "PASS" "GitHub CLI available"
        
        # Try to get workflow runs (this will fail if not in a git repo or not authenticated)
        try {
            $runs = gh run list --limit 1 --json status,conclusion 2>$null | ConvertFrom-Json
            if ($runs -and $runs.Count -gt 0) {
                $latestRun = $runs[0]
                if ($latestRun.status -eq "completed" -and $latestRun.conclusion -eq "success") {
                    Test-Result "Latest deployment" "PASS" "Last workflow succeeded"
                } else {
                    Test-Result "Latest deployment" "WARN" "Status: $($latestRun.status), Conclusion: $($latestRun.conclusion)"
                }
            }
        } catch {
            Test-Result "GitHub workflows" "WARN" "Could not check workflows - might not be in repo or not authenticated"
        }
    }
} catch {
    Test-Result "GitHub CLI" "WARN" "GitHub CLI not installed (optional)"
}

# ============================================================================
# GENERATE REPORT
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VERIFICATION RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📊 Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Passed:  " -NoNewline -ForegroundColor Green
Write-Host "$passCount"
Write-Host "  ❌ Failed:  " -NoNewline -ForegroundColor Red
Write-Host "$failCount"
Write-Host "  ⚠️  Warnings: " -NoNewline -ForegroundColor Yellow
Write-Host "$warnCount"
Write-Host ""

# Overall status
if ($failCount -eq 0 -and $warnCount -eq 0) {
    Write-Host "🎉 All tests passed! Your deployment is healthy." -ForegroundColor Green
} elseif ($failCount -eq 0) {
    Write-Host "✅ Core functionality working. Review warnings above." -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some tests failed. Review errors above." -ForegroundColor Red
}

# Next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan

if ($failCount -gt 0) {
    Write-Host "  1. Review failed tests above" -ForegroundColor White
    Write-Host "  2. Check docs-deployment/STATIC_WEB_APP_SETUP.md for troubleshooting" -ForegroundColor White
    Write-Host "  3. Run this script again after fixes" -ForegroundColor White
} else {
    if (-not [string]::IsNullOrEmpty($StaticWebAppUrl)) {
        Write-Host "  1. Visit your app: $StaticWebAppUrl" -ForegroundColor White
        Write-Host "  2. Test login with Azure AD" -ForegroundColor White
        Write-Host "  3. Create some test data" -ForegroundColor White
        Write-Host "  4. Verify data persists after refresh" -ForegroundColor White
    } else {
        Write-Host "  1. Complete deployment using DEPLOY_WEBAPP_AZURE.ps1" -ForegroundColor White
        Write-Host "  2. Run this script again to verify" -ForegroundColor White
    }
}

Write-Host ""

# Save results to file
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportFile = "verification-report-$timestamp.txt"

$report = @"
═══════════════════════════════════════════════════════════
DREAMSPACE DEPLOYMENT VERIFICATION REPORT
═══════════════════════════════════════════════════════════

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Resource Group: $ResourceGroup
Static Web App: $StaticWebAppName
URL: $StaticWebAppUrl

RESULTS:
--------
✅ Passed:  $passCount
❌ Failed:  $failCount
⚠️  Warnings: $warnCount

DETAILED RESULTS:
-----------------
$($testResults | ForEach-Object { "[$($_.Status)] $($_.Test)$(if ($_.Message) { ": $($_.Message)" })" } | Out-String)

═══════════════════════════════════════════════════════════
"@

$report | Out-File $reportFile -Encoding UTF8
Write-Host "💾 Full report saved to: $reportFile" -ForegroundColor Green
Write-Host ""

# Return exit code based on results
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}

