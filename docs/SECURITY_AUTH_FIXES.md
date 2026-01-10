# Security Auth Fixes - API Endpoints

**Date:** 2026-01-10  
**Status:** ✅ COMPLETED

## Summary

Added authentication checks to 3 API endpoints that were missing auth protection. This closes critical security vulnerabilities that could have exposed sensitive coaching and team data.

## Changes Made

### 1. `/api/getCoachingAlerts/{managerId}` - CRITICAL FIX

**File:** `api/getCoachingAlerts/index.js`

**Vulnerability:** 
- Anyone could access coaching alerts for any manager without authentication
- Exposed sensitive team member data (scores, activity levels, dream counts)

**Fix Applied:**
```javascript
const { requireAuth, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// AUTH CHECK: Authenticated users only
if (isAuthRequired()) {
  const user = await requireAuth(context, req);
  if (!user) return; // 401 already sent
  context.log(`User ${user.email} accessing coaching alerts for ${managerId}`);
}
```

**Protection Level:**
- ✅ Requires authentication (Entra ID token)
- ✅ All authenticated users can access (consistent with other endpoints)

---

### 2. `/api/getTeamRelationships` - CRITICAL FIX

**File:** `api/getTeamRelationships/index.js`

**Vulnerability:**
- Anyone could retrieve ALL team relationships in the system
- Exposed complete organizational structure and team membership

**Fix Applied:**
```javascript
const { requireAuth, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// AUTH CHECK: Authenticated users only (needed for People Hub)
if (isAuthRequired()) {
  const user = await requireAuth(context, req);
  if (!user) return; // 401 already sent
  context.log(`User ${user.email} accessing team relationships`);
}
```

**Protection Level:**
- ✅ Requires authentication (Entra ID token)
- ✅ All authenticated users can access (needed for People Hub feature)

---

### 3. `/api/refreshAllUsers` - HIGH PRIORITY FIX

**File:** `api/refreshAllUsers/index.js`

**Vulnerability:**
- Anyone could trigger bulk updates to all user profiles
- Could modify user names, emails, and other profile data

**Fix Applied:**
```javascript
const { requireAuth, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// AUTH CHECK: Authenticated users only
if (isAuthRequired()) {
  const user = await requireAuth(context, req);
  if (!user) return; // 401 already sent
  context.log(`User ${user.email} refreshing all users`);
}
```

**Protection Level:**
- ✅ Requires authentication (Entra ID token)
- ✅ All authenticated users can access (consistent with other endpoints)

---

## Additional Security Improvements

All three endpoints now also use `getCorsHeaders()` from the auth middleware, which:
- ✅ Uses configured `ALLOWED_ORIGIN` instead of wildcard `*`
- ✅ Properly sets `Access-Control-Allow-Credentials: true`
- ✅ Restricts allowed methods and headers

---

## Authentication Strategy

**Design Decision:** This application uses a simplified authentication model where all authenticated users (those with valid Entra ID tokens) can access all endpoints. Role-based access control is not implemented at the API level, keeping the security model simple and consistent across all endpoints.

This approach:
- ✅ Prevents unauthorized access (requires valid token)
- ✅ Consistent with existing endpoint patterns
- ✅ Simpler to maintain (no role configuration needed)
- ✅ Suitable for internal team applications where all users are trusted

---

## Testing Checklist

Before deploying to production, verify:

- [ ] `REQUIRE_AUTH=true` is set in Azure Function App settings
- [ ] Test unauthenticated requests return 401
- [ ] Test authenticated requests return expected data (200)

## Related Security Audit

See the security test plan for complete security validation checklist before launch.

## Remaining Security Tasks

1. **P0:** Verify `REQUIRE_AUTH=true` in production (5 min)
2. **P0:** Fix wildcard CORS in `staticwebapp.config.json` (10 min)
3. **P2:** Review all ~50 API endpoints for consistent auth patterns (1 hour)

---

## Deployment Notes

**Files Modified:**
- `api/getCoachingAlerts/index.js`
- `api/getTeamRelationships/index.js`
- `api/refreshAllUsers/index.js`

**No Breaking Changes:** 
- Existing authenticated users will continue to work normally
- Only blocks unauthenticated access (which shouldn't exist in production)

**Deployment Command:**
```bash
git add api/getCoachingAlerts/index.js api/getTeamRelationships/index.js api/refreshAllUsers/index.js docs/
git commit -m "security: add authentication to 3 unprotected endpoints

- getCoachingAlerts: require authentication
- getTeamRelationships: require authentication
- refreshAllUsers: require authentication

Fixes critical vulnerabilities where sensitive data was accessible without auth."
git push
```

**Verify Deployment:**
```bash
# Should return 401 without token
curl https://func-dreamspace-prod.azurewebsites.net/api/getCoachingAlerts/test-user

# Should return 200 with valid token
curl https://func-dreamspace-prod.azurewebsites.net/api/getCoachingAlerts/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```
