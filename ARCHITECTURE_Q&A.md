# DreamSpace - Architecture Q&A Guide

**Prepared answers for architecture reviews and technical discussions**

---

## Environment & Configuration

### Q: "Why Zod validation instead of just TypeScript?"

**Short Answer:**
"TypeScript validates at compile-time, but users can inject invalid environment variables at runtime. Zod catches configuration errors before the app runs—better to fail fast than serve a broken app."

**Detailed Answer:**
"TypeScript only validates code we write, not data coming from outside the system. Environment variables are injected at build time (Vite) or runtime (Azure Functions). If someone sets `VITE_AZURE_CLIENT_ID` to an invalid value, TypeScript won't catch it—the app will build successfully but fail at runtime when MSAL tries to use a malformed client ID.

Zod validates the actual runtime values against schemas: UUIDs for Azure IDs, URLs for endpoints, etc. We fail fast in development with a clear error message showing exactly what's misconfigured. In production, we log warnings but continue with fallbacks to prevent complete outages from configuration drift."

**File Reference:** `src/utils/env.js` (line 29-77 for schema, line 178-211 for validation)

---

### Q: "What happens if environment validation fails in production?"

**Short Answer:**
"We log the error but continue with fallback values. Development fails fast with a clear error. This prevents configuration mistakes from taking down production."

**Detailed Answer:**
"In development, validation failure throws an error and stops execution—forces developers to fix configuration before proceeding. In production, we log a detailed warning with the specific validation errors and continue with safe defaults where possible.

For example, if `VITE_COSMOS_ENDPOINT` is malformed, we log the error but the app still loads. API calls will fail gracefully with error messages instead of cryptic crashes. The alternative—hard failure in production—could mean a misconfigured environment variable takes down the entire app during a deployment.

We monitor these warnings via Application Insights (planned) to catch configuration drift before it becomes critical."

**Trade-off:** Configuration errors might not be caught immediately in production, but this is better than complete outages.

**File Reference:** `src/utils/env.js` (line 204-210)

---

### Q: "Why is domain detection based on hostname instead of environment variables?"

**Short Answer:**
"Multiple domains point to production—dreamspace.tylerstewart.co.za and dreams.netsurit.com. Hostname detection handles domain migrations without redeployment."

**Detailed Answer:**
"We maintain a whitelist of production hostnames. The app checks `window.location.hostname` at runtime and sets production mode if it matches. This solves two problems:

First, domain migrations. When moving from dreamspace.tylerstewart.co.za to dreams.netsurit.com, both domains work simultaneously during the cutover period. Just add the new domain to the whitelist, no code changes.

Second, it prevents production API URLs from being hardcoded. The same build artifacts work in staging (localhost) and production because the API URL is determined by hostname detection, not environment variables that require rebuilding.

For localhost, we use relative URLs (`/api`) which the dev proxy resolves. For production hostnames, we use absolute URLs to Azure Functions."

**File Reference:** `src/utils/env.js` (line 300-331)

---

### Q: "How do you handle environment variable changes without redeploying?"

**Short Answer:**
"Backend secrets can be updated in Azure App Settings without redeploy—changes take effect on next function execution. Frontend variables require rebuild because they're bundled at build time."

**Detailed Answer:**
"We have two types of configuration:

**Backend (Azure Functions):**
- Secrets stored in Azure App Settings (Cosmos keys, OpenAI keys, etc.)
- Changes via Azure Portal or ARM templates
- No redeployment needed—functions pick up new values on next cold start (usually within minutes)
- Zero downtime for secret rotation

**Frontend (React):**
- Build-time variables (VITE_*) bundled into JavaScript
- Changes require new build + deployment (~5 minutes via GitHub Actions)
- This is intentional—frontend config shouldn't change frequently

For frequently changing configuration (AI prompts, feature flags), we store in Cosmos DB. Admins change via UI, no deployment needed. That's why AI prompts are database-driven, not environment variables."

**Future:** Could add remote config service (Azure App Configuration) for dynamic frontend settings without rebuild.

**File Reference:** `src/utils/env.js` (all VITE_* variables), `api/utils/repositories/PromptsRepository.js` (dynamic config example)

---

## Architecture Decisions

### Q: "Why serverless instead of containerized apps (AKS/Kubernetes)?"

**Short Answer:**
"Cost and operational simplicity. Functions cost ~$5-10/month vs ~$200+/month for AKS, with zero container orchestration overhead."

**Detailed Answer:**
"We optimize for cost-efficient scale, not ultra-low latency:

**Azure Functions (current):**
- Pay-per-execution: 1M free, then $0.20 per million executions
- Current cost: ~$5-10/month for 30-50 active users
- Zero infrastructure management
- Auto-scales from 0 to 200 instances
- Trade-off: 2-5 second cold starts after idle

**AKS Alternative:**
- Minimum: 3 nodes × $70/month = $210/month baseline
- Plus container registry, load balancer, monitoring
- Requires Kubernetes expertise, YAML management, pod orchestration
- Benefit: No cold starts, more control

For our workload (goal tracking, not real-time transactions), occasional 2-second delays are acceptable. Users don't notice because most requests hit warm functions (sub-100ms). The $200/month savings and zero ops overhead justify the cold start trade-off.

