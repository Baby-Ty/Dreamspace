#!/bin/bash
# Script to create the prompts container in Cosmos DB
# Usage: ./scripts/setup-prompts-container.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get Cosmos account name from environment or parameter
COSMOS_ACCOUNT_NAME=${1:-${COSMOS_ACCOUNT_NAME}}
if [ -z "$COSMOS_ACCOUNT_NAME" ]; then
    echo -e "${YELLOW}⚠️  Cosmos account name not provided.${NC}"
    read -p "Enter Cosmos DB account name: " COSMOS_ACCOUNT_NAME
fi

# Get resource group from environment or parameter
RESOURCE_GROUP_NAME=${2:-${RESOURCE_GROUP_NAME}}
if [ -z "$RESOURCE_GROUP_NAME" ]; then
    echo -e "${YELLOW}⚠️  Resource group not provided.${NC}"
    read -p "Enter Resource Group name: " RESOURCE_GROUP_NAME
fi

echo -e "${BLUE}🚀 Setting up prompts container in Cosmos DB${NC}"
echo -e "${BLUE}   Account: $COSMOS_ACCOUNT_NAME${NC}"
echo -e "${BLUE}   Resource Group: $RESOURCE_GROUP_NAME${NC}"
echo -e "${BLUE}   Database: dreamspace${NC}"
echo ""

# Check if database exists
echo -e "${BLUE}🔍 Verifying 'dreamspace' database exists...${NC}"
if ! az cosmosdb sql database show \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "dreamspace" \
    --output json > /dev/null 2>&1; then
    echo -e "${RED}❌ Database 'dreamspace' not found. Please create it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database 'dreamspace' exists${NC}"

# Check if prompts container exists
echo -e "${BLUE}🔍 Checking if 'prompts' container exists...${NC}"
if ! az cosmosdb sql container show \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --database-name "dreamspace" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "prompts" \
    --output json > /dev/null 2>&1; then
    echo -e "${BLUE}📋 Creating 'prompts' container...${NC}"
    az cosmosdb sql container create \
        --account-name "$COSMOS_ACCOUNT_NAME" \
        --database-name "dreamspace" \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "prompts" \
        --partition-key-path "/partitionKey" \
        --throughput 400 \
        --output none
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create 'prompts' container${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Created 'prompts' container with partition key '/partitionKey'${NC}"
else
    echo -e "${GREEN}✅ Container 'prompts' already exists${NC}"
fi

echo ""
echo -e "${GREEN}✨ Prompts container setup complete!${NC}"
echo -e "${GREEN}   Container: prompts${NC}"
echo -e "${GREEN}   Partition Key: /partitionKey${NC}"
echo ""
echo -e "${BLUE}💡 The prompts container will be automatically seeded with default prompts on first use.${NC}"
