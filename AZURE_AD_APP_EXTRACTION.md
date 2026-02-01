# Azure AD App Registration Extraction Summary

**Date Extracted:** 2026-01-29  
**Source Tenant:** tylerstewart.co.za (emailtylerstewartco.onmicrosoft.com)  
**Source App (Client) ID:** ebe60b7a-93c9-4b12-8375-4ab3181000e8

---

## 1. Basic App Information

| Property | Value |
|----------|-------|
| **Display Name** | Dream Space |
| **App (Client) ID** | `ebe60b7a-93c9-4b12-8375-4ab3181000e8` |
| **Object ID** | `81886e25-d583-4666-8498-07cb9a6eb542` |
| **Tenant ID** | `fe3fb5c4-c612-405e-bee1-60ba20a1bdff` |
| **Publisher Domain** | emailtylerstewartco.onmicrosoft.com |
| **Sign-in Audience** | `AzureADMultipleOrgs` (Multi-tenant) |
| **Created Date** | 2025-09-20 |

---

## 2. Authentication Configuration

### Platform Type
- **Single-Page Application (SPA)** ✅
- Uses PKCE for secure authentication (no client secrets needed)

### SPA Redirect URIs
```
✅ http://localhost:5173
✅ https://dreamspace.tylerstewart.co.za
✅ https://dreams.netsurit.com
✅ https://gentle-grass-07ac3aa0f.1.azurestaticapps.net
```

### Logout URL
```
https://dreamspace.tylerstewart.co.za/
```

### Implicit Grant Settings
- **Access Token Issuance:** ✅ Enabled
- **ID Token Issuance:** ✅ Enabled

> ⚠️ **NOTE:** Implicit grant is enabled but NOT required for SPA + PKCE. You can disable these in the new app for better security.

### Web Platform
- No web redirect URIs configured (correctly using SPA platform)

---

## 3. API Permissions (Microsoft Graph Delegated)

All permissions are **Delegated** (Scope type) - requires user consent.

### ✅ Permissions Actually Used by the App

Based on code analysis, the app actually uses:

| Permission | Type | Description | Used For | Admin Consent Required |
|------------|------|-------------|----------|----------------------|
| **User.Read** | Delegated | Read signed-in user's profile and basic company info | `/me` endpoint, profile data, user photo | No |
| **openid** | Delegated | Sign in with work/school accounts | OIDC authentication | No |
| **profile** | Delegated | View users' basic profile (name, picture, email) | Basic user info | No |
| **email** | Delegated | Read users' primary email address | User email display | No |
| **Calendars.ReadWrite** | Delegated | Read/write user's calendars | Creating team meeting calendar events | **Yes** ⚠️ |

### ❌ Currently Configured But NOT Used

| Permission | Why It's Not Needed |
|------------|-------------------|
| **ProfilePhoto.Read.All** | The app only reads the signed-in user's own photo, which is covered by `User.Read`. This permission is for reading OTHER users' photos. |

### Recommended Permissions for New App

```json
{
  "resourceAppId": "00000003-0000-0000-c000-000000000000",
  "resourceAccess": [
    {"id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d", "type": "Scope"},  // User.Read
    {"id": "37f7f235-527c-4136-accd-4a02d197296e", "type": "Scope"},  // openid
    {"id": "14dad69e-099b-42c9-810b-d002981feec1", "type": "Scope"},  // profile
    {"id": "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0", "type": "Scope"},  // email
    {"id": "1ec239c2-d7c9-4623-a91a-a9775856bb36", "type": "Scope"}   // Calendars.ReadWrite
  ]
}
```

> ⚠️ **IMPORTANT:** `Calendars.ReadWrite` requires admin consent. A Netsurit tenant admin must grant this permission for the calendar scheduling feature to work (`scheduleMeetingWithCalendar` API endpoint).

---

## 4. App Roles (Optional - Cosmos DB Manages Roles)

The current app registration defines 3 custom app roles, but **roles are primarily managed in Cosmos DB**, not Entra ID.

### Role Priority Order (from `roleUtils.js`)

1. **Priority 1:** Cosmos DB `userData.role` field ✅ **Primary source**
2. **Priority 2:** Legacy `isCoach` flag in Cosmos DB
3. **Priority 3:** Entra ID app roles (fallback only)
4. **Priority 4:** Job title heuristics (fallback)

### Current Entra ID App Roles (Optional)

These are configured but only used as a fallback when Cosmos DB role isn't set:

