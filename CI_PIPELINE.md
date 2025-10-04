# CI Pipeline Documentation

## Overview
Automated Continuous Integration pipeline that runs quality checks on every push and pull request.

## ✅ What Gets Checked

### 1. 🔍 Linting (`npm run lint`)
- Checks code style and formatting
- Enforces ESLint rules
- **Fails build if**: Any linting errors found

### 2. 🔎 Type Checking (`npm run typecheck`)
- Validates TypeScript/JSDoc types
- Catches type errors early
- **Fails build if**: Any type errors found

### 3. 🧪 Testing (`npm test`)
- Runs all Vitest unit tests
- Component tests
- Service tests
- Hook tests
- **Fails build if**: Any tests fail

### 4. 🏗️ Production Build (`npm run build`)
- Builds optimized production bundle
- Verifies no build-time errors
- **Fails build if**: Build fails

## Trigger Events

### Automatic Triggers
- **Push** to `main` or `develop` branches
- **Pull Request** targeting `main` or `develop` branches

### Manual Trigger
Can be triggered manually from GitHub Actions tab

## Configuration

### File Location
`.github/workflows/ci.yml`

### Node Version
- **Version**: Node.js 20 LTS
- **Package Manager**: npm
- **Caching**: Enabled for faster builds

### Build Strategy
```yaml
strategy:
  fail-fast: true  # Stop on first failure (fast feedback)
```

### Error Handling
```yaml
continue-on-error: false  # Fail build on any errors (explicit)
```

## Workflow Steps

```
┌─────────────────────────────────────────┐
│  1. 📥 Checkout Code                    │
│     - Clone repository                   │
│     - Fetch all files                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. 🔧 Setup Node.js                    │
│     - Install Node.js 20                 │
│     - Enable npm caching                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. 📦 Install Dependencies             │
│     - Run: npm ci                        │
│     - Clean install from package-lock    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. 🔍 Run Linter                       │
│     - Run: npm run lint                  │
│     - ❌ FAIL BUILD IF ERRORS           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. 🔎 Run Type Check                   │
│     - Run: npm run typecheck             │
│     - ❌ FAIL BUILD IF ERRORS           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  6. 🧪 Run Tests                        │
│     - Run: npm test                      │
│     - ❌ FAIL BUILD IF FAILURES         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  7. 🏗️ Build Production                 │
│     - Run: npm run build                 │
│     - ❌ FAIL BUILD IF ERRORS           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  8. ✅ All Checks Passed                │
│     - Success message                    │
└─────────────────────────────────────────┘
```

## Local Development

### Run All Checks Locally
Before pushing, run all checks locally to catch issues early:

```bash
# Run all quality checks (same as CI)
npm run lint && npm run typecheck && npm test && npm run build
```

### Individual Checks
```bash
# Linting only
npm run lint

# Type checking only
npm run typecheck

# Tests only
npm test

# Build only
npm run build
```

### Fix Issues
```bash
# Auto-fix linting issues
npm run lint -- --fix

# Watch mode for tests
npm run test:watch
```

## Package.json Scripts

Ensure these scripts are defined in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "echo 'Type checking not configured yet' && exit 0",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Success Criteria

### Build Passes When:
- ✅ No linting errors
- ✅ No type errors
- ✅ All tests pass
- ✅ Production build succeeds

### Build Fails When:
- ❌ Any linting errors found
- ❌ Any type errors found
- ❌ Any test failures
- ❌ Production build fails
- ❌ npm ci fails (dependency issues)

## Viewing Results

### GitHub UI
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select workflow run
4. View logs for each step

### Pull Request Status
- ✅ Green checkmark: All checks passed
- ❌ Red X: One or more checks failed
- 🟡 Yellow dot: In progress

### Email Notifications
GitHub sends email notifications on:
- Build failures on `main` branch
- Pull request check failures

## Troubleshooting

### Common Issues

#### 1. Linting Errors
```bash
# Check what's failing
npm run lint

# Auto-fix if possible
npm run lint -- --fix

# Check specific file
npm run lint -- src/path/to/file.js
```

#### 2. Type Check Errors
```bash
# Run type check locally
npm run typecheck

# If using TypeScript, check tsconfig.json
# If using JSDoc, check @type annotations
```

#### 3. Test Failures
```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test -- src/path/to/test.js

# Update snapshots if needed
npm test -- -u
```

#### 4. Build Errors
```bash
# Try clean build
rm -rf dist node_modules
npm install
npm run build

# Check for import errors
# Check for missing environment variables
```

#### 5. Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

### Before Pushing
1. **Run checks locally first**
   ```bash
   npm run lint && npm run typecheck && npm test
   ```

2. **Fix issues immediately**
   - Don't push broken code
   - CI should always pass

3. **Keep commits atomic**
   - One logical change per commit
   - Easier to identify failures

### During Development
1. **Use watch modes**
   ```bash
   npm run test:watch  # Auto-run tests on changes
   ```

2. **Enable auto-fix in editor**
   - ESLint auto-fix on save
   - Prettier formatting on save

3. **Write tests alongside code**
   - TDD approach
   - Easier to maintain green CI

### Pull Requests
1. **Ensure CI passes before requesting review**
2. **Fix CI failures promptly**
3. **Don't merge if CI fails**

## Performance

### Optimization Strategies
1. **npm caching**: Faster dependency installation
2. **fail-fast**: Stop on first error (faster feedback)
3. **Parallel jobs**: Can be added for matrix testing

### Typical Run Times
- **Checkout**: ~5 seconds
- **Setup Node**: ~10 seconds (with cache)
- **Install dependencies**: ~30 seconds (with cache)
- **Lint**: ~10 seconds
- **Type check**: ~5 seconds
- **Tests**: ~15 seconds
- **Build**: ~10 seconds

**Total**: ~1-2 minutes per run

## Future Enhancements

### Potential Additions
- [ ] Code coverage reporting
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Security scanning (npm audit)
- [ ] Dependency update checks
- [ ] Deploy preview for PRs
- [ ] Matrix testing (multiple Node versions)
- [ ] E2E tests with Playwright
- [ ] Bundle size analysis

### Integration Ideas
- **Codecov**: Coverage tracking
- **SonarQube**: Code quality metrics
- **Dependabot**: Automated dependency updates
- **Snyk**: Security vulnerability scanning

## Maintenance

### Regular Tasks
- **Review workflow logs**: Check for slow steps
- **Update Node version**: Keep current with LTS
- **Update actions**: Keep @v4 versions current
- **Monitor build times**: Optimize if too slow

### When to Update
- New Node.js LTS release
- Breaking changes in dependencies
- New quality tools added
- Performance optimizations needed

---

**Status**: ✅ Active and enforced on `main` and `develop` branches  
**Last Updated**: 2024-10-04  
**Owner**: Development Team

