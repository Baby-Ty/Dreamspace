# Deployment Documentation

This folder contains deployment guides, setup instructions, and configuration documentation for Dreamspace.

## Quick Links

### Primary Deployment Guide
- **[AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)** - Complete Azure deployment guide
- **[DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md)** - Step-by-step deployment instructions

### Pre-Deployment
- **[PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)** - Checklist before deploying

### Configuration
- **[ENTRA_ROLES_SETUP.md](ENTRA_ROLES_SETUP.md)** - Microsoft Entra ID app roles setup
- **[COSMOS_DB_MIGRATION.md](COSMOS_DB_MIGRATION.md)** - Cosmos DB migration guide
- **[SETUP_UNSPLASH.md](SETUP_UNSPLASH.md)** - Unsplash API configuration

### Demo & Testing
- **[DEMO_SETUP.md](DEMO_SETUP.md)** - Demo user setup
- **[PRODUCTION_DEMO_SETUP.md](PRODUCTION_DEMO_SETUP.md)** - Production demo configuration
- **[SMOKE_TEST_IMPLEMENTATION.md](SMOKE_TEST_IMPLEMENTATION.md)** - Smoke test setup
- **[SMOKE_TEST_QUICK_REF.md](SMOKE_TEST_QUICK_REF.md)** - Quick smoke test reference

### Alternative Deployments
- **[GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md)** - GitHub Pages deployment guide

### Monitoring & Health
- **[HEALTH_CHECK_QUICK_REF.md](HEALTH_CHECK_QUICK_REF.md)** - Health check endpoints

### Feature Guides
- **[HOW_TO_SEE_MILESTONE_GOALS.md](HOW_TO_SEE_MILESTONE_GOALS.md)** - Milestone goals feature guide

### Post-Deployment
- **[PUSH_SUCCESS.md](PUSH_SUCCESS.md)** - Successful deployment verification

## Deployment Paths

### Standard Production Deployment
1. Review `PRE_DEPLOYMENT_CHECKLIST.md`
2. Follow `AZURE_DEPLOYMENT.md`
3. Configure `ENTRA_ROLES_SETUP.md`
4. Set up `COSMOS_DB_MIGRATION.md`
5. Run smoke tests per `SMOKE_TEST_QUICK_REF.md`

### Demo Environment
1. Follow `DEMO_SETUP.md`
2. Use `PRODUCTION_DEMO_SETUP.md` for production-like demo

### Alternative: GitHub Pages
1. Follow `GITHUB_PAGES_DEPLOYMENT.md`

## New Tenant Deployment

For deploying to a **new Azure tenant**, see:
- **[../docs-new-tenant-deployment/](../docs-new-tenant-deployment/)** - Complete new tenant deployment documentation

⚠️ The new tenant deployment uses different document ID formats and should NOT be mixed with existing deployments.

## Related Folders

- **[../docs-new-tenant-deployment/](../docs-new-tenant-deployment/)** - New tenant specific deployment
- **[../docs-reference/](../docs-reference/)** - Project reference and coding standards
- **[../scripts/](../scripts/)** - Deployment automation scripts

---

**Last Updated**: October 11, 2025  
**Purpose**: Deployment guides and configuration documentation

