@echo off
REM Cosmos DB Migration Script Runner (Windows)
REM This script helps you run the migration with proper environment variables

echo ==========================================
echo Cosmos DB Migration Script
echo ==========================================
echo.
echo This script will migrate all data from your OLD Cosmos DB to the NEW one.
echo.
echo WARNING: Make sure you have:
echo    1. Created the new Cosmos DB account
echo    2. Created the database 'dreamspace' with 400 RU autoscale
echo    3. Created all 10 containers with correct partition keys
echo    4. Backed up your current database
echo.
pause
echo.

REM Prompt for OLD Cosmos DB credentials
echo OLD (Source) Cosmos DB details:
echo.
set /p OLD_COSMOS_ENDPOINT="Old Cosmos DB Endpoint: "
set /p OLD_COSMOS_KEY="Old Cosmos DB Primary Key: "
echo.

REM Prompt for NEW Cosmos DB credentials
echo NEW (Destination) Cosmos DB details:
echo.
set /p NEW_COSMOS_ENDPOINT="New Cosmos DB Endpoint: "
set /p NEW_COSMOS_KEY="New Cosmos DB Primary Key: "
echo.

REM Validate inputs
if "%OLD_COSMOS_ENDPOINT%"=="" (
    echo Error: Old endpoint is required
    exit /b 1
)
if "%OLD_COSMOS_KEY%"=="" (
    echo Error: Old key is required
    exit /b 1
)
if "%NEW_COSMOS_ENDPOINT%"=="" (
    echo Error: New endpoint is required
    exit /b 1
)
if "%NEW_COSMOS_KEY%"=="" (
    echo Error: New key is required
    exit /b 1
)

echo Starting migration...
echo This may take 5-15 minutes depending on data volume...
echo.

REM Run the migration script
node scripts\migrateCosmosData.js

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
    echo.
    echo Next steps:
    echo 1. Review the migration report in backups\migration-YYYY-MM-DD\
    echo 2. Verify document counts match
    echo 3. Update api\local.settings.json with new connection strings
    echo 4. Test locally before updating production
    echo 5. See docs\COSMOS_MIGRATION_GUIDE.md for detailed instructions
) else (
    echo.
    echo Migration failed or completed with errors.
    echo Please review the migration report and error messages above.
    exit /b 1
)
