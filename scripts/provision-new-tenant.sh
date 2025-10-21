#!/bin/bash
# Azure Dreamspace New Tenant Provisioning Script
# This script automates the creation of Azure resources for a new tenant deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${CYAN}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Parse arguments
TENANT_ID=""
RESOURCE_GROUP="rg-dreamspace-prod-eastus"
LOCATION="eastus"
COSMOS_PREFIX="cosmos-dreamspace-prod"
SWA_NAME="swa-dreamspace-prod"
ENABLE_FREE_TIER="true"

while [[ $# -gt 0 ]]; do
    case $1 in
        --tenant-id)
            TENANT_ID="$2"
            shift 2
            ;;
        --resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        --location)
            LOCATION="$2"
            shift 2
            ;;
        --no-free-tier)
            ENABLE_FREE_TIER="false"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 --tenant-id TENANT_ID [options]"
            echo ""
            echo "Options:"
            echo "  --tenant-id ID           Azure Tenant ID (required)"
            echo "  --resource-group NAME    Resource group name (default: rg-dreamspace-prod-eastus)"
            echo "  --location LOCATION      Azure region (default: eastus)"
            echo "  --no-free-tier          Disable Cosmos DB free tier"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ -z "$TENANT_ID" ]; then
    print_error "Tenant ID is required. Use --tenant-id flag."
    echo "Use --help for usage information"
    exit 1
fi

# Check Azure CLI
print_step "Checking Azure CLI installation"
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Install from: https://aka.ms/InstallAzureCLIDirect"
    exit 1
fi
AZ_VERSION=$(az version --output json | jq -r '."azure-cli"')
print_success "Azure CLI version $AZ_VERSION found"

# Login
print_step "Logging in to Azure (Tenant: $TENANT_ID)"
az login --tenant "$TENANT_ID" --output none
if [ $? -ne 0 ]; then
    print_error "Failed to login to Azure"
    exit 1
fi
print_success "Logged in successfully"

# Generate unique suffix
TIMESTAMP=$(date +%Y%m%d)
COSMOS_ACCOUNT="${COSMOS_PREFIX}-${TIMESTAMP}"

print_info "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Cosmos Account: $COSMOS_ACCOUNT"
echo "  Static Web App: $SWA_NAME"
echo "  Free Tier: $ENABLE_FREE_TIER"

# Confirm
echo ""
echo "This will create Azure resources that may incur costs."
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Create Resource Group
print_step "Creating Resource Group: $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
print_success "Resource group created"

# Create Cosmos DB
print_step "Creating Cosmos DB Account: $COSMOS_ACCOUNT (this may take 5-10 minutes)"
FREE_TIER_FLAG=""
if [ "$ENABLE_FREE_TIER" = "true" ]; then
    FREE_TIER_FLAG="--enable-free-tier true"
else
    FREE_TIER_FLAG="--enable-free-tier false"
fi

az cosmosdb create \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --locations regionName="$LOCATION" \
    --default-consistency-level Session \
    $FREE_TIER_FLAG \
    --output none

print_success "Cosmos DB account created"

# Create Database
print_step "Creating Cosmos DB database: dreamspace"
az cosmosdb sql database create \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --name dreamspace \
    --throughput 400 \
    --output none

print_success "Database created"

# Create users container
print_step "Creating container: users (partition key: /id)"
az cosmosdb sql container create \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --database-name dreamspace \
    --name users \
    --partition-key-path "/id" \
    --output none

print_success "Users container created"

# Create items container for dreams, goals, scoring entries, etc.
print_step "Creating container: items (partition key: /userId)"
az cosmosdb sql container create \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --database-name dreamspace \
    --name items \
    --partition-key-path "/userId" \
    --output none

print_success "Items container created"

# Create teams container
print_step "Creating container: teams (partition key: /managerId)"
az cosmosdb sql container create \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --database-name dreamspace \
    --name teams \
    --partition-key-path "/managerId" \
    --output none

print_success "Teams container created"

