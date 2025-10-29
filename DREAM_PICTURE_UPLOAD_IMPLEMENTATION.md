# Dream Picture Upload Implementation

## 📋 Overview

Implemented functionality to upload dream images to Azure Blob Storage when creating or editing dreams. Images are stored in the `dreams-pictures` blob container and the permanent blob URL is saved in the dream's properties in Cosmos DB.

## ✅ What Was Implemented

### 1. Backend API Function: `uploadDreamPicture`

**Location:** `api/uploadDreamPicture/`

**Files:**
- `function.json` - Azure Function configuration
- `index.js` - Upload logic

**Features:**
- Accepts image files via HTTP POST
- Stores images in `dreams-pictures` blob container
- Auto-creates container with public read access if it doesn't exist
- Organizes images by userId: `{userId}/{dreamId}_{timestamp}.jpg`
- Auto-detects content type (JPEG, PNG, GIF, WebP)
- Returns permanent blob URL
- Validates file presence and proper configuration

**API Endpoint:**
```
POST /api/uploadDreamPicture/{userId}/{dreamId}
Content-Type: application/octet-stream
Body: Binary image data
```

**Response:**
```json
{
  "success": true,
  "url": "https://storage.blob.core.windows.net/dreams-pictures/user123/dream456_1730000000000.jpg",
  "message": "Dream picture uploaded successfully"
}
```

### 2. Frontend Service: `itemService.js`

**Added Method:** `uploadDreamPicture(userId, dreamId, imageFile)`

**Features:**
- Reads image file as ArrayBuffer
- Sends to backend API
- Returns success/error status with blob URL
- Proper error handling and logging

### 3. Frontend Component: `DreamBook.jsx`

**Updated Features:**
- Generate temporary dream ID for new dreams (needed for blob storage path)
- Upload images to blob storage instead of using data URLs
- Show upload progress indicator
- Validate file type (images only)
- Validate file size (max 5MB)
- Disable upload buttons during upload
- Store blob URL in dream properties
- Works for both creating new dreams and editing existing ones

**UI Improvements:**
- Loading spinner during upload
- Disabled state for upload buttons while uploading
- Better error messages for validation failures
- Remove image button when image is set

### 4. Documentation Updates

**Updated Files:**
- `ENVIRONMENT_VARIABLES.md` - Added `dreams-pictures` container documentation
- `docs-deployment/BLOB_STORAGE_SETUP.md` - Updated to include dream pictures

## 🔧 Configuration Required

### Azure Storage Account

The same storage account used for profile pictures is used for dream pictures.

**Environment Variable:**
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx;EndpointSuffix=core.windows.net
```

**Location:** Azure Function App → Configuration → Application settings

### Blob Containers

Two containers are now used:
- `profile-pictures` - User profile pictures from Microsoft 365
- `dreams-pictures` - Dream images uploaded by users

Both containers:
- Are created automatically on first upload
- Have public read access for viewing images
- Store images securely via backend API

## 🎯 Benefits

1. **Persistent Storage**: Images are permanently stored, not session-dependent
2. **Fast Delivery**: CDN-backed blob storage for quick loading
3. **Scalable**: Azure Blob Storage handles any number of images
4. **Secure**: Images uploaded through backend API, not directly from frontend
5. **Organized**: Images stored by userId for easy management
6. **Reliable**: Permanent URLs that work across sessions and devices

## 🚀 User Flow

### Creating a Dream with Image

1. User clicks "Add New Dream"
2. System generates temporary dream ID
3. User clicks "Upload File" and selects image
4. Image is validated (type, size)
5. Image uploads to blob storage (spinner shows progress)
6. Blob URL is stored in form data
7. Image preview shows the uploaded image
8. User fills in dream details
9. User clicks Save
10. Dream is saved to Cosmos DB with blob URL

### Editing Dream Image

1. User clicks Edit on existing dream
2. Current image (if any) is shown
3. User can remove or replace image
4. New image uploads to blob storage
5. Blob URL replaces old URL
6. User saves changes
7. Updated dream with new image URL saved to Cosmos DB

## 🔐 Security

- ✅ Images uploaded via backend API (not direct from frontend)
- ✅ Storage connection string only on backend
- ✅ File type validation (images only)
- ✅ File size validation (max 5MB)
- ✅ Public read access only (no write access from frontend)
- ✅ Images organized by userId (prevents conflicts)
- ✅ Unique timestamps in filenames (prevents overwrites)

## 📝 Data Structure

### Dream Object in Cosmos DB

```javascript
{
  id: "dream_1730000000000",
  userId: "user@example.com",
  type: "dream",
  title: "My Dream",
  category: "Health",
  description: "Dream description",
  image: "https://storage.blob.core.windows.net/dreams-pictures/user123/dream456_1730000000000.jpg",
  progress: 0,
  milestones: [],
  notes: [],
  history: [],
  createdAt: "2024-10-29T12:00:00.000Z",
  updatedAt: "2024-10-29T12:00:00.000Z"
}
```

The `image` field stores the permanent blob storage URL.

## 🧪 Testing

### Local Testing

1. Ensure `AZURE_STORAGE_CONNECTION_STRING` is set in Function App local settings
2. Start the API: `cd api && npm start`
3. Start the frontend: `npm run dev`
4. Create or edit a dream
5. Upload an image
6. Verify image appears correctly
7. Save dream
8. Reload page and verify image persists

### Production Testing

1. Ensure `AZURE_STORAGE_CONNECTION_STRING` is set in Azure Function App Configuration
2. Deploy the API and frontend
3. Create or edit a dream
4. Upload an image
5. Verify blob container is created
6. Verify image is accessible via blob URL
7. Verify dream saves correctly with image URL

## 📦 Deployment Checklist

- [ ] Deploy new `uploadDreamPicture` function to Azure
- [ ] Verify `AZURE_STORAGE_CONNECTION_STRING` is set in Function App Configuration
- [ ] Test image upload functionality
- [ ] Verify `dreams-pictures` container is created (or create manually)
- [ ] Verify images are accessible via blob URLs
- [ ] Test creating and editing dreams with images
- [ ] Verify images persist across sessions

## 🐛 Troubleshooting

### "Blob storage not configured" error
- Ensure `AZURE_STORAGE_CONNECTION_STRING` is set in Function App Configuration
- Restart Function App after setting the variable

### Images not uploading
- Check browser console for errors
- Verify file is an image (JPEG, PNG, GIF, WebP)
- Verify file size is under 5MB
- Check Function App logs for backend errors

### Images not displaying
- Verify blob URL is saved in dream object
- Check blob container public access is set to "Blob"
- Verify image URL is accessible in browser
- Check browser console for CORS errors

### Container not created
- Manually create `dreams-pictures` container with public blob access
- Verify storage account connection string is correct
- Check Function App has permission to create containers

## 📚 Related Documentation

- [Environment Variables](ENVIRONMENT_VARIABLES.md)
- [Blob Storage Setup](docs-deployment/BLOB_STORAGE_SETUP.md)
- [Azure Deployment](docs-deployment/AZURE_DEPLOYMENT.md)

---

**Implementation Date:** October 29, 2024  
**Status:** ✅ Complete and Ready for Deployment

