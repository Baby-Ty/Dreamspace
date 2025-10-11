# Dreamspace Coding Standards

**Status:** ✅ Active  
**Last Updated:** October 6, 2025  
**Applies To:** All new code, components, hooks, and services

---

## Definition of Done (DoD)

Every new file **MUST** include this DoD comment at the top and comply with all criteria:

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.
```

### DoD Criteria Breakdown

| Criterion | Requirement | Why |
|-----------|-------------|-----|
| **No fetch in UI** | All network calls in services/hooks | Separation of concerns, testability |
| **< 400 lines** | Files must stay under 400 lines | Maintainability, readability |
| **Early returns** | Loading/error states at component top | Reduces nesting, clearer logic |
| **A11y roles/labels** | ARIA attributes, semantic HTML | Accessibility compliance |
| **Minimal props** | Components take only what they need | Loose coupling, reusability |
| **Test IDs** | Key nodes have `data-testid` | Enables reliable testing |

---

## Architecture Patterns

### 1. Three-Layer Architecture

All features should follow this proven pattern:

```
┌─────────────────────────────────────┐
│     Page Entry (Thin Wrapper)       │
│         (3-10 lines)                │
│  - Re-exports Layout component      │
│  - Maintains backward compatibility │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      Layout Component                │
│   (Orchestration Layer)             │
│  - Composes child components        │
│  - Manages local UI state           │
│  - Uses custom data hook            │
│  - Early returns (loading/error)    │
│  - Handles modals/overlays          │
└────────┬────────────┬────────────────┘
         │            │
         ▼            ▼
┌─────────────┐  ┌──────────────┐
│Presentation │  │Presentation  │
│Component A  │  │Component B   │
│             │  │              │
│- Pure UI    │  │- Pure UI     │
│- Props only │  │- Props only  │
│- A11y ready │  │- A11y ready  │
│- Memoized   │  │- Memoized    │
└─────────────┘  └──────────────┘
         │            │
         └────────────┘
                │
                ▼
        ┌───────────────┐
        │  Custom Hook  │
        │  (Data Layer) │
        │               │
        │- Data fetch   │
        │- Business     │
        │  logic        │
        │- Caching      │
        │- Transforms   │
        │- Selectors    │
        └───────────────┘
```

### 2. File Structure

```
src/
├── pages/
│   ├── FeatureName.jsx              # Thin wrapper (3-10 lines)
│   └── feature-name/
│       ├── FeatureNameLayout.jsx    # Orchestration (200-400 lines)
│       ├── ComponentA.jsx           # Pure UI (100-300 lines)
│       └── ComponentB.jsx           # Pure UI (100-300 lines)
├── hooks/
│   └── useFeatureData.js            # Data layer (100-250 lines)
├── services/
│   └── featureService.js            # API calls (100-300 lines)
└── components/
    └── shared/                      # Reusable components
        └── SharedComponent.jsx
```

---

## Component Standards

### Layout Components (Orchestration)

**Purpose:** Compose child components, manage local UI state

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState } from 'react';
import { useFeatureData } from '../../hooks/useFeatureData';
import ComponentA from './ComponentA';
import ComponentB from './ComponentB';

export default function FeatureLayout() {
  const { data, loading, error } = useFeatureData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Early return for loading
  if (loading) {
    return <div role="status" aria-live="polite">Loading...</div>;
  }

  // ✅ Early return for error
  if (error) {
    return <div role="alert">{error.message}</div>;
  }

  // ✅ Main render with composed components
  return (
    <div data-testid="feature-layout">
      <ComponentA data={data.sectionA} onAction={handleAction} />
      <ComponentB data={data.sectionB} />
      
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          {/* Modal content */}
        </Modal>
      )}
    </div>
  );
}
```

**Requirements:**
- ✅ Use custom hook for data
- ✅ Early returns for loading/error
- ✅ Minimal local state (UI only)
- ✅ Compose child components
- ✅ Pass minimal props
- ✅ Include `data-testid` on root

