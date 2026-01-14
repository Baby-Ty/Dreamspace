# Testing Guide - Post-Refactoring Validation

**Date**: January 13, 2026
**Purpose**: Manual testing guide to validate refactored application

---

## ✅ Automated Fixes Completed

The following critical issues were identified and fixed:

1. ✅ **Validation Error** - `validateRequest` function crash (validation.js)
2. ✅ **Schema Too Strict** - `createdAt` required when should be optional
3. ✅ **Auth Validation** - Working correctly, no issues found
4. ✅ **Data Structures** - All API responses compatible with frontend
5. ✅ **Repository Integration** - Endpoints properly use provider methods

---

## 🧪 Manual Testing Required

Since I cannot interact with the browser, the following tests should be performed manually:

### Test Session 1: Dashboard (Current Week Goals)

**Objective**: Verify weekly goals CRUD operations

1. **Load Dashboard**
   - Navigate to Dashboard page
   - Verify current week header displays (e.g., "Week 3, 2026")
   - Verify week date range displays correctly
   - Check for any console errors

2. **Add New Goal**
   - Click "Add Goal" or similar button
   - Fill in goal title (e.g., "Test Goal")
   - Select a dream (if prompted)
   - Save the goal
   - Verify goal appears in the list
   - Check console for successful API call to `/saveCurrentWeek`

3. **Complete Goal**
   - Click checkbox or complete button on a goal
   - Verify goal shows as completed (e.g., strikethrough, checkmark)
   - Verify score updates
   - Check console for successful save

4. **Skip Goal**  
   - Click skip button on a goal (if available)
   - Verify goal shows as skipped
   - Check console for successful save

5. **Delete Goal**
   - Delete a goal from the list
   - Verify goal is removed
   - Check console for successful save

6. **Week Rollover** (if applicable)
   - Change system date to next Monday (or trigger rollover)
   - Verify old week is archived
   - Verify new week starts fresh

**Expected API Calls**:
- `GET /api/getCurrentWeek/{userId}` - Load goals
- `POST /api/saveCurrentWeek` - Save changes
- `POST /api/archiveWeek` - Archive old week (rollover)

---

### Test Session 2: DreamsBook

**Objective**: Verify dreams management

1. **Load DreamsBook**
   - Navigate to DreamsBook page
   - Verify all dreams display in grid
   - Check dream categories are visible
   - Verify year vision displays (if set)
   - Check for console errors

2. **Create New Dream**
   - Click "Add Dream" button
   - Fill in:
     - Title (e.g., "Test Dream")
     - Category (select one)
     - Description
   - Save the dream
   - Verify dream appears in grid
   - Check console for `/saveDreams` API call

3. **Edit Dream**
   - Click on an existing dream
   - Modify title or description
   - Save changes
   - Verify changes persist

4. **Upload Dream Image**
   - Click upload/edit image on a dream
   - Select an image file
   - Verify image uploads and displays
   - Check console for `/uploadDreamPicture` call

5. **Add Goal Template**
   - Open a dream's goals section
   - Add a new goal template (weekly recurring goal)
   - Save the template
   - Verify template is saved

6. **Delete Dream**
   - Delete a test dream
   - Verify dream is removed
   - Check console for successful save

7. **Year Vision**
   - Edit year vision text
   - Save changes
   - Verify vision persists after page reload
   - Check console for `/saveYearVision` call

**Expected API Calls**:
- `GET /api/getUserData/{userId}` - Load dreams
- `POST /api/saveDreams` - Save dream changes
- `POST /api/uploadDreamPicture` - Upload image
- `POST /api/saveYearVision` - Save year vision

---

### Test Session 3: DreamTeam (Coach Features)

**Objective**: Verify team management for coaches

**Prerequisites**: User must have coach or admin role

1. **Load DreamTeam Page**
   - Navigate to DreamTeam
   - Verify team information displays
   - Verify team member list loads
   - Check for console errors

2. **View Team Metrics**
   - Verify metrics card shows:
     - Total dreams
     - Completed goals
     - Team engagement score
   - Check console for `/getTeamMetrics` call

3. **View Coaching Alerts**
   - Verify coaching alerts display (if any)
   - Examples: members with no activity, overdue check-ins
   - Check console for `/getCoachingAlerts` call

4. **Schedule Meeting**
   - Click "Schedule Meeting" or similar
   - Fill in meeting details:
     - Date and time
     - Agenda
   - Save meeting
   - Verify meeting appears in schedule
   - Check console for `/updateTeamMeeting` call

5. **Record Meeting Attendance**
   - Open meeting attendance modal
   - Mark attendees as present/absent
   - Save attendance
   - Verify attendance is recorded
   - Check console for `/saveMeetingAttendance` call

6. **View Meeting History**
   - Open meeting history
   - Verify past meetings display
   - Check attendance records
   - Check console for `/getMeetingAttendance` call

7. **View Team Member Details**
   - Click on a team member
   - Verify member's dreams and goals display
   - Verify progress charts load

**Expected API Calls**:
- `GET /api/getTeamMetrics`
- `GET /api/getCoachingAlerts`
- `POST /api/updateTeamMeeting`
- `GET /api/getMeetingAttendance`
- `POST /api/saveMeetingAttendance`

---

### Test Session 4: PeopleHub (Admin Features)

**Objective**: Verify admin functionality

**Prerequisites**: User must have admin role

1. **Load PeopleHub**
   - Navigate to PeopleHub/Admin Dashboard
   - Verify users list loads
   - Verify coaches list loads
   - Check for console errors

