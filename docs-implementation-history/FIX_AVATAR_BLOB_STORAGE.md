# 🖼️ Fix: Avatar Not Saving to Blob Storage

## Problem
User avatars are showing temporary URLs (ui-avatars.com) instead of being saved to Azure Blob Storage.

## Root Causes

### 1. Blob Storage Container Doesn't Exist Yet
The `profile-pictures` container needs to be created in your storage account (`stdreamspace`).

### 2. Avatar URL Not Being Persisted
Even if the upload works initially, the avatar URL might not be saved to Cosmos DB when the user profile is saved.

## Quick Fix

### Step 1: Create Blob Storage Container

Run this command to create the container:

```powershell
# Make sure you're in the NetsuritCIO subscription
az account set --subscription "NetsuritCIO"

# Create the profile-pictures container with public blob access
az storage container create `
  --name "profile-pictures" `
  --account-name "stdreamspace" `
  --public-access blob `
  --auth-mode login
```

**Or via Azure Portal:**
1. Go to Azure Portal → Storage Account `stdreamspace`
2. Click **Containers** (under Data storage)
3. Click **+ Container**
4. Name: `profile-pictures`
5. Public access level: **Blob (anonymous read access for blobs only)**
6. Click **Create**

### Step 2: Verify Storage Connection String is Set

The Function App should already have `AZURE_STORAGE_CONNECTION_STRING` configured (we set it earlier), but let's verify:

```powershell
az functionapp config appsettings list `
  --name "func-dreamspace-prod" `
  --resource-group "rg_dreams2025dev" `
  --query "[?name=='AZURE_STORAGE_CONNECTION_STRING'].{Name:name, Value:value}" -o table
```

If it's not set or shows empty, run:

```powershell
$storageConn = az storage account show-connection-string `
  --name "stdreamspace" `
  --resource-group "rg_dreams2025dev" `
  --query "connectionString" -o tsv

az functionapp config appsettings set `
  --name "func-dreamspace-prod" `
  --resource-group "rg_dreams2025dev" `
  --settings "AZURE_STORAGE_CONNECTION_STRING=$storageConn" `
  --output none
```

### Step 3: Test Profile Picture Upload

After the Function App deployment completes, test the upload endpoint:

```powershell
# Create a test image (1x1 pixel JPEG)
$testImage = [System.Convert]::FromBase64String("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA==")

# Test upload
Invoke-RestMethod `
  -Uri "https://func-dreamspace-prod.azurewebsites.net/api/uploadProfilePicture/test-user-123" `
  -Method POST `
  -Body $testImage `
  -ContentType "image/jpeg"
```

**Expected response:**
```json
{
  "success": true,
  "url": "https://stdreamspace.blob.core.windows.net/profile-pictures/test-user-123.jpg",
  "message": "Profile picture uploaded successfully"
}
```

## How the Avatar Upload Works

### Current Flow (AuthContext.jsx lines 68-79):

1. User logs in
2. Profile fetched from Microsoft Graph
3. Default avatar set to `ui-avatars.com` URL
4. `graph.uploadMyPhotoToStorage(userId)` is called
5. If successful, avatar URL is updated to blob storage URL
6. User profile is saved to Cosmos DB with the avatar URL

### The Upload Chain:

**AuthContext.jsx** → **graphService.js** → **uploadProfilePicture API**

```javascript
// 1. AuthContext.jsx (line 73)
const uploadResult = await graph.uploadMyPhotoToStorage(userId);

// 2. graphService.js (lines 74-138)
async uploadMyPhotoToStorage(userId) {
  // Fetches photo from Microsoft Graph
  // Uploads to blob storage via API
  // Returns blob URL
}

// 3. api/uploadProfilePicture/index.js
// Uploads to Azure Blob Storage
// Returns public blob URL
```

## Common Issues

### Issue 1: "Blob storage not configured" Error

**Symptom**: Console shows error about AZURE_STORAGE_CONNECTION_STRING

**Fix**: Run Step 2 above to set the connection string

### Issue 2: Container Not Found

**Symptom**: Upload fails with "The specified container does not exist"

**Fix**: Run Step 1 above to create the container

### Issue 3: Avatar Reverts to ui-avatars.com After Refresh

**Symptom**: Avatar uploads successfully but reverts after page reload

**Cause**: The avatar URL isn't being saved to Cosmos DB with the user profile

**Fix**: Check that `saveUserData` is being called with the updated avatar URL. Look at the console logs:

