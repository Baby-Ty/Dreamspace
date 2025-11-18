# Simplified Weeks Tracking - Implementation Plan

## 🎯 Goals

1. **Eliminate redundancy**: Remove DreamsWeekAhead page (2010 lines) - Dashboard already shows current week
2. **Simplify data model**: Replace complex `weeks{year}` containers with simple `currentWeek` + `pastWeeks`
3. **Improve UX**: Focus on current week only, lightweight history view
4. **Automatic lifecycle**: Goals stop when counter reaches 0, dream completes, or user stops

## 📦 New Container Architecture

### Container: `currentWeek`
**Partition Key**: `/userId`  
**Document ID**: `{userId}_currentWeek`  
**Purpose**: Active goals for the current week only

```json
{
  "id": "user@example.com_currentWeek",
  "userId": "user@example.com",
  "weekId": "2025-W47",
  "weekStartDate": "2025-11-17",
  "weekEndDate": "2025-11-23",
  "goals": [
    {
      "id": "goal_instance_001",
      "templateId": "template_456",
      "dreamId": "dream_123",
      "title": "Run 5km",
      "completed": false,
      "completedAt": null,
      "skipped": false,
      "weeksRemaining": 11,
      "recurrence": "weekly",
      "createdAt": "2025-11-17T..."
    },
    {
      "id": "goal_monthly_002",
      "templateId": "template_789",
      "dreamId": "dream_456",
      "title": "Hike in nature",
      "recurrence": "monthly",
      "frequency": 2,
      "completionCount": 1,
      "completed": false,
      "completionDates": ["2025-11-05T..."],
      "monthId": "2025-11",
      "monthsRemaining": 5,
      "createdAt": "2025-11-01T..."
    }
  ],
  "stats": {
    "totalGoals": 5,
    "completedGoals": 2,
    "skippedGoals": 0,
    "score": 6
  },
  "createdAt": "2025-11-17T...",
  "updatedAt": "2025-11-18T..."
}
```

### Container: `pastWeeks`
**Partition Key**: `/userId`  
**Document ID**: `{userId}_pastWeeks`  
**Purpose**: Lightweight history summaries (all years)

```json
{
  "id": "user@example.com_pastWeeks",
  "userId": "user@example.com",
  "weekHistory": {
    "2025-W47": {
      "totalGoals": 5,
      "completedGoals": 3,
      "skippedGoals": 1,
      "score": 9,
      "weekStartDate": "2025-11-17",
      "weekEndDate": "2025-11-23"
    },
    "2025-W46": {
      "totalGoals": 6,
      "completedGoals": 4,
      "skippedGoals": 0,
      "score": 12,
      "weekStartDate": "2025-11-10",
      "weekEndDate": "2025-11-16"
    }
  },
  "totalWeeksTracked": 47,
  "updatedAt": "2025-11-18T..."
}
```

## 🔄 Weekly Goal Lifecycle

### 1. Template Creation (dreams container)
When user creates a weekly goal template:
- Stored in `dreams.weeklyGoalTemplates[]`
- Has `targetWeeks` or `targetMonths` countdown
- Has `active` flag for manual control

### 2. Instance Creation (currentWeek container)
- Created automatically each week from active templates
- Linked to template via `templateId`
- Has `weeksRemaining` countdown

### 3. Goal Stop Conditions (ALL THREE)
Goals stop appearing when:
1. **Counter reaches 0**: `weeksRemaining === 0`
2. **Dream completes**: Parent dream marked as completed
3. **Manual stop**: User sets template `active: false`

### 4. Skip Week Feature
- User can skip a goal for current week only
- Goal marked with `skipped: true` flag
- Skipped weeks DON'T decrement `weeksRemaining` counter
- Goal reappears next week (fresh start)

### 5. Monthly Goals (Semi-Monthly)
For goals like "Hike 2x per month":
- One instance per month (not per week)
- Counter-based: `completionCount / frequency` (e.g., "1/2")
- User clicks multiple times to increment counter
- Carries forward through weeks of same month
- Resets on month rollover

## 🔧 API Endpoints

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/getCurrentWeek/{userId}` | GET | Get active current week document |
| `/api/saveCurrentWeek` | POST | Save current week goals |
| `/api/archiveWeek/{userId}` | POST | Archive current week to pastWeeks |
| `/api/getPastWeeks/{userId}` | GET | Get week history for charts |
| `/api/weeklyRollover` | Timer | Monday 00:00 - Archive & create new week |

### Modified Endpoints
- `getUserData` - Include currentWeek and pastWeeks in response
- `saveDreams` - Still stores templates (no change)

## 📁 File Structure

```
api/
├── getCurrentWeek/
│   ├── index.js
│   └── function.json
├── saveCurrentWeek/
│   ├── index.js
│   └── function.json
├── archiveWeek/
│   ├── index.js
│   └── function.json
├── getPastWeeks/
│   ├── index.js
│   └── function.json
├── weeklyRollover/          # Timer trigger
│   ├── index.js
│   └── function.json
└── utils/
    └── cosmosProvider.js    # Add new containers

