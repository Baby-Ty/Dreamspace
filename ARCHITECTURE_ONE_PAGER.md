# DreamSpace - Architecture One-Pager

**Quick Reference for Architecture Discussions**

---

## System Overview
Enterprise React + Azure Functions app for employee goal tracking with AI-powered features. $24/month database cost, serverless compute, 100+ concurrent users supported.

---

## 1. Authentication
**"We use Azure AD (Entra ID) with MSAL for SSO, ensuring all Netsurit employees authenticate through their existing corporate identity."**

📁 **See:** `src/auth/authConfig.js`, `api/utils/authMiddleware.js`

---

## 2. Authorization & Roles
**"We implement role-based access control with three tiers—User, Coach, and Admin—stored in Cosmos DB user profiles, not Azure AD, giving us operational flexibility without directory changes."**

📁 **See:** `api/utils/authMiddleware.js` (line 145-200), `users` container in Cosmos DB

---

## 3. Data Isolation & Multi-Tenancy
**"We achieve hard data isolation through Cosmos DB partition keys—every query scopes to userId or managerId—ensuring users cannot access data outside their authorization boundary, even with a compromised token."**

📁 **See:** `api/utils/repositories/`, `api/utils/cosmosProvider.js` (line 26-77)

---

## 4. Frontend ↔ Backend Contract
**"We enforce a strict ok/fail response pattern with typed services—all API calls return `{ success: bool, data?, error? }`—ensuring predictable error handling and eliminating raw fetch calls in UI components."**

📁 **See:** `src/services/BaseService.js`, `src/services/apiClient.js`, `src/utils/errorHandling.js`

---

## 5. Error Handling & Failure Modes
**"We fail gracefully with layered defenses—frontend validation with Zod, API-level error boundaries, database retry logic, and user-facing toast notifications—ensuring users always know what went wrong and what to do next."**

📁 **See:** `src/schemas/*.js`, `api/utils/apiWrapper.js` (handleError), `api/health/index.js`

---

## 6. Security Posture
**"We implement defense-in-depth—HTTPS everywhere, Azure AD authentication, token-based API authorization, CORS restrictions, rate limiting, and zero secrets in frontend code—resulting in a security model suitable for enterprise sensitive data."**

📁 **See:** `staticwebapp.config.json` (headers), `api/utils/rateLimiter.js`, `api/utils/authMiddleware.js`

---

## 7. Scalability & Performance
**"We optimize for cost-efficient scale through Cosmos DB shared throughput, partition key-aware queries, request caching, and serverless Azure Functions—currently running at $24/month with headroom for 10x growth."**

📁 **See:** `api/utils/cosmosProvider.js` (CONTAINER_CONFIG), `api/utils/rateLimiter.js`

**Current metrics:** p50 ~100ms API latency, 100+ concurrent users tested, 400 RU shared pool

---

## 8. AI / Automation Readiness
**"We expose AI capabilities through backend-proxied APIs with configurable prompts stored in Cosmos DB—enabling non-technical admins to tune AI behavior without code deployments, while maintaining cost controls through rate limiting."**

📁 **See:** `api/generateImage/index.js`, `api/utils/repositories/PromptsRepository.js`, `src/pages/people/PromptEditorSection.jsx`

**Features:** DALL-E image generation, GPT-4 vision statements, AI colleague matching
**Limits:** 25 images/user/day, 500 images/org/day, 10 req/min

---

## Key Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Azure AD (not custom auth) | Zero credential management, SSO | Dependency on Azure AD availability |
| Cosmos DB roles (not Azure AD roles) | Operational agility, instant changes | Not in centralized audit log |
| Partition keys for isolation | 1 RU queries, security, scale | Cross-partition queries expensive |
| Backend API proxying | API key security, rate limiting | Additional latency (~50ms) |
| Shared throughput (400 RU) | 93% cost savings | Noisy neighbor risk |
| Serverless functions | Pay-per-execution, auto-scale | Cold starts (2-5s after idle) |
| In-memory rate limiting | Simple, no dependencies | State lost on restart |
| Session storage tokens | Better security | Re-auth on browser close |

---

## Quick Navigation

