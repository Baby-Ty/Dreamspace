# DreamSpace - Solutions Architecture Cheat Sheet

**Purpose**: Executive-level reference for architecture reviews and technical discussions  
**Audience**: CTO, Head of Engineering, Solutions Architects  
**Last Updated**: January 2026

---

## 1. Authentication

### Anchor Statement
"We use Azure AD (Entra ID) with MSAL for SSO, ensuring all Netsurit employees authenticate through their existing corporate identity."

### High-Level Flow
- User visits app → MSAL initiates Azure AD login flow
- Azure AD validates credentials → issues JWT token (id_token)
- Frontend stores token in session storage
- All API calls include `Authorization: Bearer {token}` header
- Backend validates JWT signature against Azure's JWKS endpoint
- Token verified against configured tenant and client IDs

### Key Decisions & Rationale
**Why Azure AD with MSAL?**
- Zero additional credential management - uses existing Netsurit SSO
- Enterprise-grade security with MFA/conditional access
- No password storage or management burden
- Native integration with Microsoft Graph for calendar/profile data

**Why sessionStorage vs localStorage?**
- Tokens clear on browser close - better security posture
- Prevents token persistence across sessions
- Reduces risk of XSS-based token theft

### Risks / Trade-offs
- **Dependency on Azure AD availability**: If Azure AD is down, entire app is inaccessible
- **Session-based tokens**: Users must re-authenticate on browser close (intentional security choice)
- **No offline mode**: Authentication requires network connectivity
- **Token expiration**: 1-hour default lifetime requires silent token refresh (handled by MSAL)

### Future Improvements
- Implement refresh token rotation for longer sessions
- Add telemetry for authentication failure patterns
- Consider certificate-based authentication for service accounts

### Where This Lives (Navigation)
**Frontend:**
- `src/auth/authConfig.js` - MSAL configuration (tenant, client IDs, scopes)
- `src/auth/AuthProvider.jsx` - React context wrapper for MSAL
- `src/services/apiClient.js` - Token injection into API calls (line 45-64)
- `src/pages/Login.jsx` - Login UI and redirect handling

**Backend:**
- `api/utils/authMiddleware.js` - JWT validation (line 98-143)
  - `validateToken()` function verifies JWT against Azure's signing keys
  - Uses JWKS client for key rotation support
  - Validates audience (client ID) and issuer (tenant ID)