### Presentational Components (Pure UI)

**Purpose:** Display data, emit events upward

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';

function ComponentA({ data, onAction }) {
  return (
    <section 
      data-testid="component-a"
      aria-labelledby="component-a-heading"
    >
      <h2 id="component-a-heading">{data.title}</h2>
      
      <button 
        onClick={onAction}
        aria-label="Perform action"
        data-testid="action-button"
      >
        Action
      </button>
    </section>
  );
}

ComponentA.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
  }).isRequired,
  onAction: PropTypes.func.isRequired,
};

// ✅ Memoize to prevent unnecessary re-renders
export default memo(ComponentA);
```

**Requirements:**
- ✅ Pure function (no side effects)
- ✅ Accept only needed props
- ✅ PropTypes for type safety
- ✅ Memoized with `memo()`
- ✅ ARIA attributes
- ✅ Semantic HTML
- ✅ `data-testid` on key elements

### Thin Wrapper Pattern

**Purpose:** Maintain backward compatibility, single point of import

```javascript
// Thin wrapper - maintains backward compatibility
// Points to: src/pages/feature-name/FeatureNameLayout.jsx

export { default } from './feature-name/FeatureNameLayout';
```

**Requirements:**
- ✅ 3-10 lines max
- ✅ Re-exports Layout component
- ✅ Includes comment explaining purpose
- ✅ Maintains existing import paths

---

## Hooks Standards

### Custom Data Hooks

**Purpose:** Encapsulate data fetching, business logic, state management

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { featureService } from '../services/featureService';

export function useFeatureData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Data fetching
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      const result = await featureService.getData();
      
      if (!mounted) return;
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Memoized selectors
  const processedData = useMemo(() => {
    if (!data) return null;
    return {
      sectionA: data.filter(item => item.type === 'A'),
      sectionB: data.filter(item => item.type === 'B'),
    };
  }, [data]);

  // ✅ Memoized actions
  const updateItem = useCallback(async (id, updates) => {
    const result = await featureService.updateItem(id, updates);
    if (result.success) {
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    }
    return result;
  }, []);

  return {
    data: processedData,
    loading,
    error,
    updateItem,
  };
}
```

**Requirements:**
- ✅ One hook per feature/domain
- ✅ Return loading/error states
- ✅ Memoize expensive calculations
- ✅ Use `useCallback` for functions
- ✅ Handle cleanup (unmounted state)
- ✅ Return minimal API

---

## Service Layer Standards

### Service Functions

**Purpose:** Handle all network requests, return consistent format

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling';
import { ErrorCodes } from '../constants/errors';

/**
 * Get feature data from API
 * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
 */
export async function getData() {
  try {
    const response = await fetch('/api/feature/data', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return fail(ErrorCodes.NETWORK, `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // ✅ Optional: Validate with Zod schema
    const validated = DataSchema.parse(data);
    
    return ok(validated);
  } catch (error) {
    return fail(ErrorCodes.UNKNOWN, error.message);
  }
}

/**
 * Update feature item
 * @param {string} id - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
 */
export async function updateItem(id, updates) {
  try {
    const response = await fetch(`/api/feature/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      return fail(ErrorCodes.NETWORK, `HTTP ${response.status}`);
    }

    const data = await response.json();
    return ok(data);
  } catch (error) {
    return fail(ErrorCodes.UNKNOWN, error.message);
  }
}

export const featureService = {
  getData,
  updateItem,
};
```

**Requirements:**
- ✅ Return `{ success, data?, error? }`
- ✅ Use `ok()` and `fail()` helpers
- ✅ NO `throw` statements
- ✅ JSDoc comments on all functions
- ✅ Use error code constants
- ✅ Optional: Zod validation
- ✅ Export service object

---

## Error Handling Standards

### Response Format

All services **MUST** return consistent format:

```javascript
// Success
{
  success: true,
  data: { /* result data */ }
}

// Failure
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable message'
  }
}
```

### Using Error Helpers

```javascript
import { ok, fail, toErrorMessage } from './utils/errorHandling';
import { ErrorCodes } from './constants/errors';

