# DreamSpace - Netsurit Dreams Program

A professional enterprise web application for Netsurit's Dreams Program, enabling team members to document personal dreams, set weekly goals, track progress, connect with colleagues, and receive coaching support.

## 🚀 Features

### 🏠 **Dashboard**
- Personalized welcome with user profile
- Real-time metrics: Dreams, Weekly Goals, Connects, Scorecard points
- Recent activity feed with weekly goal progress
- Quick actions for key features
- Motivational quote display
- Visual progress indicators

### 📖 **Dream Book**
- Create and manage up to 10 personal dream entries
- Rich dream details:
  - Title and category (Health, Travel, Career, Learning, etc.)
  - Detailed description with vision statement
  - Image upload with Unsplash integration
  - Progress tracking (0–100%)
  - Completion status and milestones
- Auto-save with visual feedback
- Drag-and-drop reordering
- Beautiful card-based layout with animations

### 📅 **Dream Tracker (Week Ahead)**
- Weekly goal planning with recurring templates
- Goal types: Milestones, To-Dos, Focus Areas
- Link goals to specific dreams
- Mark goals as complete with progress visualization
- Week-by-week navigation
- Template system for recurring weekly goals
- Historical goal tracking

### 🤝 **Dream Connect**
- AI-powered colleague suggestions based on shared dream categories
- Connection request system with messaging
- Photo upload for connect confirmation
- Connection history with notes and photos
- Filter by office, region, or dream category
- In-person and virtual connect support

### 👨‍🏫 **Dream Coach**
- Coaching dashboard for team leaders
- Team member overview with engagement metrics
- Coaching alerts for low engagement
- One-on-one coaching session tracking
- Team performance analytics
- Assign/unassign team members
- Weekly goal review and feedback

### 💼 **Career Book**
- Career goal tracking and development planning
- Skills assessment and gap analysis
- Development plan creation
- Career milestone tracking
- Integration with organizational career frameworks
- Progress visualization

### 🏆 **Scorecard**
- Comprehensive point tracking system:
  - Dreams created and completed
  - Weekly goals achieved
  - Dream Connects completed
  - Group participation
- Achievement levels and badges
- Historical point tracking by year
- Detailed activity history
- Visual progress charts

### 👥 **People Dashboard**
- Browse all team members by office/region
- View colleague dream books and goals
- See connection opportunities
- Filter by location, dream categories, or engagement
- Profile cards with engagement indicators

### 👨‍💼 **Admin Dashboard**
- Comprehensive system metrics and analytics
- User management (create, edit, promote to coach)
- Team assignment and coaching structure
- Engagement tracking and reporting
- Data migration tools
- System health monitoring
- Advanced filtering and search

### 🏥 **Health Monitoring**
- Real-time API endpoint health checks
- Azure Functions status monitoring
- Database connectivity verification
- Performance metrics
- Error tracking and alerting

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with Netsurit custom theme
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Authentication**: Azure AD (MSAL) with role-based access
- **State Management**: React Context + useReducer
- **Validation**: Zod schemas
- **Testing**: Vitest + React Testing Library
- **Monitoring**: Azure Application Insights

### Backend
- **Runtime**: Azure Functions (Node.js 20+)
- **Database**: Azure Cosmos DB (NoSQL)
- **Authentication**: Azure AD integration
- **Monitoring**: Application Insights
- **Storage**: Azure Blob Storage (profile/dream images)

### Architecture
- **Pattern**: 3-layer architecture (Pages → Layouts → Components)
- **API**: 30+ Azure Function endpoints
- **Data Layer**: Service-based with error handling
- **State**: Centralized with AppContext
- **Validation**: Schema-based with Zod

## 🚦 Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher
- **Azure Account**: For backend services (Cosmos DB, Functions, Storage)
- **Azure CLI**: For deployment
- **npm**: Package manager

### Installation

#### 1. Clone and Install Frontend
```bash
# Clone the repository
git clone <repository-url>
cd dreamspace

# Install frontend dependencies
npm install
```

#### 2. Install Backend Dependencies
```bash
# Install Azure Functions dependencies
cd api
npm install
cd ..
```

#### 3. Configure Environment Variables

**Frontend** (`src/utils/env.js`):
```javascript
export const ENV = {
  MODE: 'production', // or 'development'
  API_BASE_URL: 'https://your-function-app.azurewebsites.net/api',
  AZURE_CLIENT_ID: 'your-azure-ad-client-id',
  AZURE_TENANT_ID: 'your-tenant-id',
  APP_INSIGHTS_KEY: 'your-app-insights-key'
};
```