src/
├── services/
│   ├── currentWeekService.js   # NEW: Simplified week ops
│   ├── weekHistoryService.js   # NEW: Past weeks queries
│   └── weekService.js          # DEPRECATED: Mark for removal
├── hooks/
│   └── useDashboardData.js     # UPDATE: Use currentWeek service
├── pages/
│   ├── dashboard/
│   │   ├── DashboardLayout.jsx
│   │   ├── WeekGoalsWidget.jsx  # ADD: Skip button
│   │   └── WeekHistoryModal.jsx # NEW: View past weeks
│   └── DreamsWeekAhead.jsx      # DELETE: 2010 lines removed!
└── context/
    └── AppContext.jsx           # UPDATE: New week logic

docs/
└── WEEKS_SIMPLIFICATION_PLAN.md # This file
```

## 🚀 Implementation Phases

### Phase 1: Infrastructure ✅
- [x] Create implementation plan (this doc)
- [ ] Update cosmosProvider.js with new containers
- [ ] Create getCurrentWeek API
- [ ] Create saveCurrentWeek API
- [ ] Create archiveWeek API
- [ ] Create weeklyRollover timer function

### Phase 2: Services ⏳
- [ ] Create currentWeekService.js
- [ ] Create weekHistoryService.js
- [ ] Update useDashboardData.js

### Phase 3: UI Updates ⏳
- [ ] Add skip button to WeekGoalsWidget
- [ ] Add monthly goal counter UI
- [ ] Create WeekHistoryModal component

### Phase 4: Migration & Cleanup ⏳
- [ ] Create migration script (weeks{year} → currentWeek/pastWeeks)
- [ ] Update AppContext for new logic
- [ ] Remove DreamsWeekAhead.jsx
- [ ] Remove old weeks{year} references
- [ ] Clean up routes in App.jsx

### Phase 5: Testing ⏳
- [ ] Test current week CRUD operations
- [ ] Test skip week functionality
- [ ] Test monthly goal counters
- [ ] Test week rollover (manual trigger)
- [ ] Test migration with real data
- [ ] Test fallback mechanisms

## 🎨 User Experience Changes

### Before (Complex)
- Navigate between weeks (past/future)
- Month selector
- Overwhelming 2010-line page
- Redundant with Dashboard

### After (Simple)
- Dashboard shows current week only ✅
- "Skip this week" button for flexibility
- Simple history modal (view only, no editing)
- Monthly goals show "1/2 completed" counter
- Focus on what matters: THIS week

## 🔒 Safety & Rollback

### Rollover Failsafes
1. **Check on login**: If currentWeek.weekId !== actual week, trigger rollover
2. **Manual trigger**: Admin button to force rollover
3. **Catch-up logic**: Archives all missed weeks automatically

### Migration Safety
- Keep old `weeks{year}` containers during testing
- Dual-write during transition period
- One-time migration script for all users
- Rollback plan: Restore from weeks{year} containers

## 📊 Success Metrics

- **Code reduction**: Remove 2010 lines (DreamsWeekAhead.jsx)
- **Performance**: Faster queries (1 document vs 52+ documents)
- **User engagement**: Higher completion rates (focused on current week)
- **Maintenance**: Simpler code, easier to debug

## ⚠️ Deprecations

Files marked for removal after migration:
- ❌ `src/pages/DreamsWeekAhead.jsx` (2010 lines)
- ❌ `src/services/weekService.js` (replaced by currentWeekService.js)
- ❌ Cosmos containers: `weeks2025`, `weeks2026`, etc.

Route removals:
- ❌ `/dreams-week-ahead` route
- ❌ "Manage Goals" button links updated

## 📝 Notes

- Past weeks are **read-only** (historical summaries)
- Only current week is editable
- Skipped weeks don't count toward goal duration
- Monthly goals persist through weeks of same month
- All years stored in single pastWeeks document (lightweight)

---

**Status**: 🟡 In Progress  
**Branch**: `feature/simplified-weeks-tracking`  
**Started**: November 18, 2025  
**Target**: Complete implementation in current context window

