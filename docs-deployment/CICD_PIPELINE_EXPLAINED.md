# CI/CD Pipeline Explanation - Dreamspace

## Overview

Your Dreamspace application uses **GitHub Actions** to automatically build, test, and deploy to **Azure Static Web Apps** whenever you push code to the `main` branch.

---

## 🔄 Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER: Push to main / Pull Request / Manual             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  JOB 1: Build and Deploy                                    │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  Step 1: Checkout Code                                     │
│  ├─ Clone repository                                       │
│  └─ Fetch all files                                        │
│                                                             │
│  Step 2: Setup Node.js 18                                  │
│  ├─ Install Node.js                                        │
│  └─ Setup npm cache                                        │
│                                                             │
│  Step 3: Install Dependencies                              │
│  └─ Run: npm ci (clean install)                            │
│                                                             │
│  Step 4: Run Linter ⚠️                                      │
│  ├─ Run: npm run lint                                      │
│  └─ Fails build if errors found                            │
│                                                             │
│  Step 5: Run Tests ⚠️                                       │
│  ├─ Run: npm test                                          │
│  └─ Fails build if tests fail                              │
│                                                             │
│  Step 6: Build Frontend 🏗️                                 │
│  ├─ Run: npm run build (Vite)                              │
│  ├─ Output: /dist folder                                   │
│  └─ Environment: VITE_APP_ENV=production                   │
│                                                             │
│  Step 7: Deploy to Azure 🚀                                │
│  ├─ Upload /dist → Static Web App                          │
│  ├─ Upload /api → Azure Functions                          │
│  ├─ Azure builds Functions                                 │
│  └─ Deploy to production                                   │
│                                                             │
│  Step 8: Verify Deployment ✅                               │
│  └─ Wait 30 seconds for propagation                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
              ✅ SUCCESS: App Live!
              https://your-app.azurestaticapps.net
```

---

## 🎯 Pipeline Triggers

Your pipeline runs automatically in these scenarios:

### 1. **Push to Main Branch**
```bash
git push origin main
```
- ✅ Triggers full build and deploy
- ✅ Deploys to production
- ⏱️ Takes 3-5 minutes

### 2. **Pull Request to Main**
```bash
# When you open a PR to main
```
- ✅ Triggers build and test
- ✅ Creates preview environment
- ✅ Temporary URL for testing
- ✅ Auto-deleted when PR closes

### 3. **Manual Trigger**
```
GitHub → Actions → Workflow → Run workflow
```
- ✅ On-demand deployment
- ✅ Useful for hotfixes
- ✅ No code change required

---

## 📋 Detailed Step-by-Step

### **Step 1: Checkout Code** (5 seconds)
```yaml
- uses: actions/checkout@v3
  with:
    submodules: true
```
**What happens:**
- GitHub Actions clones your repository
- Downloads all files to the build server
- Includes any git submodules

**Why important:**
- Gets latest code to build
- Ensures consistency

---

### **Step 2: Setup Node.js** (10 seconds)
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
```
**What happens:**
- Installs Node.js version 18
- Caches npm packages for faster builds
- Sets up npm and npx commands

**Why important:**
- Your app requires Node 18
- Caching speeds up subsequent builds by 50%

---

### **Step 3: Install Dependencies** (30-60 seconds)
```yaml
- name: Install dependencies
  run: npm ci
```
**What happens:**
- Runs `npm ci` (clean install)
- Installs exact versions from package-lock.json
- Installs ~50 dependencies

**Why `npm ci` instead of `npm install`:**
- ✅ Faster (10-50% faster)
- ✅ Uses exact versions (reliable)
- ✅ Removes old node_modules first
- ✅ Fails if lock file is out of sync

**Dependencies installed:**
- React, React DOM, React Router
- MSAL (Azure AD authentication)
- Lucide icons
- Tailwind CSS
- Vite build tools
- Testing libraries (Vitest, Testing Library)

---

### **Step 4: Run Linter** (10-20 seconds) ⚠️
```yaml
- name: Run linter
  run: npm run lint
```
**What happens:**
- Runs ESLint on all .js/.jsx files
- Checks code quality and style
- Looks for common errors

**What it checks:**
- Unused variables
- Missing imports
- React best practices
- Code style consistency

**⚠️ Build fails if:**
- ESLint errors found
- Syntax errors
- Rule violations

**Example errors caught:**
```javascript
// ❌ Unused variable
const unused = 5;

// ❌ Missing dependency in useEffect
useEffect(() => {
  doSomething(prop);
}, []); // Should include 'prop'

// ❌ Missing prop validation
function MyComponent(props) { } // Should have PropTypes
```

---

### **Step 5: Run Tests** (10-30 seconds) ⚠️
```yaml
- name: Run tests
  run: npm test
```
**What happens:**
- Runs all Vitest unit tests
- Tests React components
- Validates utilities and services

