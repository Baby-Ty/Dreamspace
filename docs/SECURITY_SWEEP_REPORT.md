# DreamSpace Security Sweep Report

**Date:** January 14, 2026  
**Scope:** Full application security audit

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 2 | Requires immediate fix |
| 🟠 HIGH | 4 | Fix within this sprint |
| 🟡 MEDIUM | 3 | Plan for next sprint |
| 🟢 LOW | 2 | Technical debt |

---

## ✅ Security Strengths Found

Before diving into issues, these security practices are already in place:

1. **No secrets in repository** - `.gitignore` properly excludes `.env`, `local.settings.json`, and credential files
2. **SSRF protection** - Domain allowlists for external URL fetching in upload APIs
3. **Parameterized queries** - All Cosmos DB queries use parameterized inputs (no NoSQL injection)
4. **JWT token validation** - Proper JWKS-based validation with audience/issuer checks
5. **Rate limiting implemented** - Per-endpoint rate limits in `rateLimiter.js`
6. **Authentication middleware** - Centralized auth with role-based access control
7. **File upload validation** - Magic byte detection and image compression
8. **Session storage** - Tokens stored in sessionStorage (not localStorage) reducing XSS impact

---

## 🔴 CRITICAL ISSUES

### 1. Wildcard CORS in Static Web App Config

**File:** `public/staticwebapp.config.json`

**Issue:** The public-facing config uses wildcard (`*`) CORS while the API middleware uses a specific origin. This creates:
- Security mismatch between frontend and backend
- Potential credential leakage if credentials are ever enabled
- Cross-site attack surface

**Current (INSECURE):**
```json
"globalHeaders": {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

**Fix (SECURE):**
```json
"globalHeaders": {
  "Access-Control-Allow-Origin": "https://dreamspace.tylerstewart.co.za",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
}
```

**Priority:** P0 - Fix immediately

---

### 2. Missing Security Headers

**Files:** `staticwebapp.config.json`, `api/utils/apiWrapper.js`

**Issue:** No browser security headers configured, leaving users vulnerable to:
- Clickjacking (missing X-Frame-Options)
- MIME-type sniffing attacks (missing X-Content-Type-Options)
- XSS attacks (missing Content-Security-Policy)
- Downgrade attacks (missing Strict-Transport-Security)

**Fix - Add to `staticwebapp.config.json`:**
```json
"globalHeaders": {
  "Access-Control-Allow-Origin": "https://dreamspace.tylerstewart.co.za",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://login.microsoftonline.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://*.blob.core.windows.net https://api.openai.com; frame-ancestors 'none';"
}
```

**Priority:** P0 - Critical for production

---

## 🟠 HIGH SEVERITY ISSUES

### 3. Error Message Information Leakage

**File:** `api/utils/apiWrapper.js:248-270`

**Issue:** Internal error messages and stack details are exposed to clients, potentially revealing:
- Database schema information
- Internal paths and configuration
- Third-party service details

**Current (LEAKY):**
```javascript
context.res = {
  status: 500,
  body: JSON.stringify({
    error: 'Internal server error',
    details: error.message || 'An unexpected error occurred'  // Leaks internal info
  }),
  headers
};
```

**Fix (SAFE):**
```javascript
// Only expose details in non-production environments
const isProduction = process.env.NODE_ENV === 'production' || 
                     !process.env.AZURE_FUNCTIONS_ENVIRONMENT?.includes('Development');

