# 🔧 UserId Mismatch Fix

## Problem Identified

Your dreams are being saved with the wrong userId:
- **Saving with:** `af103e6b-2c5d-4d9a-b080-227f08d33e73` (AAD Object ID / GUID)
- **Loading with:** `Tyler.Stewart@netsurit.com` (Email)

This mismatch means when you log in, the system looks for items with your email, but they're stored under the GUID!

## Quick Fix (Recommended)

### Step 1: Clear Browser Data
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Find **Local Storage** → `http://localhost:5173`
4. **Right-click** → **Clear**
5. Find **Session Storage** → `http://localhost:5173`  
6. **Right-click** → **Clear**

### Step 2: Refresh & Re-Login
1. **Hard refresh:** Press `Ctrl + Shift + R`
2. **Sign in again** with your Microsoft account
3. You'll start with a fresh profile using the correct userId (email)

### Step 3: Test
1. Add a new dream
2. Check console - should see: `Saving item: { userId: 'Tyler.Stewart@netsurit.com', ... }`
3. Refresh page - dream should persist!

## Alternative: Migrate Existing Data

If you want to keep the dreams you already created, we need to migrate them in Cosmos DB from the GUID userId to your email userId.

Run this in PowerShell from the `api` folder:

```powershell
cd api

# Create migration script
@'
const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");

const settings = JSON.parse(fs.readFileSync("./local.settings.json", "utf8"));
const client = new CosmosClient({
  endpoint: settings.Values.COSMOS_ENDPOINT,
  key: settings.Values.COSMOS_KEY
});

const GUID_USERID = "af103e6b-2c5d-4d9a-b080-227f08d33e73";
const EMAIL_USERID = "Tyler.Stewart@netsurit.com";

async function migrate() {
  const db = client.database("dreamspace");
  const itemsContainer = db.container("items");
  
  console.log(`\nLooking for items with GUID userId: ${GUID_USERID}\n`);
  
  const { resources: items } = await itemsContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: GUID_USERID }]
    })
    .fetchAll();
  
  console.log(`Found ${items.length} items to migrate\n`);
  
  if (items.length === 0) {
    console.log("No items to migrate!");
    return;
  }
  
  for (const item of items) {
    console.log(`  Migrating ${item.type}: ${item.title || item.id}`);
    
    // Delete old item (with GUID partition key)
    await itemsContainer.item(item.id, GUID_USERID).delete();
    
    // Create new item with email partition key
    const { _rid, _self, _etag, _attachments, _ts, ...cleanItem } = item;
    await itemsContainer.items.create({
      ...cleanItem,
      userId: EMAIL_USERID
    });
    
    console.log(`    ✅ Migrated!`);
  }
  
  console.log(`\n✅ Migration complete! ${items.length} items updated\n`);
}

migrate().catch(console.error);
'@ | Out-File -FilePath migrate-userid.js -Encoding utf8

# Run migration
node migrate-userid.js
```

After migration, refresh your browser and the dreams should appear!

## Why Did This Happen?

The issue was likely caused by:
1. Old localStorage data that had the GUID as the userId
2. The app state got confused about which ID to use
3. Some code was using `aadObjectId` instead of `id`

## Verify Fix

After clearing localStorage and re-logging in, check the console:
```
🔍 AppContext userId: Tyler.Stewart@netsurit.com  ← Should be email
initialUser.id: Tyler.Stewart@netsurit.com  ← Should be email
```

When saving a dream, you should see:
```
💾 Saving dream to database: dream_xxx
Saving item: {
  userId: 'Tyler.Stewart@netsurit.com',  ← Should be email, not GUID!
  type: 'dream',
  ...
}
```

## Prevention

The code has been updated to ensure consistent userId usage. Future saves will use the email (id) consistently, not the GUID (aadObjectId).

