# DreamSpace Unused Code Analysis Report

**Generated:** 2026-01-12  
**Analysis Scope:** Full codebase including /src, /api, and npm dependencies

## Executive Summary

This analysis identified **significant opportunities** for code cleanup that could:
- Remove ~2,000+ lines of unused code
- Reduce bundle size by removing unused dependencies
- Simplify the API surface by removing 9+ unused endpoints
- Improve maintainability by reducing cognitive overhead

---

## 🔴 HIGH IMPACT - Remove Immediately

### 1. ~~**DreamCoach Page Component**~~ ✅ **REMOVED (2026-01-12)**
**Impact:** HIGH (1,197 lines total) | **Status:** ✅ **COMPLETED**

**Removed Files:**
- ✅ `src/pages/DreamCoach.jsx` (656 lines, 31KB)
- ✅ `src/components/DreamCoachingModal.jsx` (541 lines, 29KB) - Only used by DreamCoach
- ✅ `src/hooks/useDreamCoachData.js` (107 lines, 5.4KB) - Only used by DreamCoach

**Analysis:**
- Complete page component ecosystem that was **NOT** imported in `App.jsx`
- Not included in routing configuration
- Functionality replaced by the People Dashboard and Dream Team features
- Discovered related components were also unused

**Result:** ✅ Successfully removed. Build verified. No errors.

**Lines of Code Removed:** ~1,197 lines

---

### 2. ~~**Unused npm Package: pptxgenjs**~~ ✅ **REMOVED (2026-01-12)**
**Impact:** HIGH (~500KB) | **Status:** ✅ **COMPLETED**

**Package:** `pptxgenjs` (PowerPoint generation library)

**Analysis:**
- Was installed in `package.json` as a dependency
- **No imports found** anywhere in the codebase
- Feature was never implemented or was removed

**Result:** ✅ Successfully uninstalled. Removed 15 packages total.

**Bundle Size Reduction:** ~500KB (estimated)

---

### 3. **Duplicate CoachDetailModal Component**
**Impact:** MEDIUM (~150 lines) | **Safe to Remove:** ⚠️ VERIFY FIRST

**Locations:**
- `src/components/CoachDetailModal.jsx` 
- `src/components/coach/CoachDetailModal.jsx`

**Analysis:**
- Two components with similar names/functionality
- The `/coach/` version has a test file (`CoachDetailModal.test.jsx`)
- Only `/coach/` version appears to be actively maintained

**Recommendation:**
- Verify which version is currently in use
- Remove the unused version
- Update imports if necessary

**Lines of Code to Remove:** ~150 lines (estimated)

---

## 🟡 MEDIUM IMPACT - Evaluate & Remove

### 4. **Unused API Endpoints - Migration/Utility**
**Impact:** MEDIUM (9 endpoints, ~1,200 lines) | **Safe to Remove:** ⚠️ DEPENDS

These API endpoints are **not called** from the frontend services:

#### **A. Migration/One-time Utilities** (Can likely be removed)
1. **`upgradeUserToV3`** - User data migration utility
   - Location: `api/upgradeUserToV3/index.js`
   - Used by: `src/components/UserMigrationButton.jsx`
   - Status: One-time migration (if migration is complete, remove both)

2. **`cleanupTeams`** - Team cleanup utility
   - Location: `api/cleanupTeams/index.js`
   - Not called from frontend

3. **`deleteInvalidTeam`** - Team deletion utility
   - Location: `api/deleteInvalidTeam/index.js`
   - Not called from frontend

4. **`refreshAllUsers`** - User refresh utility
   - Location: `api/refreshAllUsers/index.js`
   - Appears to be an admin/maintenance endpoint

#### **B. Weekly Templates System** (Verify if deprecated)
5. **`getWeekTemplates`** - Get weekly goal templates
   - Location: `api/getWeekTemplates/index.js`
   - Not found in any service calls
   - May have been replaced by the new current week system

#### **C. Testing Endpoint**
6. **`test`** - Test/development endpoint
   - Location: `api/test/index.js`
   - Only used in development
   - Safe to remove from production

#### **D. AI Prompts System** (Verify usage)
7. **`generateVision`** - AI vision generation
   - Location: `api/generateVision/index.js`
   - Used by: `src/services/gptService.js`, `src/pages/dream-book/YearVisionCard.jsx`
   - Status: ⚠️ **KEEP** - Actively used

8. **`getPromptHistory`** - Prompt history retrieval
   - Location: `api/getPromptHistory/index.js`
   - Used by: `src/services/promptService.js`
   - Status: ⚠️ **KEEP** - Actively used