**Tests run:**
- Component rendering tests
- User interaction tests
- Utility function tests
- Schema validation tests

**⚠️ Build fails if:**
- Any test fails
- Test coverage too low (if configured)
- Timeout errors

**Example test:**
```javascript
test('Button renders correctly', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

---

### **Step 6: Build Application** (60-90 seconds) 🏗️
```yaml
- name: Build application
  run: npm run build
  env:
    VITE_APP_ENV: production
    VITE_COSMOS_ENDPOINT: ${{ secrets.VITE_COSMOS_ENDPOINT }}
```
**What happens:**
- Runs Vite build process
- Transpiles JSX to JavaScript
- Bundles all files together
- Minifies code
- Optimizes images and assets
- Tree-shakes unused code
- Outputs to `/dist` folder

**Environment variables:**
- `VITE_APP_ENV=production` - Sets production mode
- `VITE_COSMOS_ENDPOINT` - Cosmos DB endpoint (from secrets)

**Build output:**
```
dist/
├── index.html              (main HTML file)
├── assets/
│   ├── index-abc123.js    (main JS bundle, 200-300KB)
│   ├── vendor-def456.js   (React, libraries, 150KB)
│   ├── auth-ghi789.js     (MSAL bundle, 50KB)
│   └── index-jkl012.css   (Tailwind CSS, 20KB)
└── logo.png
```

**Optimizations applied:**
- Code splitting (3 main chunks)
- Minification (reduces size by 70%)
- Dead code elimination
- Asset optimization

**⚠️ Build fails if:**
- Syntax errors in code
- Missing imports
- TypeScript errors (if using TS)
- Out of memory (rare)

---

### **Step 7: Deploy to Azure** (60-120 seconds) 🚀
```yaml
- name: Deploy to Azure Static Web Apps
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    skip_app_build: true    # Already built
    skip_api_build: false   # Azure builds Functions
    app_location: "/dist"
    api_location: "/api"
```

**What happens - Part A: Frontend Deployment**
1. Uploads `/dist` folder to Azure
2. Azure receives all HTML/CSS/JS files
3. Files distributed to CDN edge locations
4. Old version replaced atomically
5. Cache purged for instant updates

**What happens - Part B: API Deployment**
1. Uploads `/api` folder (Azure Functions)
2. Azure detects Node.js Functions
3. Runs `npm install` for Functions
4. Builds each function
5. Deploys 18 HTTP triggers:
   - `getUserData`
   - `saveUserData`
   - `getAllUsers`
   - `health`
   - `promoteUserToCoach`
   - ... and 13 more

**Azure builds Functions with:**
- Node.js 18 runtime
- `@azure/cosmos` package
- `@azure/functions` package

**Environment variables applied:**
- `COSMOS_ENDPOINT` - From Static Web App settings
- `COSMOS_KEY` - From Static Web App settings

**Result:**
```
Your app is now live at:
https://[your-app].azurestaticapps.net

Available endpoints:
- https://[your-app].azurestaticapps.net/              (Frontend)
- https://[your-app].azurestaticapps.net/api/health   (Health check)
- https://[your-app].azurestaticapps.net/api/getUserData/:userId
- https://[your-app].azurestaticapps.net/api/saveUserData/:userId
- ... all 18 Functions
```

---

### **Step 8: Verify Deployment** (30 seconds) ✅
```yaml
- name: Wait for deployment
  run: sleep 30
```
**What happens:**
- Waits 30 seconds for changes to propagate
- Allows CDN to update worldwide
- Ensures Functions are fully deployed

**Why needed:**
- CDN updates take 10-30 seconds
- Functions need initialization time
- Prevents "site not found" errors

---

## 🎭 Pull Request Preview Environments

When you open a Pull Request:

```
┌─────────────────────────────────────────────────────────────┐
│  PR Opened to Main                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Create Preview Environment  │
        │  URL: pr-123.azurestaticapps │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Deploy PR Changes           │
        │  Isolated from production    │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Test changes live           │
        │  Share with team             │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  PR Merged or Closed         │
        │  → Auto-delete preview       │
        └──────────────────────────────┘
```

**Benefits:**
- ✅ Test changes before merging
- ✅ Share with stakeholders
- ✅ No impact on production
- ✅ Automatic cleanup

---

## 🔑 Required Secrets

Your pipeline needs these GitHub Secrets:

### 1. `AZURE_STATIC_WEB_APPS_API_TOKEN` (Required)
- **What:** Deployment token from Azure
- **Used for:** Deploying to Static Web App
- **Get from:** `DEPLOY_WEBAPP_AZURE.ps1` output or Azure Portal
- **Add to:** GitHub → Settings → Secrets → Actions

### 2. `VITE_COSMOS_ENDPOINT` (Optional)
- **What:** Cosmos DB endpoint URL
- **Used for:** Frontend configuration
- **Format:** `https://your-cosmos.documents.azure.com:443/`
- **Note:** Backend uses app settings, not this secret

