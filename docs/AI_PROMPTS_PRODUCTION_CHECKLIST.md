# AI Prompts Production Deployment Checklist

This checklist ensures the AI Prompts feature works correctly in production.

## ✅ Pre-Deployment Checklist

### 1. Cosmos DB Container
- [x] **Container Created**: `prompts` container exists in Cosmos DB
- [x] **Partition Key**: `/partitionKey` configured correctly
- [x] **Database**: `dreamspace` database exists
- [x] **Account**: Your Cosmos DB account name (e.g., `cosmos-dreamspace-<env>-<date>`)

**Status**: ✅ Container created successfully via setup script

### 2. Azure Function App Configuration

The Azure Function App (`func-dreamspace-prod`) needs these environment variables:

- [ ] **COSMOS_ENDPOINT**: `https://<your-cosmos-account>.documents.azure.com:443/`
- [ ] **COSMOS_KEY**: Primary master key from Cosmos DB account
- [ ] **OPENAI_API_KEY**: (Already configured for image/vision generation)

**To verify/update in Azure Portal:**
1. Go to Azure Portal → Function App → `func-dreamspace-prod`
2. Navigate to **Configuration** → **Application settings**
3. Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` are set
4. If missing, add them from Cosmos DB account → Keys section

### 3. API Endpoints Deployment

When code is pushed to `main`, these new endpoints will be deployed:

- [x] `GET /api/getPrompts` - Fetch prompts from Cosmos DB
- [x] `POST /api/savePrompts` - Save prompts to Cosmos DB
- [x] `POST /api/generateImage` - Updated to load prompts from Cosmos DB
- [x] `POST /api/generateVision` - Updated to load prompts from Cosmos DB

**Status**: ✅ Code is ready, will deploy on next push

### 4. Frontend Deployment

The frontend will automatically:
- [x] Detect live site (`dreamspace.tylerstewart.co.za`)
- [x] Use production API URL (`https://func-dreamspace-prod.azurewebsites.net/api`)
- [x] Load PromptEditorSection component
- [x] Connect to People Hub

**Status**: ✅ Code is ready, will deploy on next push

## 🚀 Post-Deployment Verification

After deploying, verify these steps:

### 1. Verify API Endpoints Work

Test the getPrompts endpoint:
```bash
curl https://func-dreamspace-prod.azurewebsites.net/api/getPrompts
```

Expected response:
```json
{
  "success": true,
  "prompts": {
    "id": "ai-prompts",
    "partitionKey": "config",
    "imageGeneration": {...},
    "visionGeneration": {...},
    "styleModifiers": {...}
  }
}
```

### 2. Verify Prompts Container Has Document

1. Go to Azure Portal → Cosmos DB → (your Cosmos DB account)
2. Navigate to **Data Explorer** → `dreamspace` → `prompts` container
3. Verify document with ID `ai-prompts` exists
4. If missing, access People Hub → AI Prompts (will auto-create)

### 3. Test End-to-End Flow

1. **Access People Hub**:
   - Go to `https://dreamspace.tylerstewart.co.za`
   - Navigate to People Hub
   - Click "AI Prompts" button

2. **Edit a Prompt**:
   - Expand "Image Generation" section
   - Modify the "Dream Image Prompt"
   - Click "Save Changes"
   - Verify success toast appears

3. **Verify Changes Take Effect**:
   - Generate a new dream image (Dream Book → Add Dream → Generate Image)
   - Verify the updated prompt is used
   - Check Azure Function logs to confirm prompts loaded from Cosmos DB

## 🔧 Troubleshooting Production Issues

### Prompts Not Loading

**Symptoms**: People Hub → AI Prompts shows error or loading forever

**Check**:
1. Azure Function App logs for errors
2. Cosmos DB connection string in Function App settings
3. Network connectivity between Function App and Cosmos DB
4. Container exists and has document

**Fix**:
- Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` in Function App settings
- Check Function App logs: Portal → Function App → Functions → getPrompts → Monitor

### Prompts Not Updating

**Symptoms**: Changes saved but not reflected in image/vision generation

**Check**:
1. Verify `savePrompts` API succeeded (check response)
2. Verify document updated in Cosmos DB (check `lastModified` timestamp)
3. Verify `generateImage`/`generateVision` load from Cosmos DB (check logs)

**Fix**:
- Check Function App logs for both `savePrompts` and `generateImage`/`generateVision`
- Verify prompts document in Cosmos DB has latest changes
- Restart Function App if needed

### Default Prompts Not Created

**Symptoms**: Container exists but no document

**Fix**:
- Access People Hub → AI Prompts (triggers auto-creation)
- Or call `GET /api/getPrompts` endpoint (will create defaults)

## 📋 Production Environment Summary

| Component | Value |
|-----------|-------|
| **Frontend URL** | `https://dreamspace.tylerstewart.co.za` |
| **API Base URL** | `https://func-dreamspace-prod.azurewebsites.net/api` |
| **Cosmos DB Account** | (your Cosmos DB account name) |
| **Database** | `dreamspace` |
| **Container** | `prompts` |
| **Partition Key** | `/partitionKey` |
| **Document ID** | `ai-prompts` |

## ✅ Final Checklist Before Going Live

- [ ] Cosmos DB container `prompts` exists
- [ ] Azure Function App has `COSMOS_ENDPOINT` configured
- [ ] Azure Function App has `COSMOS_KEY` configured
- [ ] Code pushed to `main` branch
- [ ] GitHub Actions deployment completed
- [ ] Tested `getPrompts` endpoint returns data
- [ ] Tested `savePrompts` endpoint saves changes
- [ ] Verified prompts document exists in Cosmos DB
- [ ] Tested end-to-end: Edit prompt → Save → Generate image → Verify change

## 🎯 Expected Behavior

Once deployed and configured:

1. **First Access**: When someone accesses People Hub → AI Prompts for the first time, default prompts are automatically created in Cosmos DB
2. **Editing**: Administrators can edit any prompt and save changes
3. **Immediate Effect**: Changes take effect immediately - next image/vision generation uses updated prompts
4. **Persistence**: All changes are stored in Cosmos DB and persist across deployments
5. **No Caching**: Prompts are always loaded fresh from Cosmos DB on each request

