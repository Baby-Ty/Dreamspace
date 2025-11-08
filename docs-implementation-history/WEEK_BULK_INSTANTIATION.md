# Week Bulk Instantiation Implementation

**Date**: November 8, 2025  
**Status**: ✅ **IMPLEMENTED** - Templates now auto-populate all target weeks

---

## Problem

Previously, when a weekly goal template was created with `targetWeeks: 12`, only the current week would have goal instances. When browsing to future weeks in Week Ahead, users wouldn't see any goals because instances were only created on-demand when visiting that specific week.

## Solution

Implemented bulk instantiation of templates across all their target weeks upfront, so goals are visible immediately when browsing any future week.

---

## Changes Made

### 1. Added `bulkInstantiateTemplates` Method to `weekService.js`

```javascript
async bulkInstantiateTemplates(userId, year, templates) {
  // Calls the /bulkInstantiateTemplates API endpoint
  // Creates instances for all templates across their target weeks
  // Returns: { success: true, weeksCreated, instancesCreated, ... }
}
```

**Location**: `src/services/weekService.js:193-251`

### 2. Updated `AppContext.addWeeklyGoal` to Auto-Instantiate New Templates

When a new template is created:
1. Template is saved to dreams container
2. **NEW**: Template is immediately bulk instantiated across all target weeks
3. Instances are created in the weekYear document for the current year

**Location**: `src/context/AppContext.jsx:577-624`

**Code**:
```javascript
// After template is saved successfully...
const templateForAPI = {
  ...template,
  durationType: template.targetWeeks ? 'weeks' : 'unlimited',
  durationWeeks: template.targetWeeks || 52
};

await weekService.bulkInstantiateTemplates(
  userId, 
  currentYear, 
  [templateForAPI]
);
```

### 3. Added Bulk Instantiation on Login

When user logs in and has existing templates:
1. All templates are loaded from database
2. **NEW**: A useEffect runs and bulk instantiates all existing templates
3. Ensures all weeks are populated even if templates were created before this feature

**Location**: `src/context/AppContext.jsx:439-480`

**Triggers**: Runs once after weeklyGoals are loaded, with 1 second delay to avoid race conditions

---

## Data Flow

### Creating a New Weekly Goal

```
1. User creates weekly goal with targetWeeks: 12
2. Template created: { id: "goal_123", targetWeeks: 12, ... }
3. Template saved to dreams container ✅
4. [NEW] bulkInstantiateTemplates called for current year
5. API creates 12 week instances:
   - 2025-W44: goal_123_2025-W44
   - 2025-W45: goal_123_2025-W45
   - ... (10 more weeks)
6. All instances saved to weekYear document ✅
7. User can now browse to any of the 12 weeks and see the goal
```

### User Login with Existing Templates

```
1. User logs in
2. weeklyGoals loaded from database (includes templates)
3. [NEW] useEffect detects templates
4. [NEW] bulkInstantiateTemplates called for all templates
5. All weeks populated with instances
6. User can browse any week and see goals
```

---

## API Contract

### `bulkInstantiateTemplates` API

**Endpoint**: `POST /api/bulkInstantiateTemplates`

**Request Body**:
```json
{
  "userId": "user@example.com",
  "year": 2025,
  "templates": [
    {
      "id": "goal_123",
      "title": "Exercise 3x per week",
      "dreamId": "dream_456",
      "durationType": "weeks",
      "durationWeeks": 12,
      "startDate": "2025-11-08T10:00:00.000Z",
      ...
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "weeksCreated": 12,
  "totalWeeks": 45,
  "instancesCreated": 12,
  "templatesProcessed": 1
}
```

**Logic**:
- Calculates week ranges based on `durationType`, `durationWeeks`, `startDate`
- Creates instances with ID format: `{templateId}_{weekId}`
- Skips instances that already exist
- Updates weekYear document with all new instances

---

## Template Format Mapping

Templates use `targetWeeks` in the frontend, but API expects `durationType` and `durationWeeks`:

```javascript
const templateForAPI = {
  ...template,
  durationType: template.targetWeeks ? 'weeks' : 'unlimited',
  durationWeeks: template.targetWeeks || 52
};
```

**Mapping**:
- `targetWeeks: 12` → `durationType: 'weeks', durationWeeks: 12`
- `targetWeeks: undefined` → `durationType: 'unlimited', durationWeeks: 52`

---

## Testing

### Manual Test Steps

1. **Create a new weekly goal with 12 weeks**:
   - Go to Week Ahead
   - Create a consistency goal with recurrence: weekly, targetWeeks: 12
   - Check console logs for "✅ Template instantiated across all target weeks"

2. **Browse to a future week**:
   - Click on a week 5 weeks from now
   - Goal should be visible immediately (not created on-demand)

3. **Check database**:
   - View weekYear document in Cosmos DB
   - Should see 12 weeks populated with goal instances

4. **Login with existing templates**:
   - Ensure user has templates in database
   - Login and check console for "✅ Bulk instantiation complete on login"
   - Browse future weeks and verify goals are visible

### Edge Cases Handled

- **Templates already instantiated**: API skips existing instances
- **No templates**: Bulk instantiation skipped gracefully
- **API failure**: Template still saved, instances can be created on-demand as fallback
- **Race conditions**: 1 second delay on login instantiation prevents duplicate calls

---

## Performance Considerations

**Before**:
- 1 API call per week visited (lazy loading)
- 12 API calls to see goals in 12 weeks

**After**:
- 1 API call when template is created (bulk instantiation)
- 0 additional API calls when browsing weeks
- **Result**: Faster UX, fewer API calls overall

**Database Impact**:
- Single write operation to weekYear document
- All 12 week instances written at once
- No additional RU cost compared to creating them individually

---

## Future Enhancements

1. **Multi-year support**: Handle templates that span multiple years
2. **Re-instantiation**: Update instances when template is edited
3. **Progressive loading**: Instantiate first 4 weeks immediately, rest in background
4. **Cleanup**: Delete instances when template is deactivated or deleted (already implemented)

---

## Related Files

- `src/services/weekService.js` - Added bulkInstantiateTemplates method
- `src/context/AppContext.jsx` - Added bulk instantiation on template creation and login
- `api/bulkInstantiateTemplates/index.js` - Backend API (already existed)
- `src/pages/DreamsWeekAhead.jsx` - Uses addWeeklyGoal (automatically benefi ts)
- `src/hooks/useDashboardData.js` - Uses addWeeklyGoal (automatically benefits)
- `src/hooks/useDreamTracker.js` - Uses addWeeklyGoal (automatically benefits)
- `src/hooks/useDreamBook.js` - Uses addWeeklyGoal (automatically benefits)

---

## Summary

✅ **All weeks now auto-populate when templates are created**  
✅ **Existing templates are bulk instantiated on login**  
✅ **Goals are visible when browsing any future week**  
✅ **Matches existing data patterns (weekYear document structure)**  
✅ **Works for weekly recurring goals with targetWeeks setting**

The implementation is complete and ready for testing!

---

## Related Implementation

See also: **[ALL_WEEKS_INITIALIZATION.md](./ALL_WEEKS_INITIALIZATION.md)**

The all-weeks initialization feature complements this implementation by ensuring that ALL 52/53 weeks of the year are pre-populated in the weekYear document on sign-in. This means:

1. **Bulk instantiation** (this feature) populates weeks with goal instances
2. **All-weeks initialization** ensures every week exists with at least an empty goals array
3. **Together**: Users see a complete year calendar with goals distributed across relevant weeks

