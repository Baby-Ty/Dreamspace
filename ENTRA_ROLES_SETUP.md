# Setting up Entra ID App Roles for DreamSpace

This guide explains how to configure Microsoft Entra ID (Azure AD) App Roles to control access to different views in DreamSpace.

## Multi-Tenant Configuration

**Important**: DreamSpace is now configured for multi-tenant access, allowing users from any Azure AD tenant to sign in. If you need to restrict access to specific tenants only, see the "Single-Tenant Configuration" section at the bottom.

## Overview

DreamSpace now uses Entra ID App Roles to determine user permissions:
- **Admin**: Access to all views including Admin Dashboard
- **Manager**: Access to Dream Coach and People Hub views
- **Coach**: Access to Dream Coach view
- **Employee**: Basic access to personal views only

## Step 1: Configure App Roles in Entra ID

1. **Navigate to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Navigate to "Microsoft Entra ID" > "App registrations"
   - Find your DreamSpace application (`ebe60b7a-93c9-4b12-8375-4ab3181000e8`)

2. **Create App Roles**
   - Click on your app registration
   - Go to "App roles" in the left menu
   - Click "Create app role" and add these roles:

### Admin Role
```json
{
  "displayName": "DreamSpace Admin",
  "description": "Full access to all DreamSpace features including admin dashboard",
  "value": "DreamSpace.Admin",
  "allowedMemberTypes": ["User"],
  "id": "[Generate new GUID]",
  "isEnabled": true
}
```

### Manager Role
```json
{
  "displayName": "DreamSpace Manager",
  "description": "Access to coaching and people management features",
  "value": "DreamSpace.Manager", 
  "allowedMemberTypes": ["User"],
  "id": "[Generate new GUID]",
  "isEnabled": true
}
```

### Coach Role
```json
{
  "displayName": "DreamSpace Coach",
  "description": "Access to team coaching features",
  "value": "DreamSpace.Coach",
  "allowedMemberTypes": ["User"],
  "id": "[Generate new GUID]",
  "isEnabled": true
}
```

## Step 2: Assign Users to Roles

1. **Navigate to Enterprise Applications**
   - Go to "Microsoft Entra ID" > "Enterprise applications"
   - Find your DreamSpace application
   - Click "Users and groups"

2. **Add Role Assignments**
   - Click "Add user/group"
   - Select the user
   - Select the appropriate role (Admin, Manager, or Coach)
   - Click "Assign"

## Step 3: Configure Token Claims (Optional)

If roles don't appear automatically in tokens:

1. Go to your app registration
2. Navigate to "Token configuration"
3. Click "Add optional claim"
4. Select "ID" token type
5. Add the "roles" claim

## Step 4: Test Role Assignment

1. **Check Console Logs**
   - Open browser developer tools
   - Look for "User roles from Entra ID:" in the console
   - Verify the correct roles are being received

2. **Verify Navigation**
   - Admin users should see: Dashboard, Dream Book, Week Ahead, Dream Connect, Career Book, Scorecard, Dream Coach, People Hub, Admin
   - Manager users should see: Dashboard, Dream Book, Week Ahead, Dream Connect, Career Book, Scorecard, Dream Coach, People Hub
   - Coach users should see: Dashboard, Dream Book, Week Ahead, Dream Connect, Career Book, Scorecard, Dream Coach
   - Employee users should see: Dashboard, Dream Book, Week Ahead, Dream Connect, Career Book, Scorecard

## Troubleshooting

### Roles Not Appearing
1. Ensure the user is assigned to the role in Enterprise Applications
2. Check that the role value matches exactly (`DreamSpace.Admin`, `DreamSpace.Manager`, `DreamSpace.Coach`)
3. Try logging out and logging back in to refresh the token
4. Check browser console for any error messages

### Fallback Behavior
If no app roles are assigned, the system will fall back to job title-based role determination:
- Job titles containing "admin" → Admin role
- Job titles containing "manager" or "lead" → Manager role  
- Job titles containing "coach" or "mentor" → Coach role
- All others → Employee role

## Alternative Role Values

The system also accepts simplified role values for compatibility:
- `Admin` (instead of `DreamSpace.Admin`)
- `Manager` (instead of `DreamSpace.Manager`)
- `Coach` (instead of `DreamSpace.Coach`)

Choose the naming convention that works best for your organization.

## Azure Portal Configuration for Multi-Tenant

To enable multi-tenant access, you need to configure your app registration in Azure Portal:

### 1. Update App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Microsoft Entra ID" > "App registrations"
3. Find your DreamSpace application (`ebe60b7a-93c9-4b12-8375-4ab3181000e8`)
4. Go to "Authentication"
5. Under "Supported account types", select:
   - **"Accounts in any organizational directory (Any Azure AD directory - Multitenant)"**

### 2. Publisher Domain Verification (Optional but Recommended)
1. In your app registration, go to "Branding & properties"
2. Set your "Publisher domain" to your verified domain
3. This removes the "unverified" warning during consent

### 3. Admin Consent (For External Tenants)
When users from external tenants sign in for the first time:
- They may see a consent screen requesting permissions
- Tenant admins may need to grant admin consent for their organization
- This is normal for multi-tenant applications

## Single-Tenant Configuration (Alternative)

If you prefer to restrict access to specific tenants only:

### Option A: Your Tenant Only
```javascript
// In authConfig.js
authority: "https://login.microsoftonline.com/fe3fb5c4-c612-405e-bee1-60ba20a1bdff"
```

### Option B: Specific Tenant
```javascript
// Replace with the target tenant ID
authority: "https://login.microsoftonline.com/TARGET_TENANT_ID"
```

### Option C: Multiple Specific Tenants
You would need to implement custom logic to validate the tenant ID after authentication.

## Troubleshooting Cross-Tenant Issues

### "User account does not exist in tenant" Error
- **Solution**: Use multi-tenant configuration (authority: "common")
- **Alternative**: Add the user as a guest user in your original tenant

### App Roles Not Working for External Users
- External users won't have app roles from your tenant
- Consider implementing role assignment based on:
  - Email domain
  - Job title
  - Custom user attributes
  - Manual role assignment after first login

### Permission Consent Issues
- External tenant admins may need to grant consent
- Consider pre-consenting for known partner organizations
- Provide clear documentation about required permissions