// Success case
return ok({ id: 1, name: 'John' });

// Error cases
return fail(ErrorCodes.NETWORK, 'Failed to connect');
return fail(ErrorCodes.VALIDATION, 'Invalid input');
return fail(ErrorCodes.AUTH, 'Unauthorized');

// Extract message from unknown error
catch (error) {
  return fail(ErrorCodes.UNKNOWN, toErrorMessage(error));
}
```

### Error Codes

Use constants from `src/constants/errors.js`:

```javascript
export const ErrorCodes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN_ERROR',
};
```

---

## Accessibility Standards

### Required Attributes

| Element Type | Required Attributes |
|--------------|-------------------|
| **Interactive** | `aria-label` or `aria-labelledby` |
| **Buttons** | Clear text or `aria-label` |
| **Forms** | `label` for each input, `aria-invalid` for errors |
| **Lists** | `role="list"` with `role="listitem"` |
| **Regions** | `role="region"` with `aria-labelledby` |
| **Modals** | `role="dialog"`, `aria-modal="true"`, focus trap |
| **Tabs** | `role="tablist"`, `role="tab"`, `aria-selected` |
| **Loading** | `role="status"`, `aria-live="polite"` |
| **Errors** | `role="alert"`, `aria-live="assertive"` |

### Keyboard Navigation

All interactive elements **MUST** support:
- ✅ `Tab` / `Shift+Tab` navigation
- ✅ `Enter` / `Space` activation
- ✅ `Escape` to close modals/overlays
- ✅ Arrow keys for lists/grids (if applicable)

### Example: Accessible Button

```javascript
<button
  onClick={handleClick}
  aria-label="Delete item"
  data-testid="delete-button"
>
  <TrashIcon aria-hidden="true" />
