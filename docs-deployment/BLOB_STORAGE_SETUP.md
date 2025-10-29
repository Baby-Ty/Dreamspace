# Azure Blob Storage Setup for Images

This guide explains how images (profile pictures and dream pictures) are stored in Azure Blob Storage.

## 📋 Overview

### Profile Pictures
When a user logs in with Microsoft 365, the system:
1. Fetches their profile picture from Microsoft Graph API
2. Uploads it to Azure Blob Storage via the `uploadProfilePicture` Azure Function
3. Stores the permanent blob URL in Cosmos DB
4. Displays the picture from blob storage (not from a temporary URL)

### Dream Pictures
When a user uploads an image for a dream, the system:
1. Accepts the image file via the frontend
2. Uploads it to Azure Blob Storage via the `uploadDreamPicture` Azure Function
3. Stores the permanent blob URL in the dream's properties in Cosmos DB
4. Displays the picture from blob storage

## 🎯 Why Blob Storage?

Previously, profile pictures were stored as temporary blob URLs using `URL.createObjectURL()`, which only lasted for the browser session. Now all images are permanently stored in Azure Blob Storage, providing:
- ✅ Persistent URLs that work across sessions
- ✅ Fast CDN-backed delivery
- ✅ Reduced calls to Microsoft Graph API (for profile pictures)
- ✅ Images visible to all users (for team views)
- ✅ Scalable storage for user-uploaded content
- ✅ Secure upload through backend API endpoints

## 🔧 Setup Instructions

### 1. Create Storage Account (If Not Already Created)

```bash
# Set variables
$RESOURCE_GROUP = "rg-dreamspace-prod-eastus"
$STORAGE_ACCOUNT = "stdreamspaceprod"  # Must be globally unique, lowercase, no hyphens
$LOCATION = "eastus"

# Create storage account
az storage account create `
  --name $STORAGE_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku Standard_LRS `
  --kind StorageV2 `
  --access-tier Hot
```

### 2. Get Storage Connection String

**Via Azure Portal:**
1. Go to Azure Portal → Storage Accounts
2. Select your storage account
3. Navigate to **Security + networking** → **Access keys**
4. Copy the **Connection string** from Key 1 or Key 2

**Via Azure CLI:**
```bash
az storage account show-connection-string `
  --name $STORAGE_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --query connectionString `
  --output tsv
```

### 3. Create Blob Containers (Optional - Auto-created by API)

The following containers are automatically created by the Azure Functions on first upload with public read access. However, you can create them manually:

**Containers:**
- `profile-pictures` - User profile pictures from Microsoft 365
- `dreams-pictures` - Dream images uploaded by users

**Via Azure Portal:**
1. Go to Storage Account → **Data storage** → **Containers**
2. Click **+ Container**
3. Name: `profile-pictures` or `dreams-pictures`
4. Public access level: **Blob (anonymous read access for blobs only)**
5. Click **Create**
6. Repeat for the other container

**Via Azure CLI:**
```bash
# Create profile-pictures container
az storage container create `
  --name profile-pictures `
  --account-name $STORAGE_ACCOUNT `
  --public-access blob

# Create dreams-pictures container
az storage container create `
  --name dreams-pictures `
  --account-name $STORAGE_ACCOUNT `
  --public-access blob
```

### 4. Configure Azure Function App

Add the connection string to your Function App configuration:

**Via Azure Portal:**
1. Go to Azure Portal → Function App
2. Navigate to **Settings** → **Configuration**
3. Click **+ New application setting**
4. Name: `AZURE_STORAGE_CONNECTION_STRING`
5. Value: `DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx;EndpointSuffix=core.windows.net`
6. Click **OK**, then **Save**
7. Confirm the restart when prompted

**Via Azure CLI:**
```bash
$CONNECTION_STRING = az storage account show-connection-string `
  --name $STORAGE_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --query connectionString `
  --output tsv

az functionapp config appsettings set `
  --name func-dreamspace-prod `
  --resource-group $RESOURCE_GROUP `
  --settings "AZURE_STORAGE_CONNECTION_STRING=$CONNECTION_STRING"
```

### 5. Deploy Updated Function Code

Make sure the updated code (including `uploadProfilePicture` function) is deployed:

```bash
# From the project root
cd api
npm install  # Installs @azure/storage-blob

# Deploy using your deployment script
cd ..
.\DEPLOY_FUNCTIONS_SIMPLE.ps1
```

## 🔍 How It Works

### Code Flow

1. **Frontend (`src/context/AuthContext.jsx`):**
   - Calls `graph.uploadMyPhotoToStorage(userId)`
   - Receives permanent blob storage URL
   - Stores URL in user profile

2. **GraphService (`src/services/graphService.js`):**
   - Fetches photo from Microsoft Graph API: `/me/photo/$value`
   - Converts to binary buffer
   - POSTs to `/api/uploadProfilePicture/{userId}`

3. **Azure Function (`api/uploadProfilePicture/index.js`):**
   - Receives image buffer
   - Creates safe filename from userId
   - Uploads to `profile-pictures` container
   - Returns permanent blob URL

