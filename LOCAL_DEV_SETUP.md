# Local Development with Real Cosmos DB

This guide explains how to run the DreamSpace app locally while connecting to the production Cosmos DB database.

## ✅ Configuration Complete

All configuration files have been set up to use your production Azure resources:

### 1. Backend API Configuration (`api/local.settings.json`)
- ✅ `COSMOS_ENDPOINT`: Connected to `cosmos-dreamspace-prod-20251013`
- ✅ `COSMOS_KEY`: Configured with primary key
- ✅ `AZURE_STORAGE_CONNECTION_STRING`: Connected to `stdreamspace`
- ✅ `AzureWebJobsStorage`: Configured for Azure Functions runtime

### 2. Frontend Configuration (`.env.local`)
- ✅ `VITE_APP_ENV`: Set to `production`
- ✅ `VITE_COSMOS_ENDPOINT`: Points to production Cosmos DB
- ✅ `VITE_AZURE_CLIENT_ID`: Configured for Microsoft authentication

### 3. API Proxy (`vite.config.js`)
- ✅ Vite dev server now proxies `/api` requests to `http://localhost:7071`

## 🚀 How to Run

### Step 1: Install Dependencies

```powershell
# Install frontend dependencies
npm install

# Install backend API dependencies
cd api
npm install
cd ..
```

### Step 2: Start the Backend API (Azure Functions)

Open a **new terminal** and run:

```powershell
cd api
npm start
```

You should see:
```
Azure Functions Core Tools
Core Tools Version: 4.x
Function Runtime Version: 4.x

Functions:
  - getUserData: [GET] http://localhost:7071/api/getUserData/{userId}
  - saveUserData: [POST] http://localhost:7071/api/saveUserData/{userId}
  - health: [GET] http://localhost:7071/api/health
  ... (and other functions)
```

### Step 3: Test the Backend Connection

Open another terminal and test the health endpoint:

```powershell
curl http://localhost:7071/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "cosmosdb": {
      "status": "healthy",
      "responseTime": 50,
      "endpoint": "cosmos-dreamspace-prod-20251013"
    }
  }
}
```

### Step 4: Start the Frontend

In a **separate terminal**, run:

```powershell
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Open the App

1. Navigate to: http://localhost:5173
2. Click "Sign In" and authenticate with your Microsoft account
3. The app will now use **production Cosmos DB data**

## 🔍 Verify It's Working

### Check Console Logs

Open browser DevTools (F12) and check the console. You should see:

```
🔍 Environment check:
Hostname: localhost
Is live site: false
VITE_COSMOS_ENDPOINT: SET
VITE_APP_ENV: production
Production mode: true
☁️ Using Azure Cosmos DB for data persistence (3-container architecture)
```

### Test Data Persistence

1. Create a new dream or goal
2. Refresh the page
3. Data should persist (it's in Cosmos DB!)
4. Check Azure Portal → Cosmos DB → Data Explorer to see the new data

## 📦 What's Happening Behind the Scenes

### Request Flow
```
Browser (localhost:5173)
  ↓ /api/getUserData/...
Vite Proxy
  ↓ http://localhost:7071/api/getUserData/...
Azure Functions (Local)
  ↓ Uses COSMOS_ENDPOINT + COSMOS_KEY
Azure Cosmos DB (Production)
  ↓ Returns data
Back to Browser
```

### Database Architecture
The app uses a 3-container architecture:

1. **`users` container** (partition key: `/id`)
   - User profiles
   - Aggregate metrics
   - Small documents

2. **`items` container** (partition key: `/userId`)
   - Dreams
   - Weekly goals
   - Scoring history
   - Connects
   - Each item is a separate document

3. **`teams` container** (partition key: `/managerId`)
   - Team relationships
   - Coaching assignments

## ⚠️ Important Notes

### 1. Using Production Data
You're now working with **REAL PRODUCTION DATA**. Be careful:
- ✅ Test changes carefully before deploying
- ✅ Don't delete or modify production data unless intentional
- ✅ Consider creating a test user for development

### 2. Security
The following files contain sensitive credentials and are gitignored:
- `api/local.settings.json` - Contains Cosmos DB keys
- `.env.local` - Contains environment configuration

**Never commit these files to git!**

### 3. Azure Functions Core Tools Required
Make sure you have Azure Functions Core Tools installed:

```powershell
# Check if installed
func --version

# If not installed, use:
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### 4. Port Conflicts
- Frontend runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:7071`

If these ports are in use, you'll need to:
- Stop other services using these ports, OR
- Change the ports in configuration

## 🐛 Troubleshooting

### Issue: "COSMOS_ENDPOINT not configured"
**Solution:** Make sure `api/local.settings.json` exists with valid credentials.

### Issue: "Failed to connect to Cosmos DB"
**Solution:** 
1. Check Azure Portal → Cosmos DB is running
2. Verify the COSMOS_KEY in `api/local.settings.json` is correct
3. Check your network connection

### Issue: API requests fail with 404
**Solution:**
1. Ensure Azure Functions are running (`cd api && npm start`)
2. Check that Vite proxy is configured in `vite.config.js`
3. Look at the Network tab in browser DevTools

### Issue: Authentication fails
**Solution:**
1. Check that `VITE_AZURE_CLIENT_ID` is set in `.env.local`
2. Verify the redirect URI in Azure AD App Registration includes `http://localhost:5173`
3. Clear browser cache and try again

### Issue: Data shows in local but not in Azure
**Solution:** You might be looking at localStorage instead of Cosmos DB. Check console logs for "Using Azure Cosmos DB" message.

## 🔄 Switching Back to Local Storage

If you want to use local storage (no cloud) for testing:

1. Edit `.env.local`:
```
VITE_APP_ENV=development  # Change from 'production'
```

2. Restart the frontend:
```powershell
# Stop with Ctrl+C, then:
npm run dev
```

Console should show: `💾 Using localStorage for data persistence (development mode)`

## 🎯 Next Steps

Now that you're set up with production data locally:

1. Make your code changes
2. Test thoroughly with real data
3. Commit and push to trigger deployment
4. Monitor the deployment in Azure Portal

## 📚 Additional Resources

- [Cosmos DB Migration Guide](docs-deployment/COSMOS_DB_MIGRATION.md)
- [Environment Variables Reference](ENVIRONMENT_VARIABLES.md)
- [Azure Deployment Guide](docs-deployment/AZURE_DEPLOYMENT.md)
- [API Documentation](api/README.md)

---

**🎉 Happy coding!** You're now running local development with production-grade infrastructure.

