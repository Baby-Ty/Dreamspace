# Smoke Test Implementation ✅

## Overview
Automated smoke tests that verify critical endpoints after deployment. Runs in GitHub Actions to catch deployment issues early.

## ✅ What Was Created

### Smoke Test Script
**`scripts/smokeTest.cjs`** (~400 lines)
- Pure Node.js (no dependencies)
- Tests critical endpoints
- Validates response format
- Checks performance
- Color-coded terminal output
- Exit code 0 (pass) or 1 (fail)

### GitHub Actions Workflow
**`.github/workflows/deploy.yml`**
- Deploy to Azure Static Web Apps
- Wait for deployment to propagate
- Run smoke tests automatically
- Fail workflow if tests fail

### Local Test Runner
**`scripts/smokeTest.local.sh`**
- Start dev server
- Run tests against localhost
- Stop server
- Return test results

## 🧪 Tests Included

### 1. Root Endpoint Accessible
- **URL**: `{BASE_URL}/`
- **Expected**: HTTP 200
- **Purpose**: Verify basic connectivity

### 2. Health Endpoint Returns 200/503
- **URL**: `{BASE_URL}/api/health`
- **Expected**: HTTP 200 (healthy) or 503 (unhealthy)
- **Purpose**: Verify API is responding

### 3. Health Endpoint Returns Valid JSON
- **URL**: `{BASE_URL}/api/health`
- **Expected**: Valid JSON with `status` and `checks` fields
- **Purpose**: Verify response structure

### 4. Health Endpoint Performance
- **URL**: `{BASE_URL}/api/health`
- **Expected**: Response within 5 seconds
- **Purpose**: Verify acceptable latency

## 🚀 Usage

### Run Against Production
```bash
node scripts/smokeTest.cjs https://dreamspace.tylerstewart.co.za

# Or use npm script
npm run smoke-test:prod
```

### Run Against Localhost
```bash
node scripts/smokeTest.cjs http://localhost:5173

# Or use npm script
npm run smoke-test
```

### Run with Local Dev Server (Bash)
```bash
chmod +x scripts/smokeTest.local.sh
./scripts/smokeTest.local.sh
```

### Run with Local Dev Server (PowerShell)
```powershell
# Start dev server
npm run dev

# In another terminal
node scripts/smokeTest.cjs http://localhost:5173

# Or use npm script
npm run smoke-test
```

### Run from Package Script
Add to `package.json`:
```json
{
  "scripts": {
    "smoke-test": "node scripts/smokeTest.js http://localhost:5173",
    "smoke-test:prod": "node scripts/smokeTest.js https://dreamspace.tylerstewart.co.za"
  }
}
```

Then run:
```bash
npm run smoke-test
npm run smoke-test:prod
```

## 📊 Output Example

### Successful Run
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🧪 SMOKE TEST SUITE 🧪                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Base URL: https://dreamspace.tylerstewart.co.za
Timeout: 30000ms

Testing: https://dreamspace.tylerstewart.co.za/
✓ Root endpoint accessible (234ms)
  Status: 200

Testing: https://dreamspace.tylerstewart.co.za/api/health
✓ Health endpoint returns 200 or 503 (156ms)
  Status: 200
  Health: healthy
✓ Health endpoint returns valid JSON (145ms)
  Status: healthy
  Service: DreamSpace API
✓ Health endpoint responds within 5 seconds (143ms)

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              📊 TEST RESULTS                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

✓ Root endpoint accessible (234ms)
✓ Health endpoint returns 200 or 503 (156ms)
✓ Health endpoint returns valid JSON (145ms)
✓ Health endpoint responds within 5 seconds (143ms)

Total: 4 tests
Passed: 4
Failed: 0

✓ All tests passed!
```

### Failed Run
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🧪 SMOKE TEST SUITE 🧪                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Base URL: https://dreamspace.tylerstewart.co.za
Timeout: 30000ms

Testing: https://dreamspace.tylerstewart.co.za/
✗ Root endpoint accessible
  Error: Request timeout after 30000ms

Testing: https://dreamspace.tylerstewart.co.za/api/health
✗ Health endpoint returns 200 or 503
  Error: Expected status 200 or 503, got 404

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              📊 TEST RESULTS                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

✗ Root endpoint accessible (30012ms)
  Error: Request timeout after 30000ms
✗ Health endpoint returns 200 or 503 (234ms)
  Error: Expected status 200 or 503, got 404

Total: 2 tests
Passed: 0
Failed: 2

✗ 2 test(s) failed!
```

## ⚙️ Configuration

### Timeout
Default: 30 seconds

Modify in `scripts/smokeTest.js`:
```javascript
const TIMEOUT = 30000; // 30 seconds
```

### Performance Threshold
Default: 5 seconds

Modify in `testHealthPerformance()`:
```javascript
const MAX_RESPONSE_TIME = 5000; // 5 seconds
```

