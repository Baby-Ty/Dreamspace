# DreamSpace Environment Variables

> **Quick Start**: Copy `.env.example` to `.env` and fill in your values

## 📋 Table of Contents
- [Overview](#overview)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Variable Reference](#variable-reference)
- [Validation & Security](#validation--security)
- [Troubleshooting](#troubleshooting)

---

## Overview

DreamSpace uses environment variables for configuration. Variables are:
- ✅ **Type-validated** using Zod schemas at startup
- ✅ **Secure** - never committed to git
- ✅ **Environment-aware** - different configs for dev/prod
- ✅ **Fail-fast** - validates on startup in development

### File Structure
```
.env.example          ← Template (committed to git)
.env                  ← Your local config (NOT in git)
.env.production       ← Production overrides (NOT in git)
.env.development      ← Dev overrides (NOT in git)
```

---

## Local Development Setup

### 1. Create Your Local Environment File

```bash
# Copy the template
cp .env.example .env

# Edit with your values
notepad .env   # Windows
nano .env      # Linux/Mac
```

### 2. Minimum Required for Development

For basic local development, you can run with **NO** environment variables! The app will:
- Use localStorage instead of Cosmos DB
- Use mock images instead of Unsplash
- Work with mock authentication (development mode)

### 3. Optional: Add Services

**For Unsplash Stock Photos:**
```env
VITE_UNSPLASH_ACCESS_KEY=your-key-from-unsplash
```
👉 Get key: https://unsplash.com/developers

**For Azure Cosmos DB (testing production behavior):**
```env
VITE_COSMOS_ENDPOINT=https://your-dev-account.documents.azure.com:443/
VITE_COSMOS_KEY=your-dev-key
```
👉 Use a **separate dev Cosmos DB account**, never production keys locally!

---

## Production Deployment

### Azure Static Web App Configuration

Environment variables for production are set in **Azure Portal**, not in `.env` files!

**Location:** Azure Portal → Your Static Web App → Settings → **Configuration** → Application settings

### Required Production Variables

| Variable | Where to Get It | Example |
|----------|-----------------|---------|
| `VITE_APP_ENV` | Set manually | `production` |
| `VITE_AZURE_CLIENT_ID` | Azure Portal → App Registrations → Your App | `a1b2c3d4-...` |
| `VITE_AZURE_TENANT_ID` | Azure Portal → Microsoft Entra ID → Overview | `e5f6g7h8-...` |
| `VITE_COSMOS_ENDPOINT` | Azure Portal → Cosmos DB → Keys | `https://...documents.azure.com:443/` |
| `VITE_COSMOS_KEY` | Azure Portal → Cosmos DB → Keys → Primary Key | `long-key-string` |

### Optional Production Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_UNSPLASH_ACCESS_KEY` | Stock photos | Uses mock images |
| `VITE_APPINSIGHTS_CONNECTION_STRING` | Monitoring | No monitoring |
| `VITE_API_BASE_URL` | API endpoint | `/api` |

### Azure Functions (Backend API)

**Location:** Azure Portal → Function App → Settings → **Configuration** → Application settings

| Variable | Value |
|----------|-------|
| `COSMOS_ENDPOINT` | Same as frontend |
| `COSMOS_KEY` | Same as frontend |

⚠️ **Note:** Backend uses `COSMOS_*` (without `VITE_` prefix)

---

## Variable Reference

### 🔐 Authentication

#### `VITE_AZURE_CLIENT_ID`
- **Type:** UUID
- **Required:** Production only
- **Purpose:** Microsoft Entra ID app registration client ID
- **Get it:** Azure Portal → App Registrations → Your App → Overview

#### `VITE_AZURE_TENANT_ID`
- **Type:** UUID  
- **Required:** Production only
- **Purpose:** Azure tenant/directory ID for authentication
- **Get it:** Azure Portal → Microsoft Entra ID → Overview

---

### 💾 Database

#### `VITE_COSMOS_ENDPOINT`
- **Type:** URL
- **Required:** Production only
- **Purpose:** Azure Cosmos DB account endpoint
- **Format:** `https://your-account.documents.azure.com:443/`
- **Get it:** Azure Portal → Cosmos DB → Keys → URI

#### `VITE_COSMOS_KEY`
- **Type:** String (long key)
- **Required:** Production only
- **Purpose:** Cosmos DB primary access key
- **Get it:** Azure Portal → Cosmos DB → Keys → Primary Key
- **⚠️ Security:** Never log or expose this value!

#### `VITE_COSMOS_DATABASE`
- **Type:** String
- **Required:** No
- **Default:** `dreamspace`
- **Purpose:** Cosmos DB database name

#### `VITE_COSMOS_CONTAINER`
- **Type:** String
- **Required:** No
- **Default:** `users`
- **Purpose:** Cosmos DB container name for user data

---

### 🌐 API Configuration

#### `VITE_API_BASE_URL`
- **Type:** String
- **Required:** No
- **Default:** `/api`
- **Purpose:** Base URL for Azure Functions backend
- **Examples:**
  - `/api` (Azure Static Web App)
  - `https://your-functions.azurewebsites.net/api` (Standalone Functions)

#### `VITE_GRAPH_API_BASE`
- **Type:** URL
- **Required:** No
- **Default:** `https://graph.microsoft.com/v1.0`
- **Purpose:** Microsoft Graph API base URL

---

### 🖼️ Unsplash API

#### `VITE_UNSPLASH_ACCESS_KEY`
- **Type:** String
- **Required:** No
- **Purpose:** Unsplash API access key for stock photos
- **Get it:** https://unsplash.com/developers
- **Fallback:** App uses mock images if not provided

---

### 📊 Monitoring

#### `VITE_APPINSIGHTS_CONNECTION_STRING`
- **Type:** String
- **Required:** No
- **Purpose:** Azure Application Insights connection string
- **Format:** `InstrumentationKey=xxx;IngestionEndpoint=https://...`
- **Get it:** Azure Portal → Application Insights → Properties

#### `VITE_APPINSIGHTS_INSTRUMENTATION_KEY`
- **Type:** String
- **Required:** No
- **Purpose:** Legacy Application Insights key (use connection string instead)

---

### 🎛️ Feature Flags

#### `VITE_ENABLE_COSMOS`
- **Type:** Boolean (`true` | `false`)
- **Required:** No
- **Purpose:** Explicitly enable/disable Cosmos DB
- **Default:** Auto-detected based on endpoint/key presence

#### `VITE_ENABLE_UNSPLASH`
- **Type:** Boolean (`true` | `false`)
- **Required:** No
- **Purpose:** Explicitly enable/disable Unsplash API
- **Default:** Auto-detected based on access key presence

---

### 🏷️ Build Metadata

#### `VITE_APP_VERSION`
- **Type:** String (semantic version)
- **Required:** No
- **Purpose:** App version for display/logging
- **Example:** `1.2.0`
- **Note:** Usually set by CI/CD pipeline

#### `VITE_BUILD_TIME`
- **Type:** ISO 8601 timestamp
- **Required:** No
- **Purpose:** Build timestamp for diagnostics
- **Example:** `2024-10-29T12:00:00Z`
- **Note:** Usually set by CI/CD pipeline

---

## Validation & Security

### Automatic Validation

Environment variables are validated at app startup using Zod schemas in `src/utils/env.js`.

**Development Behavior:**
- ❌ Throws error if production variables missing
- ⚠️ Warns about optional variables
- 📋 Shows helpful setup instructions

**Production Behavior:**
- ⚠️ Logs warning if variables invalid
- ✅ Falls back to safe defaults
- ✅ Continues running (graceful degradation)

### Security Best Practices

#### ✅ DO:
- Use `.env.example` as template
- Store production secrets in Azure Portal only
- Use separate Cosmos DB accounts for dev/prod
- Check configuration using `config.cosmos.isConfigured`
- Rotate keys regularly

#### ❌ DON'T:
- Commit `.env` files to git
- Log sensitive values to console
- Share keys in Slack/email
- Use production keys locally
- Hard-code secrets in source code

### Checking Configuration in Code

```javascript
import { config } from './utils/env.js';

// Check if services are configured
if (config.cosmos.isConfigured) {
  console.log('✅ Cosmos DB configured');
} else {
  console.log('ℹ️ Using localStorage');
}

if (config.unsplash.isConfigured) {
  console.log('✅ Unsplash configured');
} else {
  console.log('ℹ️ Using mock images');
}
```

---

## Troubleshooting

### "Environment validation failed"

**Problem:** Missing required production variables

**Solution:**
1. Check you're running the right build (`npm run dev` vs `npm run build`)
2. For production builds, ensure Cosmos DB variables are set
3. See error message for specific missing variables

### "Invalid Cosmos DB endpoint"

**Problem:** Endpoint URL is malformed

**Solution:**
```env
# ✅ Correct format (with port and trailing slash)
VITE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/

# ❌ Wrong
VITE_COSMOS_ENDPOINT=your-account
VITE_COSMOS_ENDPOINT=https://your-account.documents.azure.com
```

### "Authentication not working"

**Problem:** Azure AD variables missing or incorrect

**Solution:**
1. Verify `VITE_AZURE_CLIENT_ID` is a valid UUID
2. Verify `VITE_AZURE_TENANT_ID` matches your Azure tenant
3. Check redirect URIs in Azure App Registration match your app URL
4. Ensure app roles are assigned to users

### "Images not loading from Unsplash"

**Problem:** Invalid or missing Unsplash key

**Solution:**
1. Verify key is correct (no extra spaces)
2. Check Unsplash dashboard for rate limits
3. App will fall back to mock images automatically

### "Local development works but production fails"

**Problem:** Environment variables not set in Azure

**Solution:**
1. Go to Azure Portal → Static Web App → Configuration
2. Add all required variables as Application settings
3. Redeploy or restart the app
4. Check build logs for validation errors

---

## Additional Resources

- **Detailed Usage:** `src/utils/ENV_USAGE.md`
- **Quick Reference:** `src/utils/ENV_QUICK_REF.md`
- **Azure Deployment:** `docs-deployment/AZURE_DEPLOYMENT.md`
- **Static Web App Setup:** `docs-deployment/STATIC_WEB_APP_SETUP.md`
- **Implementation Details:** `docs-implementation-history/ENV_VALIDATION_IMPLEMENTATION.md`

---

## Summary Checklist

### For Local Development
- [ ] Copy `.env.example` to `.env`
- [ ] (Optional) Add Unsplash key for real stock photos
- [ ] (Optional) Add dev Cosmos DB for testing
- [ ] Run `npm run dev`

### For Production Deployment  
- [ ] Create Azure Cosmos DB account
- [ ] Create App Registration in Entra ID
- [ ] Set environment variables in Azure Static Web App Configuration
- [ ] Set backend variables in Function App Configuration
- [ ] Deploy and verify with smoke tests

### Security Review
- [ ] No `.env` files committed to git
- [ ] Production keys only in Azure Portal
- [ ] Separate dev/prod Cosmos DB accounts
- [ ] No secrets in source code
- [ ] Regular key rotation scheduled

---

**Last Updated:** 2024-10-29  
**Maintained By:** DreamSpace Development Team

