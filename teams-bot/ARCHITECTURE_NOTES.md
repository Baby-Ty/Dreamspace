# Teams Bot Architecture Notes

## Integration with Existing Dreamspace Architecture

This document explains how the Teams bot architecture aligns with and extends the existing Dreamspace application.

## Consistency with Existing Patterns

### 1. Cosmos DB Access Pattern

**Main App (`api/getItems/index.js`):**
```javascript
const { CosmosClient } = require('@azure/cosmos');
let client, database, itemsContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  itemsContainer = database.container('items');
}
```

**Bot (`services/cosmosService.js`):**
```javascript
const { CosmosClient } = require('@azure/cosmos');
let client, database;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
}
```

**✅ Same pattern**: Both use module-level initialization with env var checks.

---

### 2. Environment Variables

**Main App:**
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`

**Bot:**
- `COSMOS_ENDPOINT` (reused)
- `COSMOS_KEY` (reused)
- `MicrosoftAppId` (new)
- `MicrosoftAppPassword` (new)
- `MicrosoftAppType` (new)

**✅ Consistency**: Bot reuses existing Cosmos vars, adds only bot-specific vars.

---

### 3. Azure Functions Structure

**Main App Functions:**
```
api/
├── getItems/
│   ├── function.json
│   └── index.js
```

**Bot Functions:**
```
teams-bot/
├── messages/
│   ├── function.json
│   └── index.js
```

**✅ Same structure**: Both use function folders with `function.json` + `index.js`.

---

### 4. Error Handling Pattern

**Main App:**
```javascript
context.res = {
  status: 500,
  body: JSON.stringify({ 
    error: 'Database not configured', 
    details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
  }),
  headers
};
```

**Bot:**
```javascript
context.res = {
  status: 500,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    error: 'Database not configured',
    details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required'
  })
};
```

**✅ Same pattern**: Consistent error response structure.

---

### 5. Dependency Management

**Main App (`api/package.json`):**
```json
{
  "dependencies": {
    "@azure/cosmos": "^4.6.0"
  },
  "devDependencies": {
    "@azure/functions": "^4.0.0"
  }
}
```

**Bot (`teams-bot/package.json`):**
```json
{
  "dependencies": {
    "@azure/cosmos": "^4.6.0",
    "botbuilder": "^4.22.0"
  },
  "devDependencies": {
    "@azure/functions": "^4.0.0"
  }
}
```

**✅ Aligned**: Same Cosmos and Functions versions, plus Bot Framework.

---

## Data Flow Comparison

### Main App User Flow
```
Browser → Dreamspace Web App → Azure Functions API
  → Cosmos DB (users, items, teams)
  → Response to Browser
```

### Bot User Flow
```
Teams Client → Teams Service → Azure Bot
  → Bot Function App → Cosmos DB (users, checkins, botConversations)
  → Bot Function App → Teams Service → Teams Client