If we reach 1,000+ concurrent users or need <100ms p99 latency guarantees, we'd revisit containers."

**Trade-off:** Cold starts vs cost. We chose cost.

---

### Q: "Why Cosmos DB instead of Azure SQL or PostgreSQL?"

**Short Answer:**
"Cosmos DB's partition key model gives us 1 RU queries and physical data isolation. SQL would require more complex row-level security and cost significantly more for the same isolation guarantees."

**Detailed Answer:**
"Three reasons:

**1. Partition-Based Isolation:**
- Cosmos DB physically isolates data by userId (partition key)
- Queries with partition key = 1 RU cost
- SQL queries without proper indexing = expensive table scans
- Even with SQL RLS (row-level security), all user data is in same table—harder to reason about security

**2. Cost Efficiency:**
- Cosmos DB: $24/month with shared throughput (400 RU)
- Azure SQL: Basic tier = $5/month but can't handle load, Standard = $100+/month
- Cosmos autoscales down to 40 RU when idle—SQL doesn't have equivalent

**3. Schema Flexibility:**
- Different item types (dreams, goals, connects) have different fields
- NoSQL allows flexible schema per document
- SQL would require nullable columns or complex EAV pattern

**Trade-offs:**
- No complex joins (we denormalize data)
- No ACID transactions across partitions (acceptable for our use case)
- SQL would be better for complex analytics queries

For user-scoped CRUD operations with isolation requirements, Cosmos DB is ideal. If we needed complex reporting or multi-table joins, SQL would be better."

**File Reference:** `api/utils/cosmosProvider.js` (line 26-77 container configs)

---

### Q: "How do you handle database schema evolution without migrations?"

**Short Answer:**
"Lazy migration pattern: code reads both old and new formats, transforms on read, writes in new format. Over time, all documents converge without downtime."

**Detailed Answer:**
"Schema-less doesn't mean no schema—it means flexible schema evolution:

**Pattern:**
1. **Add new field:** Code defaults to null if missing, no migration needed
2. **Rename field:** Read `oldField || newField`, always write `newField`
3. **Change structure:** Transform function converts old→new on read
4. **Remove field:** Stop writing, old documents remain (ignored)

**Example (hypothetical):**
```javascript
// Old format: { status: 'completed' }
// New format: { status: 'completed', completedAt: '2025-01-20' }

function readGoal(doc) {
  // Handle old documents without completedAt
  if (doc.status === 'completed' && !doc.completedAt) {
    doc.completedAt = doc.updatedAt; // Backfill from updatedAt
  }
  return doc;
}
```

Over weeks/months, all documents get rewritten in new format through normal updates.

**For breaking changes:** We run one-time migration scripts (see `scripts/migrateCosmosData.cjs`). These scan containers and transform documents. We run during low-traffic windows with backups.

**Trade-off:** Requires defensive coding (handle missing fields), but eliminates downtime for schema changes."

**File Reference:** `scripts/migrateCosmosData.cjs` (migration script example)

---

### Q: "What's your disaster recovery strategy?"

**Short Answer:**
"Cosmos DB automatic backups every 4 hours (30-day retention), plus manual JSON exports before major changes. RTO ~2 hours, RPO ~4 hours. Acceptable for non-critical goal-tracking app."

**Detailed Answer:**
"Multi-layered backup strategy:

**Automated (Azure):**
- Cosmos DB continuous backups (every 4 hours, 30-day retention)
- Restore via Azure Portal or support ticket
- RTO (Recovery Time Objective): ~2 hours for full restore
- RPO (Recovery Point Objective): Up to 4 hours data loss

**Manual (Application-Level):**
- Export scripts dump all containers to JSON (`scripts/exportCosmosData.cjs`)
- Run before major migrations or risky deployments
- Stored in `backups/` folder with timestamps
- Can restore specific containers without full database restore

**What We DON'T Have:**
- Geo-redundancy (single region: US East)
- Real-time replication
- Point-in-time restore for sub-hour granularity

**Disaster Scenarios:**

1. **Accidental deletion:** Restore from most recent manual backup (~5 min)
2. **Cosmos DB regional outage:** Wait for Azure recovery (no failover region)
3. **Data corruption:** Restore from automated backup (~2 hours)
4. **Complete Azure region failure:** Deploy to new region + restore from backup (~4-6 hours)

For a goal-tracking application (not financial transactions), 4-hour RPO is acceptable. Users can tolerate losing a few hours of goal updates. If we were handling financial data or critical operations, we'd add multi-region writes and sub-second replication."

**Future:** Multi-region Cosmos DB with automatic failover (adds ~$30/month)

**File Reference:** `scripts/exportCosmosData.cjs`, `scripts/checkAndRestoreDreams.cjs`

---

### Q: "Why proxy OpenAI instead of using Azure OpenAI Service?"

**Short Answer:**
"Initially went with OpenAI API for faster development. Azure OpenAI Service is on the roadmap—better SLA, data residency, and compliance. Migration is straightforward, just change the endpoint."

**Detailed Answer:**
"Current setup: Direct OpenAI API integration

**Why we started here:**
- Faster time-to-market (no Azure OpenAI approval process)
- Simpler initial setup
- Access to latest models immediately (GPT-4 Turbo, DALL-E 3)

