# Coach Role & Preview Button Fix Summary

## Problem
Tyler Stewart was promoted to coach via the People Hub, but the Dream Coach preview button (eye icon) wasn't appearing in the sidebar navigation.

## Root Cause
The `determineUserRoleFromToken` function in `AuthContext.jsx` was only checking:
1. Azure AD Entra roles
2. Microsoft Graph job title/department

But it was **NOT** checking the `role` and `isCoach` properties stored in Cosmos DB (which are set when promoting users via People Hub).

## Changes Made

### 1. Fixed Role Determination Priority (AuthContext.jsx)
Updated `determineUserRoleFromToken` to check roles in this priority order:

1. **PRIORITY 1**: Cosmos DB `role` field (set via People Hub promotion)
2. **PRIORITY 2**: Cosmos DB `isCoach` flag (legacy support)
3. **PRIORITY 3**: Azure AD Entra app roles
4. **PRIORITY 4**: Microsoft Graph job title/department

```javascript
// Now checks userData.role FIRST
if (userData?.role) {
  if (userData.role === 'admin') return 'admin';
  if (userData.role === 'coach' || userData.role === 'manager') return 'coach';
  if (userData.role === 'user' || userData.role === 'employee') return 'employee';
}
```

### 2. Added refreshUserRole() Function
Added a new function that can be called to refresh a user's role from Cosmos DB without logging out:

```javascript
const { refreshUserRole } = useAuth();
await refreshUserRole(); // Reloads role from database
```

### 3. Automatic Role Refresh on Window Focus
Added automatic role checking when the browser window regains focus:
- When you switch away from the browser and come back
- When you click on the browser tab after using another app
- Automatically checks for role updates in Cosmos DB

### 4. Dream Coach Preview Button Logic (Layout.jsx)
The preview button now only shows for users with these roles:
- `coach`
- `admin`
- `manager`

```javascript
const isDreamCoach = item.name === 'Dream Coach';
const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin' || userRole === 'manager';
const showPreview = item.previewHref && (!isDreamCoach || isCoachOrAdmin);
```

## Backend Verification

### promoteUserToCoach API (Already Correct)
The API endpoint correctly sets both properties in Cosmos DB:

```javascript
const updatedUser = {
  ...user,
  role: 'coach',
  isCoach: true,
  lastModified: new Date().toISOString(),
  promotedAt: new Date().toISOString()
};
```

### getUserData API (Already Correct)
The API returns the user's `role` and `isCoach` fields from Cosmos DB in the response.

## For Tyler Stewart to See the Dream Coach Preview

Tyler Stewart has 3 options to refresh his role:

### Option 1: Refresh the Browser Page (Simplest)
1. Press `F5` or `Ctrl+R` (Windows) / `Cmd+R` (Mac)
2. The page will reload and fetch his updated role from Cosmos DB
3. The Dream Coach eye icon should appear

### Option 2: Switch Browser Tabs (Automatic)
1. Switch to a different app or browser tab
2. Switch back to the DreamSpace tab
3. The role will automatically refresh due to the focus event listener

### Option 3: Log Out and Log Back In (Most Thorough)
1. Click "Sign out" in the sidebar
2. Sign back in with Microsoft
3. Role will be loaded fresh from Cosmos DB

## Console Verification

To verify Tyler's role is loading correctly, check the browser console for these logs:

```
✅ User role from Cosmos DB: coach
✅ User role refreshed: { oldRole: 'employee', newRole: 'coach' }
```

## Summary of Files Changed

| File | Changes |
|------|---------|
| `src/context/AuthContext.jsx` | ✅ Updated `determineUserRoleFromToken` to check Cosmos DB role first<br>✅ Added `refreshUserRole()` function<br>✅ Added automatic refresh on window focus |
| `src/components/Layout.jsx` | ✅ Added role-based conditional for Dream Coach preview button<br>✅ Added Eye icon import |
| `api/promoteUserToCoach/index.js` | ✅ Already correctly sets `role: 'coach'` and `isCoach: true` |
| `api/getUserData/index.js` | ✅ Already correctly returns `role` and `isCoach` fields |

## Testing Checklist

- [x] Backend sets `role: 'coach'` in Cosmos DB when promoting
- [x] Backend returns `role` field in getUserData API
- [x] Frontend checks Cosmos DB role before Azure AD roles
- [x] Frontend refreshes role on window focus
- [x] Dream Coach preview button only shows for coaches
- [ ] Tyler Stewart refreshes browser and sees Dream Coach eye icon

## Next Steps

1. **Tyler Stewart**: Refresh your browser page (F5)
2. **Verify**: Check that the Dream Coach preview button (eye icon) appears
3. **Test**: Click the eye icon to preview the Dream Coach page

---

## Bug Fix - Hoisting Issue

**Issue**: `Cannot access 'refreshUserRole' before initialization`  
**Cause**: The `useEffect` hook was defined before the `refreshUserRole` function  
**Fix**: Moved the focus event listener `useEffect` to after `refreshUserRole` definition

---

**Implementation Date**: November 9, 2025  
**Status**: ✅ Complete - Fixed Hoisting Issue - Ready for Testing

