# DreamSpace - Architecture Talking Points

**Optimized for verbal explanations in meetings**

---

## Opening Statement (30 seconds)

"DreamSpace is an enterprise React application running on Azure, designed for Netsurit's employee goal-tracking program. It's built with a serverless architecture—Azure Functions for the API, Cosmos DB for data, and Static Web Apps for hosting. We're running at about $40-55 per month total infrastructure cost, supporting 100+ concurrent users with built-in AI features for image generation and vision statements."

---

## If Asked: "How do you handle authentication?"

**Short version:**
"We use Azure AD with MSAL, so every user logs in with their existing Netsurit credentials. No passwords to manage, no user database for authentication. It's SSO through Microsoft's identity platform."

**If they want more detail:**
"The frontend uses the MSAL library to redirect users to Azure AD's login page. Once authenticated, we get a JWT token that's sent with every API request. The backend validates that token against Azure's public keys—checking the signature, expiration, and that it's issued for our specific tenant and application. If the token's invalid, we return 401 and the user is redirected back to login."

**If asked about security:**
"Tokens are stored in session storage, not local storage, so they're automatically cleared when the browser closes. We don't persist tokens across sessions—that's an intentional security trade-off. Better to have users log in again than risk long-lived token exposure."

---

## If Asked: "How do you handle authorization and roles?"

**Short version:**
"Three roles: User, Coach, and Admin. Roles are stored in our Cosmos DB user profiles, not in Azure AD. This gives us operational flexibility—we can promote someone to Coach instantly without waiting for directory changes."

**If they want more detail:**
"After we validate the authentication token, we look up the user in Cosmos DB to check their role flags. The middleware enforces role requirements before any business logic runs. For example, the image generation endpoint requires 'user' auth, team management requires 'coach', and prompt configuration requires 'admin'. There's also a 'user-access' pattern that ensures users can only access their own data, unless they're a coach accessing their team members or an admin."

**If asked about coach access:**
"Coaches can only see data for members of their team. We validate this by checking the teams container—if the coach's ID matches the team's managerId and the target user is in that team's members array, access is granted. Otherwise it's 403 forbidden. Team managers also get automatic coach privileges, so they don't need explicit role assignments."

---

## If Asked: "How do you isolate user data?"

**Short version:**
"Partition keys. Every query in Cosmos DB includes the userId as the partition key. You literally can't query another user's data without knowing their userId and having authorization to access it."

**If they want more detail:**
"Cosmos DB containers are partitioned—most use `/userId`, team data uses `/managerId`. Every single query includes WHERE c.userId = @userId. This does two things: first, it's a performance optimization because partition key queries cost 1 Request Unit instead of 10-100 for cross-partition queries. Second, it's a security boundary—even if someone bypassed our authorization layer, the database physically isolates data by partition. You'd need to enumerate all possible userIds and have authorization for each one to access multiple users' data."

**If asked about the container architecture:**
"We have 10 containers: users, dreams, connects, teams, scoring, currentWeek, pastWeeks, meeting_attendance, coaching_alerts, and prompts. Each has its own partition strategy based on access patterns. For example, dreams are partitioned by userId because you mostly query 'show me MY dreams'. Teams are partitioned by managerId because coaches query 'show me MY team's data'."

---

## If Asked: "How does the frontend talk to the backend?"

**Short version:**
"All API calls go through a centralized apiClient that automatically injects the authentication token. Services wrap these calls in an ok/fail pattern, so every response is either { success: true, data } or { success: false, error }."

**If they want more detail:**
"We enforce three rules: first, no raw fetch calls in UI components—everything goes through service classes. Second, all services inherit from BaseService which provides standard error handling. Third, the apiClient singleton handles token acquisition and injection, so component code never touches authentication. This means if we need to change auth strategy, add request logging, or switch to a different token format, we change one file."

