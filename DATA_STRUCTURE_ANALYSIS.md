# Data Structure Compatibility Analysis

**Date**: January 13, 2026  
**Status**: ✅ COMPATIBLE

## Summary

API response formats match frontend expectations. The refactored repository pattern maintains backward compatibility.

---

## Current Week API Response Format

### API Endpoint: `getCurrentWeek/{userId}`

**Returns**:
```javascript
{
  success: true,
  data: {
    id: string,           // userId
    userId: string,
    weekId: string,       // ISO week (e.g., "2026-W03")
    weekStartDate: string, // ISO date
    weekEndDate: string,   // ISO date
    goals: Array<Goal>,
    stats: {
      totalGoals: number,
      completedGoals: number,
      skippedGoals: number,
      score: number
    },
    createdAt: string,
    updatedAt: string
  }
}
```

**Or when no current week**:
```javascript
{
  success: true,
  data: null,
  message: "No current week document found..."
}
```

### Frontend Expectations

**From**: `src/services/currentWeekService.js`, `src/hooks/useDashboardGoalsLoader.js`, etc.

**Expected**:
```javascript
if (result.success && result.data) {
  const goals = result.data.goals || [];
  const weekId = result.data.weekId;
  // ... use goals and weekId
}
```

**Status**: ✅ COMPATIBLE - Frontend correctly handles both `data` object and `data: null` cases

---

## Save Current Week API Request/Response

### API Endpoint: `POST /saveCurrentWeek`

**Request Body**:
```javascript
{
  userId: string,
  weekId: string,  // ISO week (e.g., "2026-W03")
  goals: Array<Goal>,
  stats?: object   // Optional
}
```

**Response**:
```javascript
{
  success: true,
  data: {
    id: string,
    userId: string,
    weekId: string,
    goals: Array<Goal>,
    stats: object,
    createdAt: string,
    updatedAt: string
  }
}
```

**Frontend Sends**:
```javascript
await currentWeekService.saveCurrentWeek(userId, weekId, goals, stats);
```

**Status**: ✅ COMPATIBLE

---

## Goal Object Structure

### Schema Validation (`api/utils/validation.js`)

```javascript
{
  id: string,
  templateId?: string,
  type: 'weekly_goal' | 'deadline',
  title: string,
  description?: string,
  dreamId?: string,
  dreamTitle?: string,
  dreamCategory?: string,
  goalId?: string,
  recurrence?: 'weekly' | 'monthly',
  completed: boolean,
  completedAt?: string | null,
  skipped?: boolean,
  weekId?: string,
  createdAt?: string  // ✅ Fixed to be optional
}
```

### Frontend Creates

**From**: `src/hooks/useDashboardGoalsActions.js`
```javascript
{
  id: `goal_${Date.now()}`,
  templateId: template?.id,
  type: 'weekly_goal',
  title: template.title,
  description: template.description,
  dreamId: template.dreamId,
  dreamTitle: template.dreamTitle,
  dreamCategory: template.dreamCategory,
  goalId: template.goalId,
  completed: false,
  skipped: false,
  createdAt: new Date().toISOString()
}
```

**Status**: ✅ COMPATIBLE

---

## Past Weeks API Response Format

### API Endpoint: `getPastWeeks/{userId}`

**Returns**:
```javascript
{
  success: true,
  data: {
    userId: string,
    weekHistory: {
      [weekId: string]: {
        totalGoals: number,
        completedGoals: number,
        skippedGoals: number,
        score: number,
        weekStartDate: string,
        weekEndDate: string,
        archivedAt: string
      }
    },
    totalWeeksTracked: number
  }
}
```

**Frontend Expectations**:
```javascript
if (result.success && result.data?.weekHistory) {
  const weeks = Object.entries(result.data.weekHistory);
  // ... process weeks
}
```

**Status**: ✅ COMPATIBLE

---

## WeeksRepository Data Transformation

### `upsertCurrentWeek()` Method

**Adds**:
- Generates `id` (userId)
- Calculates `weekStartDate` from weekId
- Calculates `weekEndDate` from weekId
- Ensures each goal has unique `id` if missing
- Adds `createdAt` to new goals if missing
- Calculates stats automatically:
  - `totalGoals`
  - `completedGoals`
  - `skippedGoals`
  - `score`
- Adds `updatedAt` timestamp

**Status**: ✅ Enhances data without breaking compatibility

---

## Legacy Data Structure Support

### `getUserData` Endpoint

Still supports legacy `weeks{year}` container format for backward compatibility:

```javascript
{
  // v3 structure
  dataStructureVersion: 3,
  dreamBook: Array,
  yearVision: string,
  weeklyGoals: Array,  // Flattened from legacy weeks structure
  connects: Array,
  scoringHistory: Array,
  // ... profile fields
}
```

**Status**: ✅ Backward compatible - Aggregates legacy data correctly

---

## Issues Found and Fixed

### 1. ✅ FIXED: `createdAt` Required in Schema

**Problem**: `WeeklyGoalInstanceSchema.createdAt` was required (`z.string()`)
**Impact**: Existing goals without `createdAt` would fail validation
**Fix**: Changed to optional (`z.string().optional()`)
**File**: `api/utils/validation.js` line 163

### 2. ✅ FIXED: Validation Error Handling

**Problem**: `error.errors.map()` crashed when `errors` was undefined
**Impact**: Validation failures returned 500 instead of 400
**Fix**: Added null checking `(error.errors || []).map(...)`
**File**: `api/utils/validation.js` line 241

---

## Conclusion

**Status**: ✅ FULLY COMPATIBLE

All data structures are compatible between frontend and backend. The refactored repository pattern maintains backward compatibility while adding improvements like:
- Automatic timestamp management
- Stats calculation
- Date range calculation from week IDs
- Better validation with helpful error messages

**No Additional Fixes Needed**
