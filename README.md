# DreamSpace - Netsurit Dreams Program

A professional enterprise web application for Netsurit's Dreams Program, enabling team members to document personal dreams, set weekly goals, track progress, connect with colleagues, and collaborate with their team.

## Features

### Dashboard
- Personalized welcome with user profile and stats
- **Weekly Goals Widget**: Plan and track goals for the current week
  - Link goals to specific dreams
  - Mark goals as complete with progress visualization
  - View past weeks history
  - Automatic week rollover system
- Quick access to dreams with visual progress indicators
- Real-time metrics overview

### Dream Book
- Create and manage up to 10 personal dream entries
- Rich dream details: title, category, description, progress tracking
- **AI-Powered Image Generation**: Generate dream images using DALL-E with multiple style options
- Progress stages: Exploring, Planning, In Progress, Almost There, Achieved
- Goal tracking per dream with completion history
- Coach notes and feedback integration

### Dream Team
- Team collaboration dashboard for coaches and members
- View team members' dreams and progress
- **Meeting Attendance**: Track and record team meeting participation
- Team statistics and engagement metrics
- Coach can view and add notes to team members' dreams
- Customizable team name and info

### Dream Connect
- AI-powered colleague suggestions based on shared dream categories
- Connection request system with messaging
- Photo upload for connect confirmation
- Connection history with notes
- Filter by office, region, or dream category

### Scorecard
- Comprehensive point tracking system:
  - Dreams created and completed
  - Weekly goals achieved
  - Dream Connects completed
- Achievement levels and historical tracking by year
- Visual progress charts and activity history

### People Dashboard
- Browse all team members by office/region
- View colleague profiles and engagement
- Filter by location or dream categories

### Health Check
- Real-time API endpoint health monitoring
- Database connectivity verification
- System status overview

## Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with Netsurit custom theme
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Authentication**: Azure AD (MSAL) with role-based access
- **State Management**: React Context + useReducer
- **Validation**: Zod schemas
- **Testing**: Vitest + React Testing Library

### Backend
- **Runtime**: Azure Functions (Node.js 20+)
- **Database**: Azure Cosmos DB (NoSQL)
- **AI Services**: OpenAI (DALL-E, GPT) via backend proxy
- **Storage**: Azure Blob Storage (images)
- **Monitoring**: Azure Application Insights

## Getting Started

### Prerequisites
- Node.js 18+
- Azure Account (Cosmos DB, Functions, Storage)
- npm

### Installation

```bash
# Clone and install frontend
git clone <repository-url>
cd dreamspace
npm install

# Install backend dependencies
cd api
npm install
cd ..
```

### Configuration

**Frontend** (`src/utils/env.js`):
```javascript
export const ENV = {
  MODE: 'production',
  API_BASE_URL: 'https://your-function-app.azurewebsites.net/api',
  AZURE_CLIENT_ID: 'your-azure-ad-client-id',
  AZURE_TENANT_ID: 'your-tenant-id'
};
```

**Backend** (`api/local.settings.json`):
```json
{
  "Values": {
    "COSMOS_ENDPOINT": "your-cosmos-endpoint",
    "COSMOS_KEY": "your-cosmos-key",
    "COSMOS_DATABASE": "DreamsDB",
    "BLOB_CONNECTION_STRING": "your-blob-storage-connection",
    "OPENAI_API_KEY": "your-openai-key"
  }
}
```

### Development

```bash
# Run frontend
npm run dev
# Access at http://localhost:5173

# Run backend (in separate terminal)
cd api
func start
# Functions at http://localhost:7071/api
```

### Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Project Structure

```
dreamspace/
├── api/                    # Azure Functions backend
│   ├── [function-name]/    # Individual API endpoints
│   │   ├── function.json   # Function configuration
│   │   └── index.js        # Function handler
│   ├── utils/              # Shared utilities
│   │   ├── repositories/   # Data access layer
│   │   └── cosmosProvider.js
│   └── package.json
│
├── src/                    # Frontend application
│   ├── auth/               # MSAL authentication
│   ├── components/         # Shared UI components
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   │   ├── dashboard/      # Dashboard feature
│   │   ├── dream-book/     # Dream Book feature
│   │   ├── dream-team/     # Dream Team feature
│   │   ├── dream-connect/  # Dream Connect feature
│   │   ├── scorecard/      # Scorecard feature
│   │   └── people/         # People Dashboard feature
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # API service layer
│   ├── state/              # State management
│   └── utils/              # Utility functions
│
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
└── public/                 # Static assets
```

## Database Architecture

### Cosmos DB - 9-Container Architecture

| Container | Partition Key | Purpose |
|-----------|--------------|---------|
| **users** | `/userId` | User profiles |
| **dreams** | `/userId` | Dreams and goal templates per user |
| **connects** | `/userId` | Connection records |
| **scoring** | `/userId` | Yearly scoring rollups |
| **teams** | `/managerId` | Team relationships and coaching |
| **currentWeek** | `/userId` | Active week goals (one doc per user) |
| **pastWeeks** | `/userId` | Historical week summaries |
| **meeting_attendance** | `/teamId` | Team meeting attendance records |
| **prompts** | `/partitionKey` | AI prompt configurations and history |

### Key Patterns
- Always query with partition key for optimal performance
- Current week auto-rolls over to pastWeeks weekly
- Repository pattern for data access (`api/utils/repositories/`)

## Architecture Patterns

### 3-Layer Architecture
```
pages/Feature.jsx (thin wrapper)
    ↓
pages/feature/FeatureLayout.jsx (orchestration)
    ↓ uses
hooks/useFeature.js (data layer)
    ↓ uses
services/featureService.js (API calls)
```

### Definition of Done (DoD)
Every file must comply with:
- No fetch calls in UI components
- Files under 400 lines
- Early returns for loading/error states
- ARIA roles and labels for accessibility
- `data-testid` attributes on key nodes

### Error Handling
Services use the `ok/fail` pattern:
```javascript
import { ok, fail } from '../utils/errorHandling.js';
return ok(data);      // Success
return fail(ErrorCodes.NETWORK, 'Message'); // Error
```

## AI Features

### DALL-E Image Generation
- Generate dream images with customizable styles
- Style options: Stylized Digital, Vibrant Coastal, Semi-Realistic, Photorealistic
- Custom style text support
- Backend proxy for secure API key handling

### GPT Vision Statements
- Generate visionary year statements from user input
- Polish and improve existing vision text
- Integrates with user's dream data for personalized content

### Prompt Management (Admin)
- Configurable AI prompts stored in Cosmos DB
- Version history with restore capability
- Test panel for validating prompt changes

## Security

- **Authentication**: Azure AD with MSAL, SSO with Netsurit accounts
- **Authorization**: Role-based access (User, Coach)
- **Data**: HTTPS/TLS in transit, Cosmos DB encryption at rest
- **Isolation**: User data partitioned by `userId`

## Contributing

1. Follow the 3-layer architecture pattern
2. Comply with DoD requirements
3. Write tests for new features
4. Use Zod schemas for validation
5. Keep files under 400 lines

### Pull Request Process
```bash
git checkout -b feature/description
# Make changes
git commit -m "feat: Add feature"
git push origin feature/description
```

## License

**Proprietary software** for Netsurit internal use only.

Copyright 2024-2025 Netsurit. All rights reserved.

## Support

- **Email**: support@netsurit.com
- **Documentation**: See `docs/` folder

---

**Version**: 4.0  
**Last Updated**: January 2025  
**Maintainer**: Netsurit Development Team
