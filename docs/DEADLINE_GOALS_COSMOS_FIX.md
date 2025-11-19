# Deadline Goals Cosmos DB Fix - weeksRemaining Persistence

## Issue Found

After implementing deadline goals with `weeksRemaining` calculation, we discovered that:

1. **Templates weren't persisting `weeksRemaining`/`monthsRemaining`** - The `saveDreams` API wasn't saving these fields to Cosmos DB
2. **Rollover wasn't updating templates** - After decrementing `weeksRemaining` for instances, the templates in Cosmos DB weren't being updated with the new values

## Root Cause

### Problem 1: Missing Fields in saveDreams
The `api/saveDreams/index.js` was mapping templates but not including `weeksRemaining` and `monthsRemaining` fields, so they were never persisted.

### Problem 2: Templates Not Updated After Rollover
The week rollover logic in `api/utils/weekRollover.js` was:
- Reading templates from Cosmos DB
- Creating instances with decremented `weeksRemaining`
- **BUT** not saving the updated template values back to Cosmos DB

This meant:
- Week 1: Template has `weeksRemaining: 12`, instance created with `weeksRemaining: 11`
- Week 2: Template still has `weeksRemaining: 12` (not updated!), instance created with `weeksRemaining: 11` again (wrong!)
- Week 3: Same issue continues...

## Fixes Applied

### Fix 1: Persist weeksRemaining/monthsRemaining in saveDreams
**File**: `api/saveDreams/index.js`

Added fields to template mapping:
```javascript
weeksRemaining: template.weeksRemaining, // ← NEW
monthsRemaining: template.monthsRemaining, // ← NEW
targetMonths: template.targetMonths, // ← NEW (was missing)
```

### Fix 2: Update Templates During Rollover
**File**: `api/utils/weekRollover.js`

1. **Track template updates** using a `Map`:
   ```javascript
   const templateUpdates = new Map(); // Track updates by template ID
   ```

2. **Update weeksRemaining for weekly goals**:
   ```javascript
   const newWeeksRemaining = wasSkipped 
     ? template.weeksRemaining 
     : Math.max(0, (template.weeksRemaining || template.targetWeeks || 0) - 1);
   
   if (template.weeksRemaining !== newWeeksRemaining) {
     templateUpdates.set(template.id, {
       ...template,
       weeksRemaining: newWeeksRemaining
     });
   }
   ```

3. **Update monthsRemaining for monthly goals**:
   ```javascript
   if (!isSameMonth) {
     const newMonthsRemaining = Math.max(0, (template.monthsRemaining || template.targetMonths || 0) - 1);
     if (template.monthsRemaining !== newMonthsRemaining) {
       const existingUpdate = templateUpdates.get(template.id) || template;
       templateUpdates.set(template.id, {
         ...existingUpdate,
         monthsRemaining: newMonthsRemaining
       });
     }
   }
   ```

4. **Save updated templates back to Cosmos DB**:
   ```javascript
   if (templateUpdates.size > 0) {
     const updatedTemplates = templates.map(template => {
       const update = templateUpdates.get(template.id);
       return update || template;
     });
     
     const updatedDreamsDoc = {
       ...dreamsDoc,
       weeklyGoalTemplates: updatedTemplates,
       updatedAt: new Date().toISOString()
     };
     await cosmosProvider.upsertDreamsDocument(userId, updatedDreamsDoc);
   }
   ```

## How It Works Now

### Weekly Consistency Goals
1. **Initial Creation**: Template created with `weeksRemaining: 12` (from `targetWeeks`)
2. **Week 1 Rollover**: 
   - Instance created with `weeksRemaining: 11`
   - Template updated in Cosmos DB: `weeksRemaining: 11`
3. **Week 2 Rollover**:
   - Reads template with `weeksRemaining: 11` ✅
   - Instance created with `weeksRemaining: 10`
   - Template updated in Cosmos DB: `weeksRemaining: 10`
4. **Continues** until `weeksRemaining: 0`, then goal stops appearing

### Monthly Consistency Goals
1. **Initial Creation**: Template created with `monthsRemaining: 6` (from `targetMonths`)
2. **Month 1 Rollover**:
   - Instance created with `monthsRemaining: 5`
   - Template updated in Cosmos DB: `monthsRemaining: 5`
3. **Continues** until `monthsRemaining: 0`, then goal stops appearing

### Deadline Goals
- Deadline goals don't use templates (they're stored in `dream.goals[]`)
- `weeksRemaining` is calculated dynamically each week using `getWeeksUntilDate()`
- No template update needed - calculation happens on-the-fly

## Testing Checklist

After deploying these fixes, verify:

- [ ] Create a weekly consistency goal with `targetWeeks: 12`
- [ ] Check Cosmos DB: Template should have `weeksRemaining: 12`
- [ ] Simulate week rollover
- [ ] Check Cosmos DB: Template should have `weeksRemaining: 11` ✅
- [ ] Simulate another week rollover
- [ ] Check Cosmos DB: Template should have `weeksRemaining: 10` ✅
- [ ] Continue until `weeksRemaining: 0`
- [ ] Verify goal stops appearing in Dashboard ✅

## Notes

- Template updates are **non-critical** - if they fail, rollover continues (logs warning)
- Uses `Map` for efficient template tracking during rollover
- Preserves all other template fields when updating
- Works for both weekly and monthly consistency goals
- Deadline goals don't need template updates (calculated dynamically)

