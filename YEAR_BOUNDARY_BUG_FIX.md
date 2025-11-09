# Year Boundary Bug Fix - ISO Week Year vs Calendar Year

## Problem

Goals were not showing up for ISO weeks that span year boundaries:
- **Week 1 of 2026** (Dec 29, 2025 - Jan 4, 2026) - Missing when viewing in late December 2025
- **Week 52 of 2025** - Missing when viewing in early January 2026

## Root Cause

The code was using **calendar year** (`new Date().getFullYear()`) instead of **ISO week year** when querying the Cosmos DB weeks containers.

### ISO Week Year vs Calendar Year

ISO 8601 defines that:
- **Week 1** is the week with the year's first Thursday
- This means Week 1 can start in late December of the previous calendar year
- The **ISO week year** is determined by which year the Thursday falls in

**Example:**
- Week 1 of 2026: Dec 29, 2025 - Jan 4, 2026
  - Thursday is Jan 1, 2026
  - **ISO week year: 2026** (even though it starts in December 2025)
  - **Calendar year when viewing in Dec 2025: 2025** ❌

## The Bug

### Before Fix

```javascript
// useDashboardData.js (line 88)
const currentYear = new Date().getFullYear();  // ❌ Calendar year!
const weekDocResult = await weekService.getWeekGoals(currentUser.id, currentYear);

// DreamsWeekAhead.jsx (line 83)
const year = weekObj.start.getFullYear();  // ❌ Calendar year!
```

When viewing Week 1 (2026-W01) in late December 2025:
- `new Date().getFullYear()` returns **2025**
- Code queries `weeks2025` container
- Week 2026-W01 is stored in `weeks2026` container
- **Result: Goal not found!** ❌

### After Fix

```javascript
// useDashboardData.js (line 88)
const { year: isoYear } = parseIsoWeek(currentWeekIso);  // ✅ ISO week year!
const weekDocResult = await weekService.getWeekGoals(currentUser.id, isoYear);

// DreamsWeekAhead.jsx (line 83)
const { year } = parseIsoWeek(weekIso);  // ✅ ISO week year!
```

Now when viewing Week 1 (2026-W01) in late December 2025:
- `parseIsoWeek("2026-W01")` returns `{ year: 2026, week: 1 }`
- Code queries `weeks2026` container
- Week 2026-W01 is found
- **Result: Goal displays correctly!** ✅

## Files Modified

1. **src/hooks/useDashboardData.js**
   - Line 6: Added `parseIsoWeek` import
   - Line 88: Changed from `new Date().getFullYear()` to `parseIsoWeek(currentWeekIso).year`
   - Line 131: Changed from `new Date().getFullYear()` to `parseIsoWeek(currentWeekIso).year`

2. **src/pages/DreamsWeekAhead.jsx**
   - Line 83: Changed from `weekObj.start.getFullYear()` to `parseIsoWeek(weekIso).year`
   - Line 624: Changed from `activeWeek.start.getFullYear()` to `parseIsoWeek(activeIsoWeek).year`

## Testing

To verify the fix:

1. **Navigate to Week 52 of 2025** (late December)
   - Verify "Year Boundary Test Goal" appears
   
2. **Navigate to Week 1 of 2026** (Dec 29, 2025 - Jan 4, 2026)
   - Verify "Year Boundary Test Goal" appears
   
3. **Navigate to Week 2 of 2026**
   - Verify "Year Boundary Test Goal" appears

4. **Check console logs**
   - Should see: `📅 Loading current week goals for 2026-W01 (ISO year: 2026)`
   - Should NOT see any year mismatches

## Related Documentation

- ISO 8601 Week Date: https://en.wikipedia.org/wiki/ISO_week_date
- `parseIsoWeek()` utility: `src/utils/dateUtils.js`
- Week goal storage: 6-container architecture with year-specific `weeks{year}` containers

## Impact

This fix ensures that:
- ✅ Goals display correctly during year transitions
- ✅ Week goals are queried from the correct year container
- ✅ Year boundary weeks (Week 1 and Week 52/53) work as expected
- ✅ No data loss or duplication across year boundaries

## Prevention

To prevent similar bugs in the future:

**Rule:** When working with ISO weeks, ALWAYS use `parseIsoWeek()` to get the year:

```javascript
// ❌ WRONG
const year = new Date().getFullYear();

// ✅ CORRECT
const weekIso = getCurrentIsoWeek();
const { year } = parseIsoWeek(weekIso);
```

The calendar year and ISO week year can differ for weeks at year boundaries!

