# DreamSpace - Quick Reference Guide

> **Last Updated:** October 22, 2025 (After major cleanup)

---

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Smoke test (local)
npm run smoke-test

# Smoke test (production)
npm run smoke-test:prod
```

---

## 🔧 Deployment

### Deploy Web App to Azure
```powershell
# Full webapp deployment (recommended)
.\DEPLOY_WEBAPP_AZURE_FIXED.ps1

# Quick verification
.\VERIFY_DEPLOYMENT.ps1
```

### Deploy Azure Functions API
```powershell
# Deploy/update API functions only
.\DEPLOY_FUNCTIONS_SIMPLE.ps1 `
  -FunctionAppName "func-dreamspace-prod" `
  -ResourceGroup "rg_Dreams2025Dev"
```

### Deploy 3-Container Database Migration
```powershell
# If migrating to new architecture
.\DEPLOY_NOW.ps1 `
  -ResourceGroupName "rg_Dreams2025Dev" `
  -CosmosAccountName "cosmos-dreamspace-prod-20251013"
```

---

## 🌱 Seed Demo Data

### Recommended Method (Via API)
```bash
# Local development
node scripts/seed-sarah-demo-data.js http://localhost:7071/api

# Production
node scripts/seed-sarah-demo-data.js https://func-dreamspace-prod.azurewebsites.net/api
```

### Using Web Interface
Navigate to: `https://dreamspace.tylerstewart.co.za/add-production-demo-users.html`

---

## 🏗️ Project Structure

```
dreamspace/
├── api/                           # Azure Functions (24 endpoints)
│   ├── getUserData/              # Fetch user data
│   ├── saveUserData/             # Save user data
│   ├── getAllUsers/              # Get all users (admin)
│   ├── getTeamRelationships/     # Coach team data
│   ├── saveItem/                 # Save individual items
│   ├── getItems/                 # Fetch user items
│   └── ...                       # Other endpoints
│
├── src/                          # React application
│   ├── components/              # Reusable components
│   │   ├── career/              # Career-related components
│   │   ├── coach/               # Coaching components
│   │   └── ...
│   ├── pages/                   # Page components
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── DreamBook.jsx        # Dream book page
│   │   ├── DreamCoach.jsx       # Coaching page
│   │   └── ...
│   ├── services/                # API services
│   │   ├── api.js               # Core API wrapper
│   │   ├── userService.js       # User data service
│   │   └── itemService.js       # Item data service
│   ├── schemas/                 # Zod validation schemas
│   ├── hooks/                   # Custom React hooks
│   └── context/                 # React context providers
│
├── public/                       # Static files
│   ├── add-production-demo-users.html
│   ├── api-diagnostic.html
│   ├── clear-cache.html
│   └── setup-sarah-demo.html
│
├── scripts/                      # Utility scripts
│   └── seed-sarah-demo-data.js  # Demo data seeding
│
├── docs-deployment/              # Deployment guides
├── docs-reference/               # Reference documentation
└── docs-new-tenant-deployment/   # Multi-tenant setup
```

---

## 🔑 Key Files

### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Styling configuration
- `staticwebapp.config.json` - Azure routing config
- `vitest.config.js` - Test configuration

### Deployment Scripts
- `DEPLOY_WEBAPP_AZURE_FIXED.ps1` - Deploy webapp to Azure
- `DEPLOY_FUNCTIONS_SIMPLE.ps1` - Deploy Azure Functions
- `DEPLOY_NOW.ps1` - 3-container migration
- `VERIFY_DEPLOYMENT.ps1` - Verify deployment
- `AZURE_SETUP_COMMANDS.ps1` - Initial Azure setup

---

## 🔐 Environment Variables

### Azure Function App Settings
Required in Azure Portal → Function App → Configuration:
```
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-primary-key
```

### Local Development (api/local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-primary-key"
  }
}
```

⚠️ **Never commit local.settings.json to git!**

---

## 📊 Database Structure

### Cosmos DB Containers

#### 1. **users** (Partition Key: `/userId`)
Stores user profiles, basic info, and references to other data.

#### 2. **items** (Partition Key: `/userId`)
Stores user's dreams, career goals, and development plans.

#### 3. **teams** (Partition Key: `/managerId`)
Stores coaching team relationships and metadata.

---

## 🌐 API Endpoints

### Base URLs
- **Local:** `http://localhost:7071/api`
- **Production:** `https://func-dreamspace-prod.azurewebsites.net/api`