### API Endpoint

```
POST /api/uploadProfilePicture/{userId}
Content-Type: image/jpeg
Body: [binary image data]

Response:
{
  "success": true,
  "url": "https://stdreamspaceprod.blob.core.windows.net/profile-pictures/user@domain.com.jpg",
  "message": "Profile picture uploaded successfully"
}
```

### Blob Naming Convention

Profile pictures are stored with a safe filename based on the user ID:
- Format: `{userId}.jpg`
- Special characters replaced with underscores
- Example: `john.doe@company.com` → `john.doe@company.com.jpg`
- Uploading again overwrites the existing picture

## 🧪 Testing

### 1. Test Profile Picture Upload

1. Log in with a Microsoft 365 account that has a profile picture
2. Check browser console for:
   ```
   📸 Attempting to upload profile picture to blob storage...
   ✅ Profile picture uploaded to blob storage: https://...
   ```
3. Verify the picture displays correctly

### 2. Verify Blob Storage

**Via Azure Portal:**
1. Go to Storage Account → **Data storage** → **Containers**
2. Click `profile-pictures`
3. You should see files like `user@domain.com.jpg`
4. Click a file → **Overview** to see the URL

**Via Azure CLI:**
```bash
az storage blob list `
  --container-name profile-pictures `
  --account-name $STORAGE_ACCOUNT `
  --output table
```

### 3. Test Public Access

Copy a blob URL and open it in a browser (incognito mode to test without authentication):
```
https://stdreamspaceprod.blob.core.windows.net/profile-pictures/user@domain.com.jpg
```

If you can see the image, public access is working correctly.

## 🔒 Security Considerations

### ✅ What's Secure

- **Backend Upload Only**: Users can't directly upload to blob storage
- **Authenticated Source**: Pictures only come from Microsoft Graph API
- **Validated Input**: User ID is sanitized before use as filename
- **Connection String**: Only backend has storage credentials

### ⚠️ Public Read Access

The `profile-pictures` container has **public read access**, meaning:
- Anyone with the URL can view profile pictures
- This is intentional for team/coaching views
- No sensitive data should be in profile pictures
- Users can't upload arbitrary images (only from M365)

### 🚫 What's NOT Stored

The storage account connection string is:
- ❌ NOT in frontend code
- ❌ NOT in environment variables prefixed with `VITE_`
- ❌ NOT accessible to users
- ✅ Only in Function App Configuration

## 🐛 Troubleshooting

### Error: "Blob storage not configured"

**Problem:** `AZURE_STORAGE_CONNECTION_STRING` not set in Function App

**Solution:**
1. Check Function App → Configuration → Application settings
2. Verify the setting exists and value is correct
3. Restart Function App after adding

### Error: "Failed to upload profile picture"

**Problem:** Permission or connection issues

**Solution:**
1. Verify connection string is valid
2. Check storage account isn't behind firewall
3. Ensure Function App has network access to storage
4. Check Function App logs for detailed error

### Profile Picture Not Displaying

**Problem:** URL is generated but image doesn't load

**Solution:**
1. Open blob URL directly in browser
2. If 404: Picture didn't upload - check Function logs
3. If 403: Container access level is wrong - set to "Blob"
4. If CORS error: Check storage CORS settings (shouldn't be needed for blob URLs)

### Container Not Auto-Created

**Problem:** First upload fails to create container

**Solution:**
1. Manually create container via Portal or CLI
2. Set public access level to "Blob"
3. Try upload again

## 📊 Monitoring

### Check Upload Logs

**Via Azure Portal:**
1. Go to Function App → **Monitoring** → **Log stream**
2. Watch for `uploadProfilePicture` invocations
3. Check for errors or success messages

**Via Application Insights:**
```
traces
| where operation_Name == "uploadProfilePicture"
| order by timestamp desc
| take 100
```

### Monitor Storage Usage

**Via Azure Portal:**
1. Go to Storage Account → **Monitoring** → **Insights**
2. Check **Capacity** for blob storage usage
3. Check **Transactions** for upload activity

## 💰 Cost Considerations

Profile picture storage costs are minimal:
- **Storage**: ~$0.02 per GB per month
- **Transactions**: ~$0.05 per 10,000 operations
- **Typical usage**: For 1000 users with 100KB pictures each:
  - Storage: ~100MB = $0.002/month
  - Uploads: 1000 uploads = $0.005 one-time

**Cost optimization:**
- Pictures are only uploaded once per user (on first login)
- Subsequent logins use the existing blob URL
- Consider setting lifecycle management to delete unused blobs

## 📚 Related Documentation

- **Environment Variables**: `../ENVIRONMENT_VARIABLES.md`
- **API Reference**: `../QUICK_REFERENCE.md`
- **Azure Deployment**: `./AZURE_DEPLOYMENT.md`
- **Function Code**: `../api/uploadProfilePicture/index.js`
- **Graph Service**: `../src/services/graphService.js`

---

**Last Updated:** 2024-10-29  
**Maintained By:** DreamSpace Development Team