</button>
```

### Example: Accessible Modal

```javascript
function Modal({ children, onClose }) {
  const dialogRef = useRef();

  useEffect(() => {
    // ✅ Trap focus in modal
    const firstFocusable = dialogRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="modal"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        Close
      </button>
    </div>
  );
}
```

---

## Testing Standards

### Test Coverage Requirements

| Type | Requirement |
|------|-------------|
| **Hooks** | Test data fetching, mutations, selectors |
| **Services** | Test success/error cases, validation |
| **Components** | Test rendering, user interactions, a11y |
| **Critical Paths** | 100% coverage required |
| **New Features** | Tests required before merge |

### Hook Testing Example

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useFeatureData } from './useFeatureData';
import * as featureService from '../services/featureService';

describe('useFeatureData', () => {
  it('fetches data on mount', async () => {
    jest.spyOn(featureService, 'getData').mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Test' }],
    });

    const { result } = renderHook(() => useFeatureData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([{ id: 1, name: 'Test' }]);
  });

  it('handles errors', async () => {
    jest.spyOn(featureService, 'getData').mockResolvedValue({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Failed' },
    });

    const { result } = renderHook(() => useFeatureData());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### Component Testing Example

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentA from './ComponentA';

describe('ComponentA', () => {
  it('renders with data', () => {
    const data = { title: 'Test Title' };
    render(<ComponentA data={data} onAction={jest.fn()} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const onAction = jest.fn();
    render(<ComponentA data={{ title: 'Test' }} onAction={onAction} />);

    const button = screen.getByTestId('action-button');
    await userEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility', () => {
    render(<ComponentA data={{ title: 'Test' }} onAction={jest.fn()} />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('Perform action')).toBeInTheDocument();
  });
});
```

---

## Performance Standards

### Optimization Requirements

| Scenario | Solution |
|----------|----------|
| **Expensive calculations** | `useMemo` |
| **Function props** | `useCallback` |
| **Pure components** | `memo()` |
| **Large lists** | Virtual scrolling |
| **Heavy components** | `lazy()` + `Suspense` |
| **Large data transforms** | Move to hook/service |

### Memoization Example

```javascript
import { useMemo, useCallback, memo } from 'react';

function ExpensiveComponent({ items, onSelect }) {
  // ✅ Memoize expensive calculation
  const processedItems = useMemo(() => {
    return items
      .filter(item => item.active)
      .sort((a, b) => a.priority - b.priority)
      .map(item => ({ ...item, label: item.name.toUpperCase() }));
  }, [items]);

  // ✅ Memoize callback
  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);

  return (
    <ul>
      {processedItems.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onSelect={handleSelect} 
        />
      ))}
    </ul>
  );
}

// ✅ Memoize component
export default memo(ExpensiveComponent);
```

---

## Documentation Standards

### File-Level Comments

Every file **MUST** start with DoD comment:

```javascript
// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.
```

### Function Documentation

Use JSDoc for all exported functions:

```javascript
/**
 * Fetches user data from the API
 * @param {string} userId - The user's unique identifier
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeTeam - Whether to include team data
 * @returns {Promise<{success: boolean, data?: User, error?: Error}>}
 * @example
 * const result = await getUserData('123', { includeTeam: true });
 * if (result.success) {
 *   console.log(result.data);
 * }
 */
export async function getUserData(userId, options = {}) {
  // implementation
}
```

### Component PropTypes

```javascript
ComponentName.propTypes = {
  /** User's display name */
  name: PropTypes.string.isRequired,
  /** Optional callback when action performed */
  onAction: PropTypes.func,
  /** User data object */
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
};
```

---

## Import Standards

### Import Order

```javascript
// 1. External dependencies
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// 2. Internal hooks
import { useFeatureData } from '../../hooks/useFeatureData';

// 3. Internal components
import ComponentA from './ComponentA';
import ComponentB from './ComponentB';

// 4. Services
import { featureService } from '../../services/featureService';

// 5. Utils
import { ok, fail } from '../../utils/errorHandling';

// 6. Constants
import { ErrorCodes } from '../../constants/errors';

// 7. Styles (if any)
import './styles.css';
```

---

## Git Commit Standards

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no behavior change)
- `style`: UI/styling changes
- `test`: Add or update tests
- `docs`: Documentation changes
- `chore`: Build, dependencies, tooling

### Examples

```
feat: add user filtering to People Dashboard

- Add search input with debouncing
- Add office filter dropdown
- Add sort by name/team options
- Integrate with usePeopleData hook

Closes #123
```

```
fix: prevent memory leak in useCareerData hook

- Add cleanup function to useEffect
- Check mounted state before setState
- Prevent stale closure issues

Fixes #456
```

---

## Code Review Checklist

Before approving any PR, verify:

### DoD Compliance
- [ ] DoD comment at top of each file
- [ ] No fetch/API calls in components
- [ ] All files < 400 lines
- [ ] Early returns for loading/error
- [ ] ARIA attributes on interactive elements
- [ ] Minimal props (no excessive drilling)
- [ ] `data-testid` on testable elements

### Architecture
- [ ] Follows three-layer pattern (data/orchestration/presentation)
- [ ] Custom hooks for business logic
- [ ] Pure presentational components
- [ ] Thin wrapper if refactoring existing file

### Error Handling
- [ ] Services return `{ success, data?, error? }`
- [ ] Uses `ok()` and `fail()` helpers
- [ ] Error codes from constants
- [ ] No unhandled exceptions

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation works
- [ ] Focus management for modals
- [ ] Screen reader friendly

### Testing
- [ ] Tests written for new code
- [ ] Tests pass locally
- [ ] Critical paths have coverage

### Performance
- [ ] Expensive calculations memoized
- [ ] Callbacks use `useCallback`
- [ ] Pure components use `memo()`
- [ ] No unnecessary re-renders