**Configuration:**
- Frontend: `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID` (src/utils/env.js)
- Backend: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` (Azure Functions App Settings)

**Why Here?**
- Authentication is infrastructure-level concern, isolated from business logic
- Middleware pattern allows injection into any API endpoint

---

## 2. Authorization & Roles

### Anchor Statement
"We implement role-based access control with three tiers—User, Coach, and Admin—stored in Cosmos DB user profiles, not Azure AD, giving us operational flexibility without directory changes."

### High-Level Flow
- After JWT validation, backend queries Cosmos DB `users` container
- User document contains `roles: { admin: bool, coach: bool }` flags
- Team managers automatically receive coach privileges (dynamic elevation)
- API endpoints declare required role via wrapper: `auth: 'user'|'coach'|'admin'|'user-access'`
- Middleware enforces role before business logic executes
- Failed authorization returns HTTP 403 with CORS headers

### Key Decisions & Rationale
**Why Cosmos DB roles vs Azure AD App Roles?**
- Operational agility: Promote users instantly without Azure AD change tickets
- Separation of concerns: Identity vs application permissions
- Dynamic elevation: Team managers inherit coach privileges automatically
- Simpler audit trail: Role changes tracked in application database

**Why `user-access` pattern?**
- Enables data isolation: Users can only access their own data
- Coaches can access their team members' data
- Admins have unrestricted access
- Prevents horizontal privilege escalation

### Risks / Trade-offs
- **Race condition on role changes**: 5-second cache in authMiddleware (acceptable for non-critical operations)
- **No centralized audit**: Role changes aren't in Azure AD audit logs
- **Team manager privilege**: Any team manager = coach access (intentional for operational simplicity)
- **In-flight requests**: Role revocation doesn't affect active API calls (stateless auth)

### Future Improvements
- Add role change audit log to separate container
- Implement time-based role grants (temporary admin access)
- Add granular permissions (e.g., read-only coach)

### Where This Lives (Navigation)
**Backend:**
- `api/utils/authMiddleware.js` (line 145-200) - Role lookup and validation
  - `getUserRole()` - Queries Cosmos DB for roles + team manager status
  - `requireAdmin()`, `requireCoach()`, `requireUserAccess()` - Role enforcement functions
  - `checkTeamMembership()` (line 316-354) - Validates coach-to-member relationships
  - `areUsersInSameTeam()` (line 364-402) - Team membership validation

**Data Model:**
- `users` container: `{ roles: { admin: bool, coach: bool }, isCoach: bool }`
- `teams` container: `{ managerId: string, teamMembers: string[] }`

**API Wrapper:**
- `api/utils/apiWrapper.js` (line 122-172) - Role enforcement integration
  - Configurable per-endpoint: `{ auth: 'user-access', targetUserIdParam: 'body.userId' }`

**Why Here?**
- Authorization is cross-cutting concern, enforced before any business logic
- Middleware pattern ensures consistent enforcement across 47+ API endpoints

---

## 3. Data Isolation & Multi-Tenancy

### Anchor Statement
"We achieve hard data isolation through Cosmos DB partition keys—every query scopes to userId or managerId—ensuring users cannot access data outside their authorization boundary, even with a compromised token."

### High-Level Flow
- Each container has partition key: `/userId` (user data) or `/managerId` (team data)
- All queries include partition key in WHERE clause: `WHERE c.userId = @userId`
- Repository pattern enforces partition key inclusion
- Frontend never sends queries directly—all data access via backend APIs
- Backend validates requesting user matches target userId (or has coach/admin role)

### Key Decisions & Rationale
**Why partition by userId?**
- Cosmos DB performance: Partition key queries = 1 RU, cross-partition = expensive
- Security: Physical data isolation, not just logical filtering
- Cost optimization: Shared throughput (400 RU pool) works efficiently with partitioning
- Scale: Automatic distribution as user base grows

**Why 10-container architecture?**
- Each data type has different access patterns and partition keys
- Prevents hot partitions (e.g., `prompts` container uses `/partitionKey` for singleton data)
- Enables granular permission management (future-proofing)

### Risks / Trade-offs
- **Cross-user queries are expensive**: People dashboard requires multiple partition queries (mitigated by caching)
- **Team data partitioned by managerId**: If coach changes, team data must migrate partitions (handled by `replaceTeamCoach` API)
- **No global analytics**: Cross-partition aggregations require backend processing (intentional security choice)
- **Container sprawl**: 10 containers increase operational complexity

### Future Improvements
- Add Redis cache for frequently accessed cross-partition data (People dashboard)
- Implement materialized views for team-wide analytics
- Consider hierarchical partition keys for larger teams (currently single-level)

### Where This Lives (Navigation)
**Backend Repositories:**
- `api/utils/repositories/BaseRepository.js` - Base class with partition key utilities
- `api/utils/repositories/UserRepository.js` - User profile access (partitioned by userId)
- `api/utils/repositories/DreamsRepository.js` - Dreams data (partitioned by userId)
- `api/utils/repositories/TeamsRepository.js` - Team relationships (partitioned by managerId)
- `api/utils/repositories/WeeksRepository.js` - Weekly goals (partitioned by userId)

**Container Configuration:**
- `api/utils/cosmosProvider.js` (line 26-77) - CONTAINER_CONFIG object
  - Maps logical names to partition keys
  - Documents why each container uses specific partition strategy

**API Enforcement:**
- `api/utils/authMiddleware.js` (line 411-447) - `requireUserAccess()` function
  - Validates requester can access target userId's data
  - Checks admin role OR self-access OR coach-team relationship OR same-team membership

**Example Queries:**
- `api/getItems/index.js` (line 50-55) - Shows partition key usage in SQL queries
- All queries include: `WHERE c.userId = @userId` with partition key parameter

**Why Here?**
- Repository pattern centralizes partition key logic
- Prevents accidental cross-partition queries
- Authmiddleware ensures authorization before repository access

---

## 4. Frontend ↔ Backend Contract

### Anchor Statement
"We enforce a strict ok/fail response pattern with typed services—all API calls return `{ success: bool, data?, error? }`—ensuring predictable error handling and eliminating raw fetch calls in UI components."

### High-Level Flow
- UI components call service methods (never fetch directly)
- Services inherit from `BaseService` class
- `BaseService.handleApiRequest()` wraps all API calls
- `apiClient` singleton injects auth tokens automatically
- Backend returns JSON: `{ success: true, data: {...} }` or `{ error: 'message' }`
- Frontend transforms to ok/fail pattern: `return ok(data)` or `return fail(code, message)`
- UI components handle: `if (!result.success) { show error }`

### Key Decisions & Rationale
**Why ok/fail pattern vs throw/catch?**
- Explicit error handling: Forces developers to handle failures
- Type safety: Predictable response shape across all services
- No silent failures: Errors must be explicitly checked
- Testability: Easy to mock success/failure cases

**Why centralized apiClient?**
- Single source of truth for API base URL (production vs dev)
- Automatic token injection on every request
- Consistent error logging (401/403 detection)
- No credential leakage (tokens never in component code)

**Why BaseService abstraction?**
- DRY principle: Common request/response handling in one place
- Consistent error transformation (HTTP status → ErrorCode enum)
- Eliminates 200+ lines of boilerplate across 21 service files

### Risks / Trade-offs
- **Learning curve**: Developers must understand ok/fail pattern (mitigated by consistent examples)
- **Verbosity**: Every API call has ~5 lines of error handling (acceptable for reliability)
- **No streaming**: Request/response pattern doesn't support WebSockets (not needed currently)

### Future Improvements
- Add request/response interceptors for global error handling
- Implement automatic retry for transient failures (network blips)
- Add request deduplication for rapid-fire calls

### Where This Lives (Navigation)
**Frontend:**
- `src/services/apiClient.js` - Singleton API client with token injection
  - `setTokenGetter()` (line 28-31) - Called by AuthProvider after login
  - `_getAuthHeaders()` (line 45-64) - Acquires token, injects Bearer header
  - `fetch()` method (line 72-94) - Wraps native fetch with auth + error logging

- `src/services/BaseService.js` - Abstract base for all services
  - `handleApiRequest()` (line 41-80) - Standard request/response wrapper
  - `handleErrorResponse()` (line 88-127) - HTTP status → ok/fail transformation
  - `validateParams()` (line 135-142) - Input validation helper

- `src/utils/errorHandling.js` - ok/fail pattern implementation
  - `ok(data)` (line 4-6) - Success response builder
  - `fail(code, message)` (line 11-20) - Error response builder

**Backend:**
- `api/utils/apiWrapper.js` - Standard endpoint wrapper
  - `createApiHandler()` (line 56-220) - Wraps business logic with auth/CORS/error handling
  - `handleError()` (line 238-291) - Consistent error response formatting
  - Production mode hides internal error details (security)

**Example Service:**
- `src/services/itemService.js` - Shows ok/fail pattern in practice
- `src/services/databaseService.js` - Shows BaseService usage

**API Contract:**
- All APIs return JSON with this shape:
  - Success: `{ <data fields> }` or `{ success: true, data: {...} }`
  - Error: `{ error: 'message', details?: 'details', requestId: 'guid' }`

**Why Here?**
- Services are data layer, isolated from UI concerns
- ApiClient handles infrastructure (auth, base URL)
- BaseService handles common patterns (error transform)
- Business logic stays in specific service methods

---

## 5. Error Handling & Failure Modes

### Anchor Statement
"We fail gracefully with layered defenses—frontend validation with Zod, API-level error boundaries, database retry logic, and user-facing toast notifications—ensuring users always know what went wrong and what to do next."

### High-Level Flow
1. **Frontend validation** - Zod schemas validate input before API call
2. **API authentication** - 401/403 errors redirect to login or show permission denied
3. **Rate limiting** - 429 errors show "Try again in X seconds"
4. **Database errors** - 404 = not found, 500 = internal error (details hidden in production)
5. **UI error display** - Toast notifications with actionable messages
6. **Fallback states** - Null/empty states for missing data (not crashes)

### Key Decisions & Rationale
**Why Zod for validation?**
- Type-safe schemas prevent bad data from reaching backend
- Runtime validation catches edge cases TypeScript can't
- Single source of truth for data shapes (schema reuse)

**Why toast notifications vs inline errors?**
- Non-blocking: User can continue working while error displays
- Consistent location: All errors appear in same place
- Auto-dismiss: Doesn't require user action to clear

**Why hide error details in production?**
- Security: Prevents information leakage (database structure, API keys, etc.)
- User experience: Technical stack traces confuse non-technical users
- Observability: Full errors logged server-side with request IDs

### Risks / Trade-offs
- **Lost context on retry**: If user refreshes after error, operation state is lost (intentional—no dirty state)
- **No error recovery**: Some operations (e.g., file uploads) cannot be retried automatically
- **Request IDs not user-visible**: Users cannot easily report "request XYZ failed" (future: show IDs in error modal)

### Future Improvements
- Add error boundary components for catastrophic React failures
- Implement offline queue for mutations (IndexedDB)
- Add Sentry or Application Insights for error aggregation

### Where This Lives (Navigation)
**Frontend:**
- `src/schemas/*.js` - Zod validation schemas (11 files)
  - Example: `src/schemas/dreamSchema.js` validates dream creation/updates
  - Prevents invalid data from reaching API

- `src/utils/errorHandling.js` - ok/fail pattern + error utilities
  - `toErrorMessage(e)` (line 25-31) - Extracts human-readable message from various error shapes

- `src/utils/handleServiceError.js` - Service layer error handler
  - Transforms API errors → toast notifications
  - Maps HTTP status codes → user-friendly messages

- `src/utils/toast.js` - Toast notification system
  - `showError()`, `showSuccess()`, `showInfo()` - User feedback

**Backend:**
- `api/utils/apiWrapper.js` - Centralized error handling
  - `handleError()` (line 238-291) - Formats all API errors consistently
  - `isProduction()` (line 226-230) - Determines error detail visibility
  - Cosmos DB 404 errors handled gracefully (returns null, not crash)

- `api/utils/rateLimiter.js` - Rate limit enforcement
  - Returns 429 with `Retry-After` header
  - Per-endpoint limits (e.g., 10 req/min for AI generation)

**Error Codes:**
- `src/constants/errors.js` - Standardized error codes
  - `ERR.NETWORK`, `ERR.AUTH`, `ERR.VALIDATION`, `ERR.UNKNOWN`
  - Maps HTTP status codes to error categories

**Health Check:**
- `api/health/index.js` - Diagnostic endpoint
  - Tests Cosmos DB connectivity
  - Returns 200/503 with component health status
  - Used by monitoring systems and debug panels

**Why Here?**
- Validation at entry points (schemas) prevents bad data early
- Error handler middleware catches all API failures consistently
- Toast system provides single channel for user feedback
- Health check enables proactive monitoring

---

## 6. Security Posture

### Anchor Statement
"We implement defense-in-depth—HTTPS everywhere, Azure AD authentication, token-based API authorization, CORS restrictions, rate limiting, and zero secrets in frontend code—resulting in a security model suitable for enterprise sensitive data."

### High-Level Security Layers
1. **Transport**: HTTPS/TLS 1.2+ enforced by Azure Static Web Apps
2. **Authentication**: Azure AD JWT validation with JWKS key rotation
3. **Authorization**: Role-based access + data isolation via partition keys
4. **API Security**: CORS headers, rate limiting, input validation
5. **Secrets**: All keys (Cosmos, OpenAI) server-side only, never in frontend bundle
6. **Headers**: Security headers (X-Frame-Options, CSP, etc.) via staticwebapp.config.json

### Key Decisions & Rationale
**Why server-side API proxying for OpenAI?**
- Prevents API key exposure in browser
- Enables rate limiting and usage tracking
- Allows prompt template management without code changes

**Why CORS restrictions?**
- `ALLOWED_ORIGIN` environment variable limits valid origins
- Prevents unauthorized domains from calling APIs
- Reduces CSRF attack surface

**Why rate limiting?**
- Prevents abuse of expensive operations (AI image generation)
- Protects against credential stuffing attacks
- Limits blast radius of compromised accounts

### Risks / Trade-offs
- **In-memory rate limiting**: State lost on function restart (acceptable for soft limits)
- **No WAF**: Static Web Apps don't include WAF (mitigated by Azure Front Door if needed)
- **Session storage tokens**: Lost on browser close (intentional trade-off for security)
- **Single-instance deployment**: Rate limiting not shared across instances (acceptable for current scale)

### Future Improvements
- Migrate rate limiting to Azure Cache for Redis (multi-instance shared state)
- Add Azure Front Door with WAF for DDoS protection
- Implement Content Security Policy (CSP) headers
- Add rate limiting per-user in Cosmos DB (persistent limits)

### Where This Lives (Navigation)
**Frontend Security:**
- `src/utils/env.js` - Environment variable validation
  - Lines 6-9: Security note about NOT including secrets (COSMOS_KEY, OPENAI_API_KEY)
  - Line 50: VITE_COSMOS_KEY removed for security
  - Line 61: VITE_OPENAI_API_KEY removed for security

- `staticwebapp.config.json` - HTTP security headers
  - Line 26-30: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

**Backend Security:**
- `api/utils/authMiddleware.js` - Authentication + authorization
  - `validateToken()` (line 98-143) - JWT signature validation
  - `requireAuth()`, `requireAdmin()`, `requireCoach()`, `requireUserAccess()` - Authorization gates

- `api/utils/apiWrapper.js` - CORS and request validation
  - `getCorsHeaders()` - Sets Access-Control-* headers
  - OPTIONS preflight handling (line 77-80)
  - REQUIRE_AUTH environment flag (defaults to true)

- `api/utils/rateLimiter.js` - Rate limiting
  - Per-endpoint limits (line 32-59)
  - AI endpoints: 10 req/min
  - Write endpoints: 30-60 req/min
  - Read endpoints: 60-120 req/min

- `api/generateImage/index.js` - API key proxying example
  - Line 126: `process.env.OPENAI_API_KEY` only accessible server-side
  - Daily limits: 25/user, 500/organization (line 37-69)

**Configuration:**
- Backend secrets in Azure Functions App Settings (not in code):
  - `COSMOS_ENDPOINT`, `COSMOS_KEY`
  - `OPENAI_API_KEY`
  - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`
  - `ALLOWED_ORIGIN`

**Why Here?**
- Secrets in Azure Functions App Settings (encrypted at rest, never in code)
- CORS enforcement at API layer (first line of defense)
- Security headers at static web app layer (browser enforcement)
- Rate limiting in middleware (before business logic)

---

## 7. Scalability & Performance

### Anchor Statement
"We optimize for cost-efficient scale through Cosmos DB shared throughput, partition key-aware queries, request caching, and serverless Azure Functions—currently running at $24/month with headroom for 10x growth."

### High-Level Architecture
- **Database**: Cosmos DB with 400 RU autoscale pool (shared across 10 containers)
  - Scales down to 40 RU when idle (cost savings)
  - Scales up to 400 RU under load (performance)
- **API**: Serverless Azure Functions (pay-per-execution)
  - Cold start optimized with light dependencies
  - Stateless handlers scale horizontally
- **Frontend**: Azure Static Web Apps with CDN
  - Global edge caching for HTML/CSS/JS
  - Zero-cost hosting tier

### Key Decisions & Rationale
**Why shared throughput vs dedicated per-container?**
- Cost: $24/month vs $325/month (93% savings)
- Efficiency: Most containers are idle most of the time
- Performance: 400 RU sufficient for current load (100+ concurrent users)

**Why partition keys?**
- Cosmos DB performance: Queries with partition key = 1 RU, without = 10-100 RU
- Example: `SELECT * FROM c WHERE c.userId = @userId` (1 RU) vs `SELECT * FROM c WHERE c.email = @email` (cross-partition, expensive)

**Why serverless Azure Functions?**
- Cost: Only pay for actual executions (no idle compute costs)
- Scale: Automatic horizontal scaling under load
- Simplicity: No server management, auto-patching

### Current Performance Characteristics
- **API latency**: p50 ~100ms, p95 ~500ms (measured via health endpoint)
- **Database latency**: p50 ~20ms, p95 ~100ms (Cosmos DB same-region)
- **Concurrent users**: Tested to 100+ simultaneous (current usage ~30-50)
- **Data volume**: ~50 users, ~500 dreams, ~1,000 weekly goals (room for 10x growth)

### Risks / Trade-offs
- **Shared throughput**: One noisy neighbor can starve others (mitigated by rate limiting)
- **Cold starts**: First request after idle can take 2-5 seconds (acceptable for non-real-time app)
- **No caching layer**: All requests hit Cosmos DB (future: add Redis for hot data)
- **Single-region deployment**: All data in one Azure region (no geo-redundancy yet)

### Future Improvements
- Add Azure Cache for Redis for frequently accessed data (People dashboard, prompts)
- Implement database connection pooling (reduce Cosmos DB connection overhead)
- Add Application Insights dashboards for p99 latency tracking
- Consider Cosmos DB multi-region writes for global users

### Where This Lives (Navigation)
**Database Configuration:**
- `api/utils/cosmosProvider.js` (line 26-77) - CONTAINER_CONFIG
  - Documents partition key strategy per container
  - Line 29: `users` partitioned by `/userId`
  - Line 36: `dreams` partitioned by `/userId`
  - Line 48: `teams` partitioned by `/managerId`

**Performance Patterns:**
- `api/utils/repositories/BaseRepository.js` - Base repository with performance utilities
  - `getContainer()` (line 26-36) - Container reference caching
  - `cleanMetadata()` (line 44-48) - Removes Cosmos metadata (reduces payload size)

- `src/utils/requestCache.js` - Client-side request caching
  - Prevents duplicate API calls for same data
  - TTL-based expiration (configurable per endpoint)

**Monitoring:**
- `api/health/index.js` - Health check endpoint
  - Measures Cosmos DB response time (line 51)
  - Returns 503 if database unhealthy

**Cost Optimization:**
- Shared throughput configured in Azure Portal (not in code)
- Autoscale between 40-400 RU (set in Cosmos DB settings)
- Azure Functions Consumption Plan (pay-per-execution)

**Rate Limiting:**
- `api/utils/rateLimiter.js` - Protects against runaway costs
  - AI endpoints: 10 req/min (expensive operations)
  - Write endpoints: 30-60 req/min
  - Read endpoints: 60-120 req/min

**Why Here?**
- Partition keys enforced in repository pattern (centralizes performance logic)
- Shared throughput configured at infrastructure level (Azure Portal)
- Rate limiting protects expensive operations (prevents cost spikes)
- Health check enables performance monitoring

---

## 8. AI / Automation Readiness

### Anchor Statement
"We expose AI capabilities through backend-proxied APIs with configurable prompts stored in Cosmos DB—enabling non-technical admins to tune AI behavior without code deployments, while maintaining cost controls through rate limiting."

### High-Level Flow
1. **Prompt Storage**: AI prompts stored in `prompts` container (Cosmos DB)
2. **Admin Configuration**: People Hub admin panel allows prompt editing + testing
3. **API Proxying**: Frontend calls backend `/generateImage` or `/generateVision`
4. **Prompt Injection**: Backend loads prompts, injects user input, calls OpenAI
5. **Rate Limiting**: Daily limits (25/user, 500/org) + per-minute throttling
6. **Response Processing**: Backend returns image URL or text, never raw API response

### Current AI Features
- **Dream Image Generation**: DALL-E via OpenAI GPT Image (line 224-237 in generateImage)
  - Configurable style modifiers (stylized, realistic, coastal, etc.)
  - Custom style text support
  - Prompt templates: `dreamPrompt`, `backgroundCardPrompt`

- **Vision Statement Generation**: GPT-4 text generation
  - Generates inspiring year vision statements
  - Polishes user-provided text
  - Integrates with user's dream data for personalization

- **Dream Connect Suggestions**: AI-powered colleague matching
  - Analyzes shared dream categories
  - Suggests connections based on interests

### Key Decisions & Rationale
**Why backend API proxying?**
- Security: API keys never exposed to browser
- Cost control: Enforce rate limits and daily caps
- Flexibility: Change AI models without frontend changes
- Observability: Track AI usage per user

**Why prompt configuration in Cosmos DB?**
- Agility: Update prompts without code deployments
- Versioning: History table tracks changes (revert if needed)
- Testing: Admin panel allows testing prompts before saving
- Access control: Only admins can modify prompts

**Why rate limiting?**
- Cost control: OpenAI charges per request (image gen = $0.04-0.08)
- Abuse prevention: Prevents users from exhausting daily budget
- Fair usage: Per-user limits ensure equitable access

### Risks / Trade-offs
- **In-memory daily limits**: Reset on function restart (acceptable for soft limits)
- **No request queuing**: 429 errors require manual retry (acceptable for non-critical operations)
- **OpenAI availability**: If OpenAI is down, AI features fail (no fallback)
- **Prompt injection risk**: User input sanitized but not fully bulletproof (mitigated by prompt structure)

### Future Improvements
- Add persistent rate limiting in Cosmos DB (survives restarts)
- Implement request queuing for 429 errors (automatic retry)
- Add fallback to cached/default images if OpenAI fails
- Track AI usage costs per user (chargeback model)
- Add Azure OpenAI Service as alternative to OpenAI API (better SLA, data residency)

### Where This Lives (Navigation)
**Backend AI APIs:**
- `api/generateImage/index.js` - Image generation via OpenAI
  - Line 37-78: Daily limit enforcement (25/user, 500/org)
  - Line 147-167: Prompt loading from Cosmos DB with fallback
  - Line 214-219: Prompt template + style modifier injection
  - Line 224-237: OpenAI API call with authentication

- `api/generateVision/index.js` - Text generation via GPT-4
  - Similar pattern to generateImage

**Prompt Management:**
- `api/getPrompts/index.js` - Fetch current prompt configuration
- `api/savePrompts/index.js` - Update prompts (admin only)
- `api/getPromptHistory/index.js` - View prompt version history
- `api/restorePrompt/index.js` - Revert to previous prompt version

- `api/utils/repositories/PromptsRepository.js` - Prompt CRUD operations
  - `getPrompts()` - Fetch active prompts
  - `upsertPrompts()` - Save new prompts with history
  - `getDefaultPrompts()` - Fallback if Cosmos DB unavailable

**Frontend:**
- `src/pages/people/PromptEditorSection.jsx` - Admin prompt editing UI
- `src/pages/people/PromptTestPanel.jsx` - Test prompts before saving
- `src/pages/people/prompt-fields/*.jsx` - Prompt field editors
  - `ImageGenerationSection.jsx` - Dream image prompts
  - `VisionGenerationSection.jsx` - Vision statement prompts
  - `StyleModifiersSection.jsx` - Style modifier management
  - `AILimitsSection.jsx` - Rate limit configuration

**Data Model:**
- `prompts` container (Cosmos DB):
  ```
  {
    id: 'active',
    partitionKey: 'prompts',
    imageGeneration: {
      dreamPrompt: 'string',
      backgroundCardPrompt: 'string'
    },
    styleModifiers: {
      stylized_digital: { modifier: 'string' },
      vibrant_coastal: { modifier: 'string' },
      ...
    },
    aiLimits: {
      imageGeneration: { dailyLimitPerUser: 25, dailyLimitTotal: 500 }
    },
    modifiedBy: 'user@example.com',
    lastModified: 'ISO timestamp'
  }
  ```

**Rate Limiting:**
- `api/generateImage/index.js` (line 19-77) - In-memory daily usage tracking
  - `checkDailyLimit()` - Validates per-user and organization limits
  - `recordUsage()` - Increments counters on success

**Why Here?**
- Backend proxying keeps API keys secure
- Cosmos DB storage enables non-code changes
- Admin UI in People Hub (natural location for admin functions)
- Rate limiting at API layer (before expensive operations)

---

## Navigation Quick Reference

### Key Entry Points
**Authentication Flow:**
1. `src/pages/Login.jsx` - User lands here
2. `src/auth/AuthProvider.jsx` - MSAL initialization
3. `api/utils/authMiddleware.js` - Backend token validation

**API Request Flow:**
1. UI component calls service (e.g., `itemService.getItems()`)
2. `src/services/BaseService.js` - Wraps request with error handling
3. `src/services/apiClient.js` - Injects auth token
4. `api/[endpoint]/index.js` - Backend handler
5. `api/utils/apiWrapper.js` - Auth/CORS/error middleware
6. `api/utils/repositories/` - Database operations

**Data Flow:**
1. `src/context/AppProvider.jsx` - Global state initialization
2. `src/hooks/use[Feature].js` - Feature-specific data hooks
3. `src/services/[feature]Service.js` - API calls
4. Backend API → Cosmos DB via repositories

### Core Configuration Files
- **Frontend**: `src/utils/env.js` - Environment variables + validation
- **Backend**: `api/local.settings.json.example` - Template for secrets
- **Infrastructure**: `staticwebapp.config.json` - Static web app config (routing, headers)
- **Database**: `api/utils/cosmosProvider.js` - Container configuration

### Debugging Starting Points
- **Health Check**: Navigate to `/health` endpoint - tests API + DB connectivity
- **Network Errors**: Check `src/services/apiClient.js` console logs (token acquisition)
- **Auth Issues**: Check `api/utils/authMiddleware.js` logs (JWT validation failures)
- **Performance**: Check `api/health/index.js` response times

---

## Summary: What/Why/Where

**What**: Enterprise-grade React + Azure Functions app for goal tracking with AI features  
**Why**: Netsurit needed secure, scalable platform for employee engagement with zero IT overhead  
**Where**: Azure Static Web Apps (frontend) + Azure Functions (backend) + Cosmos DB (data) + OpenAI (AI)

**Key Strengths:**
- Zero credential management (Azure AD SSO)
- Hard data isolation (partition keys)
- Cost-optimized ($24/month database, serverless compute)
- Admin-configurable AI (no code deployments)
- Enterprise security posture (HTTPS, RBAC, rate limiting)

**Accepted Trade-offs:**
- Single-region deployment (no geo-redundancy)
- In-memory rate limiting (resets on restart)
- No offline mode (requires network)
- Session-based auth (re-login on browser close)

**Next Phase Candidates:**
- Azure Cache for Redis (persistent rate limiting + caching)
- Application Insights dashboards (observability)
- Multi-region Cosmos DB (geo-redundancy)
- Azure OpenAI Service (data residency + SLA)
