# PowerShell script to get deployment information for DreamSpace
# Run this after creating your Azure Static Web App

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "dreamspace-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "dreamspace-app"
)

Write-Host "🔍 Getting deployment information for DreamSpace..." -ForegroundColor Green

# Check if Azure CLI is installed and logged in
try {
    $account = az account show --query "name" -o tsv 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Please login to Azure CLI first: az login" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Logged in to Azure as: $account" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Get Static Web App details
Write-Host "📱 Getting Static Web App details..." -ForegroundColor Blue
$appDetails = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get Static Web App details. Make sure the app exists." -ForegroundColor Red
    Write-Host "💡 Create it first in the Azure Portal or run: az staticwebapp create" -ForegroundColor Yellow
    exit 1
}

# Get deployment token
Write-Host "🔑 Getting deployment token..." -ForegroundColor Blue
$secrets = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
$deploymentToken = $secrets.properties.apiKey

Write-Host ""
Write-Host "🎉 Static Web App Information" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 App Details:" -ForegroundColor Yellow
Write-Host "Name: $($appDetails.name)" -ForegroundColor White
Write-Host "URL: https://$($appDetails.defaultHostname)" -ForegroundColor White
Write-Host "Status: $($appDetails.properties.repositoryUrl)" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Deployment Token (for GitHub Secrets):" -ForegroundColor Yellow
Write-Host $deploymentToken -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy the deployment token above" -ForegroundColor White
Write-Host "2. Go to your GitHub repository: https://github.com/Baby-Ty/Dreamspace" -ForegroundColor White
Write-Host "3. Navigate to: Settings > Secrets and variables > Actions" -ForegroundColor White
Write-Host "4. Click 'New repository secret'" -ForegroundColor White
Write-Host "5. Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Cyan
Write-Host "6. Value: [paste the deployment token]" -ForegroundColor Cyan
Write-Host "7. Click 'Add secret'" -ForegroundColor White
Write-Host ""
Write-Host "🚀 After adding the secret, push any change to trigger deployment!" -ForegroundColor Green