### Documentation
- [ ] JSDoc on exported functions
- [ ] PropTypes on components
- [ ] Clear variable/function names
- [ ] Complex logic has comments

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

```javascript
// ❌ Fetch in component
function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{data?.name}</div>;
}

// ❌ Throwing errors in services
export async function getData() {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('Failed'); // DON'T THROW
  }
  return response.json();
}

// ❌ Deep prop drilling
<Parent>
  <Child user={user} settings={settings} onUpdate={onUpdate}>
    <GrandChild user={user} settings={settings} onUpdate={onUpdate}>
      <GreatGrandChild user={user} settings={settings} onUpdate={onUpdate} />
    </GrandChild>
  </Child>
</Parent>

// ❌ Massive monolithic file
function HugeComponent() {
  // ... 1,500 lines of mixed concerns
}

// ❌ Missing accessibility
<button onClick={handleClick}>
  <TrashIcon />
</button>

// ❌ No memoization
function Component({ items }) {
  const processed = items.filter(...).map(...).sort(...); // Runs every render!
  return <List items={processed} />;
}
```

### ✅ Do This Instead

```javascript
// ✅ Custom hook with service
function MyComponent() {
  const { data, loading, error } = useMyData();
  
  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <div>{data.name}</div>;
}

// ✅ Return result object
export async function getData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      return fail(ErrorCodes.NETWORK, 'Failed to fetch');
    }
    const data = await response.json();
    return ok(data);
  } catch (error) {
    return fail(ErrorCodes.UNKNOWN, error.message);
  }
}

// ✅ Use hooks/context to avoid drilling
function Parent() {
  const { user, settings, onUpdate } = useAppContext();
  return <Child />; // No props needed
}

// ✅ Modular components
function FeatureLayout() {
  const { data } = useFeatureData();
  return (
    <>
      <SectionA data={data.a} />
      <SectionB data={data.b} />
    </>
  );
}

// ✅ Full accessibility
<button 
  onClick={handleClick}
  aria-label="Delete item"
>
  <TrashIcon aria-hidden="true" />
</button>

// ✅ Memoize expensive operations
function Component({ items }) {
  const processed = useMemo(() => 
    items.filter(...).map(...).sort(...),
    [items]
  );
  return <List items={processed} />;
}
```

---

## Quick Reference Card

### Every Component Must Have:
1. ✅ DoD comment at top
2. ✅ Early returns (loading/error)
3. ✅ ARIA attributes
4. ✅ `data-testid` on testable elements
5. ✅ PropTypes
6. ✅ < 400 lines

### Every Service Must Have:
1. ✅ Return `{ success, data?, error? }`
2. ✅ Use `ok()` / `fail()` helpers
3. ✅ Error code constants
4. ✅ JSDoc comments
5. ✅ NO `throw` statements

### Every Hook Must Have:
1. ✅ Single responsibility
2. ✅ Return loading/error states
3. ✅ Memoize calculations (`useMemo`)
4. ✅ Memoize callbacks (`useCallback`)
5. ✅ Cleanup function (if needed)

---

## Enforcement

### Pre-Commit Checks
- ESLint must pass
- File size check (< 400 lines)
- DoD comment present

### CI Pipeline
- All tests must pass
- Lint must pass
- Build must succeed
- No console errors/warnings

### Code Review
- At least one approval required
- All checklist items verified
- DoD compliance confirmed

---

## Getting Help

### Questions About Standards
- Check this document first
- Review refactoring examples in `/src/pages/career/`, `/src/pages/people/`, `/src/pages/dream-connect/`
- Review existing hooks in `/src/hooks/`
- Check service examples in `/src/services/`

### Proposing Changes
- Open discussion with team
- Update this document via PR
- Get consensus before merging

---

**Remember:** These standards exist to make development faster, code more maintainable, and the product more accessible. When in doubt, follow the pattern established in recent refactorings.

---

**Last Updated:** October 6, 2025  
**Version:** 1.0  
**Status:** ✅ Active and Enforced

