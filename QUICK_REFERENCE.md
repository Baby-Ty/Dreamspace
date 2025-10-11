# Dreamspace New Tenant - Quick Reference

Quick reference guide for common tasks and important information.

## Essential URLs

### Azure Portal
- **Portal**: https://portal.azure.com
- **Entra ID App Registrations**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
- **Static Web Apps**: https://portal.azure.com/#create/Microsoft.StaticApp
- **Cosmos DB**: https://portal.azure.com/#create/Microsoft.Azure.Cosmos

### GitHub
- **Repository**: https://github.com/Baby-Ty/Dreamspace
- **Actions**: https://github.com/Baby-Ty/Dreamspace/actions
- **Settings**: https://github.com/Baby-Ty/Dreamspace/settings

## Resource Naming Convention

```
Resource Group:     rg-dreamspace-prod-eastus
Cosmos DB:          cosmos-dreamspace-prod-YYYYMMDD
Static Web App:     swa-dreamspace-prod
App Registration:   Dreamspace Production
```

## Critical Configuration Values

### Entra ID App Registration
```javascript
// src/auth/authConfig.js
clientId: "YOUR_CLIENT_ID"              // From app registration
authority: "https://login.microsoftonline.com/YOUR_TENANT_ID"
```

### Cosmos DB Document Structure
```json
{
  "id": "user@domain.com",              // Email/UPN (human-readable)
  "aadObjectId": "guid-here",           // Azure AD Object ID (immutable)
  "userId": "user@domain.com",          // Same as id
  "name": "User Name",
  "email": "user@domain.com",
  "dreamBook": [],
  "weeklyGoals": [],
  "score": 0
}
```

### Azure Static Web App Settings
```
Frontend (build-time):
  VITE_APP_ENV=production
  VITE_COSMOS_ENDPOINT=https://cosmos-XXX.documents.azure.com:443/

Backend (runtime):
  COSMOS_ENDPOINT=https://cosmos-XXX.documents.azure.com:443/
  COSMOS_KEY=<primary-key-here>
```

## Cosmos DB Configuration

### Database: `dreamspace`
- **Throughput**: 400 RU/s (shared across containers)

### Container: `users`
- **Partition Key**: `/id`
- **Important**: Must be `/id` not `/userId`

### Container: `teams`
- **Partition Key**: `/managerId`

## App Roles

| Role | Value | Access |
|------|-------|--------|
| Admin | `DreamSpace.Admin` | All features including Admin Dashboard |
| Manager | `DreamSpace.Manager` | People Hub, Dream Coach |
| Coach | `DreamSpace.Coach` | Dream Coach only |
| Employee | (none) | Core features only |

## Common Commands

### Local Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feat/new-tenant-deployment

# Stage and commit
git add .
git commit -m "Your message"

# Push to remote
git push origin feat/new-tenant-deployment

# Merge via PR on GitHub
```

### Azure CLI
```bash
# Login
az login --tenant TENANT_ID

# List resources
az resource list --resource-group rg-dreamspace-prod-eastus

# Get Cosmos connection
az cosmosdb keys list --name cosmos-XXX --resource-group rg-dreamspace-prod-eastus

# Get Static Web App URL
az staticwebapp show --name swa-dreamspace-prod --resource-group rg-dreamspace-prod-eastus --query "defaultHostname"
```

### PowerShell (Automated Setup)
```powershell
# Run provisioning script
.\scripts\provision-new-tenant.ps1 -TenantId "YOUR_TENANT_ID"

# With options
.\scripts\provision-new-tenant.ps1 `
  -TenantId "YOUR_TENANT_ID" `
  -ResourceGroup "rg-dreamspace-prod-eastus" `
  -Location "eastus"
```

### Bash (Automated Setup)
```bash
# Run provisioning script
./scripts/provision-new-tenant.sh --tenant-id YOUR_TENANT_ID

# With options
./scripts/provision-new-tenant.sh \
  --tenant-id YOUR_TENANT_ID \
  --resource-group rg-dreamspace-prod-eastus \
  --location eastus
```

