# 6-Container Architecture - Testing Guide

**Last Updated**: October 31, 2025  
**Status**: Ready for Testing

## Prerequisites

✅ All containers created in Azure Cosmos DB:
- `users`, `dreams`, `connects`, `weeks2025`, `scoring`, `teams`

✅ All API endpoints deployed
✅ Frontend services implemented
✅ Components updated

## Test User Setup

### Option 1: Create New Test User
New users will automatically use the 6-container structure (`dataStructureVersion: 3`).

1. Sign in with a new account
2. Profile will be created in `users` container
3. No data migration needed

### Option 2: Migrate Existing User

To migrate an existing user from old structure:

1. Update user profile in `users` container:
```json
{
  "id": "user@example.com",
  "userId": "user@example.com",
  "dataStructureVersion": 3,
  ...other fields
}
```

2. Data will be loaded from appropriate containers based on version

## End-to-End Test Flow

### 1. Sign In & Data Load
**Expected Behavior:**
- `getUserData` API fetches from all 6 containers in parallel
- Console shows: "✅ Loaded 6-container data: X dreams, Y goals, Z connects, W scoring entries"
- Dashboard displays consolidated data

**Verify:**
- Open browser DevTools → Console
- Look for log: "User is using new 6-container structure"
- Check Network tab: Single API call to `getUserData`

---

### 2. Add a New Dream
**Steps:**
1. Navigate to Dream Book
2. Click "Add Dream"
3. Fill in dream details
4. Save

**Expected Behavior:**
- Dream saved to `dreams` container
- Scoring entry created in `scoring` container
- Console shows: "💾 Saving dream to dreams container: dream_XXX"
- Console shows: "✅ Scoring entry added, new total: XX"

**Verify in Azure:**
- Check `dreams` container → should have new dream document
- Check `scoring` container → should have entry with `source: "dream"`, `points: 10`

---

### 3. Add Consistency Milestone
**Steps:**
1. Edit a dream
2. Add milestone with type "consistency"
3. Save dream

**Expected Behavior:**
- Template created in `dreams` container
- Console shows: "💾 Saving template to dreams container: template_XXX"
- Template has `type: "weekly_goal_template"`

**Verify in Azure:**
- Check `dreams` container → should have document with `type: "weekly_goal_template"`
- Template should have: `dreamId`, `milestoneId`, `recurrence: "weekly"`, `active: true`

---

### 4. View Week Ahead
**Steps:**
1. Navigate to Dreams Week Ahead
2. Select current month and week

**Expected Behavior:**
- Templates loaded from `dreams` container
- Instances auto-created for selected week
- Console shows: "💾 Batch creating X week instances for 2025-WXX"
- Each instance saved to `weeks2025` container

**Verify in Azure:**
- Check `weeks2025` container → should have document: `userId_2025`
- Document structure:
```json
{
  "id": "userId_2025",
  "userId": "user@example.com",
  "year": 2025,
  "weeks": {
    "2025-W44": {
      "goals": [
        {
          "id": "template_XXX_2025-W44",
          "templateId": "template_XXX",
          "title": "...",
          "completed": false,
          ...
        }
      ]
    }
  }
}
```

**Verify Frontend:**
- Goals display in "This Week's Goals" section
- Each goal shows dream emoji and title
- Recurring goals show "Recurring Weekly" badge

---

### 5. Complete a Weekly Goal
**Steps:**
1. In Week Ahead view
2. Click checkbox on a goal to complete it

**Expected Behavior:**
- Goal updated in `weeks2025` container
- Scoring entry created in `scoring` container
- Console shows: "💾 Updating goal in weeks container: goal_XXX 2025-WXX"
- Console shows: "✅ Scoring entry added, new total: XX"
- User score increases by 5 points

**Verify in Azure:**
- Check `weeks2025` container → goal should have `completed: true`, `completedAt: "2025-10-31T..."`
- Check `scoring` container → new entry with `source: "week"`, `points: 5`, `weekId: "2025-WXX"`

**Verify Frontend:**
- Goal shows checkmark and strike-through
- Progress bar updates
- Score in profile increases

---

### 6. Add Dream Connect
**Steps:**
1. Navigate to Dream Connect
2. Select a person to connect with
3. Write connection message
4. Send request

