@echo off
REM Cosmos DB Backup Script Runner (Windows)
REM This script helps you run the backup with proper environment variables

echo ==========================================
echo Cosmos DB Backup Script
echo ==========================================
echo.
echo This script will export all data from your current Cosmos DB.
echo.

REM Prompt for Cosmos DB credentials
echo Please enter your CURRENT Cosmos DB details:
echo.
set /p COSMOS_ENDPOINT="Cosmos DB Endpoint (e.g., https://your-account.documents.azure.com:443/): "
set /p COSMOS_KEY="Cosmos DB Primary Key: "
echo.

REM Validate inputs
if "%COSMOS_ENDPOINT%"=="" (
    echo Error: Endpoint is required
    exit /b 1
)
if "%COSMOS_KEY%"=="" (
    echo Error: Key is required
    exit /b 1
)

echo Starting backup...
echo.

REM Run the export script
node scripts\exportCosmosData.js

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Backup completed successfully!
    echo.
    echo Next steps:
    echo 1. Review the backup files in the backups\ directory
    echo 2. Create your new Cosmos DB in Azure Portal ^(see docs\COSMOS_MIGRATION_GUIDE.md^)
    echo 3. Run the migration script to transfer data
) else (
    echo.
    echo Backup failed. Please check the error messages above.
    exit /b 1
)