### Environment Variables
```bash
# Set base URL via environment
export VITE_APP_URL=https://your-app.com
node scripts/smokeTest.cjs

# Or pass as argument
node scripts/smokeTest.cjs https://your-app.com
```

## 🔄 GitHub Actions Integration

### Workflow Triggers
- **Push to `main`**: Automatic deployment + tests
- **Manual**: Via GitHub Actions UI

### Workflow Steps
1. **Deploy**: Build and deploy to Azure
2. **Wait**: 30 seconds for deployment propagation
3. **Test**: Run smoke tests
4. **Pass/Fail**: Workflow succeeds/fails based on tests

### Secrets Required
```
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Set in: GitHub repo → Settings → Secrets and variables → Actions

## 📈 Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | All tests passed | Deployment successful |
| `1` | One or more tests failed | Deployment failed, investigate |

## 🔍 Adding New Tests

### Example: Test a New Endpoint
Edit `scripts/smokeTest.cjs`:

```javascript
async function testMyEndpoint() {
  const testName = 'My endpoint returns data';
  const startTime = Date.now();
  
  try {
    const url = `${BASE_URL}/api/my-endpoint`;
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    console.log(`✓ ${testName} (${duration}ms)`);
    results.passed++;
    results.tests.push({ name: testName, passed: true, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`✗ ${testName}`);
    console.log(`  Error: ${error.message}`);
    
    results.failed++;
    results.tests.push({ 
      name: testName, 
      passed: false, 
      duration,
      error: error.message 
    });
  }
}

// Add to runTests()
async function runTests() {
  printHeader();
  
  await testRootEndpoint();
  await testHealthEndpoint();
  await testHealthJSON();
  await testHealthPerformance();
  await testMyEndpoint();  // ← Add here
  
  printFooter();
  process.exit(results.failed > 0 ? 1 : 0);
}
```

## 🛠️ Troubleshooting

### Tests Timing Out
**Cause**: Server not responding or slow network  
**Fix**: 
- Check server is running
- Verify URL is correct
- Increase `TIMEOUT` value

### Tests Fail Locally But Pass in CI
**Cause**: Different environments  
**Fix**:
- Check localhost vs production URLs
- Verify local dev server is running
- Check firewall/proxy settings

### Tests Pass But Deployment Failed
**Cause**: Tests ran before deployment completed  
**Fix**:
- Increase wait time in workflow (currently 30s)
- Add more robust deployment check

### JSON Parse Errors
**Cause**: API returning invalid JSON or error page  
**Fix**:
- Check API endpoint is deployed
- Verify response content-type
- Check for HTML error pages instead of JSON

## 📊 Monitoring Integration

### Track in Application Insights
```javascript
// Add to smokeTest.cjs
const { ApplicationInsights } = require('@microsoft/applicationinsights');

if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  const appInsights = new ApplicationInsights({
    config: {
      connectionString: process.env.APPINSIGHTS_CONNECTION_STRING
    }
  });
  appInsights.loadAppInsights();
  
  // Track test results
  appInsights.trackMetric({
    name: 'smoke_test_passed',
    average: results.passed
  });
  
  appInsights.trackMetric({
    name: 'smoke_test_failed',
    average: results.failed
  });
}
```

### Slack Notifications
```yaml
# In .github/workflows/deploy.yml
- name: Notify Slack on failure
  if: failure()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_MESSAGE: 'Smoke tests failed! Check deployment.'
```

## 🎯 Best Practices

### 1. Run Tests After Every Deployment
Always verify the deployment worked.

### 2. Keep Tests Fast
Aim for < 30 seconds total execution time.

### 3. Test Critical Paths Only
Don't test everything, just critical functionality.

### 4. Use Meaningful Error Messages
Help developers diagnose issues quickly.

### 5. Version Your Tests
Keep tests in sync with deployed version.

## 📝 Files Created

```
scripts/
├── smokeTest.cjs             # Main test script (~400 lines)
└── smokeTest.local.sh        # Local test runner (Bash)

.github/workflows/
└── deploy.yml                # Deployment + smoke test workflow

Documentation:
└── SMOKE_TEST_IMPLEMENTATION.md  # This file
```

## 🏆 Benefits

### For Developers
- ✅ Catch deployment issues immediately
- ✅ Verify critical functionality
- ✅ Clear pass/fail feedback

### For Operations
- ✅ Automated deployment verification
- ✅ Early warning system
- ✅ Reduced manual testing

### For Team
- ✅ Confidence in deployments
- ✅ Faster feedback loop
- ✅ Better reliability

---

**Status**: ✅ Complete and Integrated  
**Script**: `scripts/smokeTest.cjs`  
**Workflow**: `.github/workflows/deploy.yml`  
**Exit Code**: 0 (pass) or 1 (fail)

**Note**: File uses `.cjs` extension for CommonJS compatibility (project uses ES modules)