| Role Value | Description | Cosmos DB Equivalent |
|------------|-------------|---------------------|
| `DreamSpace.Admin` | Full access to all features | `role: 'admin'` |
| `DreamSpace.Manager` | Coaching and people management | `role: 'coach'` or `role: 'manager'` |
| `DreamSpace.Coach` | Team coaching features | `role: 'coach'` |

### Recommendation for New Tenant

**Option 1: Skip App Roles (Recommended)**
- Don't create these app roles in the new tenant
- Rely entirely on Cosmos DB for role management
- Simpler to manage, no need to assign roles in Entra ID

**Option 2: Keep App Roles (Optional)**
- Useful if you want Entra admins to control some roles
- Provides a fallback if Cosmos DB role isn't set
- Must use exact same `value` strings if you choose this option

> ℹ️ **NOTE:** The app will work fine without these Entra app roles since Cosmos DB is the primary source. Only create them if you want the fallback behavior.

---

## 5. Additional Configuration

### Exposed API Scopes
- ❌ None configured (app does not expose custom APIs)

### Certificates & Secrets
- ❌ **No certificates or secrets configured** (correct for SPA with PKCE)

### Optional Claims
- ❌ None configured

### Group Membership Claims
- ❌ Not enabled

---

## 6. What MUST Change for New Tenant

When creating the new app registration in **Netsurit** tenant:

### ✏️ REQUIRED CHANGES

1. **New Client ID**
   - Old: `ebe60b7a-93c9-4b12-8375-4ab3181000e8`
   - New: (Will be generated by Azure)
   - **Update:** `VITE_AZURE_CLIENT_ID` in all environments

2. **New Tenant ID**
   - Old: `fe3fb5c4-c612-405e-bee1-60ba20a1bdff`
   - New: (Netsurit tenant ID)
   - **Update:** `VITE_AZURE_TENANT_ID` in all environments

3. **Sign-in Audience**
   - Current: `AzureADMultipleOrgs` (Multi-tenant)
   - Recommended for new app: `AzureADMyOrg` (Single tenant - Netsurit only)
   - This provides better security by restricting to Netsurit accounts only

4. **Admin Consent**
   - Must be granted by Netsurit tenant admin for `Calendars.ReadWrite` (required for meeting scheduling)

5. **App Roles Assignment**
   - ℹ️ **SKIP THIS** - Roles are managed in Cosmos DB, not Entra ID
   - No need to create or assign Entra app roles

### ✅ STAYS THE SAME

- All redirect URIs (copy exactly as-is)
- API permission names (User.Read, openid, profile, email, Calendars.ReadWrite)
- Application code (reads from environment variables)
- MSAL configuration structure

---

## 7. Code Changes Required

### Environment Variables to Update

**File: `.env.local` (development)**
```env
VITE_AZURE_CLIENT_ID=<new-netsurit-client-id>
VITE_AZURE_TENANT_ID=<new-netsurit-tenant-id>
VITE_APP_ENV=development
```

**Azure Static Web Apps App Settings:**
- `VITE_AZURE_CLIENT_ID` → New Netsurit client ID
- `VITE_AZURE_TENANT_ID` → New Netsurit tenant ID

### Files That Reference These (NO CODE CHANGES NEEDED)

- `src/auth/authConfig.js` - Reads from `import.meta.env.VITE_AZURE_CLIENT_ID` and `VITE_AZURE_TENANT_ID`
- `src/utils/env.js` - Validates and exposes config values
- All other files use these indirectly through the config

### ✅ No Code Changes Needed

The scopes in `src/auth/authConfig.js` match what the app actually uses:
```javascript
scopes: ["User.Read", "profile", "openid", "email", "Calendars.ReadWrite"]
```

These are correct and should remain as-is. The new app registration must include `Calendars.ReadWrite` for the calendar scheduling feature to work.

---

## 8. Step-by-Step Recreation Guide

### Step 1: Create New App Registration in Netsurit Tenant

```bash
# Login to Netsurit tenant
az login --tenant <netsurit-tenant-id-or-domain>

# Create new app registration
az ad app create \
  --display-name "Dream Space" \
  --sign-in-audience AzureADMyOrg \
  --enable-id-token-issuance true \
  --enable-access-token-issuance true \
  --web-redirect-uris "https://dreamspace.tylerstewart.co.za/" \
  --spa-redirect-uris "http://localhost:5173" "https://dreamspace.tylerstewart.co.za" "https://dreams.netsurit.com" "https://gentle-grass-07ac3aa0f.1.azurestaticapps.net"
```

