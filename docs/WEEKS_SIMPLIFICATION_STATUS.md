# Simplified Weeks Tracking - Implementation Status

**Branch**: `feature/simplified-weeks-tracking`  
**Started**: November 18, 2025  
**Current Status**: 🟡 In Progress (60% complete)

---

## ✅ Completed (10/16 tasks)

### Phase 1: Infrastructure ✅
- [x] Create implementation plan documentation
- [x] Update cosmosProvider.js with currentWeek & pastWeeks containers
- [x] Create API: getCurrentWeek endpoint
- [x] Create API: saveCurrentWeek endpoint
- [x] Create API: archiveWeek endpoint  
- [x] Create API: getPastWeeks endpoint (bonus)

### Phase 2: Services ✅
- [x] Create currentWeekService.js (simplified week operations)
- [x] Create weekHistoryService.js (past weeks queries)

### Phase 3: Dashboard UI ✅
- [x] Update useDashboardData.js to use new currentWeek service
- [x] Add skip week button to WeekGoalsWidget.jsx
- [x] Add monthly goal counter support to dashboard

---

## 🟡 In Progress (6/16 tasks remaining)

### Phase 4: Additional Features
- [ ] **Create API: weeklyRollover timer function** (ID: 6)
  - Azure Function with timer trigger
  - Runs every Monday 00:00
  - Archives current week, creates new week from templates
  - Priority: Medium (can be done later)

- [ ] **Create WeekHistoryModal.jsx** (ID: 12)
  - Simple read-only modal showing past weeks
  - Priority: Low (nice-to-have)

### Phase 5: Migration & Integration
- [ ] **Create migration script** (ID: 13)
  - One-time script to migrate from weeks{year} to currentWeek/pastWeeks
  - Priority: HIGH (required for deployment)

- [ ] **Update AppContext.jsx** (ID: 14)
  - Update week goal logic to work with new containers
  - May need to refactor addWeeklyGoal, updateWeeklyGoal, etc.
  - Priority: HIGH (required for full functionality)

### Phase 6: Cleanup
- [ ] **Remove DreamsWeekAhead.jsx route** (ID: 15)
  - Delete 2010-line file
  - Remove route from App.jsx
  - Update navigation links
  - Priority: Medium (cleanup task)

### Phase 7: Testing
- [ ] **Test complete flow with real data** (ID: 16)
  - End-to-end testing
  - Priority: HIGH (before merge)

---

## 📊 Progress Summary

**Files Created**: 13
- API endpoints: 4 (getCurrentWeek, saveCurrentWeek, archiveWeek, getPastWeeks)
- Services: 2 (currentWeekService.js, weekHistoryService.js)
- Documentation: 2 (WEEKS_SIMPLIFICATION_PLAN.md, this file)
- Modified: 5 (cosmosProvider.js, useDashboardData.js, WeekGoalsWidget.jsx, DashboardLayout.jsx)

**Lines Added**: ~1,500  
**Lines Removed**: TBD (will remove 2010 lines from DreamsWeekAhead.jsx)

**Commits**: 3
1. `feat: Add simplified weeks tracking infrastructure`
2. `feat: Update Dashboard to use simplified currentWeek service`
3. `feat: Add skip button and monthly goal counters to Dashboard`

---

## 🚀 What's Working Now

### ✅ Current Week Management
- Dashboard shows current week goals from `currentWeek` container
- Toggle goal completion (with optimistic updates)
- Skip goals for this week (reappears next week)
- Monthly goal counters (e.g., "2/3 this month")

### ✅ API Endpoints
- `GET /api/getCurrentWeek/{userId}` - Get active week
- `POST /api/saveCurrentWeek` - Save current week goals
- `POST /api/archiveWeek` - Archive week to history
- `GET /api/getPastWeeks/{userId}` - Get week history

### ✅ Services Layer
- `currentWeekService.js` - All current week operations
- `weekHistoryService.js` - Past weeks queries

---

## ⚠️ What's Not Working Yet

### Templates → Instances
- Need to update AppContext to create instances from templates
- Currently relies on old weeks{year} pattern

### Week Rollover
- No automatic Monday rollover yet (requires timer function)
- Need fallback check on user login

### Past Weeks View
- No UI to view historical week summaries yet

---

## 🎯 Next Steps (Recommended Order)

1. **Quick Win**: Remove DreamsWeekAhead route (~10 mins)
2. **Critical**: Update AppContext for new week logic (~30 mins)
3. **Important**: Create migration script (~20 mins)
4. **Nice-to-Have**: Create WeekHistoryModal (~20 mins)
5. **Later**: Weekly rollover timer function (~30 mins)
6. **Final**: End-to-end testing (~20 mins)

**Estimated Time to Complete**: 2-3 hours

---

## 📝 Notes

- Old `weeks{year}` containers still exist (for rollback safety)
- No breaking changes yet (new system runs in parallel)
- Can test with real user data safely
- Migration script will convert existing data

---

**Last Updated**: November 18, 2025  
**Updated By**: AI Agent (Claude Sonnet 4.5)

