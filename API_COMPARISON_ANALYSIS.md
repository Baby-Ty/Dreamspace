# API Endpoints Comparison Analysis

**Comparing**: Working version (commit 88d8d25) vs Current HEAD
**Date**: January 13, 2026

## Summary

After the major refactoring, most API endpoints were successfully converted to use the `apiWrapper.js` pattern. However, some endpoints still use direct container access instead of repository methods.

---

## ✅ Correctly Refactored Endpoints

These endpoints properly use provider repository methods:

### 1. `getCurrentWeek/index.js`
- Uses: `provider.getCurrentWeekDocument(userId)`
- Status: ✅ Correct

### 2. `saveCurrentWeek/index.js`
- Uses: `provider.upsertCurrentWeek(userId, weekId, goals, stats)`
- Status: ✅ Correct (after validation fixes)

### 3. `getPastWeeks/index.js`
- Uses: `provider.getPastWeeksDocument(userId)`
- Status: ✅ Correct

### 4. `archiveWeek/index.js`
- Uses: `provider.archiveWeekToPastWeeks(...)`
- Status: ✅ Correct

---

## ⚠️ Mixed Pattern Endpoints

These endpoints mix direct container access with provider methods:

### 1. `getUserData/index.js` ⚠️

**Current Pattern**:
```javascript
const usersContainer = provider.getContainer('users');
const dreamsContainer = provider.getContainer('dreams');
const connectsContainer = provider.getContainer('connects');
const scoringContainer = provider.getContainer('scoring');

// Then uses containers directly:
await usersContainer.item(userId, userId).read();
await dreamsContainer.item(userId, userId).read();
await connectsContainer.items.query(...);
```

**Available Provider Methods**:
- `provider.getUserProfile(userId)`
- `provider.getDreamsDocument(userId)`
- `provider.getUserConnects(userId, orderBy)`
- `provider.getScoringDocument(userId, year)`

**Analysis**:
- This endpoint is complex because it deals with legacy data structure migration
- It aggregates data from multiple containers for backward compatibility
- The direct container access was intentional for the legacy `weeks{year}` containers
- However, for `users`, `dreams`, `connects`, and `scoring` containers, it SHOULD use repository methods

**Recommendation**: Refactor helper functions to use provider methods where available

---

## 🔍 Direct Container Access Analysis

**Total matches found**:
- `provider.` calls: 79 matches across 31 files ✅
- `container.items|container.item` calls: 47 matches across 27 files

**Files still using direct container access**:
1. `getUserData/index.js` - Helper functions
2. `saveDreams/index.js` - Direct access (but may be needed for complex operations)
3. `saveConnect/index.js` - Direct access
4. `deleteConnect/index.js` - Direct access
5. `saveItem/index.js` - Direct access
6. `deleteItem/index.js` - Direct access
7. `getItems/index.js` - Direct access
8. `saveScoring/index.js` - Direct access
9. `getScoring/index.js` - Direct access
10. `updateUserProfile/index.js` - Direct access

**Repository files (expected to use direct access)**:
- `api/utils/repositories/*.js` - ✅ These SHOULD use direct container access
- `api/utils/authMiddleware.js` - ✅ Auth checks may need direct access

---

## Key Findings

### Pattern 1: Correct Usage ✅
```javascript
module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'body.userId'
}, async (context, req, { provider }) => {
  const data = await provider.getCurrentWeekDocument(userId);
  return { success: true, data };
});
```

### Pattern 2: Mixed Usage ⚠️
```javascript
module.exports = createApiHandler({
  auth: 'user-access'
}, async (context, req, { provider, container }) => {
  // Using both provider methods AND direct container access
  const profile = await provider.getUserProfile(userId);
  const { resource } = await container.item(id, pk).read(); // Should avoid this
});
```

### Pattern 3: Legacy Compatibility (Acceptable) ✅
```javascript
// For legacy weeks{year} containers that don't have repository methods yet
const weeksContainer = database.container(`weeks${currentYear}`);
const { resource } = await weeksContainer.item(docId, userId).read();
```

---

## Action Items

1. ✅ **COMPLETED**: Fix validation errors in `validation.js`
2. **TODO**: Refactor `getUserData/index.js` helper functions to use provider methods
3. **OPTIONAL**: Review other endpoints to see if they can use provider methods
4. **DOCUMENT**: The `getUserData` endpoint's complexity is justified for backward compatibility

---

## Conclusion

The refactoring successfully converted most endpoints to use the apiWrapper pattern. The remaining direct container access is primarily in:
1. Complex aggregation endpoints (getUserData)
2. Simple CRUD operations that may not have repository methods yet
3. Repository classes themselves (expected)

**Status**: ✅ Refactoring is successful with minor cleanup needed
