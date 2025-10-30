# 🚀 First Time Setup for DreamSpace Local Development

This guide is for developers who have just cloned the repository and want to set up local development.

## Prerequisites

- ✅ Node.js 20+ installed
- ✅ Azure Functions Core Tools v4 installed
- ✅ Access to Azure Portal (for Cosmos DB credentials)
- ✅ Git repository cloned

## Quick Setup (3 Options)

### Option 1: Automated Setup (Recommended if you have Azure CLI)

```powershell
# Install dependencies
npm install
cd api
npm install
cd ..

# Run automated setup
.\scripts\setup-local-dev.ps1

# Start development
.\START_LOCAL_DEV.ps1
```

### Option 2: Semi-Automated (Copy & Configure)

```powershell
# Install dependencies
npm install
cd api
npm install
cd ..

# Copy example files
Copy-Item api\local.settings.json.example api\local.settings.json
Copy-Item .env.example .env.local

# Edit api\local.settings.json and add your Cosmos DB credentials
# (See section below for how to get them)

# Start development
.\START_LOCAL_DEV.ps1
```

### Option 3: Manual Setup

Follow the detailed instructions in `LOCAL_DEV_SETUP.md`

## Getting Azure Credentials

### Cosmos DB Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Resource Groups** → `rg_dreams2025dev`
3. Click on **cosmos-dreamspace-prod-20251013**
4. In the left menu, click **Keys**
5. Copy:
   - **URI** (this is your `COSMOS_ENDPOINT`)
   - **PRIMARY KEY** (this is your `COSMOS_KEY`)

### Storage Account Credentials (Optional, for image uploads)

1. In the same resource group, click on **stdreamspace**
2. In the left menu, click **Access keys**
3. Copy **Connection string** from key1
4. This is your `AZURE_STORAGE_CONNECTION_STRING`

## File Structure

After setup, you should have these files:

```
Dreamspace/
├── api/
│   ├── local.settings.json  ← Created (gitignored, contains secrets)
│   └── ...
├── .env.local  ← Created (gitignored, contains config)
└── ...
```

### api/local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "YOUR_STORAGE_CONNECTION_STRING",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://cosmos-dreamspace-prod-20251013.documents.azure.com:443/",
    "COSMOS_KEY": "YOUR_COSMOS_PRIMARY_KEY_HERE",
    "AZURE_STORAGE_CONNECTION_STRING": "YOUR_STORAGE_CONNECTION_STRING"
  },
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

### .env.local

```bash
# Environment mode
VITE_APP_ENV=production

# Azure Cosmos DB Configuration
VITE_COSMOS_ENDPOINT=https://cosmos-dreamspace-prod-20251013.documents.azure.com:443/

# Azure AD Authentication
VITE_AZURE_CLIENT_ID=ebe60b7a-93c9-4b12-8375-4ab3181000e8
```

## Verification

After setup, verify everything works:

```powershell
# Test backend health
curl http://localhost:7071/api/health

# Should return:
# {
#   "status": "healthy",
#   "checks": {
#     "cosmosdb": { "status": "healthy" }
#   }
# }
```

## Common Issues

### "api/local.settings.json not found"
**Solution:** Run `.\scripts\setup-local-dev.ps1` or copy the example file manually

### "Azure Functions Core Tools not found"
**Solution:** Install it:
```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### "Cannot connect to Cosmos DB"
**Solution:** 
- Verify your `COSMOS_KEY` is correct in `api/local.settings.json`
- Check you have network access to Azure
- Ensure the Cosmos DB account exists

### ".env.local not found"
**Solution:** Create it from the template above or run the setup script

## Security Notes

⚠️ **IMPORTANT:**
- ✅ `local.settings.json` and `.env.local` are gitignored
- ❌ NEVER commit these files to git
- ❌ NEVER share your Cosmos DB keys publicly
- ✅ These files contain production credentials - keep them secure!

## Next Steps

Once setup is complete:

1. **Start Development:**
   ```powershell
   .\START_LOCAL_DEV.ps1
   ```

2. **Open Browser:**
   Navigate to http://localhost:5173

3. **Sign In:**
   Use your Microsoft account to authenticate

4. **Start Coding:**
   - Frontend: Port 5173
   - Backend API: Port 7071
   - Changes auto-reload!

## Need Help?

- 📚 **Full Guide:** See `LOCAL_DEV_SETUP.md`
- 🐛 **Issues:** Check the troubleshooting section
- 💬 **Questions:** Contact the team

---

**Happy Coding!** 🚀