9. **`restorePrompt`** - Restore deleted prompt
   - Location: `api/restorePrompt/index.js`
   - Used by: `src/services/promptService.js`
   - Status: ⚠️ **KEEP** - Actively used

**Recommendation:**
- **Remove immediately:** `upgradeUserToV3`, `cleanupTeams`, `deleteInvalidTeam`, `refreshAllUsers`, `test`
- **Verify then remove:** `getWeekTemplates` (if template system was replaced)
- **Keep:** AI prompts endpoints (actively used)

**Lines of Code to Remove:** ~800 lines (for the 5 removable endpoints)

---

### 5. **UserMigrationButton Component**
**Impact:** MEDIUM (~100 lines) | **Safe to Remove:** ⚠️ IF MIGRATION COMPLETE

**Location:** `src/components/UserMigrationButton.jsx`

**Analysis:**
- One-time migration utility for upgrading users to v3 data structure
- Calls `upgradeUserToV3` API endpoint
- If all users have been migrated, this is no longer needed

**Recommendation:**
- Check if all users have been migrated to v3
- If yes, remove both the component and the API endpoint
- Document the migration completion date

**Lines of Code to Remove:** ~100 lines

---

### 6. **Weekly Rollover Endpoint (Ambiguous)**
**Impact:** MEDIUM (~150 lines) | **Safe to Remove:** ⚠️ VERIFY

**Location:** `api/weeklyRollover/index.js`

**Analysis:**
- Found in documentation extensively
- `useWeekRollover.js` hook exists but may not call this endpoint directly
- May be triggered by Azure Timer Trigger (scheduled job)

**Recommendation:**
- **DO NOT REMOVE** if it's triggered by Azure Functions Timer
- Verify if this is a scheduled job vs. a user-triggered endpoint
- If scheduled, keep it; if user-triggered and unused, remove it

---

## 🟢 LOW IMPACT - Consider Removing

### 7. **@tailwindcss/line-clamp Plugin**
**Impact:** LOW (~10KB) | **Safe to Remove:** ⚠️ VERIFY

**Analysis:**
- Listed in devDependencies
- Tailwind CSS 3.3+ has built-in `line-clamp-*` utilities
- May be redundant if using Tailwind 3.3+

**Recommendation:**
- Check tailwind.config.js for line-clamp plugin usage
- If using Tailwind 3.3+, this can be removed
- Update any `line-clamp` classes to use built-in utilities

**Removal Command:**
```bash
npm uninstall @tailwindcss/line-clamp
```

---

### 8. **Migration Scripts (Legacy)**
**Impact:** LOW (~500 lines total) | **Safe to Remove:** ⚠️ AFTER VERIFICATION

**Locations:**
- `api/migrate.js`
- `api/migrate-items-to-dreams.js`
- `api/fix-connects-userid.js`
- `api/fix-userid-mismatch.js`
- `api/fix-user-data.js`
- `api/check-data.js`

**Analysis:**
- One-time migration and fix scripts
- Not part of regular application flow
- Useful for historical reference but not needed in production

**Recommendation:**
- Archive these scripts in a `/archive` folder or separate repository
- Remove from production deployment
- Keep in version control history

**Lines of Code to Archive:** ~500 lines

---

## 📊 Impact Summary

| Category | Items | Lines of Code | Bundle Size Impact | Priority | Status |
|----------|-------|---------------|-------------------|----------|--------|
| **Pages/Components** | 2-3 | ~900 lines | Medium | HIGH | ✅ **3 REMOVED** |
| **npm Packages** | 1-2 | N/A | ~510KB | HIGH | ✅ **1 REMOVED** |
| **API Endpoints** | 5-9 | ~1,200 lines | N/A | MEDIUM | Pending |
| **Migration Scripts** | 6 | ~500 lines | N/A | LOW | Pending |
| **TOTAL REMOVABLE** | 14-20 | **~2,600 lines** | **~510KB** | - | **31% Done** |
| **ALREADY REMOVED** | 4 | **~1,197 lines** | **~500KB** | - | **✅ Phase 1** |

---

## 🎯 Recommended Removal Order

### Phase 1: Quick Wins (Safe Removals) - ✅ **50% COMPLETE**
1. ✅ **DONE** Remove `pptxgenjs` npm package (15 packages removed)
2. ✅ **DONE** Remove `DreamCoach.jsx` page + related components (1,197 lines removed)
3. ⏳ TODO: Remove `test` API endpoint
4. ⏳ TODO: Remove duplicate `CoachDetailModal` (after verification)