**If asked about error handling:**
"If an API call fails, we return a structured error with a code and message. The service layer transforms HTTP status codes into our error categories—network, auth, validation, or unknown. Components check result.success and show a toast notification if it's false. We never let errors crash the app—worst case, the user sees a friendly error message and can try again."

---

## If Asked: "What's your security model?"

**Short version:**
"Defense in depth. HTTPS everywhere, Azure AD authentication, role-based authorization, CORS restrictions, rate limiting, and all secrets server-side. No API keys in the frontend bundle."

**If they want more detail:**
"Starting from the outside: HTTPS enforced by Azure Static Web Apps, so all traffic is encrypted. Then Azure AD validates user identity. Then our middleware validates JWT tokens and enforces roles. Then partition keys isolate data. We also have rate limiting—expensive operations like AI image generation are limited to 10 requests per minute and 25 per day per user. And critically, API keys for OpenAI and Cosmos DB are only in the backend—they're never bundled into the frontend JavaScript. The browser never sees them."

**If asked about rate limiting:**
"We use in-memory rate limiting right now, which is fine for our single-instance deployment. It tracks requests per user per endpoint. For example, image generation is 10 per minute, writes are 30-60 per minute, reads are higher. If someone exceeds the limit, they get a 429 with a Retry-After header. The main downside is the state resets if the Azure Function restarts, but that's acceptable for soft limits. If we scale to multiple instances, we'd migrate to Redis for shared state."

---

## If Asked: "How does it scale?"

**Short version:**
"We're optimized for cost-efficient scale. Cosmos DB uses shared throughput—400 RU pool that auto-scales down to 40 when idle. Azure Functions are serverless, so they scale horizontally automatically. We're at $24/month for the database with headroom for 10x growth."

**If they want more detail:**
"Cosmos DB is the main cost driver. We use shared throughput across all 10 containers—instead of paying $325/month for 400 RU per container, we pay $24/month for a single 400 RU pool. The autoscale feature scales down to 40 RU when idle, so we're not paying for capacity we're not using. For API scaling, Azure Functions handle that automatically—if we suddenly get 1,000 concurrent requests, Azure spins up more instances. We pay per execution, not per hour of uptime."

**If asked about performance:**
"API latency is about 100ms at p50, 500ms at p95. Database latency is 20-100ms. We've tested 100+ concurrent users with no issues—current production usage is 30-50. The main performance bottleneck is cross-partition queries, like the People dashboard showing all users. That's expensive because Cosmos DB has to fan out the query across partitions. If that becomes a problem, we'd add Redis caching."

**If asked about cold starts:**
"Yes, serverless functions have cold starts—first request after idle can take 2-5 seconds. But subsequent requests are fast because the function stays warm. For our use case, that's acceptable—this isn't a real-time transactional system. It's a goal-tracking app where occasional 2-second delays are fine. If we needed guaranteed fast responses, we'd switch to Premium Functions with always-warm instances, but that's $200/month vs nearly free."

---

## If Asked: "Tell me about the AI features"

**Short version:**
"We integrate with OpenAI for image generation and vision statements. API keys are server-side only—frontend calls our backend, our backend calls OpenAI. Admins can edit AI prompts through a UI without code deployments."

**If they want more detail:**
"The primary AI feature is dream image generation using DALL-E. Users describe their dream, pick a style like 'photorealistic' or 'stylized digital', and we generate an image. Under the hood, the frontend calls our generateImage endpoint, we load the prompt template from Cosmos DB, inject the user's input and style modifier, then call OpenAI's API. We also have GPT-4 integration for generating vision statements—users can type a rough idea and GPT polishes it into an inspiring year-long vision."

**If asked about prompt management:**
"All prompts are stored in the Cosmos DB prompts container. Admins access a dedicated UI in the People Hub to edit them. There's version history, so if someone breaks a prompt, we can revert. There's also a test panel where admins can try new prompts before saving. This means we can tune AI behavior without redeploying code—just edit the prompt, save, and it's live immediately."

