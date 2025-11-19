# DoD Violations: Files Over 400 Lines

**Status**: Phase 3 Partial - Documentation Complete, Refactoring Needed  
**Date**: November 18, 2025  
**DoD Rule**: All files must be < 400 lines

## Critical Priority (>1000 lines)

### 1. src/context/AppContext.jsx (1,431 lines)
**Status**: Partially addressed - deprecation stubs added for weekService  
**Action Needed**: Split into separate contexts
- `DreamContext.jsx` - Dream operations
- `WeekContext.jsx` - Week goal operations  
- `ScoringContext.jsx` - Scoring operations
- `AppContext.jsx` - Core app state only (<400 lines)

**Notes**: Many functions use deprecated weekService and need migration to currentWeekService

### 2. src/pages/VisionBuilderDemo.jsx (1,471 lines)
**Action Needed**: Refactor using 3-layer pattern
- Create `pages/vision-builder/` directory
- `VisionBuilderLayout.jsx` - Main orchestration (<200 lines)
- Separate components for each section (<150 lines each)

## High Priority (700-1000 lines)

### 3. src/components/UserManagementModal.jsx (765 lines)
**Action Needed**: Split into tab-based components
- `user-management/UserManagementLayout.jsx`
- `user-management/UserListTab.jsx`
- `user-management/RoleManagementTab.jsx`
- `user-management/TeamAssignmentTab.jsx`

## Medium Priority (600-700 lines)

### 4. src/pages/DreamCoach.jsx (663 lines)
**Action Needed**: Apply 3-layer pattern
- `DreamCoach.jsx` - Thin wrapper (3-10 lines)
- `dream-coach/DreamCoachLayout.jsx` - Orchestration
- `hooks/useDreamCoachData.js` - Data layer (already exists)
- Separate components for views

### 5. src/pages/people/PeopleDashboardLayout.jsx (651 lines)
**Action Needed**: Extract components
- Separate tab components
- Extract metric cards into reusable components

### 6. src/pages/dream-connect/DreamConnectLayout.jsx (638 lines)
**Action Needed**: Already follows 3-layer pattern, but needs component extraction
- Extract connect list into separate component
- Extract connect form into separate component

### 7. src/hooks/useDreamTracker.js (615 lines)
**Action Needed**: Split by concern
- `useDreamTrackerData.js` - Data operations (<300 lines)
- `useDreamTrackerUI.js` - UI state management  
- Or extract operations into `dreamOperations.js` utility

## Lower Priority (500-600 lines)

### 8. src/components/ReportBuilderModal.jsx (563 lines)
**Action Needed**: Component extraction
- Extract report type sections
- Extract preview/export logic

### 9. src/pages/AdminDashboard.jsx (541 lines)
**Action Needed**: Split into admin modules
- Separate user management
- Separate system health
- Separate metrics

### 10. src/components/DreamCoachingModal.jsx (541 lines)
**Action Needed**: Extract coaching note types
- Separate components for different note types

### 11. src/components/CareerTrackerModal.jsx (496 lines)
**Action Needed**: Component extraction
- Split goals vs development plan sections

### 12. src/hooks/useDreamBook.js (482 lines)
**Action Needed**: Extract goal template operations
- `useDreamBook.js` (<300 lines)
- `useGoalTemplates.js` (new hook)

### 13. src/hooks/useDashboardData.js (478 lines)
**Status**: DOD violation marker added ✓  
**Action Needed**: Split by concern
- `useDashboardStats.js` - Statistics calculations
- `useDashboardGoals.js` - Goal data management

## Acceptable (400-450 lines) - Minor Violations

### 14. src/pages/dashboard/WeekGoalsWidget.jsx (420 lines)
**Action Needed**: Extract goal list rendering
- `WeekGoalsWidget.jsx` (<250 lines)
- `GoalListView.jsx` (new component)
- `GoalItem.jsx` (new component)

### 15. src/context/AuthContext.jsx (410 lines)
**Action Needed**: Extract utilities
- `AuthContext.jsx` (<300 lines)
- `authHelpers.js` - Token refresh logic
- `graphHelpers.js` - Microsoft Graph API calls

## Test Files (Lower Priority)

### 16. src/hooks/usePeopleData.test.js (465 lines)
**Action Needed**: Split into multiple test files
- Group related tests into separate files

## Files Removed/Addressed

- ✅ `src/pages/DreamsWeekAhead.jsx` (1,689 lines) - DELETED in Phase 1
- ✅ `src/services/weekService.js` (390 lines) - DELETED in Phase 1  
- ✅ `src/data/mockData.backup.js` (1,159 lines) - DELETED in Phase 3

## Summary

**Total Files Violating DoD**: 15 (down from 18)  
**Deleted**: 3 files  
**Marked**: 1 file (useDashboardData.js)  
**Remaining**: 14 files need refactoring

**Estimated Effort**: 16-24 hours for complete refactoring

## Refactoring Strategy

1. **Extract Components**: Move large inline JSX to separate components
2. **Split by Concern**: Separate data operations from UI logic  
3. **Three-Layer Pattern**: Page → Layout + Hook → Service
4. **Utility Functions**: Extract reusable logic into utility files
5. **Type Safety**: Add proper TypeScript/Zod validation during refactoring

## Next Steps

1. Prioritize AppContext split (most impact)
2. Refactor files > 600 lines first (biggest violations)
3. Apply 3-layer pattern consistently
4. Add proper DoD comments to all refactored files

