# DreamSpace - Architecture & Context

**Project**: Netsurit Dreams Program Internal Web Application  
**Purpose**: Help team members document dreams, track progress, connect with colleagues, and receive coaching support  
**Status**: Production (Active Development)  
**Deployment**: Azure Static Web Apps + Azure Functions

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Folder Structure](#folder-structure)
5. [Key Patterns](#key-patterns)
6. [API Conventions](#api-conventions)
7. [UI & Styling](#ui--styling)
8. [Authentication](#authentication)
9. [Deployment](#deployment)
10. [Constraints & Rules](#constraints--rules)
11. [Assumptions to Verify](#assumptions-to-verify)

---

## Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.5.0
- **Styling**: Tailwind CSS 3.3.5 (custom Netsurit palette)
- **Icons**: Lucide React 0.292.0
- **Routing**: React Router DOM 6.20.1
- **State**: React Context + useReducer pattern
- **Auth**: @azure/msal-browser 3.30.0, @azure/msal-react 2.2.0
- **Validation**: Zod 3.22.4
- **Testing**: Vitest 1.0.4, React Testing Library, jsdom

### Backend
- **Platform**: Azure Functions v4 (Node.js 20+)
- **Database**: Azure Cosmos DB (SQL API)
- **Storage**: Azure Blob Storage (for profile pictures, dream images)
- **Monitoring**: Azure Application Insights
- **APIs**: Microsoft Graph API v1.0

### Development
- **Package Manager**: npm
- **Linter**: ESLint 8.53.0
- **Dev Server**: Vite (port 5173)
- **API Local**: Azure Functions Core Tools (port 7071)

---

## Architecture

### Frontend Architecture: Three-Layer Pattern

The application follows a strict three-layer architecture for all features:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Entry Point (Thin Wrapper)                    │
│  pages/FeatureName.jsx (3-10 lines)                     │
│  - Re-exports Layout component                          │
│  - Maintains backward compatibility                     │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Orchestration (Layout Component)              │
│  pages/feature-name/FeatureNameLayout.jsx (<200 lines)  │
│  - Composes presentation components                     │
│  - Manages local UI state (tabs, modals, filters)       │
│  - Uses custom data hook for business logic             │
│  - Early returns for loading/error states               │
│  - Handles user interactions                            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Data Layer (Custom Hook)                      │
│  hooks/useFeatureName.js (<250 lines)                   │
│  - Encapsulates all data fetching                       │
│  - Business logic and computations                      │
│  - Memoization with useMemo/useCallback                 │
│  - Calls service layer for API operations               │
│  - Returns minimal, focused API to Layout               │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Service Layer                                           │
│  services/featureService.js (<200 lines)                │
│  - All fetch/HTTP calls                                 │
│  - Error handling (ok/fail pattern)                     │
│  - No UI logic                                           │
│  - Returns { success, data?, error? }                   │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Presentation Components                                 │
│  pages/feature-name/ComponentA.jsx (<150 lines)         │
│  - Pure presentation logic                              │
│  - Receives data via props                              │
│  - Emits events via callbacks                           │
│  - Reusable and testable                                │
└─────────────────────────────────────────────────────────┘
```

### Successfully Refactored Features
- ✅ People Dashboard (`pages/people/`)
- ✅ Scorecard (`pages/scorecard/`)
- ✅ Career Book (`pages/career/`)
- ✅ Dream Connect (`pages/dream-connect/`)
- ✅ Dream Tracker (`pages/dream-tracker/`)

### Needs Refactoring
- ❌ Dream Book (`pages/DreamBook.jsx` - 1,150 lines, monolithic)
- ❌ Dashboard (`pages/Dashboard.jsx`)
- ❌ Week Ahead (`pages/DreamsWeekAhead.jsx`)

---

## Database Schema

### Cosmos DB: 6-Container Architecture

DreamSpace uses a **6-container architecture** for optimal performance and scalability:

#### Container 1: `users`
- **Partition Key**: `/userId` or `/id`
- **Purpose**: User profiles ONLY (no large arrays)
- **Document Structure**:
  ```json
  {
    "id": "user@example.com",
    "userId": "user@example.com",
    "name": "John Doe",
    "email": "user@example.com",
    "office": "Cape Town",
    "avatar": "https://...",
    "role": "user|coach|manager|admin",
    "isCoach": false,
    "assignedCoachId": "coach@example.com",
    "assignedTeamName": "Team Alpha",
    "score": 150,
    "dreamsCount": 5,
    "connectsCount": 3,
    "dataStructureVersion": 3,
    "lastUpdated": "2025-11-08T10:30:00.000Z"
  }
  ```

#### Container 2: `dreams`
- **Partition Key**: `/userId`
- **Purpose**: Aggregated dreams document per user (one doc per user)
- **Document Structure**:
  ```json
  {
    "id": "user@example.com",
    "userId": "user@example.com",
    "dreamBook": [
      {
        "id": "dream_123",
        "title": "Run a Marathon",
        "category": "Health & Fitness",
        "description": "Complete my first marathon",
        "progress": 45,
        "image": "https://...",
        "goals": [...],
        "notes": [...],
        "history": [...],
        "createdAt": "2025-01-15T...",
        "updatedAt": "2025-11-08T..."
      }
    ],
    "weeklyGoalTemplates": [
      {
        "id": "template_456",
        "type": "weekly_goal_template",
        "title": "Run 5km",
        "dreamId": "dream_123",
        "targetWeeks": 12,
        "startDate": "2025-01-15",
        "active": true
      }
    ],
    "createdAt": "2025-01-15T...",
    "updatedAt": "2025-11-08T..."
  }
  ```

#### Container 3: `connects`
- **Partition Key**: `/userId`
- **Purpose**: Individual connect documents
- **Document Structure**:
  ```json
  {
    "id": "connect_789",
    "userId": "user@example.com",
    "withWhom": "colleague@example.com",
    "withWhomName": "Jane Smith",
    "dreamId": "dream_123",
    "when": "2025-11-01T14:30:00.000Z",
    "where": "Office Coffee Shop",
    "notes": "Great conversation about marathon training",
    "selfieUrl": "https://...",
    "createdAt": "2025-11-01T..."
  }
  ```

#### Container 4: `scoring`
- **Partition Key**: `/userId`
- **Purpose**: Yearly scoring rollups per user
- **Document ID Format**: `{userId}_{year}_scoring`
- **Document Structure**:
  ```json
  {
    "id": "user@example.com_2025_scoring",
    "userId": "user@example.com",
    "year": 2025,
    "totalScore": 150,
    "entries": [
      {
        "id": "score_001",
        "type": "dream|week|connect|goal",
        "points": 10,
        "description": "Completed weekly goal",
        "timestamp": "2025-11-08T...",
        "metadata": { "weekId": "2025-W45", "dreamId": "dream_123" }
      }
    ],
    "lastUpdated": "2025-11-08T..."
  }
  ```

#### Container 5: `teams`
- **Partition Key**: `/managerId`
- **Purpose**: Team relationships and coaching assignments
- **Document Structure**:
  ```json
  {
    "id": "team_coach@example.com_123456789",
    "managerId": "coach@example.com",
    "managerName": "John Coach",
    "teamName": "Team Alpha",
    "teamMembers": [
      {
        "userId": "member@example.com",
        "name": "Member Name",
        "assignedAt": "2025-01-15T..."
      }
    ],
    "createdAt": "2025-01-15T...",
    "updatedAt": "2025-11-08T..."
  }
  ```

#### Container 6: `weeks{year}` (Dynamic)
- **Container Name**: `weeks2025`, `weeks2026`, etc. (year-specific)
- **Partition Key**: `/userId`
- **Purpose**: Week-by-week goal instances for a specific year
- **Document ID Format**: `{userId}_{year}`
- **Document Structure**:
  ```json
  {
    "id": "user@example.com_2025",
    "userId": "user@example.com",
    "year": 2025,
    "weeks": {
      "2025-W01": {
        "goals": [
          {
            "id": "goal_instance_001",
            "templateId": "template_456",
            "type": "weekly_goal",
            "title": "Run 5km",
            "dreamId": "dream_123",
            "weekId": "2025-W01",
            "completed": true,
            "completedAt": "2025-01-07T...",
            "createdAt": "2025-01-01T..."
          }
        ]
      },
      "2025-W02": { "goals": [...] },
      "...": "52-53 weeks per year"
    },
    "createdAt": "2025-01-01T...",
    "updatedAt": "2025-11-08T..."
  }
  ```

### Data Migration Strategy
- **V1** (legacy): Monolithic user documents with all data in arrays
- **V2** (deprecated): 3-container split (items container)
- **V3** (current): 6-container with aggregated dreams and year-specific weeks
- Migration handled automatically by `getUserData` and `saveUserData` API functions
- `dataStructureVersion` field tracks user's current version

### Query Patterns
- **Get user profile**: `SELECT * FROM c WHERE c.id = @userId` (users container)
- **Get user dreams**: `SELECT * FROM c WHERE c.id = @userId` (dreams container, returns aggregated doc)
- **Get user connects**: `SELECT * FROM c WHERE c.userId = @userId ORDER BY c.when DESC` (connects container)
- **Get week goals**: Read week document by ID `{userId}_{year}`, extract `weeks[weekId].goals`
- **Get team members**: `SELECT * FROM c WHERE c.managerId = @coachId` (teams container)

---

## Folder Structure

```
dreamspace/
├── api/                              # Azure Functions backend
│   ├── functionName/                 # Each function in own folder
│   │   ├── index.js                  # Function logic
│   │   └── function.json             # Function bindings
│   ├── utils/
│   │   └── cosmosProvider.js         # Cosmos DB client singleton
│   ├── host.json                     # Functions host config
│   ├── package.json                  # Backend dependencies
│   └── local.settings.json.example   # Example local config
│
├── src/                              # Frontend source
│   ├── pages/                        # Page components
│   │   ├── FeatureName.jsx          # Thin wrapper (3-10 lines)
│   │   └── feature-name/            # Feature subdirectory
│   │       ├── FeatureNameLayout.jsx    # Orchestration (<200 lines)
│   │       ├── ComponentA.jsx           # Presentation (<150 lines)
│   │       └── ComponentB.jsx
│   │
│   ├── components/                   # Shared components
│   │   ├── Layout.jsx               # Main app layout + sidebar
│   │   ├── ErrorBoundary.jsx        # Error boundary
│   │   ├── LoadingSpinner.jsx       # Loading states
│   │   ├── SaveStatus.jsx           # Auto-save indicator
│   │   └── modals/                  # Shared modals
│   │
│   ├── hooks/                        # Custom hooks (data layer)
│   │   ├── useFeatureName.js        # Feature-specific hook
│   │   ├── useDashboardData.js
│   │   ├── usePeopleData.js
│   │   └── useAuthenticatedFetch.js
│   │
│   ├── services/                     # API service layer
│   │   ├── databaseService.js       # User data persistence
│   │   ├── itemService.js           # Individual items (dreams, goals)
│   │   ├── weekService.js           # Week goal operations
│   │   ├── connectService.js        # Connects operations
│   │   ├── scoringService.js        # Scoring operations
│   │   ├── peopleService.js         # People/team operations
│   │   └── graphService.js          # Microsoft Graph API
│   │
│   ├── context/                      # React Context
│   │   ├── AppContext.jsx           # Global app state
│   │   └── AuthContext.jsx          # Authentication state
│   │
│   ├── schemas/                      # Zod validation schemas
│   │   ├── dream.js                 # Dream schemas
│   │   ├── person.js                # Person/user schemas
│   │   ├── team.js                  # Team schemas
│   │   ├── week.js                  # Week goal schemas
│   │   └── index.js                 # Schema exports
│   │
│   ├── utils/                        # Utilities
│   │   ├── env.js                   # Environment validation (Zod)
│   │   ├── logger.js                # Logging utility
│   │   ├── errorHandling.js         # ok/fail helpers
│   │   ├── dateUtils.js             # Date utilities (ISO weeks)
│   │   ├── monthUtils.js            # Month utilities
│   │   └── toast.js                 # Toast notifications
│   │
│   ├── constants/                    # Constants
│   │   ├── errors.js                # Error codes
│   │   └── dreamInspiration.js      # Dream templates
│   │
│   ├── data/                         # Mock data (development)
│   │   └── mockData.js              # Mock user data
│   │
│   ├── auth/                         # Authentication
│   │   └── authConfig.js            # MSAL configuration
│   │
│   ├── config/                       # Configuration
│   │   └── appInsights.js           # Application Insights setup
│   │
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # React entry point
│   └── index.css                     # Global styles (Tailwind)
│
├── docs-deployment/                  # Deployment documentation
├── docs-reference/                   # Reference docs (standards)
├── docs-implementation-history/      # Implementation history
├── scripts/                          # PowerShell/Bash setup scripts
├── public/                           # Static assets
├── dist/                             # Build output
│
├── package.json                      # Frontend dependencies
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
├── staticwebapp.config.json          # Azure SWA config
└── .env                              # Environment variables (not committed)
```

---

## Key Patterns

### 1. Definition of Done (DoD)
Every file MUST start with this comment and comply with all criteria:

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.
```

**Criteria:**
1. No fetch in UI components (use services/hooks)
2. Files under 400 lines
3. Early returns for loading/error states
4. ARIA roles and labels on interactive elements
5. Components accept minimal props (avoid prop drilling)
6. Key testable elements have `data-testid` attributes

### 2. Error Handling Pattern

**Services must return:**
```javascript
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

// Success
return ok(data);

// Failure
return fail(ErrorCodes.NETWORK, 'Failed to fetch data');
```

**Response format:**
```javascript
{ success: true, data: {...} }
{ success: false, error: 'Error message' }
```

**Never use `throw` in services** - always return ok/fail.

### 3. Logging Pattern

```javascript
import { logger } from '../utils/logger.js';
// OR
import { createLogger } from '../utils/logger.js';
const log = createLogger('module-name');

// Usage
logger.debug('auth', 'Token validated', { userId: '123' });
logger.info('api', 'Data loaded', { count: 10 });
logger.warn('storage', 'Quota at 80%', { used: '8MB' });
logger.error('network', 'Fetch failed', { url: '/api/users' });
logger.critical('system', 'DB connection lost', { attempts: 3 });
```

### 4. Schema Validation

All external data MUST be validated with Zod schemas:

```javascript
import { parseDreamList } from '../schemas';

const dreams = parseDreamList(userData?.dreamBook);
// dreams is now validated Dream[] with fallback defaults
```

### 5. Memoization Pattern

```javascript
// In hooks:
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 6. Early Return Pattern

```javascript
function MyComponent({ data, loading, error }) {
  // Handle loading
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Handle error
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  // Handle empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }
  
  // Main render
  return <MainContent data={data} />;
}
```

### 7. Context Pattern

Two main contexts:
- **AuthContext**: User authentication, MSAL instance, login/logout
- **AppContext**: Global app state (dreams, goals, connects, scoring)

```javascript
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const { user, isAuthenticated, login, logout } = useAuth();
const { currentUser, dreamBook, weeklyGoals, updateDream } = useApp();
```

---

## API Conventions

### Azure Functions Structure

Each function follows this pattern:

```javascript
const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  
  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }
  
  // Extract parameters
  const userId = context.bindingData.userId;
  
  // Validate input
  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID required' }),
      headers
    };
    return;
  }
  
  try {
    // Business logic here
    const result = await doSomething(userId);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ success: true, data: result }),
      headers
    };
  } catch (error) {
    context.log.error('Error:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};
```

### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/getUserData/{userId}` | GET | Load user data (all containers) |
| `/api/saveUserData/{userId}` | POST | Save user profile |
| `/api/saveDreams` | POST | Save dreams document |
| `/api/saveItem` | POST | Save individual item |
| `/api/saveWeekGoals` | POST | Save week goals |
| `/api/getWeekGoals/{userId}/{year}` | GET | Get week goals for year |
| `/api/saveConnect` | POST | Save connect |
| `/api/getConnects/{userId}` | GET | Get user connects |
| `/api/getAllUsers` | GET | Get all users (admin) |
| `/api/assignUserToCoach` | POST | Assign user to coach |
| `/api/promoteUserToCoach` | POST | Promote user to coach |

---

## UI & Styling

### Tailwind Custom Colors

```javascript
// Netsurit brand colors
'netsurit-red': '#EC4B5C',
'netsurit-coral': '#F56565',
'netsurit-orange': '#FF8A50',

// Legacy dream colors
'dream-blue': '#4A90E2',
'dream-purple': '#7B68EE',
'dream-teal': '#20B2AA',
'dream-pink': '#EC4B5C',

// Professional grays
'professional-gray-50' through 'professional-gray-900'
```

### Component Patterns

- **Layout**: `components/Layout.jsx` - Sidebar navigation + main content area
- **Sidebar**: Always visible on desktop, hamburger menu on mobile
- **Icons**: Lucide React (e.g., `<Home />`, `<BookOpen />`)
- **Modals**: Lazy-loaded with React.lazy, full-screen overlay
- **Cards**: Rounded corners, shadow, hover effects
- **Buttons**: Tailwind button classes, hover states

### Accessibility Requirements

- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`
- ARIA labels: `aria-label`, `aria-labelledby`, `aria-describedby`
- Roles: `role="button"`, `role="dialog"`, `role="tablist"`
- Keyboard navigation: Tab, Enter, Escape
- Focus management: Trap focus in modals, return focus on close

---

## Authentication

### Microsoft Entra ID (Azure AD)

- **Library**: @azure/msal-browser, @azure/msal-react
- **Config**: `src/auth/authConfig.js`
- **Client ID**: From environment variable `VITE_AZURE_CLIENT_ID`
- **Scopes**: `["User.Read", "profile", "openid", "email"]`
- **Redirect URI**: Dynamically determined based on hostname

### Auth Flow

1. User clicks "Sign in with Microsoft"
2. MSAL redirects to Microsoft login
3. User authenticates
4. MSAL receives token
5. App fetches user profile from Microsoft Graph API
6. App loads user data from Cosmos DB (or creates new profile)
7. User redirected to Dashboard

### User Roles

- **user**: Regular team member
- **coach**: Can view/manage team members
- **manager**: Same as coach (legacy)
- **admin**: Full access to People Hub and user management

Roles stored in `users` container, `role` field.

---

## Deployment

### Azure Static Web Apps
- **Frontend**: Vite build output (`dist/`) deployed to Azure SWA
- **GitHub Actions**: Auto-deploy on push to `main`
- **Custom Domain**: dreamspace.tylerstewart.co.za

### Azure Functions
- **Backend**: Deployed to separate Azure Function App
- **Runtime**: Node.js 20+
- **Trigger**: HTTP
- **CORS**: Enabled for all origins (internal app)

### Environment Variables

**Frontend (.env):**
```bash
VITE_APP_ENV=production
VITE_AZURE_CLIENT_ID=<your-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/
VITE_COSMOS_KEY=<your-primary-key>
VITE_API_BASE_URL=/api
VITE_UNSPLASH_ACCESS_KEY=<optional>
VITE_APPINSIGHTS_CONNECTION_STRING=<optional>
```

**Backend (Azure Functions App Settings):**
```bash
COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/
COSMOS_KEY=<your-primary-key>
APPINSIGHTS_INSTRUMENTATIONKEY=<optional>
```

---

## Constraints & Rules

### Hard Constraints

1. **No full file rewrites** without explicit user approval
2. **No new files** without explicit user approval
3. **Files must be < 400 lines** (break into smaller files if needed)
4. **No fetch in UI components** (use services/hooks)
5. **All services return `{ success, data?, error? }`** format
6. **All Cosmos DB queries must include partition key**
7. **Weeks containers are year-specific** (e.g., weeks2025)
8. **Users container has profile only** (no large arrays)

### Soft Constraints (Guidelines)

- Prefer small, targeted edits over large changes
- Preserve existing code style and patterns
- Use Zod schemas for all external data validation
- Log all significant operations with logger utility
- Test accessibility with keyboard navigation
- Optimize performance with memoization

### Anti-Patterns to Avoid

❌ Fetch calls in components  
❌ Files over 400 lines  
❌ Throwing errors in services  
❌ Missing DoD comment  
❌ Hardcoded API URLs  
❌ Direct localStorage access in components  
❌ Missing ARIA attributes  
❌ Prop drilling (use context or composition)  
❌ Full file rewrites  
❌ Changing file structure without approval  

---

## Assumptions to Verify

### Database
- ✅ Confirmed: 6-container architecture is active
- ✅ Confirmed: Partition keys are `/userId` (or `/id` for users) and `/managerId` for teams
- ✅ Confirmed: Year-specific weeks containers (e.g., weeks2025)
- ⚠️ Assumption: All existing users have been migrated to V3 structure
- ⚠️ Assumption: Scoring container uses `{userId}_{year}_scoring` format for document IDs

### API
- ✅ Confirmed: Azure Functions backend is separate from frontend
- ✅ Confirmed: CORS is enabled for all origins
- ✅ Confirmed: API base URL is `/api` (proxied in dev, direct in prod)
- ⚠️ Assumption: All API endpoints return JSON with proper content-type

### Authentication
- ✅ Confirmed: MSAL for Azure AD authentication
- ✅ Confirmed: User roles stored in users container
- ⚠️ Assumption: All users must have an Azure AD account to access the app
- ⚠️ Assumption: Role-based access control (RBAC) is enforced at the API level

### UI/UX
- ✅ Confirmed: Mobile-responsive design
- ✅ Confirmed: Auto-save with visual feedback
- ⚠️ Assumption: All users have modern browsers (ES6+ support)
- ⚠️ Assumption: Internet connection is generally reliable

### Deployment
- ✅ Confirmed: Azure Static Web Apps for frontend
- ✅ Confirmed: Azure Functions for backend
- ⚠️ Assumption: CI/CD pipeline is configured via GitHub Actions
- ⚠️ Assumption: Production environment variables are set in Azure Portal

---

## Quick Reference

### Dream Categories
- Family & Friends
- Skills & Hobbies
- Growth & Learning
- Spirituality & Mind
- Adventure & Fun
- Love & Relationships
- Wellness & Fitness
- Money & Wealth
- Contribution & Giving Back

### Scoring Rules
- Dream completed: 10 points
- Dream Connect: 5 points
- Group attendance: 3 points
- Milestone completed: 15 points
- Weekly goal completed: 3 points

### ISO Week Format
- Format: `YYYY-Www` (e.g., `2025-W45`)
- Week starts Monday, ends Sunday
- Utility: `getCurrentIsoWeek()` in `utils/dateUtils.js`

---

## Notes

- This codebase is under active development
- Standards compliance is ~65% (see CODING_STANDARDS_COMPLIANCE_REPORT.md)
- Priority: Refactor DreamBook.jsx (1,150 lines) to three-layer pattern
- The application uses a "pilot scope" approach - some features are "Coming Soon"
- Demo user: sarah.johnson@netsurit.com (for testing)

---

**Last Updated**: November 8, 2025  
**Maintained By**: Development Team  
**Version**: 1.0.0

