# PowerShell Script to Set Up Cosmos DB Containers for People Hub
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$CosmosAccountName
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Red = [System.ConsoleColor]::Red
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Blue

function Write-ColorText($text, $color) {
    $host.UI.RawUI.ForegroundColor = $color
    Write-Host $text
    $host.UI.RawUI.ForegroundColor = [System.ConsoleColor]::White
}

Write-ColorText "Setting up Cosmos DB containers for People Hub..." $Blue
Write-ColorText "Resource Group: $ResourceGroupName" $Yellow
Write-ColorText "Cosmos Account: $CosmosAccountName" $Yellow

# Check if logged in to Azure
Write-ColorText "Checking Azure CLI authentication..." $Blue
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-ColorText "Not logged in to Azure CLI. Please run 'az login' first." $Red
        exit 1
    }
    Write-ColorText "✅ Authenticated as: $($account.user.name)" $Green
} catch {
    Write-ColorText "❌ Azure CLI not found or not logged in. Please install Azure CLI and run 'az login'." $Red
    exit 1
}

# Check if Cosmos account exists
Write-ColorText "🔍 Verifying Cosmos DB account exists..." $Blue
try {
    $cosmosAccount = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --output json 2>$null | ConvertFrom-Json
    if (-not $cosmosAccount) {
        Write-ColorText "❌ Cosmos DB account '$CosmosAccountName' not found in resource group '$ResourceGroupName'" $Red
        exit 1
    }
    Write-ColorText "✅ Found Cosmos DB account: $($cosmosAccount.name)" $Green
} catch {
    Write-ColorText "❌ Error checking Cosmos DB account. Please verify the account name and resource group." $Red
    exit 1
}

# Check if dreamspace database exists
Write-ColorText "🔍 Checking if 'dreamspace' database exists..." $Blue
try {
    $database = az cosmosdb sql database show --account-name $CosmosAccountName --resource-group $ResourceGroupName --name "dreamspace" --output json 2>$null | ConvertFrom-Json
    if (-not $database) {
        Write-ColorText "⚠️  Database 'dreamspace' not found. Creating it..." $Yellow
        az cosmosdb sql database create --account-name $CosmosAccountName --resource-group $ResourceGroupName --name "dreamspace" --output none
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "❌ Failed to create database 'dreamspace'" $Red
            exit 1
        }
        Write-ColorText "✅ Created database 'dreamspace'" $Green
    } else {
        Write-ColorText "✅ Database 'dreamspace' already exists" $Green
    }
} catch {
    Write-ColorText "❌ Error checking/creating database" $Red
    exit 1
}

# Check if teams container exists
Write-ColorText "🔍 Checking if 'teams' container exists..." $Blue
try {
    $teamsContainer = az cosmosdb sql container show --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "teams" --output json 2>$null | ConvertFrom-Json
    if (-not $teamsContainer) {
        Write-ColorText "📋 Creating 'teams' container..." $Blue
        az cosmosdb sql container create --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "teams" --partition-key-path "/managerId" --throughput 400 --output none
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "❌ Failed to create 'teams' container" $Red
            exit 1
        }
        Write-ColorText "✅ Created 'teams' container with partition key '/managerId'" $Green
    } else {
        Write-ColorText "✅ Container 'teams' already exists" $Green
    }
} catch {
    Write-ColorText "❌ Error checking/creating 'teams' container" $Red
    exit 1
}

# Check if users container exists (should already exist)
Write-ColorText "🔍 Verifying 'users' container exists..." $Blue
try {
    $usersContainer = az cosmosdb sql container show --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "users" --output json 2>$null | ConvertFrom-Json
    if (-not $usersContainer) {
        Write-ColorText "⚠️  'users' container not found. Creating it..." $Yellow
        az cosmosdb sql container create --account-name $CosmosAccountName --database-name "dreamspace" --resource-group $ResourceGroupName --name "users" --partition-key-path "/userId" --throughput 400 --output none
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "❌ Failed to create 'users' container" $Red
            exit 1
        }
        Write-ColorText "✅ Created 'users' container with partition key '/userId'" $Green
    } else {
        Write-ColorText "✅ Container 'users' already exists" $Green
    }
} catch {
    Write-ColorText "❌ Error checking/creating 'users' container" $Red
    exit 1
}

# Get connection details for verification
Write-ColorText "Getting connection details..." $Blue
try {
    $keys = az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroupName --type keys --output json | ConvertFrom-Json
    $endpoint = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --query "documentEndpoint" -o tsv
    
    Write-ColorText "" $White
    Write-ColorText "🎉 People Hub Cosmos DB Setup Complete!" $Green
    Write-ColorText "========================================" $Green
    Write-ColorText "" $White
    Write-ColorText "📋 Configuration Summary:" $Yellow
    Write-ColorText "Database: dreamspace" $White
    Write-ColorText "Containers:" $White
    Write-ColorText "  • users (partition key: /userId)" $White
    Write-ColorText "  • teams (partition key: /managerId)" $White
    Write-ColorText "" $White
    Write-ColorText "🔧 Next Steps:" $Yellow
    Write-ColorText "1. Ensure these environment variables are set in your Azure Static Web App:" $White
    Write-ColorText "   VITE_APP_ENV=production" $Blue
    Write-ColorText "   COSMOS_ENDPOINT=$endpoint" $Blue
    Write-ColorText "   COSMOS_KEY=<your-cosmos-key>" $Blue
    Write-ColorText "" $White
    Write-ColorText "2. Deploy your application to Azure Static Web Apps" $White
    Write-ColorText "3. Test the People Hub with live data" $White
    Write-ColorText "" $White
    Write-ColorText "📚 Documentation: See PEOPLE_HUB_COSMOS_INTEGRATION.md for detailed information" $Yellow
    Write-ColorText "" $White
    
} catch {
    Write-ColorText "⚠️  Setup completed but could not retrieve connection details" $Yellow
    Write-ColorText "Please check your Cosmos DB account manually in the Azure portal" $Yellow
}

Write-ColorText "✅ Script completed successfully!" $Green
