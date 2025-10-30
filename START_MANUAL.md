# Manual Startup Guide for Local Development

Since the automated script had issues, here's how to start the services manually.

## Step 1: Start the Backend API

1. Open a **new PowerShell terminal**
2. Navigate to the API folder and start:

```powershell
cd "C:\SupportStack\All CLients\Dreamsapp\Dreamspace\api"
npm start
```

You should see output like:
```
Azure Functions Core Tools
Core Tools Version: 4.x.x
Function Runtime Version: 4.x.x

Functions:
  health: [GET] http://localhost:7071/api/health
  getUserData: [GET] http://localhost:7071/api/getUserData/{userId}
  saveUserData: [POST] http://localhost:7071/api/saveUserData/{userId}
  ... (more functions)

Host started
```

**Keep this terminal window open!**

## Step 2: Test the Backend

In **another PowerShell terminal**, test the API:

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

## Step 3: Start the Frontend

1. Open **another new PowerShell terminal**
2. Navigate to the project root and start:

```powershell
cd "C:\SupportStack\All CLients\Dreamsapp\Dreamspace"
npm run dev
```

You should see:
```
VITE v4.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal window open too!**

## Step 4: Open the App

Open your web browser and navigate to:
```
http://localhost:5173
```

## Step 5: Verify Cosmos DB Connection

1. Open browser DevTools (press F12)
2. Go to the Console tab
3. Look for this message:
```
☁️ Using Azure Cosmos DB for data persistence (3-container architecture)
```

4. Sign in with your Microsoft account
5. Try creating a dream or goal
6. Refresh the page - data should persist!

## Troubleshooting

### Backend won't start

**Error: "Cannot find module '@azure/cosmos'"**
Solution:
```powershell
cd api
npm install
```

**Error: "func: command not found"**
Solution: Install Azure Functions Core Tools
```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### Backend starts but returns 404

Check that these files exist:
- `api/local.settings.json` (contains Cosmos DB credentials)
- `api/host.json`
- `api/package.json`

### Frontend can't connect to backend

1. Make sure backend is running on port 7071
2. Check `vite.config.js` has the proxy configuration
3. Clear browser cache and refresh

### Data not persisting

1. Check browser console for errors
2. Verify you see "Using Azure Cosmos DB" message
3. Test backend health endpoint:
```powershell
curl http://localhost:7071/api/health
```

## Quick Commands Reference

**Start Backend:**
```powershell
cd api
npm start
```

**Start Frontend:**
```powershell
npm run dev
```

**Test Backend:**
```powershell
curl http://localhost:7071/api/health
```

**Stop Services:**
- Press `Ctrl+C` in each terminal window

## Configuration Files

Your setup uses these files (both are gitignored):

- **api/local.settings.json** - Backend Cosmos DB credentials
- **.env.local** - Frontend environment variables

These were created automatically and contain your production Azure credentials.

---

**You're now ready to develop with production Cosmos DB data!**