### 3. `GITHUB_TOKEN` (Automatic)
- **What:** Auto-generated by GitHub
- **Used for:** PR comments, statuses
- **No setup needed**

---

## ⏱️ Typical Timeline

| Step | Time | Cumulative |
|------|------|------------|
| Checkout code | 5s | 5s |
| Setup Node.js | 10s | 15s |
| Install dependencies | 45s | 60s |
| Run linter | 15s | 75s |
| Run tests | 20s | 95s |
| Build application | 75s | 170s (~3min) |
| Deploy to Azure | 90s | 260s (~4min) |
| Verify | 30s | 290s (~5min) |

**Total: 3-5 minutes** from push to live

---

## 🚨 What Stops the Pipeline?

The pipeline **FAILS and STOPS** if:

### ❌ Linting Errors
```bash
Error: 'useState' is defined but never used
```
**Fix:** Remove unused imports or variables

### ❌ Test Failures
```bash
Error: Expected "Hello" but got "Goodbye"
```
**Fix:** Update tests or fix code logic

### ❌ Build Errors
```bash
Error: Cannot find module './MyComponent'
```
**Fix:** Check imports and file paths

### ❌ Missing Secrets
```bash
Error: Missing azure_static_web_apps_api_token
```
**Fix:** Add secret to GitHub repository

### ❌ Deployment Failures
```bash
Error: Invalid deployment token
```
**Fix:** Regenerate token and update secret

---

## 📊 Monitoring Deployments

### View Pipeline Status

**GitHub Actions Dashboard:**
```
https://github.com/[username]/Dreamspace/actions
```

**Status Badge:**
Add to README.md:
```markdown
![Deploy](https://github.com/[username]/Dreamspace/actions/workflows/azure-static-web-apps-deployment.yml/badge.svg)
```

**Azure Portal:**
```
Azure Portal → Static Web App → Deployment History
```

---

## 🔧 Manual Deployment

If you need to deploy manually (bypass CI/CD):

```powershell
# Build locally
npm run build

# Deploy using Azure CLI
az staticwebapp deploy `
  --name swa-dreamspace-prod `
  --resource-group rg_Dreams2025Dev `
  --source ./dist `
  --api-location ./api
```

**When to use:**
- Emergency hotfix
- CI/CD is down
- Testing local changes

---

## 🎯 Best Practices

### ✅ DO:
- Always test locally before pushing
- Run `npm run lint` before committing
- Run `npm test` to verify changes
- Keep secrets secure
- Review deployment logs
- Monitor for errors

### ❌ DON'T:
- Push broken code to main
- Skip tests to save time
- Commit secrets to code
- Deploy without testing
- Ignore linting errors

---

## 🐛 Troubleshooting

### Pipeline is slow
**Solution:**
- npm cache is being rebuilt
- Wait for first run, subsequent runs faster
- Check GitHub Actions status page

### Build fails on "npm ci"
**Solution:**
```bash
# Update lock file locally
npm install
git add package-lock.json
git commit -m "Update dependencies"
```

### Deployment succeeds but app doesn't work
**Solution:**
1. Check browser console for errors
2. Verify environment variables in Azure
3. Check API health endpoint
4. Review Azure Function logs

### Can't see changes after deployment
**Solution:**
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache
3. Wait 30 seconds for CDN
4. Check deployment history in Azure

---

## 📈 Optimization Tips

### Speed Up Builds
1. **Use npm cache** (already enabled)
2. **Reduce dependencies** (only what you need)
3. **Skip tests on docs changes:**
   ```yaml
   on:
     push:
       paths-ignore:
         - 'docs/**'
         - '*.md'
   ```

### Improve Reliability
1. **Add status checks** to protect main branch
2. **Require PR reviews** before merge
3. **Enable branch protection** rules
4. **Set up notifications** for failures

---

## 🎓 Summary

**Your CI/CD Pipeline:**
1. ✅ Automatically triggers on push to main
2. ✅ Runs quality checks (lint + tests)
3. ✅ Builds optimized production code
4. ✅ Deploys frontend to Azure CDN
5. ✅ Deploys 18 API Functions
6. ✅ Takes 3-5 minutes total
7. ✅ Provides preview environments for PRs
8. ✅ Zero-downtime deployments

**You get:**
- 🚀 Automatic deployments
- 🛡️ Quality gates
- 🔄 Preview environments
- 📊 Deployment history
- ✅ Production-ready setup

---

**Questions?** Check [STATIC_WEB_APP_SETUP.md](./STATIC_WEB_APP_SETUP.md) for more details!

