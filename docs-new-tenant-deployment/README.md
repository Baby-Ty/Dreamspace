# New Tenant Deployment Documentation

This folder contains all documentation needed to deploy Dreamspace to a new Azure tenant.

⚠️ **IMPORTANT**: This documentation is for the `new-tenant-deployment` branch only. Do NOT use with the `main` branch or existing production deployments.

## 📚 Documentation Files

### Start Here
1. **[BRANCH_README.md](BRANCH_README.md)** - Overview of the branch purpose and safety warnings
2. **[NEW_TENANT_DEPLOYMENT.md](NEW_TENANT_DEPLOYMENT.md)** - Complete deployment guide (7 parts, ~620 lines)
3. **[NEW_TENANT_CONFIG_TEMPLATE.md](NEW_TENANT_CONFIG_TEMPLATE.md)** - Configuration values tracker

### Implementation Guides
4. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist with 400+ items
5. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common commands, queries, and troubleshooting
6. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's automated vs manual with time estimates

## 🚀 Quick Start

### For First-Time Deployment

1. **Read the overview**
   ```
   Start with: BRANCH_README.md
   ```

2. **Follow the complete guide**
   ```
   Step-by-step: NEW_TENANT_DEPLOYMENT.md
   Track progress: DEPLOYMENT_CHECKLIST.md
   ```

3. **Track configuration values**
   ```
   Use: NEW_TENANT_CONFIG_TEMPLATE.md
   Fill in: Tenant IDs, URLs, credentials
   ```

4. **Reference during deployment**
   ```
   Quick lookups: QUICK_REFERENCE.md
   ```

### For Troubleshooting

- **Common issues**: See QUICK_REFERENCE.md → "Troubleshooting Quick Fixes"
- **Detailed solutions**: See NEW_TENANT_DEPLOYMENT.md → "Troubleshooting" section
- **Rollback**: See NEW_TENANT_DEPLOYMENT.md → "Rollback Procedure"

## 📋 Deployment Phases

| Phase | Time | Documentation | Status |
|-------|------|---------------|--------|
| Infrastructure | 30-45 min | NEW_TENANT_DEPLOYMENT.md Part 1 | Manual/Script |
| Entra ID Setup | 15-20 min | NEW_TENANT_DEPLOYMENT.md Part 2 | Manual |
| Code Updates | 10-15 min | NEW_TENANT_DEPLOYMENT.md Part 3 | Manual |
| Configuration | 10 min | NEW_TENANT_DEPLOYMENT.md Part 4 | Manual |
| GitHub Setup | 5 min | NEW_TENANT_DEPLOYMENT.md Part 5 | Manual |
| Deploy & Test | 15-20 min | NEW_TENANT_DEPLOYMENT.md Part 6 | Auto + Manual |
| Monitoring | 10-15 min | NEW_TENANT_DEPLOYMENT.md Part 7 | Manual |
| **Total** | **~2 hours** | | |

## 🛠️ Automation Tools

Located in `../scripts/` folder:

- **PowerShell**: `provision-new-tenant.ps1`
  ```powershell
  .\scripts\provision-new-tenant.ps1 -TenantId "YOUR_TENANT_ID"
  ```

- **Bash**: `provision-new-tenant.sh`
  ```bash
  ./scripts/provision-new-tenant.sh --tenant-id YOUR_TENANT_ID
  ```

These scripts automate:
- ✅ Resource Group creation
- ✅ Cosmos DB provisioning
- ✅ Database and container setup
- ✅ Credential retrieval

Still manual:
- ❌ Static Web App (requires GitHub OAuth)
- ❌ Entra ID App Registration (requires admin consent)
- ❌ Configuration updates

## 🎯 Key Differences from Main Branch

### Document ID Format

**Main Branch** (existing production):
```json
{ "id": "19db4ac5-2133-4b29-89af-96d8d9941aaf" }
```

**This Branch** (new tenant):
```json
{ 
  "id": "user@domain.com",
  "aadObjectId": "19db4ac5-2133-4b29-89af-96d8d9941aaf"
}
```

