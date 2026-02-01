#!/bin/bash

# Cosmos DB Migration Script Runner
# This script helps you run the migration with proper environment variables

echo "=========================================="
echo "Cosmos DB Migration Script"
echo "=========================================="
echo ""
echo "This script will migrate all data from your OLD Cosmos DB to the NEW one."
echo ""
echo "⚠️  WARNING: Make sure you have:"
echo "   1. Created the new Cosmos DB account"
echo "   2. Created the database 'dreamspace' with 400 RU autoscale"
echo "   3. Created all 10 containers with correct partition keys"
echo "   4. Backed up your current database"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Prompt for OLD Cosmos DB credentials
echo "OLD (Source) Cosmos DB details:"
echo ""
read -p "Old Cosmos DB Endpoint: " OLD_COSMOS_ENDPOINT
read -sp "Old Cosmos DB Primary Key: " OLD_COSMOS_KEY
echo ""
echo ""

# Prompt for NEW Cosmos DB credentials
echo "NEW (Destination) Cosmos DB details:"
echo ""
read -p "New Cosmos DB Endpoint: " NEW_COSMOS_ENDPOINT
read -sp "New Cosmos DB Primary Key: " NEW_COSMOS_KEY
echo ""
echo ""

# Validate inputs
if [ -z "$OLD_COSMOS_ENDPOINT" ] || [ -z "$OLD_COSMOS_KEY" ] || [ -z "$NEW_COSMOS_ENDPOINT" ] || [ -z "$NEW_COSMOS_KEY" ]; then
    echo "❌ Error: All fields are required"
    exit 1
fi

# Export variables
export OLD_COSMOS_ENDPOINT="$OLD_COSMOS_ENDPOINT"
export OLD_COSMOS_KEY="$OLD_COSMOS_KEY"
export NEW_COSMOS_ENDPOINT="$NEW_COSMOS_ENDPOINT"
export NEW_COSMOS_KEY="$NEW_COSMOS_KEY"

echo "Starting migration..."
echo "This may take 5-15 minutes depending on data volume..."
echo ""

# Run the migration script
node scripts/migrateCosmosData.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the migration report in backups/migration-YYYY-MM-DD/"
    echo "2. Verify document counts match"
    echo "3. Update api/local.settings.json with new connection strings"
    echo "4. Test locally before updating production"
    echo "5. See docs/COSMOS_MIGRATION_GUIDE.md for detailed instructions"
else
    echo ""
    echo "❌ Migration failed or completed with errors."
    echo "Please review the migration report and error messages above."
    exit 1
fi