# Get Cosmos credentials
print_step "Retrieving Cosmos DB credentials"
COSMOS_KEYS=$(az cosmosdb keys list \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --type keys \
    --output json)

COSMOS_ENDPOINT="https://${COSMOS_ACCOUNT}.documents.azure.com:443/"
COSMOS_PRIMARY_KEY=$(echo "$COSMOS_KEYS" | jq -r '.primaryMasterKey')

print_success "Cosmos DB credentials retrieved"

# Display summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOYMENT SUMMARY${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Resource Group:${NC}"
echo "  Name: $RESOURCE_GROUP"
echo "  Location: $LOCATION"

echo -e "\n${CYAN}Cosmos DB:${NC}"
echo "  Account: $COSMOS_ACCOUNT"
echo "  Endpoint: $COSMOS_ENDPOINT"
echo -n "  Primary Key: ${COSMOS_PRIMARY_KEY:0:10}..."
echo -e " ${YELLOW}(hidden)${NC}"
echo "  Database: dreamspace"
echo "  Containers: users (/id), teams (/managerId)"

echo -e "\n${CYAN}Next Steps:${NC}"
echo "  1. Create Entra ID App Registration"
echo "     - Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps"
echo "     - Create new registration for single tenant"
echo "     - Copy Application (client) ID"
echo ""
echo "  2. Create Azure Static Web App"
echo "     - Go to: https://portal.azure.com/#create/Microsoft.StaticApp"
echo "     - Name: $SWA_NAME"
echo "     - Resource Group: $RESOURCE_GROUP"
echo "     - Region: East US 2"
echo "     - Connect to GitHub: Baby-Ty/Dreamspace"
echo ""
echo "  3. Configure Static Web App settings"
echo "     - Add these application settings:"
echo "       VITE_APP_ENV=production"
echo "       VITE_COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
echo "       COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
echo "       COSMOS_KEY=[use value below]"
echo ""
echo "  4. Update code configuration"
echo "     - Update src/auth/authConfig.js with new client ID and tenant ID"
echo "     - See NEW_TENANT_DEPLOYMENT.md for details"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

# Save credentials
OUTPUT_FILE="deployment-credentials-${TIMESTAMP}.txt"
print_step "Saving credentials to $OUTPUT_FILE"

cat > "$OUTPUT_FILE" << EOF
DREAMSPACE DEPLOYMENT CREDENTIALS
Generated: $(date '+%Y-%m-%d %H:%M:%S')

⚠️  IMPORTANT: Keep this file secure and do not commit to source control!

RESOURCE GROUP
--------------
Name: $RESOURCE_GROUP
Location: $LOCATION

COSMOS DB
---------
Account Name: $COSMOS_ACCOUNT
Endpoint: $COSMOS_ENDPOINT
Primary Key: $COSMOS_PRIMARY_KEY
Database: dreamspace
Containers: 
  - users (partition key: /id)
  - teams (partition key: /managerId)

AZURE PORTAL LINKS
------------------
Resource Group: https://portal.azure.com/#@${TENANT_ID}/resource/subscriptions/SUBSCRIPTION_ID/resourceGroups/${RESOURCE_GROUP}
Cosmos DB: https://portal.azure.com/#@${TENANT_ID}/resource/subscriptions/SUBSCRIPTION_ID/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.DocumentDB/databaseAccounts/${COSMOS_ACCOUNT}

NEXT STEPS
----------
1. Create Entra ID App Registration (Manual)
2. Create Azure Static Web App (Manual or via Portal)
3. Configure application settings with credentials above
4. Update code with new client ID and tenant ID
5. Deploy via GitHub Actions

See NEW_TENANT_DEPLOYMENT.md for complete instructions.
EOF

chmod 600 "$OUTPUT_FILE"
print_success "Credentials saved to $OUTPUT_FILE"
print_info "IMPORTANT: Add $OUTPUT_FILE to .gitignore to prevent committing secrets!"

echo ""
echo -e "${GREEN}✓ Infrastructure provisioning complete!${NC}"
echo "  Follow the manual steps above to complete deployment."
echo ""