### Critical Path Files
1. **Auth**: `src/auth/AuthProvider.jsx` → `api/utils/authMiddleware.js`
2. **API**: UI → `src/services/` → `src/services/apiClient.js` → `api/[endpoint]/index.js` → `api/utils/repositories/`
3. **Data**: `api/utils/cosmosProvider.js` → `api/utils/repositories/BaseRepository.js` → specific repos
4. **Config**: `src/utils/env.js` (frontend), `api/local.settings.json` (backend), `staticwebapp.config.json` (routing/headers)

### Debugging Entry Points
- **Health**: `/health` endpoint (API + DB connectivity)
- **Auth**: Console logs in `src/services/apiClient.js` (token acquisition)
- **Errors**: `api/utils/apiWrapper.js` (all API errors flow through here)

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Azure Static Web Apps + CDN)              │
│  ├─ Pages (thin wrappers)                                   │
│  ├─ Components (UI only, no business logic)                 │
│  ├─ Hooks (data fetching via services)                      │
│  └─ Services (API calls, ok/fail pattern)                   │
│     └─ apiClient (token injection)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS + Bearer token
┌─────────────────────────────────────────────────────────────┐
│  Azure Functions (Serverless API)                           │
│  ├─ apiWrapper (auth, CORS, rate limiting, error handling)  │
│  ├─ authMiddleware (JWT validation, role enforcement)       │
│  ├─ Business logic (47 endpoints)                           │
│  └─ Repositories (Cosmos DB operations)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ Partition key queries
┌─────────────────────────────────────────────────────────────┐
│  Azure Cosmos DB (NoSQL)                                    │
│  ├─ 10 containers (users, dreams, teams, etc.)              │
│  ├─ Partition keys: /userId, /managerId, /teamId            │
│  └─ 400 RU shared autoscale pool (40-400 RU)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Transport (HTTPS/TLS 1.2+)                        │
│  Layer 2: Authentication (Azure AD JWT)                     │
│  Layer 3: Authorization (RBAC + partition key isolation)    │
│  Layer 4: Rate Limiting (per-endpoint throttling)           │
│  Layer 5: Input Validation (Zod schemas)                    │
│  Layer 6: Secret Management (Azure App Settings)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown (Current)

| Component | Cost/Month | Notes |
|-----------|------------|-------|
| Azure Static Web Apps | $0 | Free tier (100GB bandwidth) |
| Azure Functions | ~$5-10 | Consumption plan (1M executions free) |
| Cosmos DB | $24 | 400 RU shared autoscale |
| Azure Blob Storage | ~$1 | Image uploads (hot tier) |
| OpenAI API | ~$10-20 | Pay-per-use (image generation) |
| **Total** | **~$40-55** | Scales with usage, not users |

---

## Known Limitations

1. **Single-region deployment** - No geo-redundancy (US East only)
2. **In-memory rate limits** - Reset on function restart
3. **No offline mode** - Requires network connectivity
4. **Cold starts** - First request after idle: 2-5 seconds
5. **Cross-partition queries** - Expensive (People dashboard)
6. **No request queuing** - 429 errors require manual retry
7. **Session-based auth** - Re-login on browser close (intentional)

---

## Future Phase Priorities

**Phase 1: Observability (1-2 weeks)**
- Azure Application Insights integration
- Custom dashboards (latency, errors, usage)
- Alert rules for 500 errors, high latency

**Phase 2: Persistent Rate Limiting (1 week)**
- Azure Cache for Redis
- Migrate rate limiter from in-memory to Redis
- Survives restarts, shared across instances

**Phase 3: Performance (2-3 weeks)**
- Redis caching for hot data (People dashboard)
- Database connection pooling
- Image CDN for uploaded pictures

**Phase 4: Resilience (2-3 weeks)**
- Multi-region Cosmos DB (read replicas)
- Azure OpenAI Service (better SLA than OpenAI API)
- Request retry logic for transient failures

---

## When to Use This Cheat Sheet

**Architecture Review:** Start with Section 1-8 anchor statements  
**CTO Q&A:** Reference "Key Decisions & Rationale" for each section  
**Security Audit:** Jump to Section 6 + Security Model diagram  
**Cost Discussion:** Reference "Cost Breakdown" + Section 7  
**Performance Review:** Reference Section 7 + current metrics  
**AI Roadmap:** Reference Section 8 + Future Phase Priorities

---

📄 **Full Details:** See `ARCHITECTURE_CHEAT_SHEET.md` (8 sections with detailed rationale + navigation)