**Expected Behavior:**
- Connect saved to `connects` container
- Scoring entry created in `scoring` container
- Console shows: "💾 Saving connect to connects container: connect_XXX"
- Console shows: "✅ Scoring entry added, new total: XX"
- User score increases by 3 points

**Verify in Azure:**
- Check `connects` container → should have new connect document
```json
{
  "id": "connect_XXX",
  "userId": "user@example.com",
  "type": "connect",
  "withWhom": "Person Name",
  "when": "2025-10-31",
  "notes": "Connection message...",
  "createdAt": "2025-10-31T..."
}
```
- Check `scoring` container → new entry with `source: "connect"`, `points: 3`, `connectId: "connect_XXX"`

---

### 7. View Scorecard
**Steps:**
1. Navigate to Scorecard
2. Review scoring history

**Expected Behavior:**
- Displays all scoring entries from `scoring` container
- Shows breakdown by source (dreams, weeks, connects, milestones)
- Total score matches sum of all entries

**Verify Frontend:**
- Recent Activity section shows latest entries
- Points are correct: Dreams=10, Weeks=5, Connects=3, Milestones=15
- History view shows all entries sorted by date

---

## Performance Validation

### Query Efficiency
**Before (3-container):**
- 52+ queries to load all weekly goals (1 per week)
- Slow pagination through `items` container

**After (6-container):**
- 1 query to load entire year of weeks
- 90% reduction in container queries
- Parallel loading from all containers

**How to Verify:**
1. Open Azure Portal → Cosmos DB → Metrics
2. Check "Total Requests" during sign-in
3. Should see ~6 requests total (one per container)
4. Request Units (RUs) should be optimized

---

## Common Issues & Troubleshooting

### Issue: "weekId is required for weekly goal instances"
**Cause:** Trying to save goal without weekId
**Fix:** Ensure all goal instances have `weekId` field (e.g., "2025-W43")

### Issue: "Invalid type for dreams container"
**Cause:** Trying to save non-dream/template to dreams container
**Fix:** Use dedicated endpoints (connects → connectService, weeks → weekService)

### Issue: Templates not creating instances
**Cause:** Template not marked as active
**Fix:** Ensure template has `active: true` and `recurrence: "weekly"`

### Issue: Scoring not updating
**Cause:** API call failing silently
**Fix:** Check browser console for errors, verify scoring container permissions

### Issue: Old data structure returned
**Cause:** User profile still on `dataStructureVersion: 1`
**Fix:** Update user profile to `dataStructureVersion: 3` (or 2)

---

## Data Validation Queries

### Check User's Weeks Document
```sql
SELECT * FROM c WHERE c.userId = "user@example.com" AND c.year = 2025
```

### Check User's Scoring
```sql
SELECT * FROM c WHERE c.userId = "user@example.com" AND c.year = 2025
```

### Check User's Connects
```sql
SELECT * FROM c WHERE c.userId = "user@example.com" ORDER BY c.when DESC
```

### Check Active Templates
```sql
SELECT * FROM c WHERE c.userId = "user@example.com" AND c.type = "weekly_goal_template" AND c.active = true
```

---

## Success Criteria

✅ **Data Separation:**
- Dreams in `dreams` container
- Connects in `connects` container  
- Weekly goals in `weeks2025` container
- Scoring in `scoring` container

✅ **Performance:**
- Sign-in loads data in < 2 seconds
- Week view creates instances instantly
- No noticeable lag on goal completion

✅ **Data Integrity:**
- No duplicate entries
- Scoring totals match individual entries
- Week instances link correctly to templates
- All weekIds follow format "YYYY-WNN"

✅ **User Experience:**
- Smooth navigation between pages
- Immediate feedback on actions
- Score updates in real-time
- No console errors

---

## Next Steps After Testing

1. **Monitor Production:**
   - Watch for any errors in Azure Application Insights
   - Check RU consumption in Cosmos DB metrics
   - Validate query patterns

2. **Data Migration (if needed):**
   - Create migration script for existing users
   - Batch update `dataStructureVersion` 
   - Move data from old `items` container to new containers

3. **Cleanup:**
   - Archive old `items` container (or keep for rollback)
   - Document any edge cases discovered
   - Update user documentation

4. **Future Enhancements:**
   - Add `weeks2026` container before end of 2025
   - Implement cross-year transitions
   - Add data archival for old years

---

**Happy Testing! 🚀**


