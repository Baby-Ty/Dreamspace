# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### Test File Naming
- Place test files next to the code they test
- Use `.test.js` extension: `myModule.test.js`

### Example Test Structure

```javascript
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from './myModule.js';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Mocking with Vitest

```javascript
// Mock a function
const mockFn = vi.fn().mockResolvedValue('mocked value');

// Mock a module
vi.mock('./myModule.js', () => ({
  myFunction: vi.fn()
}));
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

## CI Integration

Tests run automatically in GitHub Actions on every push and pull request to the `main` branch.

