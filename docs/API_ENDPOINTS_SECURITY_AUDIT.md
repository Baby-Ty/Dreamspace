# API Endpoints Security Audit - Complete Review

**Date:** 2026-01-10  
**Auditor:** AI Security Review  
**Total Endpoints:** 51 HTTP endpoints + 1 timer trigger

---

## Executive Summary

**Status:** ⚠️ **30 endpoints lack authentication** (59% of HTTP endpoints)

### Critical Findings

| Risk Level | Count | Status |
|------------|-------|--------|
| 🔴 **CRITICAL** | 12 | User data modification without auth |
| 🟠 **HIGH** | 10 | Sensitive data access without auth |
| 🟡 **MEDIUM** | 8 | Business logic exposed |
| ✅ **PROTECTED** | 21 | Authentication implemented |

---

## Detailed Endpoint Inventory

### ✅ PROTECTED ENDPOINTS (21 endpoints with auth)

These endpoints correctly require authentication:

| Endpoint | Auth Method | Risk if Broken |
|----------|-------------|----------------|
| `assignUserToCoach` | requireAuth | Medium - team assignment |
| `generateImage` | requireAuth | Low - AI generation |
| `getAllUsers` | requireAuth | Medium - user list exposure |
| `getCoachingAlerts` | requireAuth | High - coaching data |
| `getConnects` | requireAuth | Medium - connection data |
| `getItems` | requireAuth | Medium - user items |
| `getTeamMetrics` | requireAuth | High - team data |
| `getTeamRelationships` | requireAuth | Medium - org structure |
| `getUserData` | requireUserAccess | Critical - full user data |
| `promoteUserToCoach` | requireAdmin | Critical - privilege escalation |
| `refreshAllUsers` | requireAuth | High - bulk modifications |
| `replaceTeamCoach` | requireAuth | High - team changes |
| `saveCoachMessage` | requireAuth | Medium - coaching notes |
| `saveConnect` | requireAuth | Medium - connections |
| `saveDreams` | requireAuth | High - dream data |
| `saveItem` | requireAuth | Medium - user items |
| `saveScoring` | requireAuth | Medium - scoring data |
| `saveUserData` | requireUserAccess | Critical - user data writes |
| `unassignUserFromTeam` | requireAuth | Medium - team changes |
| `uploadDreamPicture` | requireAuth | Low - image uploads |

---

## 🔴 CRITICAL - Unprotected Endpoints (12)

These endpoints MUST have auth before launch:

### 1. **deleteItem** - DELETE item
- **Risk:** Anyone can delete any user's dreams/goals
- **Vulnerable:** `DELETE /api/deleteItem/{itemId}?userId={userId}`
- **Impact:** Data loss, malicious deletion
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 2. **deleteConnect** - DELETE connection
- **Risk:** Anyone can delete user connections
- **Vulnerable:** `DELETE /api/deleteConnect/{connectId}?userId={userId}`
- **Impact:** Data loss
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 3. **updateUserProfile** - UPDATE user profile
- **Risk:** Anyone can modify any user's profile
- **Vulnerable:** `POST /api/updateUserProfile/{userId}`
- **Impact:** Profile hijacking, data corruption
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 4. **updateTeamInfo** - UPDATE team data
- **Risk:** Anyone can modify team information
- **Vulnerable:** `POST /api/updateTeamInfo`
- **Impact:** Organizational data corruption
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 5. **updateTeamMeeting** - UPDATE meeting info
- **Risk:** Anyone can change team meetings
- **Vulnerable:** `POST /api/updateTeamMeeting`
- **Impact:** Meeting disruption
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 6. **updateTeamMission** - UPDATE team mission
- **Risk:** Anyone can modify team mission
- **Vulnerable:** `POST /api/updateTeamMission`
- **Impact:** Team data corruption
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 7. **updateTeamName** - UPDATE team name
- **Risk:** Anyone can rename teams
- **Vulnerable:** `POST /api/updateTeamName`
- **Impact:** Team data corruption
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 8. **uploadProfilePicture** - UPLOAD profile pic
- **Risk:** Anyone can upload pictures as any user
- **Vulnerable:** `POST /api/uploadProfilePicture/{userId}`
- **Impact:** Storage abuse, inappropriate content
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 9. **uploadUserBackgroundImage** - UPLOAD background
- **Risk:** Anyone can upload background images
- **Vulnerable:** `POST /api/uploadUserBackgroundImage/{userId}`
- **Impact:** Storage abuse, inappropriate content
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 10. **savePrompts** - MODIFY AI prompts
- **Risk:** Anyone can change AI prompt configuration
- **Vulnerable:** `POST /api/savePrompts`
- **Impact:** System behavior manipulation, prompt injection
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 11. **saveYearVision** - SAVE year vision
- **Risk:** Anyone can modify user's year vision
- **Vulnerable:** `POST /api/saveYearVision/{userId}`
- **Impact:** Data corruption
- **Fix Priority:** P0 - LAUNCH BLOCKER

### 12. **upgradeUserToV3** - DATA MIGRATION
- **Risk:** Anyone can trigger user migration
- **Vulnerable:** `POST /api/upgradeUserToV3`
- **Impact:** Data corruption during migration
- **Fix Priority:** P0 - LAUNCH BLOCKER

---

## 🟠 HIGH RISK - Unprotected Endpoints (10)

