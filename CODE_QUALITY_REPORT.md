# Code Quality Review Report

**Generated:** 2026-01-12  
**Codebase:** DreamSpace Application

---

## Executive Summary

This report identifies significant code quality issues across the DreamSpace codebase, including:
- **4 functions with high cyclomatic complexity** (30+ branches)
- **41 API functions with duplicated boilerplate code**
- **5 major inconsistent patterns**
- **Widespread silent error handling**

---

## 1. High Cyclomatic Complexity Functions

### 🔴 Critical: `api/getUserData/index.js` (662 lines)
**Estimated Complexity: 30+**

This single function handles:
- Multiple data format detection (v1, v2, v3)
- Auto-migration between versions
- Week initialization and validation
- Parallel container queries
- Connect deduplication and sorting
- Legacy format fallbacks

**Problematic excerpt:**

```232:337:api/getUserData/index.js
module.exports = async function (context, req) {
  // ... 100+ lines of nested conditionals
  if (isNewStructure(profile)) {
    // ... handles 6-container structure
    if (needsMigration && oldDreamsResult.status === 'fulfilled') {
      // ... migration logic
      if (dreamBook.length > 0 || templates.length > 0) {
        // ... more nesting
      }
    }
  } else {
    // Old monolithic format
  }
```

**Recommendation:** Extract into separate functions:
- `loadNewStructureData()`
- `loadLegacyData()`
- `migrateToNewStructure()`
- `initializeWeekDocument()`

---

### 🔴 Critical: `api/utils/cosmosProvider.js` (920 lines)
**Issue:** God-class anti-pattern

This class has 30+ methods handling all database operations. Should be split into:
- `UserRepository`
- `DreamsRepository`
- `WeeksRepository`
- `ScoringRepository`
- `PromptsRepository`

---

### 🟡 High: `src/hooks/useWeeklyGoalActions.js` - `toggleWeeklyGoal` (130 lines)

```260:387:src/hooks/useWeeklyGoalActions.js
  const toggleWeeklyGoal = useCallback(async (goalId) => {
    if (!state.currentUser?.id) return;
    
    const goal = state.weeklyGoals.find(g => g.id === goalId);
    // ...70+ lines of nested conditionals for template vs instance handling
    
    if (goal.type === 'weekly_goal_template') {
      let instance = state.weeklyGoals.find(g => ...);
      if (!instance) {
        instance = { /* create new */ };
        dispatch(...);
      } else {
        const updatedInstance = { ... };
        dispatch(...);
        instance = updatedInstance;
      }
      // ... save logic
      if (instance.completed) {
        // ... scoring logic
      }
    } else if (goal.weekId) {
      // ... another 40 lines of similar logic
    }
```

**Recommendation:** Extract into:
- `toggleTemplateGoal()`
- `toggleInstanceGoal()`
- `updateGoalScoring()`

---

### 🟡 High: `src/context/AppContext.jsx` - `logWeeklyCompletion` (75 lines)

```276:352:src/context/AppContext.jsx
    logWeeklyCompletion: async (goalId, isoWeek, completed) => {
      dispatch({ ... });
      
      if (!state.currentUser?.dreamBook || !state.weeklyGoals) return;
      
      const weeklyGoal = state.weeklyGoals.find(...);
      if (weeklyGoal?.goalId && weeklyGoal?.dreamId) {
        const dream = state.currentUser.dreamBook.find(...);
        if (dream) {
          const goal = dream.goals?.find(...);
          if (goal?.type === 'consistency' && goal?.startDate) {
            const newStreak = computeStreak(...);
            if (goal.targetWeeks && newStreak >= goal.targetWeeks && !goal.completed) {
              // ... 30+ more lines of nested logic
            }
          }
        }
      }
```

**Issue:** 5 levels of nesting, multiple async operations inline.

---

## 2. Code Duplication

### 🔴 Critical: Cosmos DB Client Initialization (41 files!)

Every API function duplicates this pattern:

```javascript
const { CosmosClient } = require('@azure/cosmos');

let client, database, usersContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
}
```

**Files affected:** 41 API function files

**Recommendation:** All files should use the existing `cosmosProvider.js`:

```javascript
const { getCosmosProvider } = require('../utils/cosmosProvider');
const provider = getCosmosProvider();
const container = provider.getContainer('users');
```

---

### 🔴 Critical: API Boilerplate Pattern (41 files)

Every API function duplicates:

```javascript
module.exports = async function (context, req) {
  const headers = getCorsHeaders();
  
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }
  
  // ... validation ...
  
  if (!container) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY...' 
      }),
      headers
    };
    return;
  }
  
  try {
    // ... business logic ...
  } catch (error) {
    context.log.error('Error ...:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers
    };
  }
};
```