```javascript
// In AuthContext.jsx around line 128
console.log('🆕 No existing data found, saving new user profile');
const dataToSave = {
  isAuthenticated: true,
  currentUser: userData,  // This should have the blob storage URL
  weeklyGoals: [],
  scoringHistory: []
};
```

### Issue 4: Microsoft 365 Photo Not Available

**Symptom**: Console shows "No profile photo available from Microsoft 365"

**This is NORMAL**: Not all users have photos in Microsoft 365. The app will use the generated avatar.

**To add a photo**:
1. Go to Microsoft 365 → Profile
2. Upload a photo
3. Log out and back into DreamSpace

## Verification Steps

### 1. Check if Container Exists

```powershell
az storage container show `
  --name "profile-pictures" `
  --account-name "stdreamspace" `
  --query "{Name:name, PublicAccess:properties.publicAccess}"
```

Should show:
```json
{
  "Name": "profile-pictures",
  "PublicAccess": "blob"
}
```

### 2. Check Function App Has Storage Connection

```powershell
az functionapp config appsettings list `
  --name "func-dreamspace-prod" `
  --resource-group "rg_dreams2025dev" `
  --query "[?name=='AZURE_STORAGE_CONNECTION_STRING']"
```

Should return a setting with the connection string.

### 3. Test Upload Endpoint

After deployment completes:

```powershell
# This will return 400 (Bad Request) if endpoint exists but no image provided
# Which actually confirms the endpoint is working!
Invoke-RestMethod `
  -Uri "https://func-dreamspace-prod.azurewebsites.net/api/uploadProfilePicture/test" `
  -Method POST `
  -ContentType "image/jpeg" 2>&1
```

If you see `"error":"Image data is required"`, the endpoint is working! ✅

### 4. Check Browser Console

On your live site, check the browser console (F12) when logging in:

**Look for these logs:**
```
📸 Attempting to upload profile picture to blob storage...
✅ Profile picture uploaded to blob storage: https://stdreamspace.blob.core.windows.net/profile-pictures/...
```

**Or:**
```
ℹ️ No profile photo available from Microsoft 365, using generated avatar
```

## Advanced Debugging

### Enable Verbose Logging

Add this to `graphService.js` (line 135) to see detailed errors:

```javascript
} catch (error) {
  console.log('Error uploading photo to storage, using fallback:', error.message);
  console.error('Full error details:', error);  // ADD THIS LINE
  return ok(null);
}
```

### Check Azure Function Logs

```powershell
# View real-time logs
az functionapp log tail `
  --name "func-dreamspace-prod" `
  --resource-group "rg_dreams2025dev"
```

Look for uploadProfilePicture logs when you log in.

### Check Blob Storage Directly

```powershell
# List blobs in the container
az storage blob list `
  --container-name "profile-pictures" `
  --account-name "stdreamspace" `
  --query "[].{Name:name, Size:properties.contentLength, LastModified:properties.lastModified}" `
  --output table
```

## Quick Commands Reference

```powershell
# Switch to correct subscription
az account set --subscription "NetsuritCIO"

# Create container
az storage container create --name "profile-pictures" --account-name "stdreamspace" --public-access blob --auth-mode login

# Check container
az storage container show --name "profile-pictures" --account-name "stdreamspace"

# List uploaded photos
az storage blob list --container-name "profile-pictures" --account-name "stdreamspace" --output table

# Test upload endpoint (after deployment)
$testUrl = "https://func-dreamspace-prod.azurewebsites.net/api/uploadProfilePicture/test"
Invoke-RestMethod -Uri $testUrl -Method POST -Body @() -ContentType "image/jpeg" 2>&1
```

## Summary

### Likely Issue
The `profile-pictures` container doesn't exist yet in your storage account.

### Quick Fix
1. Create the container (see Step 1)
2. Wait for Function App deployment to complete
3. Log out and back in to test

### Expected Behavior After Fix
- User logs in
- Console shows: "📸 Attempting to upload profile picture to blob storage..."
- If Microsoft 365 photo exists: Avatar is uploaded to blob storage
- Avatar URL in Cosmos DB: `https://stdreamspace.blob.core.windows.net/profile-pictures/[user-id].jpg`
- Avatar persists after refresh

---

**Next Steps:**
1. Create the blob container
2. Wait for Function App deployment to complete (5-10 minutes)
3. Test by logging out and back in
4. Check browser console for upload logs