**Backend** (`api/local.settings.json`):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "your-cosmos-endpoint",
    "COSMOS_KEY": "your-cosmos-key",
    "COSMOS_DATABASE": "DreamsDB",
    "BLOB_CONNECTION_STRING": "your-blob-storage-connection",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "your-app-insights-connection"
  }
}
```

### Development

#### Run Frontend (Development Mode)
```bash
npm run dev
```
Access at `http://localhost:5173`

#### Run Backend (Azure Functions)
```bash
cd api
func start
```
Functions available at `http://localhost:7071/api`

#### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Building for Production

#### Build Frontend
```bash
npm run build
```

#### Deploy to Azure
```bash
# Deploy frontend to Azure Static Web App
npm run deploy

# Deploy backend Azure Functions
cd api
func azure functionapp publish <your-function-app-name>
```

### Smoke Tests
```bash
# Test local development
npm run smoke-test

# Test production deployment
npm run smoke-test:prod
```

## 📁 Project Structure

```
dreamspace/
├── api/                           # Azure Functions backend
│   ├── assignUserToCoach/         # Coaching assignment endpoint
│   ├── getAllUsers/               # User listing endpoint
│   ├── getConnects/               # Fetch user connections
│   ├── getItems/                  # Legacy items endpoint
│   ├── getScoring/                # Scorecard data endpoint
│   ├── getUserData/               # User profile endpoint
│   ├── getWeekGoals/              # Weekly goals endpoint
│   ├── saveDreams/                # Save dream book endpoint
│   ├── saveConnect/               # Save connection endpoint
│   ├── saveWeekGoals/             # Save weekly goals endpoint
│   ├── uploadDreamPicture/        # Dream image upload
│   ├── uploadProfilePicture/      # Profile image upload
│   ├── [30+ other endpoints]/     # Additional API functions
│   ├── utils/
│   │   └── cosmosProvider.js      # Cosmos DB client
│   ├── host.json                  # Azure Functions config
│   ├── local.settings.json        # Local environment config
│   └── package.json               # Backend dependencies
│
├── src/                           # Frontend application
│   ├── auth/
│   │   └── authConfig.js          # MSAL authentication setup
│   │
│   ├── components/                # Shared UI components
│   │   ├── Layout.jsx             # Main app layout with sidebar
│   │   ├── ErrorBoundary.jsx      # Error handling wrapper
│   │   ├── LoadingSpinner.jsx     # Loading states
│   │   ├── SaveStatus.jsx         # Auto-save indicator
│   │   ├── coach/                 # Coaching-specific components
│   │   └── [modals, widgets]/     # Feature-specific components
│   │
│   ├── config/
│   │   └── appInsights.js         # Application Insights setup
│   │
│   ├── constants/
│   │   ├── errors.js              # Error codes and messages
│   │   └── dreamInspiration.js    # Inspirational content
│   │
│   ├── context/                   # React Context providers
│   │   ├── AppContext.jsx         # Global app state
│   │   └── AuthContext.jsx        # Authentication state
│   │
│   ├── data/
│   │   └── mockData.js            # Development mock data
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuthenticatedFetch.js  # API calls with auth
│   │   ├── useDreamBook.js        # Dream book data logic
│   │   ├── useWeekGoals.js        # Weekly goals logic
│   │   ├── useDreamConnections.js # Connections logic
│   │   ├── useScorecardData.js    # Scorecard logic
│   │   ├── useCoachData.js        # Coaching logic
│   │   ├── useAdminData.js        # Admin dashboard logic
│   │   └── [other hooks]/         # Feature-specific hooks
│   │
│   ├── pages/                     # Page entry points
│   │   ├── Dashboard.jsx          # Home page (thin wrapper)
│   │   ├── DreamBook.jsx          # Dream book page
│   │   ├── DreamsWeekAhead.jsx    # Dream tracker page
│   │   ├── DreamConnect.jsx       # Connections page
│   │   ├── DreamCoach.jsx         # Coaching page
│   │   ├── CareerBook.jsx         # Career planning page
│   │   ├── Scorecard.jsx          # Points tracking page
│   │   ├── PeopleDashboard.jsx    # Team browser page
│   │   ├── AdminDashboard.jsx     # Admin page
│   │   ├── HealthCheck.jsx        # System health page
│   │   ├── dashboard/             # Dashboard components
│   │   ├── dream-book/            # Dream book components
│   │   ├── dream-tracker/         # Dream tracker components
│   │   ├── dream-connect/         # Dream connect components
│   │   ├── scorecard/             # Scorecard components
│   │   ├── people/                # People dashboard components
│   │   └── career/                # Career book components
│   │
│   ├── schemas/                   # Zod validation schemas
│   │   ├── dream.js               # Dream validation
│   │   ├── week.js                # Weekly goals validation
│   │   ├── connect.js             # Connection validation
│   │   ├── userData.js            # User profile validation
│   │   ├── scoring.js             # Scorecard validation
│   │   ├── team.js                # Team/coaching validation
│   │   └── index.js               # Schema exports
│   │
│   ├── services/                  # API service layer
│   │   ├── databaseService.js     # Dreams & user data API
│   │   ├── weekGoalService.js     # Weekly goals API
│   │   ├── connectService.js      # Connections API
│   │   ├── scoringService.js      # Scorecard API
│   │   ├── coachingService.js     # Coaching API
│   │   ├── adminService.js        # Admin operations API
│   │   ├── peopleService.js       # People browser API
│   │   ├── healthService.js       # Health check API
│   │   └── graphService.js        # Microsoft Graph API
│   │
│   ├── state/                     # State management
│   │   ├── appReducer.js          # Main reducer
│   │   ├── actions.js             # Action creators
│   │   └── actionTypes.js         # Action type constants
│   │
│   ├── utils/                     # Utility functions
│   │   ├── env.js                 # Environment configuration
│   │   ├── logger.js              # Logging utility
│   │   ├── errorHandling.js       # Error handling helpers
│   │   ├── dateUtils.js           # Date manipulation
│   │   ├── monthUtils.js          # Month/week calculations
│   │   ├── regionUtils.js         # Office/region helpers
│   │   └── toast.js               # Toast notifications
│   │
│   ├── App.jsx                    # Main app with routing
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global Tailwind styles
│
├── docs-deployment/               # Azure deployment guides
├── docs-reference/                # Technical reference docs
├── scripts/                       # Build and deployment scripts
├── public/                        # Static assets
├── index.html                     # HTML template
├── package.json                   # Frontend dependencies
├── tailwind.config.js             # Tailwind configuration
├── vite.config.js                 # Vite build config
├── vitest.config.js               # Test configuration
└── README.md                      # This file
```

