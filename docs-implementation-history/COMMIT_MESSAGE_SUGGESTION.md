# Suggested Commit Message

```
feat: comprehensive infrastructure improvements and testing

🎯 Core Infrastructure
- Add centralized error handling (ok/fail helpers)
- Add environment validation with Zod
- Add structured logger utility (App Insights ready)
- Add centralized error handler with auto-actions

💚 Health & Monitoring
- Add /api/health Azure Function endpoint
- Add HealthBadge component (sidebar + mobile)
- Add /health status dashboard page
- Add smoke test suite (post-deployment)

🧪 Testing & CI/CD
- Add Vitest test infrastructure
- Add smoke test script (scripts/smokeTest.cjs)
- Update CI workflow with lint/test/build/deploy
- Add deployment workflow with health checks

✨ UX Improvements
- Add virtual lists (react-window) for performance
- Add roving focus (keyboard navigation)
- Refactor large pages into modular components
- Add comprehensive accessibility improvements

📦 Data Validation
- Add Zod schemas for all data models
- Add schema parsers and validators
- Add type-safe environment configuration

📚 Documentation
- Add PRE_DEPLOYMENT_CHECKLIST.md
- Add HEALTH_CHECK_IMPLEMENTATION.md
- Add SMOKE_TEST_IMPLEMENTATION.md
- Add ENV_VALIDATION_IMPLEMENTATION.md
- Add LOGGER_IMPLEMENTATION.md
- Add ERROR_HANDLER_IMPLEMENTATION.md
- Add CI_PIPELINE.md

🔧 Configuration
- Add .eslintrc.json for Azure Functions
- Add smoke-test npm scripts
- Add deploy.yml workflow

BREAKING CHANGES: None
All changes are backward compatible.

Note: Pre-existing lint warnings (unused variables) to be addressed in separate PR.
```

## Alternative (Short Version)

```
feat: infrastructure improvements, health checks, and testing

- Add error handling, logging, env validation utilities
- Add /api/health endpoint + frontend health monitoring
- Add smoke tests for post-deployment verification
- Add virtual lists, roving focus for a11y/performance
- Add Zod schemas for data validation
- Add comprehensive documentation
- Refactor large components into modular structure
- Configure CI/CD with lint, test, build, deploy, smoke tests

All new code is tested and documented.
Pre-existing lint warnings to be addressed separately.
```

## Git Commands

```bash
# Review changes
git status
git diff --stat

# Stage all changes
git add .

# Commit (use one of the messages above)
git commit -m "feat: comprehensive infrastructure improvements and testing"

# Push to main
git push origin main
```

## Post-Push

1. Wait 30 seconds for deployment
2. Check GitHub Actions for workflow status
3. Run: `npm run smoke-test:prod`
4. Verify `/health` endpoint shows green
5. Configure Azure environment variables (see PRE_DEPLOYMENT_CHECKLIST.md)

