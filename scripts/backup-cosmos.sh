#!/bin/bash

# Cosmos DB Backup Script Runner
# This script helps you run the backup with proper environment variables

echo "=========================================="
echo "Cosmos DB Backup Script"
echo "=========================================="
echo ""
echo "This script will export all data from your current Cosmos DB."
echo ""

# Check if running on Windows (Git Bash/WSL) or Unix
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows environment"
    SCRIPT_EXT=".cmd"
else
    SCRIPT_EXT=".sh"
fi

# Prompt for Cosmos DB credentials
echo "Please enter your CURRENT Cosmos DB details:"
echo ""
read -p "Cosmos DB Endpoint (e.g., https://your-account.documents.azure.com:443/): " COSMOS_ENDPOINT
read -sp "Cosmos DB Primary Key: " COSMOS_KEY
echo ""
echo ""

# Validate inputs
if [ -z "$COSMOS_ENDPOINT" ] || [ -z "$COSMOS_KEY" ]; then
    echo "❌ Error: Both endpoint and key are required"
    exit 1
fi

# Export variables
export COSMOS_ENDPOINT="$COSMOS_ENDPOINT"
export COSMOS_KEY="$COSMOS_KEY"

echo "Starting backup..."
echo ""

# Run the export script
node scripts/exportCosmosData.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the backup files in the backups/ directory"
    echo "2. Create your new Cosmos DB in Azure Portal (see docs/COSMOS_MIGRATION_GUIDE.md)"
    echo "3. Run the migration script to transfer data"
else
    echo ""
    echo "❌ Backup failed. Please check the error messages above."
    exit 1
fi