## 🗄️ Database Architecture

### Cosmos DB - 6-Container Architecture

The app uses Azure Cosmos DB with a carefully designed 6-container architecture optimized for performance and scalability:

#### 1. **users** Container
- **Partition Key**: `/userId` or `/id`
- **Purpose**: User profile data only (no large arrays)
- **Structure**:
```javascript
{
  id: "user@domain.com",
  userId: "user@domain.com",
  displayName: "John Doe",
  email: "user@domain.com",
  office: "Johannesburg",
  region: "ZA",
  role: "user", // or "coach" or "admin"
  avatar: "blob-storage-url",
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z"
}
```

#### 2. **dreams** Container
- **Partition Key**: `/userId`
- **Purpose**: Aggregated dreams document per user + weekly goal templates
- **Structure**:
```javascript
{
  id: "user@domain.com_dreams",
  userId: "user@domain.com",
  dreamBook: [
    {
      id: "dream-1",
      title: "Learn Spanish",
      category: "Learning",
      description: "Become conversational...",
      progress: 45,
      imageUrl: "blob-storage-url",
      isCompleted: false,
      createdAt: "2024-01-01T00:00:00Z"
    }
  ],
  weeklyGoalTemplates: [
    {
      id: "template-1",
      title: "Practice Spanish",
      type: "recurring",
      linkedDreamId: "dream-1",
      recurrence: "weekly"
    }
  ]
}
```

#### 3. **connects** Container
- **Partition Key**: `/userId`
- **Purpose**: Individual connection documents
- **Structure**:
```javascript
{
  id: "unique-connect-id",
  userId: "user@domain.com",
  withUserId: "colleague@domain.com",
  withUserName: "Jane Smith",
  date: "2024-01-15",
  notes: "Great conversation about travel dreams",
  photoUrl: "blob-storage-url",
  sharedCategories: ["Travel", "Learning"],
  createdAt: "2024-01-15T10:30:00Z"
}
```

#### 4. **scoring** Container
- **Partition Key**: `/userId`
- **Purpose**: Yearly scoring rollups
- **Structure**:
```javascript
{
  id: "user@domain.com_2025_scoring",
  userId: "user@domain.com",
  year: 2025,
  totalPoints: 145,
  activities: [
    {
      type: "dream_created",
      points: 10,
      date: "2024-01-01",
      description: "Created dream: Learn Spanish"
    },
    {
      type: "connect_completed",
      points: 5,
      date: "2024-01-15",
      withUser: "Jane Smith"
    },
    {
      type: "weekly_goal_completed",
      points: 3,
      date: "2024-01-21",
      goalTitle: "Practice Spanish"
    }
  ]
}
```