**Recommendation:** Create a wrapper function:

```javascript
// utils/apiWrapper.js
function createApiHandler(handler, options = {}) {
  return async (context, req) => {
    const headers = getCorsHeaders();
    if (req.method === 'OPTIONS') return { status: 200, headers };
    
    if (options.requireAuth && isAuthRequired()) {
      const user = await requireAuth(context, req);
      if (!user) return;
    }
    
    try {
      const result = await handler(context, req);
      context.res = { status: 200, body: JSON.stringify(result), headers };
    } catch (error) {
      context.log.error(`${options.name} error:`, error);
      context.res = { status: 500, body: JSON.stringify({ error: error.message }), headers };
    }
  };
}
```

---

### 🟡 High: Goal Operations Pattern Duplication

`useGoalActions.js` and `useDreamActions.js` share nearly identical patterns:

```javascript
// Pattern repeated in both files:
const dreams = state.currentUser?.dreamBook || [];
const templates = state.weeklyGoals?.filter(g => 
  g.type === 'weekly_goal_template'
) || [];

const result = await itemService.saveDreams(state.currentUser.id, dreams, templates);
if (!result.success) {
  console.error('Failed to save dreams:', result.error);
  return;
}
```

**Recommendation:** Extract into shared utility:

```javascript
// utils/dreamOperations.js
export async function saveDreamsWithTemplates(userId, dreams, weeklyGoals) {
  const templates = weeklyGoals?.filter(g => g.type === 'weekly_goal_template') || [];
  return itemService.saveDreams(userId, dreams, templates);
}
```

---

### 🟡 High: Response Parsing Duplication

`itemService.js` and `databaseService.js` both have:

```javascript
const responseText = await response.text();

if (response.ok) {
  if (!responseText || responseText.trim() === '') {
    console.error('❌ Empty response from API');
    return fail(ErrorCodes.SAVE_ERROR, 'Empty response from API');
  }
  
  try {
    const result = JSON.parse(responseText);
    return ok(result);
  } catch (parseError) {
    console.error('❌ Invalid JSON response:', responseText);
    return fail(ErrorCodes.SAVE_ERROR, 'Invalid JSON response from API');
  }
} else {
  // ... similar error handling
}
```

**Recommendation:** Create `parseApiResponse()` utility in `apiClient.js`.

---

## 3. Inconsistent Patterns

### 🔴 Field Naming Inconsistency: `dreams` vs `dreamBook`

The codebase uses both field names interchangeably:

| Location | Uses `dreamBook` | Uses `dreams` |
|----------|-----------------|---------------|
| Frontend state | ✅ | |
| saveDreams API | | ✅ (explicitly prevents `dreamBook`) |
| getUserData API | ✅ (returns) | ✅ (reads) |
| cosmosProvider | ✅ | |

**Evidence from `api/saveDreams/index.js`:**

```97:98:api/saveDreams/index.js
    // IMPORTANT: Always use 'dreams' field, never 'dreamBook' to avoid duplicates
```

```165:169:api/saveDreams/index.js
    // IMPORTANT: Remove 'dreamBook' field if it exists to prevent duplicates
    if (document.dreamBook) {
      delete document.dreamBook;
      context.log('⚠️ Removed duplicate dreamBook field from document');
    }
```

---

### 🟡 High: Error Handling Inconsistency

| Pattern | Files Using |
|---------|-------------|
| `return fail(ErrorCodes.X, message)` | 19 service files |
| `console.error()` then silent return | Most hooks |
| `throw error` | Some API functions |
| Return `{ success: false }` | Some services |

---

### 🟡 Medium: State Property Naming

```javascript
// usePersistence.js saves:
{ user: state.user, prefs: state.prefs }

// AppContext uses:
{ currentUser: ..., isAuthenticated: ... }
```

---

### 🟡 Medium: Image Field Naming

```129:129:api/saveDreams/index.js
        image: dream.image || dream.picture, // Support both image (new) and picture (legacy)
```

---

## 4. Poor Error Handling

### 🔴 Critical: Silent Failures in Hooks

All action hooks follow this problematic pattern:

```javascript
// useDreamActions.js
const updateDream = useCallback(async (dream) => {
  if (!state.currentUser?.id) return;  // Silent return - no error indication
  
  // ... operations ...
  
  const result = await itemService.saveDreams(...);
  if (!result.success) {
    console.error('Failed to save dreams:', result.error);
    return;  // User never knows it failed!
  }
```

**Affected hooks:**
- `useDreamActions.js` - all 4 functions
- `useGoalActions.js` - all 5 functions
- `useWeeklyGoalActions.js` - all 5 functions
- `useConnectActions.js`

**Recommendation:** Return result objects and use toast notifications:

