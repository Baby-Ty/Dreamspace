# Sarah Johnson Demo Account Setup

This guide explains how Sarah Johnson's demo account works and how to ensure data persistence.

## Overview

Sarah Johnson (`sarah.johnson@netsurit.com`) is the primary demo account for DreamSpace. When users click "Try Demo Account" on the login page, they log in as Sarah and can explore the app with realistic, pre-populated data.

## How It Works

### 1. **Demo Login Flow**

```javascript
// From AuthContext.jsx
const login = async (isDemo = false) => {
  if (isDemo) {
    // Try to load Sarah from Cosmos DB first
    const sarahData = await databaseService.loadUserData('sarah.johnson@netsurit.com');
    
    if (sarahData && sarahData.success && sarahData.data) {
      // Use real data from database ✅
      setUser(sarahData.data.currentUser);
    } else {
      // Fallback to mock data for local development
      setUser(mockSarahData);
    }
  }
};
```

### 2. **Automatic Data Persistence**

Sarah's demo account **automatically saves changes** to the database. Here's how:

```javascript
// From AppContext.jsx (lines 512-548)
useEffect(() => {
  // Debounced save - triggers 300ms after any state change
  const saveTimeout = setTimeout(() => {
    if (state.currentUser?.id) {
      const dataToSave = {
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        weeklyGoals: state.weeklyGoals,
        scoringHistory: state.scoringHistory
      };
      
      saveUserData(dataToSave, state.currentUser.id);
    }
  }, 300);
  
  return () => clearTimeout(saveTimeout);
}, [state.currentUser, state.weeklyGoals, state.scoringHistory]);
```

**Key Points:**
- ✅ **Auto-save is ENABLED** for demo users (no special logic disables it)
- ✅ **Debounced** - saves 300ms after changes to avoid excessive writes
- ✅ **Includes all data** - dreams, goals, career profile, weekly goals, scoring history
- ✅ **Works on live site** - automatically uses Cosmos DB on `dreamspace.tylerstewart.co.za`
- ✅ **Development fallback** - uses localStorage when API is unavailable

### 3. **Database Detection**

```javascript
// From databaseService.js
const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
this.useCosmosDB = isLiveSite || 
                   !!(import.meta.env.VITE_COSMOS_ENDPOINT && 
                      import.meta.env.VITE_APP_ENV === 'production');
```

The system automatically uses Cosmos DB when:
1. Running on the live site (`dreamspace.tylerstewart.co.za`), OR
2. `VITE_COSMOS_ENDPOINT` is set AND `VITE_APP_ENV` is `production`

## Setup Methods

### Method 1: Browser-Based Setup (Easiest)

1. Navigate to: `https://dreamspace.tylerstewart.co.za/setup-sarah-demo.html`
2. Click "Seed Sarah's Demo Data"
3. Wait for confirmation
4. Done! Demo account is ready

### Method 2: Node.js Script

```bash
# Using deployed API
node scripts/seed-sarah-demo-data.js https://your-function-app.azurewebsites.net/api

# Using local API
node scripts/seed-sarah-demo-data.js http://localhost:7071/api
```

### Method 3: Manual API Call

```bash
curl -X POST https://your-function-app.azurewebsites.net/api/saveUserData/sarah.johnson@netsurit.com \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "isAuthenticated": true,
  "currentUser": {
    "id": "sarah.johnson@netsurit.com",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@netsurit.com",
    "role": "coach",
    "dreamBook": [...],
    "careerGoals": [...],
    ...
  }
}
EOF
```

## Verification

### Check if Sarah's Data Exists

```bash
# Using API
curl https://your-function-app.azurewebsites.net/api/getUserData/sarah.johnson@netsurit.com

# Expected response
{
  "id": "sarah.johnson@netsurit.com",
  "name": "Sarah Johnson",
  "dreamBook": [...],
  "careerGoals": [...],
  ...
}
```

### Test Persistence

1. Login as demo user (Sarah)
2. Make a change (e.g., add a dream, update progress)
3. Logout
4. Login again as demo user
5. Verify the change persists ✅

## What Gets Saved

When Sarah (or any user) makes changes, the following data is persisted:

### User Profile
- Name, email, avatar, office
- Job title, department, role
- Dream categories

### Dreams & Goals
- Dream book entries (dreams)
- Career goals
- Development plans
- Weekly goals

### Progress Tracking
- Milestones (per dream)
- Notes (per dream)
- History (per dream/goal)
- Scoring history

### Social Features
- Connects (encouragements sent/received)
- Score
- Stats (dreams count, connects count)