### Data Access Without Auth

13. **getCurrentWeek** - GET current week data
- **Risk:** Read any user's current week goals
- **Fix Priority:** P1

14. **getScoring** - GET scoring data
- **Risk:** Read any user's scoring history
- **Fix Priority:** P1

15. **getMeetingAttendance** - GET attendance
- **Risk:** Read team meeting attendance
- **Fix Priority:** P1

16. **getPastWeeks** - GET past weeks
- **Risk:** Read historical goal data
- **Fix Priority:** P1

17. **getWeekTemplates** - GET templates
- **Risk:** Read user's goal templates
- **Fix Priority:** P1

18. **getPrompts** - GET AI prompts
- **Risk:** Expose AI configuration (might contain strategies)
- **Fix Priority:** P1

19. **getPromptHistory** - GET prompt history
- **Risk:** Expose prompt modification history
- **Fix Priority:** P1

### Operations Without Auth

20. **archiveWeek** - Archive week data
- **Risk:** Anyone can archive user's weeks
- **Fix Priority:** P1

21. **saveCurrentWeek** - Save current week
- **Risk:** Anyone can modify current week data
- **Fix Priority:** P1

22. **saveMeetingAttendance** - Save attendance
- **Risk:** Anyone can record fake attendance
- **Fix Priority:** P1

---

## 🟡 MEDIUM RISK - Unprotected Endpoints (8)

### Admin/Bulk Operations

23. **batchSaveItems** - Batch save
- **Risk:** Bulk data operations without auth
- **Fix Priority:** P2

24. **cleanupTeams** - Cleanup teams
- **Risk:** Team data deletion
- **Fix Priority:** P2

25. **deleteInvalidTeam** - Delete teams
- **Risk:** Team deletion
- **Fix Priority:** P2

26. **restorePrompt** - Restore prompts
- **Risk:** Rollback prompt changes
- **Fix Priority:** P2

27. **getAllYearsScoring** - Get multi-year scoring
- **Risk:** Read long-term scoring data
- **Fix Priority:** P2

28. **generateVision** - Generate AI vision
- **Risk:** AI abuse, rate limiting bypass
- **Fix Priority:** P2

29. **scheduleMeetingWithCalendar** - Schedule meeting
- **Risk:** Calendar spam, meeting creation
- **Fix Priority:** P2

### Low Risk / Public

30. **test** - Test endpoint
- **Risk:** Low - just returns "working"
- **Fix Priority:** P3 - Can remain public or disable

31. **health** - Health check
- **Risk:** None - should be public for monitoring
- **Fix Priority:** P3 - Intentionally public ✅

---

## Recommended Fixes

### Immediate (Before Launch - P0)

Add `requireAuth` to these 12 endpoints:
```javascript
const { requireAuth, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

// Add after OPTIONS check:
if (isAuthRequired()) {
  const user = await requireAuth(context, req);
  if (!user) return; // 401 already sent
  context.log(`User ${user.email} accessing ${endpointName}`);
}
```

**Critical endpoints:**
1. deleteItem
2. deleteConnect  
3. updateUserProfile
4. updateTeamInfo
5. updateTeamMeeting
6. updateTeamMission
7. updateTeamName
8. uploadProfilePicture
9. uploadUserBackgroundImage
10. savePrompts
11. saveYearVision
12. upgradeUserToV3

### High Priority (Week 1 - P1)

Add auth to 10 endpoints:
- getCurrentWeek, getScoring, getMeetingAttendance, getPastWeeks
- getWeekTemplates, getPrompts, getPromptHistory
- archiveWeek, saveCurrentWeek, saveMeetingAttendance

### Medium Priority (Month 1 - P2)

Add auth to 8 endpoints:
- batchSaveItems, cleanupTeams, deleteInvalidTeam, restorePrompt
- getAllYearsScoring, generateVision, scheduleMeetingWithCalendar

### Low Priority (P3)

- **test** - Disable or keep public
- **health** - Keep public for monitoring ✅

---

## Testing Checklist

After adding auth to all endpoints:

```bash
# Test unauthenticated access (should all return 401)
curl https://func-dreamspace-prod.azurewebsites.net/api/deleteItem/test
curl https://func-dreamspace-prod.azurewebsites.net/api/updateUserProfile/test
curl https://func-dreamspace-prod.azurewebsites.net/api/savePrompts

# Test authenticated access (should return 200 or appropriate response)
curl https://func-dreamspace-prod.azurewebsites.net/api/getCurrentWeek/YOUR_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Implementation Script

I can create a script to add auth to all unprotected endpoints automatically. Do you want me to:

1. ✅ Add auth to all 12 P0 endpoints immediately (launch blockers)
2. ⏸️ Create a plan for P1/P2 endpoints to fix after launch
3. 📊 Generate test scripts to validate auth on all endpoints

---

## Launch Decision

### ❌ DO NOT LAUNCH without fixing P0 endpoints

**12 critical endpoints expose:**
- User profile modification
- Data deletion
- Team management
- File uploads
- System configuration

**Estimated fix time:** 2-3 hours to add auth to all P0 endpoints

**Risk if launched without fixes:** 
- Complete data breach
- User impersonation
- System manipulation
- GDPR violations

---

**Next Steps:** Add auth to all 12 P0 endpoints immediately.