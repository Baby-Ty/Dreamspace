# Image Generation API Key Review

## Overview
This document reviews how the OpenAI API key for image generation (DALL-E) is stored, used, and can be updated.

## Current Implementation

### Where the API Key is Stored

#### 1. **Local Development** (`local.settings.json`)
```json
{
  "Values": {
    "OPENAI_API_KEY": "sk-proj-..."
  }
}
```
- **Location**: `api/local.settings.json` (root level, not committed to git)
- **Format**: Plain text environment variable
- **Scope**: Local development only

#### 2. **Production** (Azure Function App Configuration)
- **Location**: Azure Portal → Function App → `func-dreamspace-prod` → Configuration → Application settings
- **Environment Variable Name**: `OPENAI_API_KEY`
- **Format**: Encrypted application setting in Azure
- **Scope**: Production Azure Functions

### How It's Used

The API key is accessed in `api/generateImage/index.js`:

```javascript
// Line 126: Check if OpenAI API key is configured
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw { 
    status: 500, 
    message: 'OpenAI API not configured',
    details: 'OPENAI_API_KEY environment variable is required'
  };
}

// Line 226: Used in API call to OpenAI
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  // ...
});
```

### Security Architecture

✅ **Good Security Practices:**
- API key is **server-side only** (never exposed to frontend)
- Frontend calls backend API (`/api/generateImage`) which proxies to OpenAI
- Key is stored as environment variable (not hardcoded)
- Production key is encrypted in Azure Portal

⚠️ **Current Concerns:**
- `local.settings.json` contains plain text key (should be in `.gitignore`)
- No key rotation mechanism documented
- No validation of key format/validity

## How to Update/Swap the API Key

### Option 1: Update Local Development Key

**Steps:**
1. Open `api/local.settings.json`
2. Update the `OPENAI_API_KEY` value:
   ```json
   {
     "Values": {
       "OPENAI_API_KEY": "sk-proj-YOUR-NEW-KEY-HERE"
     }
   }
   ```
3. Restart Azure Functions locally:
   ```bash
   cd api
   func start
   ```

**Note**: Changes take effect immediately after restart.

### Option 2: Update Production Key (Azure Portal)

**Steps:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: **Function App** → `func-dreamspace-prod`
3. Go to: **Configuration** → **Application settings**
4. Find `OPENAI_API_KEY` in the list
5. Click **Edit** (pencil icon)
6. Update the **Value** field with new key
7. Click **OK**
8. Click **Save** at the top (this restarts the Function App)

**Alternative: Azure CLI**
```bash
az functionapp config appsettings set \
  --name func-dreamspace-prod \
  --resource-group <your-resource-group> \
  --settings OPENAI_API_KEY="sk-proj-YOUR-NEW-KEY-HERE"
```

**Note**: Function App will automatically restart after saving, changes take effect immediately.

### Option 3: Update via GitHub Actions (CI/CD)

If you want to automate key updates, you can add it to your deployment workflow:

```yaml
- name: Set OpenAI API Key
  uses: azure/CLI@v1
  with:
    inlineScript: |
      az functionapp config appsettings set \
        --name func-dreamspace-prod \
        --resource-group <resource-group> \
        --settings OPENAI_API_KEY="${{ secrets.OPENAI_API_KEY }}"
```

**Note**: Store the key in GitHub Secrets (`Settings` → `Secrets and variables` → `Actions`)

## Verification Steps

After updating the key, verify it works:

### 1. Check Key is Loaded
- **Local**: Check Function App logs when starting
- **Production**: Check Function App logs in Azure Portal

### 2. Test Image Generation
- Use the frontend: Dream Book → Add Dream → Generate Image
- Or call API directly:
  ```bash
  curl -X POST https://func-dreamspace-prod.azurewebsites.net/api/generateImage \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <user-token>" \
    -d '{"userSearchTerm": "test", "options": {}}'
  ```

### 3. Check for Errors
- If key is invalid: You'll get `401 Unauthorized` from OpenAI
- If key is missing: You'll get `500` with message "OpenAI API not configured"
- Check Function App logs for detailed error messages

## Key Rotation Best Practices

### Recommended Approach

1. **Generate New Key** in OpenAI Dashboard
2. **Update Production** first (Azure Portal)
3. **Verify Production** works with new key
4. **Update Local** development key
5. **Revoke Old Key** in OpenAI Dashboard (after verification)

### Rollback Plan

If new key doesn't work:
1. Keep old key available temporarily
2. Revert to old key in Azure Portal
3. Investigate issue with new key
4. Try again once resolved

## Current Key Status

Based on `local.settings.json`:
- **Key Format**: `sk-proj-...` (OpenAI project-level key)
- **Key Type**: Project API key (not organization key)
- **Expiration**: Project keys don't expire unless revoked

## Recommendations

### Immediate Actions
1. ✅ Verify `local.settings.json` is in `.gitignore` (should not be committed)
2. ✅ Document key rotation process for team
3. ✅ Consider using Azure Key Vault for production keys (more secure)

### Future Improvements
1. **Azure Key Vault Integration**: Store keys in Key Vault instead of App Settings
2. **Key Validation**: Add startup check to validate key format/validity
3. **Monitoring**: Add alerts for API key failures
4. **Rotation Automation**: Set up automated key rotation if using service principals

## Related Files

- `api/generateImage/index.js` - Main API endpoint using the key
- `api/local.settings.json` - Local development configuration
- `src/utils/env.js` - Frontend env config (note: key NOT exposed here)
- `docs/AI_PROMPTS_PRODUCTION_CHECKLIST.md` - Production deployment guide

## Summary

**Can we just swap it out?** ✅ **YES**

The API key can be easily swapped by:
1. **Local**: Update `local.settings.json` → Restart Functions
2. **Production**: Update Azure Portal App Settings → Auto-restarts
3. **No code changes required** - it's a simple environment variable swap

The key is stored securely server-side and never exposed to the frontend, making updates safe and straightforward.