context.res = {
  status: 500,
  body: JSON.stringify({
    error: 'Internal server error',
    ...(isProduction ? {} : { details: error.message }),
    requestId: context.invocationId  // For support debugging
  }),
  headers
};
```

**Priority:** P1

---

### 4. In-Memory Rate Limiting Won't Scale

**File:** `api/utils/rateLimiter.js`

**Issue:** Rate limiting uses in-memory Map that:
- Resets on every function restart
- Doesn't share state across multiple instances
- Can be bypassed by distributed attacks

**Current Implementation:**
```javascript
const rateLimitStore = new Map();  // Lost on restart, not shared
```

**Recommendation:**
For Azure Static Web Apps (single instance), this is acceptable but should be documented. For production scaling:

1. **Quick Fix:** Add warning comment and monitoring:
```javascript
// WARNING: In-memory rate limiting - adequate for single-instance Azure Static Web Apps
// For multi-instance deployments, migrate to Azure Cache for Redis
const rateLimitStore = new Map();
```

2. **Scalable Fix:** Use Azure Cache for Redis (requires infrastructure change)

**Priority:** P1 - Document limitation or implement Redis

---

### 5. Missing Input Validation Schemas

**Issue:** API endpoints lack formal input validation, relying on ad-hoc checks that may miss edge cases.

**Example (Current):**
```javascript
if (!userSearchTerm || typeof userSearchTerm !== 'string' || !userSearchTerm.trim()) {
  throw { status: 400, message: 'userSearchTerm is required' };
}
```

**Recommended Fix:** Add Zod or Joi validation

```bash
cd api && npm install zod
```

**Example Schema:**
```javascript
const { z } = require('zod');

const generateImageSchema = z.object({
  userSearchTerm: z.string().min(1).max(500),
  options: z.object({
    size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
    quality: z.enum(['standard', 'high']).default('high'),
    model: z.string().default('gpt-image-1-mini'),
    imageType: z.enum(['dream', 'background_card']).default('dream'),
    styleModifierId: z.string().nullable().optional(),
    customStyle: z.string().max(1000).nullable().optional()
  }).optional()
});

// In handler:
const validated = generateImageSchema.parse(req.body);
```

**Priority:** P1 - Add to security-critical endpoints first

---

### 6. Public Blob Storage Containers

**Files:** `uploadDreamPicture/index.js:186-188`, `uploadUserBackgroundImage/index.js:163-165`

**Issue:** Blob containers are created with public read access:
```javascript
await containerClient.createIfNotExists({
  access: 'blob'  // Public read access for blobs
});
```

**Risk:** Anyone with the URL can access user images. While this may be intentional for image delivery, consider:

**Safer Alternative (if public access needed):**
- Use Azure CDN with signed URLs
- Or SAS tokens with expiration for temporary access

**Acceptable if:** Public URLs are intentional and images don't contain sensitive data.

**Priority:** P1 - Verify this is intentional and document the decision

---

## 🟡 MEDIUM SEVERITY ISSUES

### 7. CORS Origin Not Environment-Configurable

**File:** `api/utils/authMiddleware.js:25, 216-223`

**Issue:** CORS uses a single `ALLOWED_ORIGIN` environment variable, but different environments (dev, staging, production) need different origins.

**Current:**
```javascript
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    // ...
  };
}
```

**Fix - Support Multiple Origins:**
```javascript
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '').split(',');

function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) 
    ? requestOrigin 
    : ALLOWED_ORIGINS[0];
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'  // Important for caching
  };
}
```

**Environment Variable Example:**
```
ALLOWED_ORIGINS=https://dreamspace.tylerstewart.co.za,http://localhost:5173
```

**Priority:** P2

---

### 8. Environment Variable Validation Gaps

**Issue:** Some environment variables are checked at runtime but don't fail fast at startup.

**Files with gaps:**
- `api/utils/cosmosProvider.js` - Good (fails fast)
- `api/utils/authMiddleware.js` - Console.error only, doesn't prevent startup
- `api/generateImage/index.js` - Checks per-request, not at startup

**Fix - Add startup validation in `api/index.js`:**
```javascript
// api/index.js - Add environment validation
const REQUIRED_ENV = [
  'COSMOS_ENDPOINT',
  'COSMOS_KEY',
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'ALLOWED_ORIGIN'
];

const OPTIONAL_ENV = [
  'OPENAI_API_KEY',           // Required only for image generation
  'AZURE_STORAGE_CONNECTION_STRING'  // Required only for uploads
];

