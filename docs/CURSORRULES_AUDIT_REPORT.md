# .cursorrules Audit Report
**Date**: November 18, 2025  
**Status**: Complete - Ready for Updates

## Executive Summary

The `.cursorrules` file needs significant updates to align with the current codebase architecture. The main changes involve:
1. **Container count**: Updated from 6 to **8 containers** (missing `coaching_alerts`)
2. **Weeks tracking**: Migrated from `weeks{year}` to `currentWeek` + `pastWeeks` simplified model
3. **Service naming**: Updated to reflect `currentWeekService` and `weekHistoryService` instead of deprecated `weekService`
4. **Data structure version**: Now V4 (simplified weeks tracking)
5. **Page removal**: Week Ahead page (`DreamsWeekAhead.jsx`) removed - functionality integrated into Dashboard

---

## Critical Updates Required

### 1. Database Container Count & Structure

**Current `.cursorrules` says:**
- 6-container architecture
- Lists: users, dreams, connects, scoring, teams, weeks{year}

**Reality (from `cosmosProvider.js`):**
- **8-container architecture**
- Containers: users, dreams, connects, scoring, teams, **coaching_alerts**, **currentWeek**, **pastWeeks**
- `weeks{year}` containers are **deprecated** (kept only for backward compatibility)

**Required Update:**
```diff
- ### Container Structure (6-Container Architecture)
+ ### Container Structure (8-Container Architecture)
  1. **users** - `/userId` or `/id` - User profiles ONLY (no arrays)
  2. **dreams** - `/userId` - Aggregated dreams document + weekly goal templates per user
  3. **connects** - `/userId` - Individual connect documents
  4. **scoring** - `/userId` - Yearly scoring rollups (e.g., `{userId}_2025_scoring`)
  5. **teams** - `/managerId` - Team relationships and coaching assignments
- 6. **weeks{year}** - `/userId` - Year-specific week documents (e.g., `weeks2025` container)
+ 6. **coaching_alerts** - `/managerId` - Coaching alerts and notifications
+ 7. **currentWeek** - `/userId` - Active goals for current week only (one doc per user)
+ 8. **pastWeeks** - `/userId` - Historical summaries of past weeks (one doc per user, all years)
```

### 2. Weeks Tracking Architecture

**Current `.cursorrules` says:**
- Uses `weeks{year}` containers with nested structure
- Week documents: `{userId}_{year}` format

**Reality (from `CONTEXT.md` and codebase):**
- Uses **simplified `currentWeek` + `pastWeeks`** model
- `currentWeek`: One document per user with current week's goals
- `pastWeeks`: One document per user with historical summaries (all years)
- `weeks{year}` containers are deprecated (kept for historical data only)

**Required Update:**
```diff
- ### Critical DB Rules
- - Weeks containers: Nested structure `{ weeks: { "2025-W43": { goals: [...] } } }`
- - Always use partition key when querying: `userId` or `managerId`
- - Week documents: `{userId}_{year}` format for document ID
+ ### Critical DB Rules
+ - Always use partition key when querying: `userId` or `managerId`
+ - **currentWeek container**: One document per user (`{userId}`), contains current week's goals array
+ - **pastWeeks container**: One document per user (`{userId}`), contains `weekHistory` object with summaries
+ - Week documents use `{userId}` format (not `{userId}_{year}`)
+ - Legacy `weeks{year}` containers exist but are deprecated (read-only for migration)
```

### 3. Service Layer Naming

**Current `.cursorrules` says:**
- References to `weekService` (deprecated)

**Reality:**
- Uses `currentWeekService` for current week operations
- Uses `weekHistoryService` for past weeks queries
- `weekService` is deprecated and removed

**Required Update:**
Add section about service naming:
```markdown
### Week Tracking Services
- **currentWeekService**: Get/save current week goals (`getCurrentWeek`, `saveCurrentWeek`, `archiveWeek`)
- **weekHistoryService**: Query past weeks (`getPastWeeks`, `getRecentWeeks`, `getCompletionRate`)
- **Deprecated**: `weekService` - No longer used, replaced by above services
```

### 4. Data Structure Version

**Current `.cursorrules` says:**
- No mention of data structure version

**Reality (from `CONTEXT.md`):**
- Current version: **V4** (simplified weeks tracking)
- Migration path: V1 → V2 → V3 → V4

**Required Update:**
Add note about data structure versions:
```markdown
### Data Structure Versions
- **V1** (legacy): Monolithic user documents
- **V2** (deprecated): 3-container split
- **V3** (previous): 6-container with `weeks{year}` containers
- **V4** (current): 8-container with `currentWeek` + `pastWeeks` simplified tracking
- Tracked via `dataStructureVersion` field in user documents
```

