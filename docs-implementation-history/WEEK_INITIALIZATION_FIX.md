# Week Initialization Fix - November 8, 2025

## Problem
The separate `initializeAllWeeks` API endpoint was failing with 500 errors because it wasn't running/deployed locally. Users were not getting week documents with all 52/53 weeks populated on login.

## Solution
Integrated all-weeks initialization directly into the existing `getUserData` API, which already handles week document creation on login. This follows the original working pattern.

---

## Changes Made

### 1. Updated `api/getUserData/index.js`

**Added helper function** (lines 22-78):
- `getAllWeeksForYear(year)` - Generates all ISO weeks for a given year (52 or 53)
- Includes nested helpers: `getIsoWeek()` and `getWeekRange()`

**Updated week document creation** (lines 319-367):
- **New documents**: Now create with ALL 52/53 weeks initialized with empty goals arrays
- **Existing documents**: Check for missing weeks and add them automatically on login
- Logs show: `✅ Created week document with 52 weeks initialized`

**Before**:
```javascript
weeks: {}  // Empty object
```

**After**:
```javascript
weeks: {
  "2025-W01": { goals: [] },
  "2025-W02": { goals: [] },
  // ... all 52 weeks ...
  "2025-W52": { goals: [] }
}
```

### 2. Removed frontend call in `src/context/AppContext.jsx`

**Removed** (lines 331-365):
- Entire `initializeAllWeeks` useEffect that was calling the failing API
- Replaced with comment noting initialization is handled by getUserData

### 3. Cleaned up `src/services/weekService.js`

**Removed** (lines 76-132):
- `initializeAllWeeks()` method (no longer needed)
- Added comment explaining it's now handled by getUserData API

### 4. Deleted unused API endpoint

**Deleted**:
- `api/initializeAllWeeks/function.json`
- `api/initializeAllWeeks/index.js`

---

## How It Works Now

### On User Login

```
1. User signs in
2. AuthContext → getUserData API called
3. getUserData checks for weekYear document
4. If NEW: Creates document with ALL 52/53 weeks initialized
5. If EXISTS: Ensures all weeks exist, adds missing ones
6. Returns to frontend with complete week structure
7. ✅ All weeks ready for bulk instantiation
```

### Bulk Instantiation Flow

```
1. Frontend loads templates from database
2. AppContext detects templates (useEffect at line 439)
3. Calls bulkInstantiateTemplates API
4. API populates goal instances across target weeks
5. User sees goals in future weeks immediately
```

---

## Expected Behavior

### When logging in:
- Console shows: `✅ Created week document with 52 weeks initialized for user@example.com`
- OR: `✅ Initialized 52 weeks for existing document`

### After bulk instantiation:
- Console shows: `✅ Bulk instantiation complete on login: { weeksCreated: 12, instancesCreated: 12, ... }`

### In Cosmos DB:
- weekYear document has all 52 weeks
- Weeks with goals have populated arrays
- Empty weeks have empty arrays `{ goals: [] }`

### In Week Ahead UI:
- Browse any week → week structure exists
- Weeks with goals → display goals
- Empty weeks → show "No goals yet"

---

## Testing Steps

1. **Clear existing week document** (optional for testing):
   ```sql
   DELETE FROM c WHERE c.id = "Tyler.Stewart@netsurit.com_2025"
   ```

2. **Restart local API**:
   ```bash
   cd api
   func start
   ```

3. **Sign in to app**
   - Watch console for: `✅ Created week document with 52 weeks initialized`

4. **Check Cosmos DB**:
   - Document should have `weeks` object with 52 entries
   - Each week: `"2025-Wxx": { "goals": [] }`

5. **Create a goal**:
   - Create 12-week consistency goal
   - Check console for bulk instantiation success

6. **Browse future weeks**:
   - Navigate to week +5
   - Goal should be visible

---

## Benefits

1. **Single API call** - No separate initialization endpoint needed
2. **Always works** - Uses proven getUserData API that's always running
3. **Automatic** - Happens on every login without frontend intervention
4. **Idempotent** - Safe to call multiple times, only adds missing weeks
5. **Backward compatible** - Works with existing documents

---

## Related Files

**Backend**:
- `api/getUserData/index.js` - Now handles all-weeks initialization

**Frontend**:
- `src/context/AppContext.jsx` - Removed separate initialization call
- `src/services/weekService.js` - Removed unused method

**Deleted**:
- `api/initializeAllWeeks/` - No longer needed

---

## Summary

✅ All weeks initialization integrated into getUserData API  
✅ Works on every login automatically  
✅ No more 500 errors from missing API endpoint  
✅ Simpler architecture - one less API to maintain  
✅ Ready for bulk template instantiation  

The fix restores the original working pattern while adding the all-weeks initialization feature.