**If asked about cost controls:**
"Rate limiting. Each user can generate 25 images per day, organization-wide limit is 500 per day. Also 10 per minute. If someone hits the limit, they get a 429 error with a message explaining when they can try again. At current usage, we're spending about $10-20/month on OpenAI. If that spikes, we have circuit breakers in place."

---

## If Asked: "What are the biggest risks or limitations?"

**Short version:**
"Single-region deployment, in-memory rate limiting, no offline mode, and cold starts. These are all acceptable trade-offs for current scale, but we'd address them as we grow."

**If they want more detail:**
"First, everything's in one Azure region—US East. If that region has an outage, we're down. That's a trade-off we made to avoid geo-replication costs. Second, rate limiting is in-memory, so it resets when functions restart. That's fine for soft limits but wouldn't work for hard financial caps. Third, no offline mode—you need network connectivity. Fourth, serverless cold starts mean first request after idle takes 2-5 seconds. And fifth, cross-partition queries are expensive, so the People dashboard could get slow with thousands of users."

**If asked what we'd fix first:**
"Observability. We need Azure Application Insights with dashboards showing latency, error rates, and usage patterns. Right now we're flying semi-blind—we know the system works, but we don't have detailed metrics. After that, persistent rate limiting via Redis so limits survive restarts. Then caching for hot data like the People dashboard. Then multi-region Cosmos DB for resilience."

---

## If Asked: "How do you handle errors and failures?"

**Short version:**
"Graceful degradation. Frontend validation with Zod catches bad input early. API errors are caught by middleware and returned in a standard format. UI shows toast notifications with actionable messages. We never let errors crash the app."

**If they want more detail:**
"There are layers. First, Zod schemas validate input before it reaches the API—prevents things like null required fields or invalid email formats. Second, API middleware catches all errors, logs them, and returns a consistent JSON shape with error codes. Third, services transform API errors into ok/fail responses that components can handle uniformly. Fourth, toast notifications show user-friendly messages—not stack traces. For example, 401 errors redirect to login, 403 errors show 'permission denied', 429 errors show 'rate limit, try again in X seconds'."

**If asked about production error handling:**
"In production, we hide internal error details to prevent information leakage. Users see 'Internal server error, request ID: XYZ'. But server-side, we log the full error with stack trace and request ID. This way users aren't exposed to database schema or API keys in error messages, but we can still debug by looking up the request ID in logs. In development, we show full error details for faster debugging."

---

## If Asked: "What's your deployment process?"

**Short version:**
"GitHub Actions. Push to main branch, it builds the frontend, runs tests, deploys to Azure Static Web Apps. Backend deploys separately to Azure Functions. Both are fully automated."

**If they want more detail:**
"We use the Azure Static Web Apps GitHub action. On push to main, it builds the React app with Vite, runs linting and tests, then deploys the static files and API functions together. The deployment is atomic—if something fails, the old version stays live. We have a production environment and a staging environment—staging is for testing changes before they go live. Pull requests get preview deployments automatically, so we can test in isolation."

---

## If Asked: "How do you handle database migrations?"

**Short version:**
"Schema-less NoSQL, so we don't have traditional migrations. We handle schema changes in code with backward-compatible patterns—read old format, transform to new format, write new format."

**If they want more detail:**
"Because Cosmos DB is schema-less, we don't run migration scripts. When we need to change data structure, we do it lazily: the code reads both old and new formats, transforms old to new on read, and writes back in the new format. Over time, all documents converge to the new schema. For breaking changes, we'd write a one-time script to scan and update documents, but we haven't needed that yet."

**If asked about backups:**
"Cosmos DB has automatic backups every 4 hours, retained for 30 days. We also have manual export scripts that dump all containers to JSON files—we run these before major changes or migrations. The scripts are in the /scripts folder—checkAndRestoreDreams.cjs, exportCosmosData.cjs, etc."

