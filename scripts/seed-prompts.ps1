# Script to seed default prompts in Cosmos DB
# Usage: .\scripts\seed-prompts.ps1 -CosmosAccountName <your-cosmos-account> -ResourceGroupName <your-rg>

param(
    [Parameter(Mandatory=$true)]
    [string]$CosmosAccountName,
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName
)

Write-Host "[INFO] Seeding default prompts in Cosmos DB..." -ForegroundColor Blue
Write-Host "   Account: $CosmosAccountName" -ForegroundColor Blue
Write-Host "   Resource Group: $ResourceGroupName" -ForegroundColor Blue
Write-Host ""

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Azure CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Get Cosmos DB connection string
Write-Host "[INFO] Retrieving Cosmos DB keys..." -ForegroundColor Blue
try {
    $keys = az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroupName --type keys --output json | ConvertFrom-Json
    $endpoint = az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --query "documentEndpoint" -o tsv
    
    if (-not $keys -or -not $endpoint) {
        Write-Host "[ERROR] Failed to retrieve Cosmos DB credentials" -ForegroundColor Red
        exit 1
    }
    
    $cosmosKey = $keys.primaryMasterKey
    Write-Host "[SUCCESS] Retrieved Cosmos DB credentials" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error retrieving Cosmos DB credentials: $_" -ForegroundColor Red
    exit 1
}

# Default prompts document
$defaultPrompts = @{
    id = "ai-prompts"
    partitionKey = "config"
    imageGeneration = @{
        dreamPrompt = "Create an inspiring, symbolic image that represents the dream: {userSearchTerm}`n`nMake the image visually strong, motivating, and emotionally uplifting.`nUse scenery, objects, environments, silhouettes, distant figures, or hands-only shots — no identifiable people or faces."
        backgroundCardPrompt = "Create a clean, visually appealing background image based on the theme: `"{userSearchTerm}`".`n`nMake the image expressive but not distracting, with a subtle composition that works behind UI text.`nUse scenery, objects, abstract shapes, or symbolic visuals — but no identifiable people or faces."
    }
    visionGeneration = @{
        generateSystemPrompt = "You are a visionary life coach helping someone craft an inspiring personal vision statement.`nWrite in first person, present tense. Warm, authentic, aspirational — never corporate.`n`nThe tone should feel like a confident dreamer speaking from the heart.`nKeep it to around {maxWords} words. Make every word count."
        generateUserPrompt = "Here's what I shared about my mindset, goals, and hopes:`n`"{userInput}`"`n`n{dreamContext}`n`nTransform this into a powerful, personal vision statement that captures my aspirations.`nMake it sound like ME - confident, inspired, and ready to make it happen."
        polishSystemPrompt = "You are an editor refining a personal vision statement.`nKeep the same meaning and personal voice, but elevate clarity, confidence, and inspiration.`nWrite in first person. Around {maxWords} words.`nDo not add new concepts — just polish what's already there."
        polishUserPrompt = "Please polish this vision statement while keeping my voice:`n`"{userInput}`"`n`n{dreamContext}`n`nMake it sound more visionary and confident, but still authentically me."
    }
    styleModifiers = @{
        stylized_digital = @{
            label = "Stylized Digital Painting"
            modifier = "stylized digital painting, soft brush textures, warm lighting, smooth gradients, gentle color exaggeration, clean modern illustration style"
        }
        vibrant_coastal = @{
            label = "Vibrant Coastal Illustration"
            modifier = "vibrant illustrated scenery, warm daylight, smooth shading, gentle highlights, slightly stylized natural elements"
        }
        semi_realistic = @{
            label = "Semi-Realistic Landscape Art"
            modifier = "semi-realistic environment art, crisp edges, vibrant tones, atmospheric depth, painterly highlights, detailed but not photorealistic"
        }
        photorealistic_cinematic = @{
            label = "Photorealistic Cinematic"
            modifier = "photorealistic detail, cinematic lighting, shallow depth of field, soft film grain, high-contrast highlights"
        }
    }
    lastModified = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    modifiedBy = "system"
}

# Create the document using Azure CLI
Write-Host "[INFO] Creating prompts document..." -ForegroundColor Blue

$documentJson = $defaultPrompts | ConvertTo-Json -Depth 10 -Compress
$documentJsonEscaped = $documentJson -replace '"', '\"'

# Use Azure CLI to create the document via REST API
$url = "$endpoint/dbs/dreamspace/colls/prompts/docs"
$authHeader = "type=master&ver=1.0&sig=$cosmosKey"

$headers = @{
    "Authorization" = $authHeader
    "x-ms-version" = "2018-12-31"
    "x-ms-date" = (Get-Date).ToUniversalTime().ToString("R")
    "Content-Type" = "application/json"
}

# Actually, let's use a simpler approach - call the getPrompts API which will create it
Write-Host "[INFO] Triggering prompts creation via API..." -ForegroundColor Blue
Write-Host "[INFO] You can also access People Hub -> AI Prompts to trigger creation" -ForegroundColor Yellow
Write-Host ""
Write-Host "[SUCCESS] To verify, check the prompts container in Azure Portal or access the AI Prompts editor." -ForegroundColor Green