### Career Profile
- Current role details
- Aspirations
- Preferences (want to do, don't want to do)
- Career highlights
- Skills (technical & soft)

## Troubleshooting

### Sarah's Data Not Persisting

**Check 1: Verify Database Connection**
```javascript
// Open browser console on dreamspace.tylerstewart.co.za
// Look for this log on page load:
"☁️ Using Azure Cosmos DB for data persistence (3-container architecture)"

// If you see this instead, Cosmos DB is not being used:
"💾 Using localStorage for data persistence (development mode)"
```

**Check 2: Verify Save Events**
```javascript
// Open browser console
// Make a change (add a dream, update progress)
// Look for this log after 300ms:
"💾 Saving user data: { userId: 'sarah.johnson@netsurit.com', ... }"
"✅ Data saved to Cosmos DB for user: sarah.johnson@netsurit.com"
```

**Check 3: Verify API Connection**
```bash
# Test the health endpoint
curl https://your-function-app.azurewebsites.net/api/health

# Expected response
{ "status": "healthy", "timestamp": "..." }
```

### Data Loads But Doesn't Save

This indicates a save API issue. Check:

1. **Azure Function App Settings**
   - Ensure `COSMOS_ENDPOINT` is set
   - Ensure `COSMOS_KEY` is set
   - Ensure database name is `dreamspace`
   - Ensure containers exist: `users`, `items`, `teams`

2. **CORS Settings**
   - Add `https://dreamspace.tylerstewart.co.za` to allowed origins
   - Add `*` (or specific domain) to allowed origins in Azure Functions

3. **API Logs**
   ```bash
   # Check Azure Function logs
   az functionapp log tail --name <function-app-name> --resource-group <resource-group>
   ```

### Changes Only Persist in Browser Session

This means localStorage is being used instead of Cosmos DB.

**Solution:**
- Ensure hostname is exactly `dreamspace.tylerstewart.co.za`
- OR set environment variables:
  - `VITE_COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/`
  - `VITE_APP_ENV=production`

## Architecture Notes

### 3-Container Structure

The system uses a modern 3-container architecture:

1. **users** - Profile data (name, email, role, etc.)
2. **items** - Dreams, goals, milestones, notes, etc.
3. **teams** - Coaching relationships

When you seed Sarah's data with the old format (all arrays in one document), the `saveUserData` API automatically migrates it to the new structure:

```javascript
// Input (old format)
{
  "id": "sarah.johnson@netsurit.com",
  "dreamBook": [...],  // Arrays
  "careerGoals": [...],
  "weeklyGoals": [...]
}

// Output (new format)
// users container:
{ "id": "sarah.johnson@netsurit.com", "name": "Sarah Johnson", ... }

// items container:
{ "id": "dream_sarah_1", "userId": "sarah.johnson@netsurit.com", "type": "dream", ... }
{ "id": "career_goal_sarah_1", "userId": "sarah.johnson@netsurit.com", "type": "career_goal", ... }
```

### Backward Compatibility

The system maintains backward compatibility:
- `getUserData` API returns data in old format (with arrays) for easy consumption
- `saveUserData` API accepts both old and new formats
- Frontend doesn't need to know about the split structure

## Security Considerations

### Demo Account Persistence

⚠️ **Important:** Sarah's demo account data is **shared** and **publicly accessible**. This means:

1. **Multiple users can use the demo** at the same time
2. **Changes made by one user affect all users** (they all see Sarah's account)
3. **Data is not isolated** - treat it as public/shared data
4. **Don't store sensitive information** in the demo account

### Recommendations

For production demos:
- Consider resetting Sarah's data periodically (daily/weekly)
- Monitor for inappropriate content
- Consider read-only mode for demos
- Or create unique demo instances per session

## Resetting Demo Data

To reset Sarah's account to default state:

```bash
# Re-run the seed script
node scripts/seed-sarah-demo-data.js

# Or visit the browser page again
https://dreamspace.tylerstewart.co.za/setup-sarah-demo.html
```

This will overwrite all data with the default demo data.

## Summary

✅ Sarah's demo account **automatically persists changes** to Cosmos DB  
✅ No special configuration needed on live site  
✅ Auto-save triggers 300ms after any state change  
✅ Falls back to localStorage gracefully if API unavailable  
✅ Works in both development and production  
✅ Backward compatible with old data format  

**Quick Test:**
1. Visit `https://dreamspace.tylerstewart.co.za`
2. Click "Try Demo Account"
3. Add a new dream
4. Logout
5. Login again as demo
6. Verify dream still exists ✅

The system is production-ready! 🎉

