#!/usr/bin/env node

// DoD: validated I/O with Zod; consistent error shape; unit tested; CI green; health check passing.

/**
 * Smoke Test Script
 * Tests critical endpoints after deployment
 * Usage: node scripts/smokeTest.cjs [base-url]
 * 
 * Exit codes:
 *   0 = All tests passed
 *   1 = One or more tests failed
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.argv[2] || process.env.VITE_APP_URL || 'http://localhost:5173';
const TIMEOUT = 30000; // 30 seconds

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Print formatted header
 */
function printHeader() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              🧪 SMOKE TEST SUITE 🧪                       ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`${colors.cyan}Base URL:${colors.reset} ${BASE_URL}`);
  console.log(`${colors.cyan}Timeout:${colors.reset} ${TIMEOUT}ms\n`);
}

/**
 * Print formatted footer with results
 */
function printFooter() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              📊 TEST RESULTS                              ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  results.tests.forEach(test => {
    const icon = test.passed ? '✓' : '✗';
    const color = test.passed ? colors.green : colors.red;
    const duration = test.duration ? ` (${test.duration}ms)` : '';
    
    console.log(`${color}${icon}${colors.reset} ${test.name}${colors.gray}${duration}${colors.reset}`);
    
    if (!test.passed && test.error) {
      console.log(`  ${colors.red}Error:${colors.reset} ${test.error}`);
    }
  });
  
  console.log('');
  console.log(`${colors.cyan}Total:${colors.reset} ${results.tests.length} tests`);
  console.log(`${colors.green}Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${results.failed}\n`);
  
  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ ${results.failed} test(s) failed!${colors.reset}\n`);
  }
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      ...options,
      timeout: TIMEOUT
    };
    
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

/**
 * Test: Health endpoint returns 200
 */
async function testHealthEndpoint() {
  const testName = 'Health endpoint returns 200 or 503';
  const startTime = Date.now();
  
  try {
    const url = `${BASE_URL}/api/health`;
    console.log(`${colors.gray}Testing: ${url}${colors.reset}`);
    
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    // Accept 200 (healthy) or 503 (unhealthy but responding)
    const passed = response.status === 200 || response.status === 503;
    
    if (passed) {
      console.log(`${colors.green}✓${colors.reset} ${testName} ${colors.gray}(${duration}ms)${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Health: ${response.body?.status || 'unknown'}`);
      
      results.passed++;
      results.tests.push({ name: testName, passed: true, duration });
    } else {
      throw new Error(`Expected status 200 or 503, got ${response.status}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    
    results.failed++;
    results.tests.push({ 
      name: testName, 
      passed: false, 
      duration,
      error: error.message 
    });
  }
}

/**
 * Test: Health endpoint returns valid JSON
 */
async function testHealthJSON() {
  const testName = 'Health endpoint returns valid JSON';
  const startTime = Date.now();
  
  try {
    const url = `${BASE_URL}/api/health`;
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (!response.body || typeof response.body !== 'object') {
      throw new Error('Response is not valid JSON');
    }
    
    if (!response.body.status) {
      throw new Error('Response missing "status" field');
    }
    
    if (!response.body.checks) {
      throw new Error('Response missing "checks" field');
    }
    
    console.log(`${colors.green}✓${colors.reset} ${testName} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`  Status: ${response.body.status}`);
    console.log(`  Service: ${response.body.service || 'unknown'}`);
    
    results.passed++;
    results.tests.push({ name: testName, passed: true, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    
    results.failed++;
    results.tests.push({ 
      name: testName, 
      passed: false, 
      duration,
      error: error.message 
    });
  }
}

/**
 * Test: Health endpoint responds within timeout
 */
async function testHealthPerformance() {
  const testName = 'Health endpoint responds within 5 seconds';
  const startTime = Date.now();
  const MAX_RESPONSE_TIME = 5000; // 5 seconds
  
  try {
    const url = `${BASE_URL}/api/health`;
    await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (duration > MAX_RESPONSE_TIME) {
      throw new Error(`Response took ${duration}ms (max ${MAX_RESPONSE_TIME}ms)`);
    }
    
    console.log(`${colors.green}✓${colors.reset} ${testName} ${colors.gray}(${duration}ms)${colors.reset}`);
    
    results.passed++;
    results.tests.push({ name: testName, passed: true, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    
    results.failed++;
    results.tests.push({ 
      name: testName, 
      passed: false, 
      duration,
      error: error.message 
    });
  }
}

/**
 * Test: Root endpoint returns HTML (basic connectivity)
 */
async function testRootEndpoint() {
  const testName = 'Root endpoint accessible';
  const startTime = Date.now();
  
  try {
    const url = BASE_URL;
    console.log(`${colors.gray}Testing: ${url}${colors.reset}`);
    
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    console.log(`${colors.green}✓${colors.reset} ${testName} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`  Status: ${response.status}`);
    
    results.passed++;
    results.tests.push({ name: testName, passed: true, duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    
    results.failed++;
    results.tests.push({ 
      name: testName, 
      passed: false, 
      duration,
      error: error.message 
    });
  }
}

/**
 * Main test runner
 */
async function runTests() {
  printHeader();
  
  try {
    // Run tests sequentially
    await testRootEndpoint();
    console.log('');
    
    await testHealthEndpoint();
    await testHealthJSON();
    await testHealthPerformance();
    
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    printFooter();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run tests
runTests();

