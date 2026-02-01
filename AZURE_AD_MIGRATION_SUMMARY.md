# Azure AD App Migration - Quick Reference

**Date:** 2026-01-29  
**From:** tylerstewart.co.za tenant  
**To:** Netsurit tenant

---

## ✅ What We Extracted

Successfully extracted all configuration from app registration `ebe60b7a-93c9-4b12-8375-4ab3181000e8`.

Full details in: [`AZURE_AD_APP_EXTRACTION.md`](AZURE_AD_APP_EXTRACTION.md)

---

## 🔑 Key Findings

### Actual Permissions Used by the App

| Permission | Purpose |
|------------|---------|
| **User.Read** | User profile + photo |
| **openid, profile, email** | Authentication |
| **Calendars.ReadWrite** | Team meeting scheduling ⚠️ Requires admin consent |

**Permission NOT needed:**
- ❌ `ProfilePhoto.Read.All` - Currently configured but not used (app only reads own photo)

### Roles

- ✅ **Roles managed in Cosmos DB** (primary)
- ❌ **Entra app roles NOT required** (only used as fallback)
- Recommendation: Skip creating app roles in new tenant

### Redirect URIs

Copy these exactly to new app:
```
http://localhost:5173
https://dreamspace.tylerstewart.co.za
https://dreams.netsurit.com
https://gentle-grass-07ac3aa0f.1.azurestaticapps.net
```

---

## 📝 New App Registration - Quick Steps

### 1. Login to Netsurit Tenant

```bash
az login --tenant <netsurit-tenant-id>
```

### 2. Create App

```bash
az ad app create \
  --display-name "Dream Space" \
  --sign-in-audience AzureADMyOrg \
  --enable-id-token-issuance true \
  --enable-access-token-issuance true \
  --web-redirect-uris "https://dreamspace.tylerstewart.co.za/" \
  --spa-redirect-uris \
    "http://localhost:5173" \
    "https://dreamspace.tylerstewart.co.za" \
    "https://dreams.netsurit.com" \
    "https://gentle-grass-07ac3aa0f.1.azurestaticapps.net"
```

Save the `appId` from output → This is your new `VITE_AZURE_CLIENT_ID`

### 3. Set Logout URL

```bash
APP_ID="<app-id-from-step-2>"
az ad app update --id $APP_ID \
  --web-logout-url "https://dreamspace.tylerstewart.co.za/"
```

### 4. Add Permissions

```bash
az ad app permission add --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions \
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
    37f7f235-527c-4136-accd-4a02d197296e=Scope \
    14dad69e-099b-42c9-810b-d002981feec1=Scope \
    64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope \
    1ec239c2-d7c9-4623-a91a-a9775856bb36=Scope
```

### 5. Grant Admin Consent ⚠️

```bash
az ad app permission admin-consent --id $APP_ID
```

**IMPORTANT:** This requires Netsurit tenant admin privileges. Required for `Calendars.ReadWrite` permission.

### 6. Get Tenant ID

```bash
az account show --query tenantId -o tsv
```

Save this → This is your new `VITE_AZURE_TENANT_ID`

---

## 🔄 Update Environment Variables

### Local Development

Create `.env.local`:
```env
VITE_AZURE_CLIENT_ID=<new-app-id-from-step-2>
VITE_AZURE_TENANT_ID=<tenant-id-from-step-6>
VITE_APP_ENV=development
```

### Azure Static Web Apps

Update app settings:
- `VITE_AZURE_CLIENT_ID` → New app ID
- `VITE_AZURE_TENANT_ID` → Netsurit tenant ID

---

## ✅ Testing Checklist

- [ ] Login works on localhost
- [ ] User profile displays
- [ ] User photo displays
- [ ] Calendar meeting scheduling works
- [ ] Roles work (from Cosmos DB)
- [ ] Logout redirects correctly
- [ ] Production domains work

---

## 🔙 Rollback Plan

If anything goes wrong, revert environment variables:

```env
VITE_AZURE_CLIENT_ID=ebe60b7a-93c9-4b12-8375-4ab3181000e8
VITE_AZURE_TENANT_ID=fe3fb5c4-c612-405e-bee1-60ba20a1bdff
```

Redeploy → App works with old tenant within 2-5 minutes.

---

## 📚 Resources

- Full extraction details: [`AZURE_AD_APP_EXTRACTION.md`](AZURE_AD_APP_EXTRACTION.md)
- Raw JSON export: [`app-registration-export.json`](app-registration-export.json)
- Current codebase: [`src/auth/authConfig.js`](src/auth/authConfig.js)