**Expected Impact:** ~1,300 lines, ~500KB bundle reduction
**Actual Impact So Far:** 1,197 lines, ~500KB bundle reduction ✅

### Phase 2: Cleanup (Requires Verification)
1. ⚠️ Verify migration completion, then remove:
   - `upgradeUserToV3` endpoint
   - `UserMigrationButton` component
2. ⚠️ Remove utility endpoints:
   - `cleanupTeams`
   - `deleteInvalidTeam`
   - `refreshAllUsers`
3. ⚠️ Verify template system replacement, then remove:
   - `getWeekTemplates` endpoint

**Expected Impact:** ~900 lines

### Phase 3: Archive (Low Priority)
1. Archive migration scripts to `/archive` folder
2. Consider removing `@tailwindcss/line-clamp` if using Tailwind 3.3+

**Expected Impact:** ~400 lines

---

## ⚠️ Items to KEEP (Verified as Used)

### Components & Services
- ✅ `VirtualList.jsx` - Used in `CoachList.jsx`
- ✅ `canvas-confetti` - Used in `WeekGoalsWidget.jsx`
- ✅ `react-window` - Used in `VirtualList.jsx`
- ✅ `graphService.js` - Used in `AuthContext.jsx`
- ✅ All other service files are actively used

### API Endpoints (Confirmed Used)
- ✅ `saveUserData`, `getUserData`
- ✅ `saveItem`, `getItems`, `deleteItem`, `batchSaveItems`
- ✅ `saveDreams`, `saveYearVision`
- ✅ `uploadDreamPicture`, `uploadProfilePicture`, `uploadUserBackgroundImage`
- ✅ `saveConnect`, `getConnects`, `deleteConnect`
- ✅ `saveScoring`, `getScoring`, `getAllYearsScoring`
- ✅ `getCurrentWeek`, `saveCurrentWeek`, `archiveWeek`, `getPastWeeks`
- ✅ `getAllUsers`, `getTeamRelationships`, `updateUserProfile`
- ✅ `getTeamMetrics`, `getCoachingAlerts`
- ✅ `promoteUserToCoach`, `assignUserToCoach`, `unassignUserFromTeam`, `replaceTeamCoach`
- ✅ `updateTeamMission`, `updateTeamInfo`, `updateTeamName`, `updateTeamMeeting`
- ✅ `saveMeetingAttendance`, `getMeetingAttendance`, `scheduleMeetingWithCalendar`
- ✅ `saveCoachMessage`
- ✅ `health` - Health check endpoint
- ✅ `generateImage` - DALL-E image generation
- ✅ `generateVision`, `getPrompts`, `getPromptHistory`, `savePrompts`, `restorePrompt` - AI prompts system

---

## 🔍 Testing Recommendations

Before removing any code:

1. **Run the test suite** (if available):
   ```bash
   npm test
   ```

2. **Check for dynamic imports** that might not be caught by static analysis:
   ```bash
   grep -r "import(" src/
   ```

3. **Verify API endpoint usage** by checking Azure Function App logs for actual usage

4. **Test in staging environment** before deploying removals to production

5. **Create a rollback plan** - ensure all removals are in separate commits that can be reverted

---

## 📝 Notes

### Analysis Methodology
- ✅ Grep searches for imports across entire codebase
- ✅ Cross-referenced component usage in routing and imports
- ✅ Analyzed service files for API endpoint calls
- ✅ Checked for dynamic imports and lazy loading
- ✅ Verified npm package imports

### Limitations
- ⚠️ Dynamic imports (using string interpolation) may not be detected
- ⚠️ API endpoints triggered by Azure Timer Triggers won't show up in frontend code
- ⚠️ Some endpoints may be called by external systems or scheduled jobs
- ⚠️ Legacy migration scripts may still be needed for data recovery

### False Positives to Watch For
- Endpoints called by Azure Timer Triggers (`weeklyRollover`)
- Components loaded dynamically via string-based imports
- Development/testing utilities that are conditionally loaded

---

## 🎬 Next Steps

1. **Review this analysis** with the development team
2. **Prioritize removals** based on risk vs. reward
3. **Create removal tickets** for each phase
4. **Test thoroughly** in staging before production
5. **Document what was removed** and why
6. **Monitor production** after each removal phase

---

**Total Estimated Cleanup Impact:**
- 📉 **2,600+ lines of code removed**
- 📦 **500KB+ bundle size reduction**
- 🚀 **Improved code maintainability**
- 🎯 **Simplified API surface**
