# 3-Container Database Migration - Deployment Script
# Run this script to deploy the new architecture to Azure

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$CosmosAccountName,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipContainerCreation,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipGitPush
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  3-Container DB Migration Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we have the code
Write-Host "Step 1: Verifying implementation..." -ForegroundColor Green
$requiredFiles = @(
    "api/saveItem/index.js",
    "api/getItems/index.js",
    "api/deleteItem/index.js",
    "api/batchSaveItems/index.js",
    "src/services/itemService.js",
    "src/schemas/item.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "  Missing file: $file" -ForegroundColor Red
        $allFilesExist = $false
    } else {
        Write-Host "  Found: $file" -ForegroundColor Gray
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "ERROR: Some required files are missing!" -ForegroundColor Red
    exit 1
}

Write-Host "  All implementation files present" -ForegroundColor Green
Write-Host ""

# Step 2: Create items container
if (-not $SkipContainerCreation) {
    Write-Host "Step 2: Creating items container in Cosmos DB..." -ForegroundColor Green
    
    if (-not $ResourceGroupName -or -not $CosmosAccountName) {
        Write-Host ""
        Write-Host "Please provide your Azure resource details:" -ForegroundColor Yellow
        if (-not $ResourceGroupName) {
            $ResourceGroupName = Read-Host "  Resource Group Name"
        }
        if (-not $CosmosAccountName) {
            $CosmosAccountName = Read-Host "  Cosmos DB Account Name"
        }
    }
    
    Write-Host "  Creating container items with partition key /userId..." -ForegroundColor Gray
    
    # Check if already exists
    $existingContainer = az cosmosdb sql container show --account-name $CosmosAccountName --resource-group $ResourceGroupName --database-name dreamspace --name items --output json 2>$null
    
    if ($existingContainer) {
        Write-Host "  Container items already exists" -ForegroundColor Green
    } else {
        Write-Host "  Creating new container..." -ForegroundColor Gray
        az cosmosdb sql container create --account-name $CosmosAccountName --resource-group $ResourceGroupName --database-name dreamspace --name items --partition-key-path "/userId" --output none
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Container items created successfully" -ForegroundColor Green
        } else {
            Write-Host "  Failed to create container" -ForegroundColor Red
            Write-Host ""
            Write-Host "You can create it manually in Azure Portal:" -ForegroundColor Yellow
            Write-Host "  1. Go to Cosmos DB Data Explorer" -ForegroundColor Gray
            Write-Host "  2. dreamspace database" -ForegroundColor Gray
            Write-Host "  3. New Container: items, Partition key: /userId" -ForegroundColor Gray
            $continue = Read-Host "Continue anyway? (yes/no)"
            if ($continue -ne "yes") {
                exit 1
            }
        }
    }
    Write-Host ""
} else {
    Write-Host "Step 2: Skipping container creation" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Commit all changes
Write-Host "Step 3: Committing changes to git..." -ForegroundColor Green

# Check if there are uncommitted changes
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "  Found uncommitted changes" -ForegroundColor Gray
    
    # Add all files
    Write-Host "  Adding files to git..." -ForegroundColor Gray
    git add .
    
    # Commit
    Write-Host "  Committing changes..." -ForegroundColor Gray
    git commit -m "feat: Implement 3-container database architecture"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Changes committed" -ForegroundColor Green
    } else {
        Write-Host "  Commit failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  All changes already committed" -ForegroundColor Green
}
Write-Host ""

# Step 4: Push to GitHub
if (-not $SkipGitPush) {
    Write-Host "Step 4: Pushing to GitHub..." -ForegroundColor Green
    
    $currentBranch = git branch --show-current
    Write-Host "  Current branch: $currentBranch" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "  This will deploy:" -ForegroundColor Yellow
    Write-Host "    Azure Functions (saveItem, getItems, etc)" -ForegroundColor Gray
    Write-Host "    Static Web App (itemService, updated schemas)" -ForegroundColor Gray
    Write-Host "    3-container architecture" -ForegroundColor Gray
    Write-Host ""
    
    $confirm = Read-Host "  Push to GitHub and deploy? (yes/no)"
    
    if ($confirm -eq "yes") {
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Pushed to GitHub successfully" -ForegroundColor Green
        } else {
            Write-Host "  Push failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  Skipped push" -ForegroundColor Yellow
        Write-Host "  Run manually: git push origin $currentBranch" -ForegroundColor Gray
    }
} else {
    Write-Host "Step 4: Skipping git push" -ForegroundColor Yellow
    $currentBranch = git branch --show-current
    Write-Host "  Run manually: git push origin $currentBranch" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Initiated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Monitor GitHub Actions:" -ForegroundColor Yellow
Write-Host "   https://github.com/Baby-Ty/Dreamspace/actions" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Verify in Azure Portal:" -ForegroundColor Yellow
Write-Host "   Cosmos DB Data Explorer -> items container" -ForegroundColor Gray
Write-Host "   Function App -> check new functions" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Test the deployment:" -ForegroundColor Yellow
Write-Host "   Sign in as NEW user -> should use V2" -ForegroundColor Gray
Write-Host "   Sign in as EXISTING user -> migrates on save" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT_3CONTAINER_QUICKSTART.md" -ForegroundColor Gray
Write-Host "  docs-implementation-history/3_CONTAINER_DB_MIGRATION.md" -ForegroundColor Gray
Write-Host ""

Write-Host "Deployment process complete!" -ForegroundColor Green
Write-Host ""