## Troubleshooting Quick Fixes

### "Failed to acquire token"
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Try incognito mode
3. Verify redirect URIs in Entra ID
4. Check `clientId` and `authority` in code

### "Database not configured"
1. Check app settings in Static Web App
2. Verify `COSMOS_ENDPOINT` and `COSMOS_KEY`
3. Restart Static Web App
4. Check Cosmos DB firewall (should be open)

### Data not saving
1. Open browser console (F12)
2. Look for Cosmos DB errors
3. Verify partition key is `/id`
4. Check container exists in Cosmos

### Roles not working
1. Verify app roles created
2. Check user role assignments
3. User must log out and log back in
4. Check for `roles` claim in token

### Build/Deploy failures
1. Check GitHub Actions logs
2. Verify deployment token is valid
3. Check `package.json` for errors
4. Ensure all dependencies installed

## Monitoring Quick Checks

### Application Insights
```
Static Web App → Application Insights → Live Metrics
- Monitor requests/responses in real-time
- Check for exceptions
- View dependency calls
```

### Cosmos DB Metrics
```
Cosmos DB → Metrics → Chart
- Normalized RU Consumption (should be < 80%)
- Total Requests (watch for 429 status)
- Data & Index Usage
```

### Check Logs
```
Static Web App → Log stream
- View live application logs
- Debug runtime issues
```

## Security Checklist

- [ ] Cosmos keys stored in app settings (not code)
- [ ] Deployment tokens stored as GitHub secrets
- [ ] Single-tenant Entra ID configured
- [ ] Redirect URIs limited to known domains
- [ ] HTTPS enforced
- [ ] Role-based access working
- [ ] Monitoring alerts configured

## Cost Monitoring

### Azure Portal
```
Cost Management → Cost Analysis
- Filter by resource group
- View daily costs
- Set budget alerts
```

### Expected Monthly Costs
- Static Web Apps Standard: ~$9
- Cosmos DB (400 RU/s): ~$24 (or free with free tier)
- Application Insights: Free for basic usage
- **Total**: $9-33/month

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Azure Admin | _____________ | _____________ |
| GitHub Admin | _____________ | _____________ |
| Technical Lead | _____________ | _____________ |
| Support Team | _____________ | _____________ |

## Important Files

### Configuration
- `src/auth/authConfig.js` - Entra ID configuration
- `src/context/AuthContext.jsx` - Authentication logic
- `src/schemas/userData.js` - Data validation schemas
- `.github/workflows/*.yml` - CI/CD workflows

### Documentation
- `NEW_TENANT_DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `AZURE_DEPLOYMENT.md` - Azure-specific deployment info
- `ENTRA_ROLES_SETUP.md` - Role configuration guide

### Scripts
- `scripts/provision-new-tenant.ps1` - PowerShell provisioning
- `scripts/provision-new-tenant.sh` - Bash provisioning

## Useful Queries

### Cosmos DB Query Examples
```sql
-- Find all users
SELECT * FROM c

-- Find user by email
SELECT * FROM c WHERE c.id = "user@domain.com"

-- Count total dreams
SELECT VALUE COUNT(1) FROM c JOIN d IN c.dreamBook

-- Find users with incomplete dreams
SELECT c.id, c.name FROM c 
JOIN d IN c.dreamBook 
WHERE d.progress < 100
```

### Application Insights Queries (Kusto)
```kusto
// Recent errors
exceptions
| where timestamp > ago(1h)
| order by timestamp desc

// Slow requests
requests
| where duration > 3000
| order by timestamp desc

// User activity
pageViews
| summarize count() by client_City, client_Browser
```

## Quick Links

- [Azure Status](https://status.azure.com/)
- [GitHub Status](https://www.githubstatus.com/)
- [Microsoft Entra ID Status](https://status.azure.com/)

---

**Last Updated**: _________________

**Maintained By**: _________________

**Review Frequency**: Monthly