**Why Azure OpenAI is better (and why we'll migrate):**
- **Data residency:** Data stays in Azure region, never leaves Microsoft network
- **Compliance:** HIPAA, SOC 2, GDPR-compliant (OpenAI API is less clear)
- **SLA:** 99.9% uptime guarantee vs best-effort for OpenAI API
- **Private networking:** VNet integration possible
- **Same API:** Almost identical endpoints (minimal code changes)

**Migration path:**
1. Request Azure OpenAI Service access (typically 1-2 weeks approval)
2. Change endpoint: `https://api.openai.com` → `https://{name}.openai.azure.com`
3. Update authentication: `Bearer {api-key}` → `api-key: {key}` header
4. Test prompts (models may have minor behavior differences)
5. Deploy (zero frontend changes—backend proxy hides implementation)

**Estimated effort:** 1 day for migration, 2-3 days for testing

**Why we haven't done it yet:** Current usage is low (~$10-20/month), not business-critical, and we're prioritizing other features. Once usage scales or compliance becomes critical, this becomes priority."

**File Reference:** `api/generateImage/index.js` (line 224-237 would change to Azure OpenAI endpoint)

---

## Security

### Q: "How do you prevent token replay attacks?"

**Short Answer:**
"Azure AD tokens are short-lived (1 hour) and validated against Azure's signing keys. We rely on Azure AD's built-in protections—token binding, HTTPS-only, and nonce validation."

**Detailed Answer:**
"Multiple layers of protection:

**1. Short Token Lifetime:**
- ID tokens expire after 1 hour (configurable in Azure AD)
- After expiration, MSAL automatically requests new token (silent refresh)
- Stolen tokens have limited window of usefulness

**2. HTTPS Enforcement:**
- All traffic over TLS 1.2+
- Tokens never transmitted over unencrypted connections
- Mitigates network sniffing attacks

**3. Token Validation:**
- Backend validates signature against Azure's JWKS endpoint
- Checks issuer (our tenant), audience (our client ID), expiration
- Forged tokens are rejected (can't fake signature without private key)

**4. Session Storage:**
- Tokens stored in sessionStorage, not localStorage
- Cleared on browser close (not persisted across sessions)
- Reduces risk of long-lived stolen tokens

**What We DON'T Have:**
- Refresh token rotation (MSAL handles this, but not with rotation)
- Token binding (not widely supported yet)
- Additional layer like mutual TLS

**Attack Scenarios:**

- **XSS steals token:** Possible, but we sanitize user input and use React's built-in XSS protection. Token expires in 1 hour max.
- **MITM captures token:** Prevented by HTTPS (attacker would need to break TLS)
- **Token replay from logs:** We don't log tokens (intentionally redacted in Application Insights)

For enterprise internal apps (not public internet), this is sufficient. If we were handling financial transactions or facing nation-state threats, we'd add device binding or certificate-based auth."

**File Reference:** `api/utils/authMiddleware.js` (line 98-143 token validation)

---

### Q: "What's your strategy if the Cosmos DB key is compromised?"

**Short Answer:**
"Rotate keys immediately via Azure Portal (zero downtime), update Azure Functions App Settings, restart functions. Keys are never in code or logs. Audit access with Azure AD RBAC."

**Detailed Answer:**
"**Prevention:**
- Keys stored only in Azure App Settings (encrypted at rest)
- Never in code, git history, or frontend bundle
- Access to keys requires Azure RBAC permissions (only admins)
- Keys never logged (redacted in Application Insights)

**Detection:**
- Unusual Cosmos DB activity (monitored via Azure metrics)
- Unexpected RU consumption spikes
- Failed authentication attempts from unknown IPs

**Response Plan (if compromised):**

1. **Immediate (0-5 minutes):**
   - Rotate keys in Azure Portal (Cosmos DB → Keys → Regenerate Secondary Key)
   - Zero downtime (using key rollover pattern)

2. **Update Configuration (5-15 minutes):**
   - Update Azure Functions App Settings with new secondary key
   - Restart function app (picks up new key)
   - Verify connectivity with health endpoint

3. **Regenerate Primary (after 24 hours):**
   - Once all services use secondary, regenerate primary key
   - Update to new primary, regenerate secondary
   - Complete key rotation cycle

4. **Audit (ongoing):**
   - Review Cosmos DB activity logs for unauthorized access
   - Check what data was accessed/modified
   - Notify affected users if PII was compromised (GDPR requirement)

**Time to Remediate:** <15 minutes for key rotation, <2 hours for full audit

**Why Azure Functions Help:**
- Keys in App Settings, not code (can change without redeploy)
- Restart function app = new key active within seconds
- No client-side key management (keys never leave Azure)

If we used on-prem servers, key rotation would require redeploying applications."

**File Reference:** `api/utils/cosmosProvider.js` (line 89-92 shows key usage from env)

---

### Q: "How do you audit who accessed whose data?"

**Short Answer:**
"Currently limited: Azure Functions logs show which user called which endpoint. Future: Azure Application Insights custom events will track specific data access patterns (userId accessed targetUserId's dreams)."

**Detailed Answer:**
"**Current State (Basic):**
- Azure Functions built-in logging: timestamp, endpoint, authenticated userId, HTTP status
- Example: `[2025-01-28 10:30:15] User coach@example.com called /api/getItems/member@example.com - 200 OK`
- Logs retained for 30 days in Azure Monitor
- Can query: "Show all times this coach accessed team member data"

**Limitations:**
- No detailed tracking of WHAT data was returned (which dreams, goals)
- No tracking of READ operations within the data (only API calls)
- No built-in alerting for suspicious patterns (coach accessing 100 users in 1 minute)

**Planned (Application Insights Custom Events):**

```javascript
// Example enhanced logging
appInsights.trackEvent({
  name: 'DataAccess',
  properties: {
    actor: 'coach@example.com',
    action: 'read',
    resource: 'dreams',
    target: 'member@example.com',
    resourceIds: ['dream1', 'dream2'],
    reason: 'coach-team-access'
  }
});
```

This enables queries like:
- "Which coaches accessed John's dreams this month?"
- "Did anyone access dream123 after it was marked private?"
- "Alert if admin accesses more than 50 user records in 5 minutes"

**Compliance (GDPR):**
- Users can request access logs (who viewed their data)
- We can provide via Application Insights queries
- 30-day retention → extends to 90+ days for compliance

**Why This Matters:**
- Trust & transparency (users know coaches see their data)
- Security monitoring (detect compromised accounts)
- Compliance (GDPR Article 15 - right to access)

**Estimated Effort:** 2-3 days to implement Application Insights tracking + dashboard

**File Reference:** `api/utils/authMiddleware.js` (line 420 logs access events), future implementation would add Application Insights SDK

---

## Scalability & Performance

### Q: "What happens when you hit 400 RU consistently?"

**Short Answer:**
"Autoscale increases to 400 RU max currently. Beyond that, requests are rate-limited (429 errors). We'd increase the autoscale max to 1,000 RU (adds ~$50/month) or add Redis caching to reduce Cosmos DB load."

**Detailed Answer:**
"**Current Limits:**
- Autoscale pool: 40 RU (idle) to 400 RU (peak)
- Cost: $24/month ($0.012 per RU/hour)
- Supports ~100-200 concurrent users with typical load

**When 400 RU is Exceeded:**
- Cosmos DB returns 429 (Too Many Requests)
- Backend catches error, returns 429 to client with Retry-After header
- Client shows: "System busy, try again in 5 seconds"
- User retries (usually succeeds as load spikes are transient)

**Scaling Options:**

**Option 1: Increase Autoscale Max (short-term)**
- Change max from 400 RU → 1,000 RU in Azure Portal
- Cost increases to ~$72/month ($0.012 × 1,000 × 730 hours / 100)
- Supports ~500-1,000 concurrent users
- No code changes, instant effect

**Option 2: Add Redis Cache (long-term)**
- Cache hot data (user profiles, dream lists, prompts)
- Reduces Cosmos DB load by 60-80%
- Azure Cache for Redis: ~$20/month (Basic 250MB)
- Requires code changes (cache-aside pattern in repositories)
- Combined with autoscale increase, supports 2,000+ users

**Option 3: Optimize Queries**
- Review Application Insights RU consumption metrics
- Identify expensive queries (cross-partition, missing filters)
- Add indexes, optimize data access patterns
- Free, but requires profiling and code changes

**Why We're Not Worried Yet:**
- Current usage: ~50-100 RU average (well below 400)
- Peaks to 200-250 RU during heavy load (still headroom)
- 429 errors are graceful (users retry successfully)

**Monitoring Plan:**
- Set alert: RU consumption >80% for 10+ minutes
- Weekly review: check RU trends, predict capacity needs
- Proactive scaling before user impact

**Decision Tree:**
- <400 RU: No action
- 400-600 RU: Increase autoscale to 1,000 RU
- 600-1,000 RU: Add Redis cache
- >1,000 RU: Consider dedicated throughput per container or multi-region"

**File Reference:** `api/utils/cosmosProvider.js` (container config), Azure Portal for autoscale settings

---

### Q: "Why no caching layer (Redis)?"

**Short Answer:**
"Initial architecture optimized for simplicity and low cost. Current load doesn't justify Redis (~$20/month + operational complexity). Future: Redis makes sense at 200+ active users or when Cosmos DB costs exceed $50/month."

**Detailed Answer:**
"**Cost-Benefit Analysis:**

**Without Redis (current):**
- Cosmos DB: $24/month
- Every request hits database (20-50ms latency)
- Simple architecture (one fewer service to manage)
- Total cost: $24/month

**With Redis:**
- Cosmos DB: $24/month (reduced load doesn't reduce cost significantly due to autoscale minimum)
- Redis: $20/month (Basic tier)
- Reduced Cosmos DB RU consumption (cache hits = 0 RU)
- Faster responses (cache hits = 1-5ms vs 20-50ms DB)
- **But:** Added complexity (cache invalidation, connection management, deployment)
- Total cost: $44/month (+83%)

**When Redis Makes Sense:**

1. **High Cosmos DB Costs:** When RU consumption drives costs >$50/month, Redis ROI is clear
2. **Performance Requirements:** If p95 latency >200ms becomes unacceptable
3. **Repeated Queries:** People dashboard queries all users (cross-partition, expensive)
4. **Read-Heavy Workload:** 90% reads, 10% writes (current: ~70% reads, 30% writes)

**What We'd Cache:**
- User profiles (high read, low write)
- Dream lists per user (frequently accessed)
- Prompts configuration (read on every AI request, rarely changes)
- Team membership (checked on every authorization)

**Cache Invalidation Strategy:**
- Write-through: Update DB + Redis atomically
- TTL: 5-15 minutes for non-critical data
- Event-driven: Invalidate cache on mutations

**Estimated Impact:**
- 60-80% reduction in Cosmos DB RU consumption
- 50-70% improvement in API latency (cache hits)
- Supports 3-5x more users on same Cosmos DB throughput

**Why We're Waiting:**
- Current latency is acceptable (p95 ~100-200ms)
- Current cost is acceptable ($24/month)
- Complexity doesn't justify marginal improvement yet

**Trigger to Add Redis:**
- Cosmos DB costs exceed $50/month (sustained)
- OR user count exceeds 200 active users
- OR p95 latency exceeds 500ms
- OR we add real-time features (notifications, live updates)

We optimize for simplicity now, scale when needed."

**Future Reference:** Would add `api/utils/cacheProvider.js` similar to cosmosProvider pattern

---

### Q: "Why in-memory rate limiting instead of distributed (Redis/Cosmos DB)?"

**Short Answer:**
"Single-instance deployment (Azure Static Web Apps) means in-memory is sufficient. Redis would add $20/month and complexity for marginal benefit. If we scale to multi-instance Functions, we'd migrate to Redis."

**Detailed Answer:**
"**Current Architecture:**
- Azure Static Web Apps includes single Functions instance
- All requests to same instance = shared in-memory state
- Rate limits are per-user per-endpoint (stored in Map)
- Cleanup every 5 minutes prevents memory leaks

**Limitations:**
- State lost on function restart (~2-3 restarts per week, mostly cold starts)
- Not shared across instances (but we only have one)
- Users could exceed limits immediately after restart

**Why This Is Acceptable:**

1. **Soft Limits:** Rate limiting prevents abuse, not strict billing enforcement
   - 429 error = user waits 30 seconds, not a security breach
   - Occasional limit resets don't create significant risk

2. **Cost Avoidance:** Redis = $20/month for distributed state
   - 45% increase in infrastructure costs
   - Not justified for soft limits on single-instance deployment

3. **Simplicity:** No Redis connection management, no distributed state bugs

**When We'd Migrate to Redis:**

**Scenario 1: Multi-Instance Deployment**
- If we scale to Premium Functions (multiple instances)
- In-memory state not shared = users could bypass limits by hitting different instances
- Redis becomes necessary

**Scenario 2: Hard Billing Limits**
- If AI costs become significant (>$100/month)
- Need strict enforcement: "User gets exactly 25 images/day, no exceptions"
- Can't tolerate limit resets from function restarts

**Scenario 3: Compliance Requirements**
- If auditors require: "Prove user X didn't exceed 25 requests"
- Persistent rate limit state in Cosmos DB or Redis for audit trail

**Migration Path:**

```javascript
// Current: In-memory Map
const rateLimitStore = new Map();

// Future: Redis
const redis = new Redis(process.env.REDIS_CONNECTION_STRING);
await redis.incr(`ratelimit:${userId}:${endpoint}`);
await redis.expire(`ratelimit:${userId}:${endpoint}`, 60);
```

**Estimated Effort:** 2-3 days (Redis setup + code migration + testing)

**Decision:** Wait until we have multi-instance deployment or hard cost enforcement needs. Current approach is pragmatic."

**File Reference:** `api/utils/rateLimiter.js` (line 19-21 warns about limitation)

---

## Operations

### Q: "How do you know when the system is degraded before users complain?"

**Short Answer:**
"Currently limited: health endpoint shows DB connectivity, Azure Monitor has basic metrics. Planned: Application Insights with custom dashboards (latency, error rates, RU consumption) and alert rules for proactive monitoring."

**Detailed Answer:**
"**Current Monitoring (Reactive):**

1. **Health Endpoint:** `/api/health`
   - Tests Cosmos DB connectivity
   - Returns 200 (healthy), 503 (unhealthy), or 200 (degraded)
   - Checked manually or by uptime monitors (not automated yet)

2. **Azure Monitor (Platform Metrics):**
   - Function execution count, duration
   - Cosmos DB RU consumption, latency
   - HTTP status codes (500 errors)
   - Retention: 30 days

3. **User Reports:**
   - Users report issues → we investigate
   - Not ideal, but works at current scale

**Gaps (Why It's Not Enough):**
- No alerting (we don't know about issues unless we check portal)
- No p95/p99 latency tracking (only averages)
- No error rate tracking (don't know if 1% or 10% of requests fail)
- No business metrics (logins, goal completions, AI generations)

**Planned: Application Insights (Next 2 Weeks)**

**Phase 1: Instrumentation**
```javascript
// Add to each API endpoint
appInsights.trackRequest({
  name: 'getItems',
  duration: duration,
  resultCode: 200,
  success: true
});

// Track custom events
appInsights.trackEvent({
  name: 'ImageGeneration',
  properties: { userId, model, status }
});
```

**Phase 2: Dashboards**
- API latency (p50, p95, p99) - target <500ms p95
- Error rate by endpoint - alert if >5% for 5 minutes
- Cosmos DB RU consumption - alert if >80% for 10 minutes
- AI usage tracking - alert if daily spend >$50

**Phase 3: Alerts**
- Critical: >10% error rate for 5 minutes → page on-call
- Warning: p95 latency >1s for 10 minutes → Slack notification
- Info: Cosmos DB >80% RU for 30 minutes → email

**Phase 4: Synthetic Monitoring**
- Automated checks every 5 minutes: login, load dashboard, create goal
- Detects issues before real users impacted

**Why We Don't Have This Yet:**
- Small team, prioritized features over observability
- Current scale is low (30-50 users, issues are infrequent)
- Manual checks via health endpoint work for now

**When This Becomes Critical:**
- At 200+ users (can't manually check health constantly)
- When downtime costs exceed monitoring costs (~$10/month for App Insights)
- When we commit to SLA (need metrics to measure uptime)

**Estimated Effort:** 1 week for full Application Insights setup + dashboards

**File Reference:** `api/health/index.js` (existing health check), future: Application Insights SDK integration

---

## Data & Multi-Tenancy

### Q: "How do you prevent one user's queries from impacting others?"

**Short Answer:**
"Partition key isolation ensures queries only touch one user's partition. Shared throughput means noisy neighbor risk exists—if one user does 100 queries/sec, they consume RU pool. Rate limiting (120 req/min per user) mitigates this."

**Detailed Answer:**
"**Physical Isolation:**
- Cosmos DB partitions data by userId
- Query for userA only reads userA's partition (doesn't touch userB's data)
- Partition-level resource governance prevents one partition from starving others

**Shared Throughput Risk:**
- 400 RU pool shared across all users
- Heavy user (coach querying 50 team members) could consume 200+ RU
- Leaves 200 RU for everyone else (potential slowdowns)

**Mitigations:**

**1. Rate Limiting (Current):**
- 120 requests/min per user for read operations
- 30 requests/min per user for write operations
- 10 requests/min per user for AI operations
- Prevents single user from monopolizing resources

**2. Query Optimization:**
- All queries include partition key (1 RU each)
- No cross-partition queries in hot paths
- Expensive operations (People dashboard) are admin-only

**3. Monitoring (Planned):**
- Track RU consumption per user
- Alert if single user exceeds 50% of pool for >5 minutes
- Investigate and optimize their queries or increase their rate limits

**4. Dedicated Throughput (Fallback):**
- If one user legitimately needs high throughput (big team)
- Can allocate dedicated 400 RU to their partition
- Costs same as shared pool (~$24/month per user)
- Only used for outliers

**Real-World Scenario:**

*Coach with 50-member team loads Dream Team dashboard:*
- Queries dreams for each team member (50 queries × 1 RU = 50 RU)
- Queries team stats (5-10 RU)
- **Total: ~60 RU in 2-3 seconds**
- Peak consumption, but within rate limits
- Other users may see slight latency increase (50ms → 100ms) during this burst

*Mitigation:* Cache team dashboard data (Redis, future) → reduces load to 5 RU

**Why This Works at Current Scale:**
- Low concurrency (rarely have 10+ users querying simultaneously)
- Burst capacity (autoscale handles spikes)
- Rate limiting prevents runaway consumption

**When It Breaks:**
- 200+ concurrent users with heavy query patterns
- Solution: Increase autoscale max + add Redis cache"

**File Reference:** `api/utils/rateLimiter.js` (per-user limits), `api/utils/repositories/BaseRepository.js` (partition key queries)

---

### Q: "What's your data retention and deletion strategy?"

**Short Answer:**
"Currently: indefinite retention (data never automatically deleted). GDPR compliance: users can request deletion via admin, we run script to delete all user data. Future: automated retention policies (archive old data, soft delete inactive users)."

**Detailed Answer:**
"**Current State: Indefinite Retention**

All data persists indefinitely:
- Dreams, goals, connects never deleted (unless user explicitly deletes)
- Past weeks summaries accumulate (never pruned)
- Coach notes, meeting attendance records kept forever

**Benefits:**
- Historical data for analytics (trend analysis)
- Users can review progress over years
- No accidental data loss

**Risks:**
- Storage costs increase over time (negligible for text data)
- GDPR "right to be forgotten" requires manual process
- Inactive user data clutters database

**GDPR Compliance (Manual Process):**

**Right to Deletion (Article 17):**

1. User requests deletion via email to admin
2. Admin verifies identity
3. Admin runs deletion script:

```javascript
// Pseudocode for deletion script
await deleteUserProfile(userId);
await deleteDreamsDocument(userId);
await deleteUserConnects(userId);
await deleteUserWeeks(userId);
await deleteUserScoring(userId);
await removeFromTeams(userId);
```

4. Deletion completes in <5 minutes
5. User receives confirmation email
6. Backup archives retain data for 30 days (compliance requires ability to recover from accidental deletion)

**Data Retention Policy (Planned):**

**Hot Data (Active Users):**
- All data available instantly
- No retention limits

**Warm Data (Inactive 2+ Years):**
- Archive to Azure Blob Storage (cheaper)
- Retrievable but slower (requires restore from archive)
- Reduces Cosmos DB storage costs

**Cold Data (Deleted Users):**
- Soft delete (mark deleted, hide from queries)
- Hard delete after 90 days (GDPR grace period)
- Backups retained for 30 days, then purged

**Automated Policies:**
- Weekly job scans for users inactive >2 years → archive
- Weekly job scans for soft-deleted users >90 days → hard delete
- Email notifications before archival/deletion

**Export Before Deletion:**
- Users can download all their data (JSON format)
- "Export My Data" button in profile settings
- GDPR Article 20: Right to data portability

**What We DON'T Delete:**
- Anonymized analytics (aggregated data, no PII)
- Audit logs (access records, security events)
- System logs (error reports, performance metrics)

**Estimated Effort:** 3-4 days to implement automated retention + soft delete

**File Reference:** Future: `scripts/dataRetentionPolicy.cjs`, `api/deleteUser/index.js` (to be created)

---

## Future Improvements

### Q: "What would you improve first if you had 2 weeks?"

**Short Answer:**
"Observability. Add Application Insights with dashboards for latency, errors, and RU consumption. This unblocks all future optimization—can't improve what you can't measure."

**Detailed Answer:**
"**Priority 1: Observability (1-2 weeks)**

*Why:* Flying blind. We don't know if system is degrading until users complain.

*What:*
1. Application Insights SDK integration (2 days)
   - Track all API requests (duration, status, user)
   - Track custom events (image generation, goal completion)
   - Track exceptions (unhandled errors with stack traces)

2. Custom dashboards (2 days)
   - API latency (p50, p95, p99 per endpoint)
   - Error rate (% of failed requests, grouped by status code)
   - Cosmos DB RU consumption (trend over time)
   - Business metrics (logins/day, active users, goals created)

3. Alert rules (1 day)
   - Critical: >10% error rate → page on-call
   - Warning: p95 latency >1s → Slack notification
   - Info: RU consumption >80% → email

4. Synthetic monitoring (2 days)
   - Automated health checks every 5 minutes
   - Test critical paths: login → dashboard → create goal

*Impact:*
- Detect issues before users notice (proactive vs reactive)
- Data-driven optimization (identify slow endpoints, expensive queries)
- Confidence in deployments (monitor error rates after release)

*Cost:* ~$10/month (Application Insights Basic tier)

**Priority 2: Persistent Rate Limiting (1 week)**

*Why:* In-memory limits reset on function restart, creating cost risk.

*What:*
1. Azure Cache for Redis (1 day)
   - Provision Basic tier ($20/month)
   - Configure connection string in App Settings

2. Migrate rateLimiter.js (2 days)
   - Replace Map with Redis commands
   - Add TTL (auto-expire after time window)
   - Test thoroughly (rate limiting bugs are painful)

3. Add rate limit persistence (1 day)
   - Store daily usage counters in Redis
   - Survive function restarts
   - Enable chargeback (track AI costs per user)

*Impact:*
- Reliable cost controls (no more limit resets)
- Foundation for multi-instance deployment
- Audit trail for rate limit enforcement

*Cost:* +$20/month (Redis Basic 250MB)

**Priority 3: Caching Hot Data (1 week)**

*Why:* Reduce Cosmos DB load, improve latency, support more users.

*What:*
1. Cache user profiles (1 day)
   - Store in Redis with 15-minute TTL
   - Invalidate on profile update
   - Reduces authorization query from 20ms → 1ms

2. Cache prompts config (1 day)
   - Single prompt doc queried on every AI request
   - Cache with 1-hour TTL
   - Reduces 100+ queries/day to 24

3. Cache team membership (2 days)
   - Used on every coach authorization check
   - Cache with 5-minute TTL
   - Most complex: invalidate when team changes

*Impact:*
- 60-80% reduction in Cosmos DB queries
- Faster API responses (50-100ms improvement)
- Supports 3-5x more users

**Why This Order:**

1. Observability first: Can't optimize without metrics
2. Rate limiting second: Protects costs as we grow
3. Caching third: Optimization based on observability data

After these 3, we'd have:
- Visibility into system health
- Protection against cost spikes
- Capacity for 10x user growth

Then we'd tackle multi-region, advanced security, or new features based on business priorities."

---

## Trade-Offs & Alternatives

### Q: "What alternatives did you consider and why did you reject them?"

**Detailed Answer:**

**Authentication:**
- ❌ Custom auth (username/password): No way, massive security liability
- ❌ Auth0 / Okta: $240-500/month for SSO features, Azure AD is free
- ✅ Azure AD: Already the identity provider, SSO built-in, no extra cost

**Database:**
- ❌ Azure SQL: $100+/month, requires complex RLS for isolation, no autoscale-to-zero
- ❌ MongoDB Atlas: $57/month minimum (M10), similar features to Cosmos DB
- ❌ PostgreSQL: Good for relational data, but harder to implement partition-key isolation
- ✅ Cosmos DB: $24/month with autoscale, partition-key isolation, NoSQL flexibility

**Hosting:**
- ❌ Azure App Service: $55+/month (Basic tier), no autoscale-to-zero
- ❌ Azure Kubernetes Service: $200+/month minimum, operational complexity
- ❌ VM-based: Even more expensive, have to manage OS patches, backups
- ✅ Static Web Apps + Functions: ~$15/month combined, autoscale-to-zero, zero ops

**AI Provider:**
- ❌ Azure OpenAI: Requires approval process, initially slower to start
- ❌ Anthropic Claude: No image generation, only text
- ❌ Google Vertex AI: Would require GCP integration, cross-cloud complexity
- ✅ OpenAI API: Fastest time-to-market, will migrate to Azure OpenAI later

**State Management (Frontend):**
- ❌ Redux: Overkill for our state complexity, lots of boilerplate
- ❌ Zustand / Jotai: Lighter than Redux, but still external dependency
- ✅ React Context + useReducer: Built-in, sufficient for our needs, one less dependency

**API Framework:**
- ❌ Express on Functions: Possible but adds bundle size (cold start impact)
- ❌ NestJS: Heavy framework, better for large teams with strict conventions
- ✅ Plain Azure Functions: Minimal abstraction, faster cold starts, simpler mental model

**Key Decision Criteria:**
1. **Cost:** Optimize for low fixed costs, pay-per-use over reserved capacity
2. **Simplicity:** Fewer moving parts, less operational overhead
3. **Security:** Leverage Azure AD, avoid custom auth
4. **Time-to-market:** Use managed services, don't reinvent wheels"

---

### Q: "If you could re-architect from scratch, what would you change?"

**Short Answer:**
"I'd add Application Insights from day one, use Azure OpenAI instead of OpenAI API, and implement caching earlier. Overall architecture is sound—partition keys, serverless, and Azure AD were correct choices."

**Detailed Answer:**
"**What We'd Keep (Right Decisions):**
- ✅ Azure AD authentication (zero credential management)
- ✅ Cosmos DB with partition keys (security + performance)
- ✅ Serverless functions (cost + simplicity)
- ✅ React + Vite (modern, fast, simple)
- ✅ ok/fail pattern (predictable error handling)
- ✅ Repository pattern (clean data access layer)

**What We'd Change:**

**1. Observability from Day 1**
- Application Insights SDK in initial commit
- Custom events on every API call, business event
- Dashboards + alerts configured before launch
- *Cost:* ~$10/month
- *Benefit:* Would have caught performance issues earlier

**2. Azure OpenAI Instead of OpenAI API**
- Request approval during development, not after launch
- Better compliance story from the start
- *Cost:* Same as OpenAI API
- *Benefit:* Avoids migration later

**3. Redis from the Start**
- Even at low scale, caching simplifies architecture
- Persistent rate limiting prevents resets
- *Cost:* +$20/month
- *Benefit:* Cleaner architecture, less reactive scaling

**4. Structured Logging**
- Use JSON-formatted logs instead of plain text
- Easier to query in Application Insights
- *Cost:* $0 (just code conventions)
- *Benefit:* Better debugging, faster incident response

**What We'd MAYBE Change (Debatable):**

**TypeScript Instead of JavaScript?**
- Pro: Compile-time type checking, better IDE support
- Con: Slower development, more configuration, .d.ts files for node packages
- *Verdict:* JavaScript + Zod schemas + JSDoc works well, TypeScript not worth the overhead for this team size

**GraphQL Instead of REST?**
- Pro: Clients request exact data needed, no over-fetching
- Con: Added complexity, caching harder, not well-suited for serverless
- *Verdict:* REST is simpler, sufficient for our use case

**Event-Driven Architecture (Service Bus)?**
- Pro: Better decoupling, async operations, retry logic
- Con: More complex, harder to debug, +$10-50/month
- *Verdict:* Not needed yet, could add for specific use cases (email notifications, batch processing)

**What We Wouldn't Change:**

- ❌ Multi-region from start: Premature optimization, not needed until 1,000+ users
- ❌ Microservices: Monolithic Functions API is right size for team, feature set
- ❌ Different cloud: Azure makes sense given Azure AD requirement

**Bottom Line:**
Architecture is 80-90% correct. The 10-20% we'd change are minor improvements, not fundamental redesigns. Biggest regret: not adding observability from day one—everything else is fixable with incremental improvements."

---

## Quick Stats to Memorize

**Infrastructure:**
- Total cost: $40-55/month
- Database: $24/month (Cosmos DB 400 RU autoscale)
- Compute: ~$5-10/month (Functions consumption plan)
- AI: ~$10-20/month (OpenAI API usage)

**Performance:**
- API latency: p50 ~100ms, p95 ~500ms
- Database latency: p50 ~20ms, p95 ~100ms
- Cold start: 2-5 seconds (after idle >20 minutes)

**Scale:**
- Current: 30-50 active users
- Tested: 100+ concurrent users
- Supported: 500-1,000 users (current config)

**Security:**
- Auth: Azure AD with MSAL (1-hour token lifetime)
- Isolation: Partition keys (userId, managerId)
- Rate limiting: 10-120 req/min depending on endpoint
- Secrets: Server-side only (never in frontend)

**Data:**
- Containers: 10 (users, dreams, teams, etc.)
- Partition strategy: By userId or managerId
- Backups: Every 4 hours, 30-day retention
- RTO: ~2 hours, RPO: ~4 hours

---

**Remember:** You don't need to memorize line numbers. The key is understanding the "why" behind decisions. When asked for specifics, refer to the file paths provided. The cheat sheets have the exact locations.

Good luck with your review! 🚀