### Why This Matters

⚠️ **BREAKING CHANGE**: Using email-based IDs means:
- Existing users with GUID-based data will NOT be found
- All existing user data will appear lost
- This is ONLY safe for NEW deployments with NO existing data

## ✅ Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] Azure subscription with appropriate permissions
- [ ] GitHub repository access (admin or write)
- [ ] Azure Tenant ID
- [ ] List of initial users and their roles
- [ ] Budget approval (~$9-33/month)
- [ ] 2 hours available for deployment
- [ ] Read BRANCH_README.md
- [ ] Read NEW_TENANT_DEPLOYMENT.md overview

## 📖 Documentation Structure

```
docs-new-tenant-deployment/
├── README.md (this file)
├── BRANCH_README.md                     # Branch overview and warnings
├── NEW_TENANT_DEPLOYMENT.md             # Complete deployment guide
├── DEPLOYMENT_CHECKLIST.md              # Itemized progress tracker
├── QUICK_REFERENCE.md                   # Commands and troubleshooting
├── IMPLEMENTATION_SUMMARY.md            # Automated vs manual summary
└── NEW_TENANT_CONFIG_TEMPLATE.md        # Configuration values tracker
```

## 🆘 Getting Help

### During Deployment

1. **Check the checklist**: DEPLOYMENT_CHECKLIST.md
2. **Look up commands**: QUICK_REFERENCE.md
3. **Review troubleshooting**: NEW_TENANT_DEPLOYMENT.md → Troubleshooting
4. **Check Azure Portal**: Error messages, deployment logs

### Common Issues

| Issue | Solution |
|-------|----------|
| "Failed to acquire token" | QUICK_REFERENCE.md → "Failed to acquire token" |
| "Database not configured" | QUICK_REFERENCE.md → "Database not configured" |
| Data not persisting | QUICK_REFERENCE.md → "Data not saving" |
| Roles not working | QUICK_REFERENCE.md → "Roles not working" |

## 🔐 Security Reminders

- ⚠️ Never commit Cosmos keys to source control
- ⚠️ Store deployment tokens as GitHub secrets
- ⚠️ Use Azure Key Vault for production credentials
- ⚠️ Files matching `deployment-credentials-*.txt` are .gitignored
- ⚠️ Review credentials files before sharing documentation

## 📊 Success Criteria

After deployment, you should have:

- ✅ All Azure resources provisioned
- ✅ Users can login with new tenant
- ✅ Data persists across sessions
- ✅ Cosmos uses email-based IDs
- ✅ Role-based access working
- ✅ Monitoring configured
- ✅ No impact to existing production (main branch)

## 🔗 Related Files

### Code Files Modified
- `../src/context/AuthContext.jsx` - Uses email/UPN as ID
- `../src/schemas/userData.js` - Added aadObjectId field
- `../.gitignore` - Protected credential files

### Automation Scripts
- `../scripts/provision-new-tenant.ps1` - PowerShell
- `../scripts/provision-new-tenant.sh` - Bash

### Existing Documentation (Reference)
- `../AZURE_DEPLOYMENT.md` - Original Azure guide
- `../ENTRA_ROLES_SETUP.md` - Entra roles configuration
- `../README.md` - Project overview

## 💡 Tips

1. **Use the config template**: Track all values as you create them
2. **Follow the checklist**: Check off items as you complete them
3. **Test incrementally**: Verify each phase before moving forward
4. **Keep credentials secure**: Use password manager or Azure Key Vault
5. **Document changes**: Add notes to config template for your environment

## 📅 Maintenance

This documentation should be:
- **Reviewed**: After each deployment
- **Updated**: When Azure services change
- **Versioned**: Keep in sync with code changes
- **Archived**: Save filled config templates for reference

---

**Created**: October 11, 2025  
**Branch**: new-tenant-deployment  
**Version**: 1.0  
**Maintained by**: Development Team

For questions or issues, review the troubleshooting guides or open a GitHub issue with the `[new-tenant]` tag.