```

**Key Similarity**: Both validate against `users` container.

---

## Authentication Comparison

### Main App (Web)
- **Method**: MSAL.js with Azure AD
- **Config**: `src/auth/authConfig.js`
- **Tenant**: Multi-tenant (`common`)
- **Client ID**: `ebe60b7a-93c9-4b12-8375-4ab3181000e8`

### Bot (Teams)
- **Method**: Bot Framework with Azure AD
- **Config**: Environment variables in Function App
- **Tenant**: Multi-tenant (`MicrosoftAppType=MultiTenant`)
- **Client ID**: New App ID from bot setup

**✅ Aligned**: Both use multi-tenant Azure AD.

---

## Data Schema Consistency

### Existing Container: `users`
```json
{
  "id": "aad-object-id",
  "displayName": "John Doe",
  "email": "john@example.com",
  ...
}
```

**Bot Usage**: Queries by `id` field (AAD Object ID) to validate users.

### Existing Container: `items`
```json
{
  "id": "unique-id",
  "userId": "aad-object-id",
  "type": "goal" | "milestone" | "weekly_goal",
  ...
}
```

### New Container: `checkins`
```json
{
  "id": "userId-timestamp",
  "userId": "aad-object-id",
  "type": "weekly_checkin",
  ...
}
```

**✅ Consistency**: 
- Same `userId` field (AAD Object ID)
- Same `type` pattern for categorization
- Same partition key strategy (`/userId`)

---

## Deployment Comparison

### Main App Deployment
- Static Web App (frontend)
- Function App (API)
- Cosmos DB (shared)

### Bot Deployment
- **New**: Separate Function App (bot)
- **Reuses**: Same Cosmos DB account
- **New**: Azure Bot registration

**Rationale**: Separate Function App allows independent scaling and monitoring.

---

## Configuration Files Comparison

### Main App
```
api/
├── host.json
├── local.settings.json
└── package.json
```

### Bot
```
teams-bot/
├── host.json          (same structure)
├── local.settings.json (same structure)
└── package.json       (extended)
```

**✅ Identical structure**: Easy for developers familiar with main app.

---

## Cosmos DB Container Strategy

### Existing Containers
| Container | Partition Key | Purpose |
|-----------|---------------|---------|
| `users` | `/id` | User profiles |
| `items` | `/userId` | Goals, milestones |
| `teams` | `/managerId` | Coaching relationships |

### New Bot Containers
| Container | Partition Key | Purpose |
|-----------|---------------|---------|
| `botConversations` | `/userId` | Conversation refs |
| `checkins` | `/userId` | Weekly check-ins |

**✅ Consistent pattern**: Most containers use `/userId` for user-specific data.

---

## Scaling Comparison

### Main App Scaling
- **Frontend**: Azure Static Web Apps (auto-scales)
- **API**: Consumption plan (auto-scales)
- **DB**: Manual RU/s adjustment

### Bot Scaling
- **Function App**: Consumption plan (auto-scales)
- **DB**: Shares RU/s with main app
- **Bot Service**: Azure handles scaling

**✅ Same approach**: Both use serverless consumption plans.

---

## Monitoring Comparison

### Main App Monitoring
- Application Insights on Function App
- Static Web App built-in analytics
- Cosmos DB metrics

### Bot Monitoring
- Application Insights on bot Function App
- Bot Analytics (Azure Bot Service)
- Same Cosmos DB metrics

**✅ Consistent tooling**: Both use Application Insights.

---

## Cost Structure

### Main App Costs
- Static Web App: Free tier or Standard
- Function App: ~$5-10/month
- Cosmos DB: ~$24/month (400 RU/s × 3 containers)

### Additional Bot Costs
- Function App: ~$5-10/month (separate app)
- Cosmos DB: ~$16/month (400 RU/s × 2 containers)
- Bot Service: Free (standard channels)

**Total Additional: ~$20-25/month**

---

## Security Model Comparison

### Main App Security
1. User authenticates via MSAL.js
2. Gets Azure AD token
3. Token sent to API
4. API validates token (implicit)
5. Queries Cosmos DB

### Bot Security
1. Teams sends activity to bot
2. Bot Framework validates signature
3. Bot extracts AAD Object ID
4. Queries `users` container
5. If user found, allows interaction
6. Queries/writes to Cosmos DB

**✅ Layered security**: Both validate users before DB access.

---

## Future Integration Points

### Phase 2: Bidirectional Sync
```
Web App ←→ Cosmos DB ←→ Teams Bot
```

Planned integrations:
1. **Web app displays check-ins**: Read from `checkins` container
2. **Web app triggers bot**: Write to `botConversations`, bot sends proactive message
3. **Bot notifies coaches**: When `needHelp: true`, send Teams message to coach
4. **Unified analytics**: Combine web app goals with Teams check-ins

### Phase 2: SSO Integration
```
Teams Bot → SSO → Graph API → User Profile → Auto-create in Cosmos DB
```

Will align with existing:
- `src/services/graphService.js` patterns
- Same Graph API scopes
- Same user data structure

---

## Code Quality Alignment

### Main App Standards
- DoD comments at top of files
- Early return for errors
- Minimal dependencies
- Data-testid for UI components

### Bot Standards
- ✅ Comprehensive error handling
- ✅ Early returns for validation
- ✅ Minimal dependencies (only Bot Framework + Cosmos)
- ✅ Clear logging and monitoring

**Both follow**: Production-ready, maintainable code practices.

---

## Development Workflow Alignment

### Main App Development
```bash
# Frontend
npm run dev

# API (local)
cd api
func start
```

### Bot Development
```bash
# Bot (local)
cd teams-bot
func start

# Expose for Teams
ngrok http 7071
```

**✅ Same local tools**: Both use Azure Functions Core Tools.

---

## Git Workflow

### Main App
```
main branch → development → feature branches
```

### Bot
- Lives in `teams-bot/` directory on same branch
- Shares same repo, separate deployment
- Can be developed/deployed independently

**✅ Monorepo approach**: All code in one place, easier to maintain.

---

## Documentation Patterns

### Main App Docs
```
docs-deployment/
docs-implementation-history/
docs-reference/
README.md
QUICK_REFERENCE.md
```

### Bot Docs
```
teams-bot/
├── README.md
├── DEPLOYMENT.md
├── QUICK_REFERENCE.md
├── IMPLEMENTATION_SUMMARY.md
└── manifest/README.md
```

**✅ Consistent structure**: Same doc types and organization.

---

## Summary: Why This Architecture Works

1. **Separation of Concerns**: Bot in separate Function App, clear boundaries
2. **Shared Data**: Same Cosmos DB, unified user profiles
3. **Consistent Patterns**: Same coding style, tools, and practices
4. **Independent Deployment**: Can update bot without touching main app
5. **Unified Monitoring**: Same Application Insights setup
6. **Cost Efficient**: Shares Cosmos DB account, serverless consumption plans
7. **Scalable**: Both auto-scale independently
8. **Secure**: Multi-tenant Azure AD, user validation at every step
9. **Maintainable**: Clear documentation, similar structure to main app
10. **Extensible**: Ready for Phase 2 enhancements (SSO, proactive messaging, analytics)

This architecture provides the best balance of:
- **Isolation** (separate deployments)
- **Integration** (shared data and auth)
- **Cost** (reuse existing resources)
- **Maintainability** (consistent patterns)