#### 5. **teams** Container
- **Partition Key**: `/managerId`
- **Purpose**: Team relationships and coaching assignments
- **Structure**:
```javascript
{
  id: "team-coach@domain.com",
  managerId: "coach@domain.com",
  managerName: "Sarah Johnson",
  teamMembers: [
    {
      userId: "member1@domain.com",
      displayName: "John Doe",
      assignedAt: "2024-01-01T00:00:00Z"
    }
  ],
  createdAt: "2024-01-01T00:00:00Z"
}
```

#### 6. **weeks{year}** Container (e.g., `weeks2025`)
- **Partition Key**: `/userId`
- **Purpose**: Year-specific weekly goal documents
- **Structure**:
```javascript
{
  id: "user@domain.com_2025",
  userId: "user@domain.com",
  year: 2025,
  weeks: {
    "2025-W03": {
      weekStart: "2025-01-13",
      goals: [
        {
          id: "goal-1",
          title: "Practice Spanish 30 min",
          type: "milestone",
          linkedDreamId: "dream-1",
          isCompleted: false,
          completedAt: null
        }
      ]
    },
    "2025-W04": { /* ... */ }
  }
}
```

### Database Query Best Practices

1. **Always use partition key** when querying for optimal performance
2. **Week documents**: Use format `{userId}_{year}` for document ID
3. **Scoring documents**: Use format `{userId}_{year}_scoring`
4. **Minimize cross-partition queries** - design encourages single-partition operations
5. **Batch operations** when possible for bulk updates

## 🎨 Customization

### Color Palette
The app uses a professional Netsurit-branded color palette defined in `tailwind.config.js`:

**Netsurit Brand Colors:**
- `netsurit-red`: #E02C2D - Primary brand color
- `netsurit-coral`: #FF6B6B - Secondary accent
- `netsurit-orange`: #FF9A5B - Tertiary accent

**Professional Grays:**
- `professional-gray-50` through `professional-gray-900` - Full grayscale palette

**Legacy Dream Colors** (still available):
- `dream-blue`: #6366f1
- `dream-purple`: #8b5cf6
- `dream-teal`: #14b8a6
- `dream-pink`: #ec4899

### Adding New Dream Categories
Edit the dream categories in the frontend or database:

```javascript
// In components or constants
const dreamCategories = [
  "Health", "Travel", "Career", "Learning", 
  "Creative", "Financial", "Relationships", 
  "Adventure", "Spiritual", "Community",
  "Family", "Wellness", "Impact"
  // Add new categories here
];
```

### Configuring Azure Resources

#### Update Frontend Environment
Edit `src/utils/env.js`:
```javascript
export const ENV = {
  MODE: 'production',
  API_BASE_URL: 'https://your-function-app.azurewebsites.net/api',
  AZURE_CLIENT_ID: 'your-app-registration-id',
  AZURE_TENANT_ID: 'your-tenant-id',
  APP_INSIGHTS_KEY: 'your-instrumentation-key'
};
```

#### Update Backend Configuration
Edit `api/local.settings.json` for local development or configure App Settings in Azure Portal for production:
- `COSMOS_ENDPOINT`: Your Cosmos DB endpoint
- `COSMOS_KEY`: Cosmos DB access key
- `COSMOS_DATABASE`: Database name (default: `DreamsDB`)
- `BLOB_CONNECTION_STRING`: Azure Storage connection string
- `APPLICATIONINSIGHTS_CONNECTION_STRING`: App Insights connection string

## 🚀 Architecture Patterns

### 3-Layer Architecture

The app follows a strict 3-layer pattern for maintainability:

```
pages/FeatureName.jsx (thin wrapper, 3-10 lines)
    ↓
pages/feature-name/FeatureNameLayout.jsx (orchestration, <200 lines)
    ↓ uses
hooks/useFeatureName.js (data layer, <250 lines)
    ↓ uses
services/featureService.js (API calls, <200 lines)
    ↓ composes
pages/feature-name/ComponentA.jsx (presentation, <150 lines)
```

### Definition of Done (DoD)

Every file must comply with DoD requirements:
```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
```

**DoD Checklist:**
1. ✅ No fetch calls in UI components
2. ✅ Files under 400 lines
3. ✅ Early returns for loading/error states
4. ✅ ARIA roles and labels for accessibility
5. ✅ Minimal props (components take only what they need)
6. ✅ `data-testid` attributes on key nodes

