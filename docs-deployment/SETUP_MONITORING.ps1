# DreamSpace - Simple Monitoring Setup
# This script sets up Application Insights and basic alerts

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup = "dreamspace-rg",
    
    [Parameter(Mandatory=$true)]
    [string]$FunctionAppName = "dreamspace-functions",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$AlertEmail = ""
)

Write-Host "[*] Setting up monitoring for DreamSpace..." -ForegroundColor Cyan

# 1. Create Application Insights
Write-Host "`n[*] Creating Application Insights..." -ForegroundColor Yellow
$appInsightsName = "$FunctionAppName-insights"

$appInsights = az monitor app-insights component create `
    --app $appInsightsName `
    --location $Location `
    --resource-group $ResourceGroup `
    --application-type web `
    --query "{name:name, instrumentationKey:instrumentationKey, connectionString:connectionString}" `
    -o json | ConvertFrom-Json

if ($appInsights) {
    Write-Host "[OK] Application Insights created: $appInsightsName" -ForegroundColor Green
    Write-Host "   Instrumentation Key: $($appInsights.instrumentationKey)" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Failed to create Application Insights" -ForegroundColor Red
    exit 1
}

# 2. Connect Function App to Application Insights
Write-Host "`n[*] Connecting Function App to Application Insights..." -ForegroundColor Yellow

az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings "APPLICATIONINSIGHTS_CONNECTION_STRING=$($appInsights.connectionString)" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Function App connected to Application Insights" -ForegroundColor Green
} else {
    Write-Host "[WARN] Function App connection failed - may need to be done manually" -ForegroundColor Yellow
}

# 3. Create Action Group for Alerts (if email provided)
if ($AlertEmail) {
    Write-Host "`n[*] Creating alert action group..." -ForegroundColor Yellow
    $actionGroupName = "dreamspace-alerts"
    
    az monitor action-group create `
        --name $actionGroupName `
        --resource-group $ResourceGroup `
        --short-name "DreamAlert" `
        --email-receiver name="Admin" email-address=$AlertEmail `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Alert action group created" -ForegroundColor Green
        
        # Get the action group ID
        $actionGroupId = az monitor action-group show `
            --name $actionGroupName `
            --resource-group $ResourceGroup `
            --query id -o tsv
        
        # Get the Function App resource ID
        $functionAppId = az functionapp show `
            --name $FunctionAppName `
            --resource-group $ResourceGroup `
            --query id -o tsv
        
        # Create Alert 1: High failure rate
        Write-Host "`n[*] Creating alerts..." -ForegroundColor Yellow
        
        az monitor metrics alert create `
            --name "DreamSpace - High API Failure Rate" `
            --resource-group $ResourceGroup `
            --scopes $functionAppId `
            --condition "count Http5xx > 10" `
            --window-size 5m `
            --evaluation-frequency 1m `
            --description "Alert when API has more than 10 failed requests in 5 minutes" `
            --action $actionGroupId `
            --output none
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Alert created: High API Failure Rate" -ForegroundColor Green
        }
        
        # Create Alert 2: High response time
        az monitor metrics alert create `
            --name "DreamSpace - Slow API Response" `
            --resource-group $ResourceGroup `
            --scopes $functionAppId `
            --condition "avg HttpResponseTime > 3000" `
            --window-size 5m `
            --evaluation-frequency 1m `
            --description "Alert when average response time exceeds 3 seconds" `
            --action $actionGroupId `
            --output none
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Alert created: Slow API Response" -ForegroundColor Green
        }
    }
} else {
    Write-Host "`n[WARN] No email provided - skipping alert configuration" -ForegroundColor Yellow
    Write-Host "   Re-run with -AlertEmail parameter to set up alerts" -ForegroundColor Gray
}

# 4. Enable detailed logging in Function App
Write-Host "`n[*] Configuring logging settings..." -ForegroundColor Yellow

az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings "FUNCTIONS_WORKER_RUNTIME=node" "AzureWebJobsFeatureFlags=EnableWorkerIndexing" `
    --output none

Write-Host "[OK] Logging configured" -ForegroundColor Green

# 5. Summary
Write-Host "`n" -NoNewline
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Monitoring Setup Complete!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

Write-Host "`n[Application Insights Details]" -ForegroundColor Yellow
Write-Host "   Resource: $appInsightsName" -ForegroundColor White
Write-Host "   Connection String: $($appInsights.connectionString)" -ForegroundColor Gray

Write-Host "`n[View Monitoring]" -ForegroundColor Yellow
Write-Host "   1. Azure Portal -> Application Insights -> $appInsightsName" -ForegroundColor White
Write-Host "   2. Click 'Live Metrics' for real-time monitoring" -ForegroundColor White
Write-Host "   3. Check 'Failures' tab for errors" -ForegroundColor White
Write-Host "   4. Check 'Performance' tab for slow queries" -ForegroundColor White

Write-Host "`n[Add to Frontend]" -ForegroundColor Yellow
Write-Host "   Add this to your environment variables:" -ForegroundColor White
Write-Host "   VITE_APPINSIGHTS_CONNECTION_STRING=$($appInsights.connectionString)" -ForegroundColor Gray

Write-Host "`n[Next Steps]" -ForegroundColor Yellow
Write-Host "   1. Test your API to generate telemetry" -ForegroundColor White
Write-Host "   2. Check Application Insights in Azure Portal" -ForegroundColor White
if (-not $AlertEmail) {
    Write-Host "   3. Re-run with -AlertEmail to set up alerts" -ForegroundColor White
}

Write-Host ""