// Fail fast on missing required variables
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Warn about optional variables
OPTIONAL_ENV.forEach(key => {
  if (!process.env[key]) {
    console.warn(`⚠️ Optional environment variable not set: ${key}`);
  }
});
```

**Priority:** P2

---

### 9. HTTPS Protocol Check in URL Fetching

**File:** `api/uploadDreamPicture/index.js:37-39`

**Issue:** The `isUrlAllowed` function requires HTTPS, but the `fetchImageFromUrl` function still imports and could use HTTP:

```javascript
const http = require('http');  // Should be removed
const https = require('https');

// In fetchImageFromUrl:
const client = urlObj.protocol === 'https:' ? https : http;  // HTTP fallback
```

**Fix:**
```javascript
// Remove http import entirely
const https = require('https');

function fetchImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    if (!isUrlAllowed(url)) {
      reject(new Error('URL not allowed'));
      return;
    }
    
    // Only use HTTPS (isUrlAllowed already validates protocol)
    https.get(url, (res) => {
      // ...
    });
  });
}
```

**Priority:** P2

---

## 🟢 LOW SEVERITY ISSUES

### 10. Verbose Logging in Production

**Issue:** Some endpoints log sensitive-ish data (user IDs, email addresses) which could end up in log aggregators.

**Recommendation:** Use structured logging with PII redaction for production:
```javascript
context.log(`Token validated for user: ${user.email.substring(0, 3)}***`);
```

**Priority:** P3

---

### 11. Daily Usage Tracking Resets on Restart

**File:** `api/generateImage/index.js:19-24`

**Issue:** In-memory daily usage tracking resets when the function restarts, allowing users to exceed daily limits.

**Current:**
```javascript
const dailyUsage = {
  date: new Date().toISOString().split('T')[0],
  users: new Map(),  // Lost on restart
  total: 0
};
```

**Fix:** Store usage in Cosmos DB or Redis for persistence. However, since these are soft limits for cost control (not security), this is low priority.

**Priority:** P3

---

## CSRF Protection Assessment

**Status:** ✅ Not Required

This application uses:
- JWT Bearer tokens in Authorization header (not cookies)
- SameSite cookie settings via MSAL
- Single-page application architecture

CSRF attacks require cookie-based authentication, which this app doesn't use for API calls. The MSAL library handles its own CSRF protections for the OAuth flow.

---

## Unsafe Redirects Assessment

**Status:** ✅ Low Risk

Redirects found are:
- Post-login redirects to `window.location.origin` (safe - same origin)
- Navigation via React Router (safe - client-side only)
- MSAL OAuth redirects to configured URIs (safe - whitelist controlled)

No user-controlled URL redirects were found.

---

## Quick Fix Checklist

### Immediate Actions (Today)

1. [ ] Fix `public/staticwebapp.config.json` - Replace wildcard CORS with specific origin
2. [ ] Add security headers to `staticwebapp.config.json`

### This Week

3. [ ] Modify `apiWrapper.js` to hide error details in production
4. [ ] Add startup environment validation in `api/index.js`
5. [ ] Remove `http` import from upload functions (keep HTTPS only)
6. [ ] Document rate limiting limitations

### Next Sprint

7. [ ] Add Zod/Joi input validation to security-critical endpoints
8. [ ] Implement multi-origin CORS support
9. [ ] Review blob storage access policies

---

## Environment Variable Checklist

Ensure these are set in production Azure Functions App Settings:

```
# Required
COSMOS_ENDPOINT=<cosmos-account>.documents.azure.com
COSMOS_KEY=<primary-key>
AZURE_TENANT_ID=<tenant-guid>
AZURE_CLIENT_ID=<app-registration-client-id>
ALLOWED_ORIGIN=https://dreamspace.tylerstewart.co.za
REQUIRE_AUTH=true  # CRITICAL - must be true in production

# Optional (feature-dependent)
OPENAI_API_KEY=<key>
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
```

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
- [MSAL Security Considerations](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-security-considerations)