### User Endpoints
- `GET /api/getUserData/{userId}` - Get user data
- `POST /api/saveUserData/{userId}` - Save user data
- `GET /api/getAllUsers` - Get all users (admin)
- `POST /api/updateUserProfile/{userId}` - Update user profile

### Item Endpoints
- `GET /api/getItems/{userId}` - Get user's items
- `POST /api/saveItem/{userId}` - Save single item
- `POST /api/batchSaveItems/{userId}` - Save multiple items
- `DELETE /api/deleteItem/{userId}/{itemId}` - Delete item

### Coaching Endpoints
- `GET /api/getTeamRelationships/{coachId}` - Get coach's team
- `GET /api/getTeamMetrics/{coachId}` - Get team metrics
- `GET /api/getCoachingAlerts/{coachId}` - Get coaching alerts
- `POST /api/assignUserToCoach` - Assign user to coach
- `POST /api/promoteUserToCoach/{userId}` - Promote to coach
- `POST /api/replaceTeamCoach` - Replace team coach

### Utility Endpoints
- `GET /api/health` - Health check
- `POST /api/refreshAllUsers` - Refresh user data
- `POST /api/cleanupTeams` - Cleanup invalid teams

---

## 🐛 Troubleshooting

### API Not Responding
```powershell
# Check Azure Functions status
az functionapp show `
  --name func-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --query "state"

# View recent logs
az functionapp log tail `
  --name func-dreamspace-prod `
  --resource-group rg_Dreams2025Dev
```

### Build Issues
```bash
# Clear all caches and reinstall
rm -rf node_modules dist .vite
npm install
npm run build
```

### Cosmos DB Connection Issues
1. Verify credentials in Azure Portal
2. Check firewall settings (allow Azure services)
3. Verify connection string format
4. Check if keys have been rotated

---

## 📝 Common Tasks

### Add New Azure Function
1. Create folder in `api/` (e.g., `api/myNewFunction/`)
2. Add `function.json` with configuration
3. Add `index.js` with handler
4. Deploy: `.\DEPLOY_FUNCTIONS_SIMPLE.ps1`

### Add New Page
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation in `src/components/Layout.jsx`

### Update Schema
1. Edit schema in `src/schemas/`
2. Update service in `src/services/`
3. Update components using the data
4. Run tests: `npm test`

---

## 🔗 Important URLs

### Production
- **App:** https://dreamspace.tylerstewart.co.za
- **API:** https://func-dreamspace-prod.azurewebsites.net/api
- **Health Check:** https://func-dreamspace-prod.azurewebsites.net/api/health

### Development Tools
- **API Diagnostic:** https://dreamspace.tylerstewart.co.za/api-diagnostic.html
- **Clear Cache:** https://dreamspace.tylerstewart.co.za/clear-cache.html
- **Add Demo Users:** https://dreamspace.tylerstewart.co.za/add-production-demo-users.html

### Azure Portal
- **Resource Group:** [rg_Dreams2025Dev](https://portal.azure.com)
- **Function App:** func-dreamspace-prod
- **Cosmos DB:** cosmos-dreamspace-prod-20251013
- **Static Web App:** dreamspace.tylerstewart.co.za

---

## 📚 Documentation

- `README.md` - Project overview
- `AZURE_WEBAPP_SETUP_README.md` - Azure setup guide
- `DEPLOYMENT_3CONTAINER_QUICKSTART.md` - Database migration
- `CLEANUP_SUMMARY.md` - Recent cleanup details
- `docs-deployment/` - Detailed deployment guides
- `docs-reference/` - Technical reference
- `docs-new-tenant-deployment/` - Multi-tenant setup

---

## ⚠️ Important Notes

1. **Never commit credentials** - Use environment variables
2. **Rotate keys** - After any credential exposure
3. **Test before deploy** - Run smoke tests
4. **Backup data** - Before major migrations
5. **Review logs** - After each deployment

---

*For detailed information, see the full documentation in the `docs-*/` folders.*