### Step 2: Configure Logout URL

```bash
# Get the app ID from previous command output
APP_ID="<new-app-id>"

az ad app update --id $APP_ID \
  --web-logout-url "https://dreamspace.tylerstewart.co.za/"
```

### Step 3: Add API Permissions

```bash
# Add Microsoft Graph delegated permissions (with Calendars.ReadWrite)
az ad app permission add --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
                     37f7f235-527c-4136-accd-4a02d197296e=Scope \
                     14dad69e-099b-42c9-810b-d002981feec1=Scope \
                     64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope \
                     1ec239c2-d7c9-4623-a91a-a9775856bb36=Scope

# Grant admin consent (requires admin privileges - needed for Calendars.ReadWrite)
az ad app permission admin-consent --id $APP_ID
```

**Permissions added:**
- `e1fe6dd8-ba31-4d61-89e7-88639da4683d` = User.Read
- `37f7f235-527c-4136-accd-4a02d197296e` = openid
- `14dad69e-099b-42c9-810b-d002981feec1` = profile
- `64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0` = email
- `1ec239c2-d7c9-4623-a91a-a9775856bb36` = Calendars.ReadWrite ⚠️ (requires admin consent)

### Step 4: Create App Roles (OPTIONAL - Skip This Step)

> ℹ️ **RECOMMENDED: Skip this step.** The app manages roles in Cosmos DB, not Entra ID. These app roles are only used as a fallback and aren't necessary.

If you still want to create them for fallback behavior:

```bash
# Create app-roles.json file
cat > app-roles.json << 'EOF'
[
  {
    "allowedMemberTypes": ["User"],
    "description": "Access to team coaching features",
    "displayName": "DreamSpace Coach",
    "isEnabled": true,
    "value": "DreamSpace.Coach"
  },
  {
    "allowedMemberTypes": ["User"],
    "description": "Access to coaching and people management features",
    "displayName": "DreamSpace Manager",
    "isEnabled": true,
    "value": "DreamSpace.Manager"
  },
  {
    "allowedMemberTypes": ["User"],
    "description": "Full access to all DreamSpace features including admin dashboard",
    "displayName": "DreamSpace Admin",
    "isEnabled": true,
    "value": "DreamSpace.Admin"
  }
]
EOF

# Update app with roles
az ad app update --id $APP_ID --app-roles @app-roles.json
```

### Step 5: Get New IDs

```bash
# Get the new client ID and tenant ID
az ad app show --id $APP_ID --query "{ClientId:appId, ObjectId:id}"
az account show --query "{TenantId:tenantId, TenantName:name}"
```

### Step 6: Update Environment Variables

Update your deployment configurations with the new values from Step 5.

### Step 7: Test Authentication

1. Update `.env.local` with new values
2. Run `npm run dev`
3. Test login flow at http://localhost:5173
4. Verify token claims include expected roles and scopes
5. Test logout flow

---

## 9. Testing Checklist

After migration:

- [ ] User can log in successfully
- [ ] User profile loads (User.Read permission works)
- [ ] User photo displays (covered by User.Read)
- [ ] Calendar meeting scheduling works (Calendars.ReadWrite permission)
- [ ] Role-based features work (roles from Cosmos DB)
- [ ] Logout redirects correctly
- [ ] Production domain works (dreams.netsurit.com and dreamspace.tylerstewart.co.za)
- [ ] Localhost development works
- [ ] No CORS errors
- [ ] No "invalid redirect URI" errors
- [ ] No permission consent errors

---

## 10. Rollback Plan

If issues occur after switching to new tenant:

1. **Revert environment variables:**
   ```env
   VITE_AZURE_CLIENT_ID=ebe60b7a-93c9-4b12-8375-4ab3181000e8
   VITE_AZURE_TENANT_ID=fe3fb5c4-c612-405e-bee1-60ba20a1bdff
   ```

2. **Redeploy application** (Azure Static Web Apps auto-deploys on config change)

3. **Users can log in again** with old tenant within 2-5 minutes

---

## Full Export JSON

The complete app registration export is saved in: `app-registration-export.json`

This file contains all raw data from Azure AD and can be used as a reference for any additional properties not covered in this summary.

---

**Generated by:** Azure CLI extraction script  
**Full export file:** `app-registration-export.json`