---

## If Asked: "What would you improve next?"

**Short version:**
"Observability first—Application Insights dashboards. Then persistent rate limiting with Redis. Then performance optimizations like caching and connection pooling."

**If they want more detail:**
"Phase 1 is observability—we need visibility into API latency, error rates, and usage patterns. That's a week of work to set up Application Insights with custom dashboards and alert rules. Phase 2 is persistent rate limiting—migrate from in-memory to Redis so limits survive function restarts. That's another week. Phase 3 is performance—add Redis caching for the People dashboard, implement database connection pooling, and set up a CDN for uploaded images. That's 2-3 weeks. Phase 4 is resilience—multi-region Cosmos DB, Azure OpenAI Service for better SLA, and request retry logic."

---

## If Asked: "Why Azure?"

**Short version:**
"Netsurit's already on Azure, Azure AD is the identity provider, and Azure Static Web Apps makes hosting trivial. We're leveraging existing infrastructure and SSO."

**If they want more detail:**
"It's about integration and cost. Azure AD is already the identity provider, so SSO is built-in. Cosmos DB gives us globally-available NoSQL at a low price point with shared throughput. Functions give us serverless compute at nearly free for our usage. Static Web Apps include free hosting and CDN. And critically, everything's in one billing account with existing support contracts. If we went with AWS, we'd need to set up cross-cloud authentication, manage separate billing, and deal with two support systems."

---

## If Asked: "How many users can it support?"

**Short version:**
"We've tested 100+ concurrent users with no issues. Current production is 30-50. We could scale to 500+ users on the current infrastructure, maybe 1,000+ with Redis caching."

**If they want more detail:**
"It depends on usage patterns. The database is the constraint—400 RU shared throughput supports about 100-200 concurrent users doing typical operations like loading their dashboard or saving goals. If everyone simultaneously tried to generate AI images, we'd hit rate limits faster. But for normal usage, we have plenty of headroom. If we grow beyond 500 users, we'd increase Cosmos DB throughput to 1,000 RU (adds about $50/month) and add Redis caching (adds about $20/month). That'd get us to 2,000+ users easily."

---

## Closing Statement (30 seconds)

"Overall, DreamSpace is architected for secure, cost-efficient operation at current scale with clear paths to handle 10x growth. We prioritize security—Azure AD authentication, partition-key isolation, no secrets in frontend. We optimize for cost—shared database throughput, serverless compute. And we build for maintainability—consistent patterns, centralized error handling, admin-configurable AI. The next phase is adding observability and caching to support larger teams as Netsurit grows."

---

## Quick Stats to Have Ready

- **Infrastructure cost:** $40-55/month total
- **Database cost:** $24/month (Cosmos DB 400 RU shared)
- **Concurrent users tested:** 100+
- **Current production users:** 30-50
- **API latency:** p50 ~100ms, p95 ~500ms
- **Database latency:** p50 ~20ms, p95 ~100ms
- **AI limits:** 25 images/user/day, 500 images/org/day
- **Rate limiting:** 10-120 req/min depending on endpoint
- **Deployment time:** ~5 minutes (automated via GitHub Actions)
- **Uptime SLA:** No formal SLA (depends on Azure platform SLAs)
- **Data residency:** US East (single region)

---

## Navigation Cheat (if asked for specific file)

"Let me find that for you..."

- **Auth config:** `src/auth/authConfig.js`
- **Auth middleware:** `api/utils/authMiddleware.js`
- **API wrapper:** `api/utils/apiWrapper.js`
- **Database repos:** `api/utils/repositories/`
- **Error handling:** `src/utils/errorHandling.js`
- **Rate limiting:** `api/utils/rateLimiter.js`
- **Health check:** `api/health/index.js`
- **AI image gen:** `api/generateImage/index.js`
- **Prompt management:** `api/utils/repositories/PromptsRepository.js`