### Error Handling Pattern

Services must use the `ok/fail` pattern:
```javascript
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

// Success case
return ok(data);

// Error case
return fail(ErrorCodes.NETWORK, 'Failed to fetch data');
```

### Logging Standard

Use the centralized logger with Azure Application Insights integration:
```javascript
import { logger } from '../utils/logger.js';

logger.info('module', 'Operation completed', { userId, action });
logger.error('module', 'Operation failed', { error, context });
```

## 📚 Documentation

- **Deployment**: See `docs-deployment/` for Azure setup guides
- **API Reference**: See `api/README.md` for endpoint documentation
- **Architecture**: See repo rules (`.cursorrules`) for detailed patterns
- **Schemas**: See `src/schemas/USAGE_EXAMPLES.md` for validation examples
- **Testing**: See `src/test/README.md` for testing guidelines

## 🔮 Future Enhancements

### Planned Features
- [ ] Microsoft Teams deep integration (calendar, notifications)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and insights dashboard
- [ ] AI-powered dream suggestions
- [ ] Group challenges and team goals
- [ ] Gamification enhancements
- [ ] Multi-language support
- [ ] Advanced reporting and export
- [ ] Integration with performance management systems
- [ ] Automated reminder and nudge system
- [ ] Real-time collaboration features
- [ ] Video call integration for virtual connects

### Technical Improvements
- [ ] GraphQL API layer
- [ ] Progressive Web App (PWA) support
- [ ] Offline-first architecture
- [ ] Advanced caching strategies
- [ ] Automated E2E testing
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Enhanced monitoring and alerting
- [ ] Multi-tenant architecture support

## 🔒 Security & Authentication

### Azure AD Integration
- **MSAL (Microsoft Authentication Library)** for secure authentication
- **Role-based access control**: User, Coach, Admin roles
- **Azure AD group membership** for role assignment
- **Single Sign-On (SSO)** with Netsurit accounts

### Data Security
- **HTTPS/TLS** encryption for all data in transit
- **Azure Cosmos DB encryption** at rest
- **Partition key strategy** ensures data isolation
- **Role-based API access** with token validation
- **Audit logging** via Application Insights

### Privacy
- User data partitioned by `userId` for isolation
- Profile images stored in private Azure Blob Storage
- GDPR-compliant data handling
- No third-party analytics or tracking

## 📊 Monitoring & Observability

### Application Insights Integration
- Real-time performance monitoring
- Error tracking and alerting
- Custom telemetry and metrics
- User session tracking
- API request/response logging

### Health Checks
Built-in health monitoring dashboard (`/health-check`):
- API endpoint availability
- Database connectivity
- Storage account status
- Authentication service health
- Performance metrics

### Logging Levels
```javascript
logger.debug()   // Verbose development info
logger.info()    // General operational info
logger.warn()    // Potential issues
logger.error()   // Errors requiring attention
logger.critical() // Severe system failures
```

## 🤝 Contributing

### Code Quality Standards
1. Follow the 3-layer architecture pattern
2. Comply with DoD requirements
3. Write tests for new features
4. Use Zod schemas for validation
5. Follow naming conventions
6. Document complex logic
7. Keep files under 400 lines

### Pull Request Process
1. Create feature branch from `main`
2. Follow naming: `feature/description` or `fix/description`
3. Write clear commit messages
4. Ensure all tests pass
5. Update documentation as needed
6. Request review from team

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"

# Push and create PR
git push origin feature/new-feature
```

## 📄 License

This project is **proprietary software** for Netsurit's internal use only.

**Copyright © 2024 Netsurit. All rights reserved.**

Unauthorized copying, distribution, or modification of this software is strictly prohibited.

## 💬 Support & Contact

### For Technical Support
- **Email**: support@netsurit.com
- **Internal Slack**: #dreamspace-support
- **Documentation**: See `docs-deployment/` and `docs-reference/`

### For Feature Requests
- Open an issue in the repository
- Contact the product owner
- Discuss in team meetings

### For Bug Reports
Include:
1. Description of the issue
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Browser/environment details
6. Error messages from console

## 🙏 Acknowledgments

Built with ❤️ for the Netsurit team to support personal and professional growth through the Dreams Program.

**Key Technologies:**
- React & Vite for blazing-fast development
- Azure for enterprise-grade cloud infrastructure
- Tailwind CSS for beautiful, responsive design
- Lucide React for consistent iconography
- Zod for runtime type safety

---

**Version**: 3.0 (Cosmos DB Architecture)  
**Last Updated**: November 2024  
**Maintainer**: Netsurit Development Team
