# Cosmos DB Migration Guide

## 3-Container Architecture (V2)

This application now uses a modern 3-container architecture for improved scalability and performance.

### Container Structure

**Container 1: `users`** - Partition key: `/userId` or `/id`
- User profiles, roles, aggregate metrics
- Small documents, rarely updated
- No large arrays

**Container 2: `items`** - Partition key: `/userId`
- Individual dreams, weekly goals, scoring entries, connects
- Each item is a separate document with a `type` field
- Efficient queries by userId and type

**Container 3: `teams`** - Partition key: `/managerId`
- Team relationships and coaching assignments

## Changes Made

### 1. Updated Database Service
- Modified `src/services/databaseService.js` to use Cosmos DB in production
- Automatically detects environment and switches between localStorage (dev) and Cosmos DB (production)
- Supports both legacy monolithic format and new 3-container format
- Updated API endpoints to match your Azure Functions:
  - Save: `/api/saveUserData/{userId}` (now splits data across containers)
  - Load: `/api/getUserData/{userId}` (now combines data from multiple containers)
  - Items: `/api/saveItem`, `/api/getItems/{userId}`, `/api/deleteItem/{itemId}`

### 2. Environment Detection
The app now automatically uses Cosmos DB when:
- `VITE_APP_ENV=production` is set, OR
- `VITE_COSMOS_ENDPOINT` is present in environment variables

## Required Azure Configuration

### Step 1: Set Environment Variables in Azure Static Web App

1. Go to your Azure Static Web App: https://portal.azure.com
2. Navigate to **Configuration** → **Application settings**
3. Add these environment variables:

```
VITE_APP_ENV=production
COSMOS_ENDPOINT=https://dreamspace-cosmos-db.documents.azure.com:443/
COSMOS_KEY=your-primary-key-from-cosmos-db
```

### Step 2: Get Your Cosmos DB Key

1. Go to your Cosmos DB account: https://portal.azure.com
2. Navigate to **Keys** section
3. Copy the **PRIMARY KEY**
4. Use this as the value for `COSMOS_KEY` in your Static Web App configuration

## Testing the Migration

### 1. Deploy Your Changes
```bash
git add .
git commit -m "Migrate to Cosmos DB for user data storage"
git push origin main
```

### 2. Monitor the Deployment
- Check GitHub Actions for deployment status
- Monitor Azure Static Web App deployment logs

### 3. Test User Data Persistence
1. Visit your app: https://gentle-grass-07ac3aa0f.1.azurestaticapps.net/
2. Log in with Microsoft authentication
3. Create some test data (dreams, career goals, etc.)
4. Refresh the page - data should persist
5. Check browser console for Cosmos DB success messages:
   - `☁️ Using Azure Cosmos DB for data persistence`
   - `✅ Data saved to Cosmos DB for user: [userId]`
   - `✅ Data loaded from Cosmos DB for user: [userId]`

## Migration Benefits

### ✅ What You Get
- **True multi-device sync**: Data accessible from any device
- **Persistent storage**: Data survives browser clearing/reinstalls
- **Scalability**: Supports unlimited users and data growth
- **Backup & Recovery**: Azure handles data backup automatically
- **Performance**: Fast global access via Azure's CDN

### 🔄 Automatic Fallback
- If Cosmos DB is unavailable, the app falls back to localStorage
- Development mode continues to use localStorage for fast iteration
- No data loss during the transition

## Troubleshooting

### Common Issues

1. **Data not saving/loading**
   - Check Azure Static Web App environment variables are set correctly
   - Verify Cosmos DB key is valid (regenerate if needed)
   - Check browser console for error messages

2. **Build/deployment failures**
   - Ensure all environment variables are set in Azure, not in code
   - Check GitHub Actions logs for specific errors

3. **CORS errors**
   - Your Azure Functions already have CORS configured correctly
   - If issues persist, verify `staticwebapp.config.json` settings

### Debug Commands

Check if Cosmos DB is being used:
```javascript
// In browser console
console.log('Using Cosmos DB:', databaseService.useCosmosDB);
```

View current user data:
```javascript
// In browser console (after logging in)
databaseService.loadUserData('your-user-id').then(console.log);
```

## Data Migration (Optional)

If you have existing localStorage data to migrate:

```javascript
// Run in browser console on old site
function exportUserData() {
  const userData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('dreamspace_user_')) {
      userData[key] = JSON.parse(localStorage.getItem(key));
    }
  }
  console.log('Copy this data:', JSON.stringify(userData, null, 2));
}
exportUserData();
```

Then manually recreate the data in the new system by using the app normally.

## Next Steps

1. **Deploy the changes** and test thoroughly
2. **Monitor usage** in Azure portal for the first few days
3. **Set up alerts** for Cosmos DB throttling or errors
4. **Configure backup policies** in Cosmos DB settings
5. **Consider upgrading** Cosmos DB throughput if you hit limits

Your app is now ready for production use with persistent, scalable data storage! 🚀
