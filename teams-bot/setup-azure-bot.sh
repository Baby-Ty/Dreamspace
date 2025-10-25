#!/bin/bash
# Dreamspace Teams Bot - Azure Setup Script
# This script provisions all Azure resources needed for the Teams bot

set -e

# Default values
RG="${1:-rg-dreamspace}"
LOCATION="${2:-eastus}"
BOT_NAME="${3:-dreamspace-teams-bot}"
FUNC_APP="${4:-dreamspace-bot-func}"
COSMOS_ACCOUNT="${5:-}"
SKIP_COSMOS="${6:-false}"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "Dreamspace Teams Bot - Azure Setup"
echo -e "========================================${NC}"
echo ""

# Validate Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI is not installed.${NC}"
    echo -e "${YELLOW}Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged into Azure. Running 'az login'...${NC}"
    az login
fi

echo -e "${GREEN}Current Azure subscription:${NC}"
az account show --query "{Name:name, SubscriptionId:id}" -o table
echo ""

read -p "Continue with this subscription? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Exiting...${NC}"
    exit 0
fi

# Generate unique storage account name
RANDOM_SUFFIX=$((RANDOM % 9999))
STORAGE_ACCOUNT="dreamspacebot${RANDOM_SUFFIX}"

echo ""
echo -e "${CYAN}========================================"
echo -e "Configuration"
echo -e "========================================${NC}"
echo -e "${WHITE}Resource Group: $RG${NC}"
echo -e "${WHITE}Location: $LOCATION${NC}"
echo -e "${WHITE}Bot Name: $BOT_NAME${NC}"
echo -e "${WHITE}Function App: $FUNC_APP${NC}"
echo -e "${WHITE}Storage Account: $STORAGE_ACCOUNT${NC}"
echo ""

# Step 1: Create or verify Resource Group
echo -e "${CYAN}Step 1: Checking resource group...${NC}"
if [ "$(az group exists -n $RG)" = "false" ]; then
    echo -e "${YELLOW}Creating resource group: $RG${NC}"
    az group create -n $RG -l $LOCATION -o none
    echo -e "${GREEN}✓ Resource group created${NC}"
else
    echo -e "${GREEN}✓ Resource group already exists${NC}"
fi
echo ""

# Step 2: Create Storage Account
echo -e "${CYAN}Step 2: Creating storage account...${NC}"
az storage account create -n $STORAGE_ACCOUNT -g $RG -l $LOCATION --sku Standard_LRS -o none
echo -e "${GREEN}✓ Storage account created: $STORAGE_ACCOUNT${NC}"
echo ""

# Step 3: Create Function App
echo -e "${CYAN}Step 3: Creating Function App...${NC}"
az functionapp create -g $RG -n $FUNC_APP \
    --storage-account $STORAGE_ACCOUNT \
    --consumption-plan-location $LOCATION \
    --runtime node \
    --runtime-version 18 \
    --functions-version 4 \
    -o none
echo -e "${GREEN}✓ Function App created: $FUNC_APP${NC}"
echo ""

# Step 4: Create Azure AD App Registration
echo -e "${CYAN}Step 4: Creating Azure AD App Registration...${NC}"
APP_NAME="Dreamspace Teams Bot"
APP_ID=$(az ad app create --display-name "$APP_NAME" \
    --sign-in-audience AzureADMultipleOrgs \
    --query appId -o tsv)

if [ -z "$APP_ID" ]; then
    echo -e "${RED}ERROR: Failed to create App Registration${NC}"
    exit 1
fi

echo -e "${GREEN}✓ App Registration created: $APP_ID${NC}"

# Create app secret
APP_SECRET=$(az ad app credential reset --id $APP_ID --append \
    --display-name "bot-secret" \
    --query password -o tsv)

echo -e "${GREEN}✓ App secret generated${NC}"
echo ""

# Step 5: Create Azure Bot Registration
echo -e "${CYAN}Step 5: Creating Azure Bot...${NC}"
BOT_ENDPOINT="https://${FUNC_APP}.azurewebsites.net/api/messages"

az bot create --kind registration -g $RG -n $BOT_NAME \
    --appid $APP_ID \
    --password "$APP_SECRET" \
    --endpoint $BOT_ENDPOINT \
    -o none

echo -e "${GREEN}✓ Azure Bot created: $BOT_NAME${NC}"
echo ""

# Step 6: Enable Teams Channel
echo -e "${CYAN}Step 6: Enabling Teams channel...${NC}"
az bot msteams create -g $RG -n $BOT_NAME -o none
echo -e "${GREEN}✓ Teams channel enabled${NC}"
echo ""

