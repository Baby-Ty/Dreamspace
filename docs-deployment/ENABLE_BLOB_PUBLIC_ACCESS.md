# Enable Blob Public Access - Quick Fix Guide

## ❌ Error You're Seeing
```
"Public access is not permitted on this storage account"
```

## 🎯 Solution: Enable Public Blob Access

### Step 1: Find Your Storage Account

1. Go to **Azure Portal**: https://portal.azure.com
2. Navigate to: **Function Apps** → `func-dreamspace-prod`
3. In the left menu, click **Configuration** (under Settings)
4. Look for the setting `AZURE_STORAGE_CONNECTION_STRING`
5. The value will contain `AccountName=XXXX` - that's your storage account name
   - Example: `AccountName=stdreamspaceprod`

### Step 2: Enable Public Access on Storage Account

1. In Azure Portal, go to **Storage Accounts**
2. Find and click on the storage account from Step 1
3. In the left menu, go to **Settings** → **Configuration**
4. Find: **"Allow Blob public access"**
5. Change to: **Enabled** ✅
6. Click **Save** at the top
7. Wait 30 seconds for the change to take effect

### Step 3: Test Upload Again

1. Refresh your DreamSpace page
2. Create a new dream
3. Upload an image
4. The upload should now work! ✅

---

## 🔐 Security Notes

- This setting allows containers to have public read access for blobs (images)
- Images are still uploaded securely through the backend API
- Only the blob URLs are publicly readable (for displaying images)
- No one can upload/delete without going through your API

---

## ✅ Verification

After enabling, you should see:
- ✅ Image uploads successfully
- ✅ Image URL starts with `https://[storage-account].blob.core.windows.net/dreams-pictures/...`
- ✅ Dream saves with the image URL
- ✅ Image persists after page reload

---

## 🆘 Alternative If You Can't Enable Public Access

If your organization policy prevents enabling public blob access, you would need to:
1. Use Azure CDN with SAS tokens
2. Or implement a proxy endpoint in your Function App to serve images
3. Or use a different storage solution

But for DreamSpace, enabling public blob access is the simplest and recommended approach.

---

## 📞 Need Help?

If you're having trouble finding the storage account or enabling the setting:
1. Check who has Owner/Contributor access to the subscription
2. You may need to ask an admin to enable this setting
3. The setting is at the Storage Account level, not the container level