```javascript
const updateDream = useCallback(async (dream) => {
  if (!state.currentUser?.id) {
    showToast('User not logged in', 'error');
    return { success: false, error: 'NOT_AUTHENTICATED' };
  }
  
  const result = await itemService.saveDreams(...);
  if (!result.success) {
    showToast(`Failed to save: ${result.error}`, 'error');
    return result;
  }
  
  return { success: true };
});
```

---

### 🔴 Critical: Dead Code Reference

```89:125:api/getUserData/index.js
async function migrateWeekLogGoals(userId, items, context) {
  // ... 
  await itemsContainer.items.upsert(template);  // ❌ itemsContainer is undefined!
  // ...
}
```

This function references `itemsContainer` which is never defined in the file.

---

### 🟡 High: Missing Null Checks Mixed with Optional Chaining

```javascript
// Pattern found in multiple files:
const templates = state.weeklyGoals?.filter(...) || [];

// But then later:
state.weeklyGoals.find(...)  // ❌ No optional chaining
```

---

### 🟡 Medium: Magic Timeouts with No Explanation

```javascript
// DashboardLayout.jsx
setTimeout(async () => {
  await loadCurrentWeekGoals();
}, 1000);  // Why 1000ms?

setTimeout(async () => {
  await loadCurrentWeekGoals();
}, 2000);  // Why 2000ms?

// useDreamActions.js
setTimeout(() => {
  window.dispatchEvent(new CustomEvent('dreams-updated'));
}, 300);  // Why 300ms?
```

**Recommendation:** Use constants with explanatory names:

```javascript
const COSMOS_EVENTUAL_CONSISTENCY_DELAY = 1000;
const EVENT_DEBOUNCE_DELAY = 300;
```

---

## 5. AI-Generated Code Smells

### Patch-Style Comments

```javascript
// ✅ FIX: Preserve dreams if payload has empty dreams
// ← NEW: Persist weeks remaining
// ⚠️ Removed duplicate dreamBook field
```

These suggest incremental patches rather than proper refactoring.

---

### Deprecated Code with Active Logic

```241:244:src/state/appReducer.js
    // UPDATE_MILESTONE_STREAK is deprecated - goals track completion directly now
    case actionTypes.UPDATE_MILESTONE_STREAK:
      console.warn('UPDATE_MILESTONE_STREAK is deprecated...');
      return state;
```

```198:201:src/state/appReducer.js
    case actionTypes.LOG_WEEKLY_COMPLETION:
      // DEPRECATED: This action is kept for backward compatibility
      // ... but still has 40 lines of complex logic
```

**Recommendation:** Remove deprecated code paths or complete the migration.

---

### Overly Verbose Logging

```javascript
console.log('📂 Cosmos DB data loaded:', cosmosData ? 'Found data' : 'No data found');
console.log('📂 LocalStorage data loaded:', localData ? 'Found data' : 'No data found');
console.log('💾 Saving data for user ID:', userId, 'Data keys:', Object.keys(userData));
console.log('📡 Saving to:', apiClient.getBaseUrl() + endpoint);
console.log('📥 Save response status:', response.status);
console.log('📥 Save response content type:', response.headers.get('content-type'));
console.log('📥 Save response text (first 200 chars):', responseText.substring(0, 200));
```

These should use a proper logging service with levels.

---

## Recommendations Summary

### Priority 1: Critical (Do First)
1. **Centralize Cosmos DB initialization** - Use `cosmosProvider.js` everywhere
2. **Create API wrapper** - Eliminate 41-file boilerplate duplication
3. **Fix dead code** - Remove `migrateWeekLogGoals` or fix the undefined reference
4. **Add user-facing error handling** - Replace silent failures with toast notifications

### Priority 2: High (Do Soon)
1. **Break down complex functions** - `getUserData`, `toggleWeeklyGoal`, `logWeeklyCompletion`
2. **Standardize field naming** - Choose `dreams` OR `dreamBook`, not both
3. **Extract shared patterns** - `saveDreamsWithTemplates()`, `parseApiResponse()`

### Priority 3: Medium (Technical Debt)
1. **Replace magic timeouts** - Use named constants
2. **Complete deprecation** - Remove `LOG_WEEKLY_COMPLETION` legacy code
3. **Add consistent null checks** - Use optional chaining consistently
4. **Implement structured logging** - Replace emoji console.log with logging service

---

## Metrics

| Category | Count |
|----------|-------|
| Files with duplicated Cosmos init | 41 |
| Functions with complexity >20 | 4 |
| Silent failure patterns | 14+ |
| Inconsistent field names | 3 pairs |
| Magic numbers/timeouts | 8+ |
| Deprecated but active code | 2 blocks |

---

*Report generated by code review analysis*