2. **View All Users**
   - Verify all users display in table/list
   - Check user details:
     - Name
     - Email
     - Role
     - Team assignment
   - Check console for `/getAllUsers` call

3. **Promote User to Coach**
   - Select a user
   - Click "Promote to Coach" or similar
   - Confirm promotion
   - Verify user's role updates to coach
   - Check console for `/promoteUserToCoach` call

4. **Assign User to Team**
   - Select a user
   - Click "Assign to Team"
   - Select a coach/team
   - Save assignment
   - Verify user is assigned
   - Check console for `/assignUserToCoach` call

5. **Unassign User from Team**
   - Select a user with team assignment
   - Click "Unassign from Team"
   - Confirm unassignment
   - Verify user is unassigned
   - Check console for `/unassignUserFromTeam` call

6. **Replace Team Coach**
   - Select a team
   - Click "Replace Coach"
   - Select new coach
   - Handle old coach (demote or reassign)
   - Save changes
   - Verify team has new coach
   - Check console for `/replaceTeamCoach` call

7. **Edit AI Prompts**
   - Navigate to Prompts section
   - Edit vision generation prompt
   - Edit image generation prompt
   - Save changes
   - Verify prompts are saved
   - Check console for:
     - `GET /api/getPrompts`
     - `POST /api/savePrompts`

8. **View Team Relationships**
   - Open team relationships view
   - Verify all teams display
   - Verify members show under correct teams
   - Check console for `/getTeamRelationships` call

**Expected API Calls**:
- `GET /api/getAllUsers`
- `POST /api/promoteUserToCoach`
- `POST /api/assignUserToCoach`
- `POST /api/unassignUserFromTeam`
- `POST /api/replaceTeamCoach`
- `GET /api/getTeamRelationships`
- `GET /api/getPrompts`
- `POST /api/savePrompts`

---

## 🔍 Console Monitoring

During all tests, monitor browser console for:

### ✅ Success Indicators
- No red error messages
- API calls return 200 status
- Successful save messages (if implemented)
- State updates correctly

### ❌ Error Indicators
- 401 Unauthorized - Auth token issue
- 403 Forbidden - Permission issue  
- 400 Bad Request - Validation error
- 500 Internal Server Error - Backend crash
- Network errors
- CORS errors

---

## 📊 API Health Check

Before testing, verify API is running:

1. **Local Development**
   ```bash
   # Check if Azure Functions is running
   curl http://localhost:7071/api/health
   ```

2. **Expected Response**
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "timestamp": "2026-01-13T..."
   }
   ```

---

## 🐛 Known Issues Resolved

1. ✅ **Validation Error** - Fixed in `api/utils/validation.js`
   - Was: `error.errors.map()` crashed
   - Now: `(error.errors || []).map()` with null checking

2. ✅ **Schema Too Strict** - Fixed in `api/utils/validation.js`
   - Was: `createdAt: z.string()` (required)
   - Now: `createdAt: z.string().optional()`

---

## 📝 Test Results Template

Use this template to document test results:

```markdown
## Test Results - [Date]

### Dashboard Tests
- [ ] Load Dashboard - PASS/FAIL
- [ ] Add Goal - PASS/FAIL
- [ ] Complete Goal - PASS/FAIL
- [ ] Skip Goal - PASS/FAIL
- [ ] Delete Goal - PASS/FAIL
- [ ] Week Rollover - PASS/FAIL

### DreamsBook Tests
- [ ] Load DreamsBook - PASS/FAIL
- [ ] Create Dream - PASS/FAIL
- [ ] Edit Dream - PASS/FAIL
- [ ] Upload Image - PASS/FAIL
- [ ] Add Goal Template - PASS/FAIL
- [ ] Delete Dream - PASS/FAIL
- [ ] Year Vision - PASS/FAIL

### DreamTeam Tests (Coach)
- [ ] Load DreamTeam - PASS/FAIL
- [ ] View Metrics - PASS/FAIL
- [ ] View Alerts - PASS/FAIL
- [ ] Schedule Meeting - PASS/FAIL
- [ ] Record Attendance - PASS/FAIL
- [ ] View History - PASS/FAIL
- [ ] View Member Details - PASS/FAIL

### PeopleHub Tests (Admin)
- [ ] Load PeopleHub - PASS/FAIL
- [ ] View Users - PASS/FAIL
- [ ] Promote to Coach - PASS/FAIL
- [ ] Assign to Team - PASS/FAIL
- [ ] Unassign from Team - PASS/FAIL
- [ ] Replace Coach - PASS/FAIL
- [ ] Edit AI Prompts - PASS/FAIL
- [ ] View Relationships - PASS/FAIL

### Issues Found
[List any issues discovered during testing]

### Notes
[Any additional observations]
```

---

## 🎯 Success Criteria

All tests PASS when:
- ✅ No console errors
- ✅ All API calls return 200 status
- ✅ Data saves and persists correctly
- ✅ UI updates reflect changes immediately
- ✅ No authentication errors
- ✅ No validation errors

---

## 🚀 Next Steps After Testing

If issues are found:
1. Document the issue with:
   - Exact steps to reproduce
   - Expected behavior
   - Actual behavior
   - Console errors (if any)
   - Network requests (status code, payload)
2. Create bug report or fix immediately
3. Re-test after fix

---

## 📞 Support

If you encounter issues during testing:
- Check `BASELINE_ISSUES_FOUND.md` for known fixes
- Check `API_COMPARISON_ANALYSIS.md` for endpoint details
- Check `DATA_STRUCTURE_ANALYSIS.md` for data format
- Review terminal logs in `terminals/18.txt` for backend errors