# Step 7: Get Cosmos DB credentials
echo -e "${CYAN}Step 7: Retrieving Cosmos DB credentials...${NC}"

if [ -z "$COSMOS_ACCOUNT" ]; then
    echo -e "${YELLOW}Please enter your existing Cosmos DB account name:${NC}"
    read COSMOS_ACCOUNT
fi

COSMOS_ENDPOINT=$(az cosmosdb show -n $COSMOS_ACCOUNT -g $RG --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list -n $COSMOS_ACCOUNT -g $RG --query primaryMasterKey -o tsv)

if [ -z "$COSMOS_ENDPOINT" ] || [ -z "$COSMOS_KEY" ]; then
    echo -e "${RED}ERROR: Could not retrieve Cosmos DB credentials${NC}"
    echo -e "${YELLOW}Please verify the Cosmos DB account name and resource group${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Cosmos DB credentials retrieved${NC}"
echo ""

# Step 8: Configure Function App Settings
echo -e "${CYAN}Step 8: Configuring Function App settings...${NC}"
az functionapp config appsettings set -g $RG -n $FUNC_APP --settings \
    MicrosoftAppId=$APP_ID \
    MicrosoftAppPassword="$APP_SECRET" \
    MicrosoftAppType=MultiTenant \
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" \
    COSMOS_KEY="$COSMOS_KEY" \
    -o none

echo -e "${GREEN}✓ Function App configured${NC}"
echo ""

# Step 9: Create Cosmos DB Containers
if [ "$SKIP_COSMOS" != "true" ]; then
    echo -e "${CYAN}Step 9: Creating Cosmos DB containers...${NC}"
    
    # Check if botConversations exists
    if ! az cosmosdb sql container show \
        --account-name $COSMOS_ACCOUNT \
        --database-name dreamspace \
        --resource-group $RG \
        --name botConversations &> /dev/null; then
        
        echo -e "${YELLOW}Creating container: botConversations${NC}"
        az cosmosdb sql container create \
            --account-name $COSMOS_ACCOUNT \
            --database-name dreamspace \
            --resource-group $RG \
            --name botConversations \
            --partition-key-path "/userId" \
            --throughput 400 \
            -o none
        echo -e "${GREEN}✓ Container created: botConversations${NC}"
    else
        echo -e "${GREEN}✓ Container already exists: botConversations${NC}"
    fi
    
    # Check if checkins exists
    if ! az cosmosdb sql container show \
        --account-name $COSMOS_ACCOUNT \
        --database-name dreamspace \
        --resource-group $RG \
        --name checkins &> /dev/null; then
        
        echo -e "${YELLOW}Creating container: checkins${NC}"
        az cosmosdb sql container create \
            --account-name $COSMOS_ACCOUNT \
            --database-name dreamspace \
            --resource-group $RG \
            --name checkins \
            --partition-key-path "/userId" \
            --throughput 400 \
            -o none
        echo -e "${GREEN}✓ Container created: checkins${NC}"
    else
        echo -e "${GREEN}✓ Container already exists: checkins${NC}"
    fi
    
    echo ""
else
    echo -e "${YELLOW}Step 9: Skipping Cosmos DB container creation${NC}"
    echo ""
fi

# Summary
echo -e "${GREEN}========================================"
echo -e "Setup Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}Bot Configuration:${NC}"
echo -e "${WHITE}  Bot Name: $BOT_NAME${NC}"
echo -e "${WHITE}  Bot ID (App ID): $APP_ID${NC}"
echo -e "${WHITE}  Endpoint: $BOT_ENDPOINT${NC}"
echo -e "${WHITE}  Function App: $FUNC_APP${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "${WHITE}  1. Deploy your bot code to the Function App:${NC}"
echo -e "${YELLOW}     func azure functionapp publish $FUNC_APP${NC}"
echo ""
echo -e "${WHITE}  2. Test the bot endpoint:${NC}"
echo -e "${YELLOW}     $BOT_ENDPOINT${NC}"
echo ""
echo -e "${WHITE}  3. Update manifest/manifest.json with:${NC}"
echo -e "${YELLOW}     - Replace {{MICROSOFT_APP_ID}} with: $APP_ID${NC}"
echo -e "${YELLOW}     - Replace {{FUNCTION_APP_DOMAIN}} with: $FUNC_APP.azurewebsites.net${NC}"
echo ""
echo -e "${WHITE}  4. Package and upload to Teams Developer Portal${NC}"
echo ""
echo -e "${RED}IMPORTANT: Save these credentials securely!${NC}"
echo -e "${WHITE}  App ID: $APP_ID${NC}"
echo -e "${WHITE}  App Secret: $APP_SECRET${NC}"
echo ""