---

## Additional Improvements Suggested

### 1. Add Week Tracking Patterns Section

```markdown
## Week Tracking Patterns

### Current Week Operations
- Always use `currentWeekService.getCurrentWeek(userId)` to load current week
- Goals are instantiated on-demand (not pre-populated)
- Week rollover automatically archives to `pastWeeks` container
- One document read per user (vs scanning 52 weeks in old model)

### Past Weeks Queries
- Use `weekHistoryService.getPastWeeks(userId)` for historical data
- Returns summarized stats, not detailed goal data
- Supports queries: `getRecentWeeks()`, `getCompletionRate()`, `getTotalStats()`

### Goal Instantiation
- Goals created automatically when week loads (if template is active)
- Templates stored in `dreams` container (`weeklyGoalTemplates` array)
- No bulk instantiation needed (simplified model)
```

### 2. Update API Conventions Section

Add note about deprecated endpoints:
```markdown
### Deprecated Week Endpoints
- ❌ `/api/saveWeekGoals` - Use `/api/saveCurrentWeek` instead
- ❌ `/api/getWeekGoals/{userId}/{year}` - Use `/api/getCurrentWeek/{userId}` instead
- ❌ `/api/bulkInstantiateTemplates` - No longer needed (on-demand instantiation)
```

### 3. Add Container Query Patterns

```markdown
### Query Patterns
- **Get current week**: `SELECT * FROM c WHERE c.id = @userId` (currentWeek container)
- **Get past weeks**: `SELECT * FROM c WHERE c.id = @userId` (pastWeeks container)
- **Get user profile**: `SELECT * FROM c WHERE c.id = @userId` (users container)
- **Get user dreams**: `SELECT * FROM c WHERE c.id = @userId` (dreams container)
- **Get coaching alerts**: `SELECT * FROM c WHERE c.managerId = @managerId` (coaching_alerts container)
```

### 4. Add Migration Notes

```markdown
### Migration from weeks{year} to currentWeek/pastWeeks
- Old `weeks{year}` containers preserved for historical data
- Migration handled automatically by `getUserData` and week rollover functions
- No data loss - old containers remain accessible for rollback
- New code should never write to `weeks{year}` containers
```

### 5. Update Anti-Patterns

Add:
```markdown
❌ Using `weeks{year}` containers for new code
❌ Calling deprecated `weekService` functions
❌ Pre-instantiating goals for future weeks
❌ Querying multiple week documents when `currentWeek` would suffice
❌ Creating Week Ahead pages (functionality integrated into Dashboard)
```

### 6. Deprecated Pages

**Current `.cursorrules` says:**
- No mention of deprecated pages

**Reality:**
- `DreamsWeekAhead.jsx` page removed (functionality integrated into Dashboard)
- Route `/dreams-week-ahead` removed from `App.jsx`
- Navigation link removed from `Layout.jsx`

**Required Update:**
Add to deprecated/removed section:
```markdown
### Deprecated/Removed Pages
- ❌ `DreamsWeekAhead.jsx` - Removed, functionality integrated into Dashboard
- ❌ `/dreams-week-ahead` route - No longer exists
- Week tracking now handled entirely through Dashboard with simplified `currentWeek` + `pastWeeks` model
```

---

## Summary of Changes Needed

### High Priority (Critical)
1. ✅ Update container count from 6 to 8
2. ✅ Add `coaching_alerts` container documentation
3. ✅ Replace `weeks{year}` references with `currentWeek` + `pastWeeks`
4. ✅ Update week document structure examples
5. ✅ Add service naming conventions (`currentWeekService`, `weekHistoryService`)
6. ✅ Document Week Ahead page removal

### Medium Priority (Important)
7. ✅ Add data structure version documentation (V4)
8. ✅ Add week tracking patterns section
9. ✅ Update API conventions with deprecated endpoints
10. ✅ Add container query patterns
11. ✅ Add migration notes

### Low Priority (Nice to Have)
12. ✅ Update anti-patterns section
13. ✅ Add performance notes (1 doc read vs 52 scans)
14. ✅ Clarify goal instantiation patterns

---

## Files Referenced

- `api/utils/cosmosProvider.js` - Container configuration (8 containers)
- `src/services/currentWeekService.js` - Current week operations
- `src/services/weekHistoryService.js` - Past weeks queries
- `CONTEXT.md` - Architecture documentation (V4 structure)
- `src/context/AppContext.jsx` - Shows deprecated `weekService` stub
- `src/schemas/week.js` - Schema definitions (deprecated vs current)

---

## Next Steps

1. Update `.cursorrules` with all critical changes
2. Review and approve suggested improvements
3. Test that updated rules align with codebase patterns
4. Update any other documentation that references old architecture

