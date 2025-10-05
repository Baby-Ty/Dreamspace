# Smoke Test - Quick Reference

## Run Tests

### Production
```bash
npm run smoke-test:prod
```

### Localhost
```bash
npm run smoke-test
```

### Custom URL
```bash
node scripts/smokeTest.cjs https://your-url.com
```

## What Gets Tested

1. ✓ Root endpoint accessible (200)
2. ✓ `/api/health` returns 200/503
3. ✓ `/api/health` returns valid JSON
4. ✓ `/api/health` responds within 5s

## Exit Codes

- `0` = All tests passed ✓
- `1` = One or more tests failed ✗

## Sample Output

```
╔═══════════════════════════════════════════════════════════╗
║              🧪 SMOKE TEST SUITE 🧪                       ║
╚═══════════════════════════════════════════════════════════╝

Base URL: https://dreamspace.tylerstewart.co.za

✓ Root endpoint accessible (234ms)
✓ Health endpoint returns 200 or 503 (156ms)
✓ Health endpoint returns valid JSON (145ms)
✓ Health endpoint responds within 5 seconds (143ms)

╔═══════════════════════════════════════════════════════════╗
║              📊 TEST RESULTS                              ║
╚═══════════════════════════════════════════════════════════╝

Total: 4 tests
Passed: 4
Failed: 0

✓ All tests passed!
```

## CI/CD Integration

Tests run automatically after deployment to `main`:

1. Deploy to Azure
2. Wait 30 seconds
3. Run smoke tests
4. Pass/fail deployment

## Add New Test

Edit `scripts/smokeTest.cjs`:

```javascript
async function testMyEndpoint() {
  const testName = 'My endpoint test';
  const startTime = Date.now();
  
  try {
    const url = `${BASE_URL}/api/my-endpoint`;
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    results.passed++;
    results.tests.push({ name: testName, passed: true, duration });
  } catch (error) {
    results.failed++;
    results.tests.push({ 
      name: testName, 
      passed: false, 
      error: error.message 
    });
  }
}
```

---

**Full docs**: `SMOKE_TEST_IMPLEMENTATION.md`

