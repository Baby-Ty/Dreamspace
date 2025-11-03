# Local Development Environment Verification

**Date**: October 31, 2025  
**Status**: ✅ READY FOR TESTING

## Overview

The 6-container architecture is fully implemented and supports both production (Cosmos DB) and local development (localStorage). This guide will help you verify that everything works correctly.

---

## Local Development Setup

### How Local Mode Works

1. **Database Service Detection**
   - Checks hostname: `dreamspace.tylerstewart.co.za` = Production
   - Other hostnames (localhost, 127.0.0.1) = Local Development
   - Local mode uses browser `localStorage` instead of Cosmos DB

2. **Data Storage in Local Mode**
   - User data stored as: `dreamspace_user_{userId}_data`
   - Each user gets their own localStorage key
   - Data structure mirrors Cosmos DB structure

3. **API Calls in Local Mode**
   - Frontend services (connectService, weekService, scoringService) still make API calls
   - API endpoints use `/api` base URL (proxied by Vite dev server)
   - Azure Functions running locally handle the requests
   - Functions use environment variables to connect to Cosmos DB

### Starting Local Development

```bash
# Terminal 1: Start Azure Functions (API)
cd api
npm install
npm start

# Terminal 2: Start React App (Frontend)
cd ..
npm install
npm run dev
```

---

## Testing Checklist

### ✅ Step 1: New User Login

**Test:**
1. Clear browser localStorage: `localStorage.clear()`
2. Log in with a new test account
3. Check browser console logs

**Expected Console Output:**
```
🆕 No existing data found, saving new user profile with 6-container structure
✅ New user profile saved successfully (6-container, v3)
```

**Verify in localStorage:**
```javascript
// In browser console
const userId = 'test@example.com'; // Your test user email
const key = `dreamspace_user_${userId}_data`;
const data = JSON.parse(localStorage.getItem(key));
console.log('User data:', data);
```

**Expected localStorage Structure:**
```json
{
  "id": "test@example.com",
  "userId": "test@example.com",
  "name": "Test User",
  "email": "test@example.com",
  "office": "Cape Town",
  "avatar": "...",
  "score": 0,
  "dreamsCount": 0,
  "connectsCount": 0,
  "weeksActiveCount": 0,
  "currentYear": 2025,
  "dataStructureVersion": 3,
  "role": "user",
  "isActive": true,
  "createdAt": "2025-10-31T...",
  "lastUpdated": "2025-10-31T..."
}
```

**❌ Should NOT contain:**
- ❌ `dreamBook` array
- ❌ `connects` array
- ❌ `weeklyGoals` array
- ❌ `currentUser` wrapper object

---

### ✅ Step 2: Add a Dream

**Test:**
1. Navigate to Dreams page
2. Click "Add Dream"
3. Fill in dream details:
   - Title: "Learn Piano"
   - Category: "Personal"
   - Description: "Learn to play piano this year"
4. Save dream
5. Check console logs

**Expected Console Output:**
```
💾 Saving dream to dreams container: dream_...
✅ Dream saved successfully
📊 Adding scoring entry for dream creation
✅ Score updated: 10 points
```

**Verify API Call:**
```
POST /api/saveItem/{userId}
Body: {
  "type": "dream",
  "data": {
    "id": "dream_...",
    "title": "Learn Piano",
    "category": "Personal",
    ...
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "id": "dream_...",
  "container": "dreams"
}
```

**In Production (Cosmos DB):**
- Dream saved to `dreams` container
- Scoring entry saved to `scoring` container
- User profile updated: `dreamsCount++`, `score += 10`

**In Local (localStorage):**
- Dream added to user's data structure
- Score updated in localStorage

---

### ✅ Step 3: Add Recurring Goal (Template)

**Test:**
1. Open the dream you just created
2. Add a milestone with consistency goal:
   - Milestone: "Practice daily"
   - Type: "Consistency"
   - Goal: "Practice piano for 30 minutes"
   - Recurring: Yes
3. Save milestone
4. Check console logs

**Expected Console Output:**
```
💾 Creating weekly goal template for milestone
✅ Template saved to dreams container: template_...
📝 Template will generate instances when user views week
```

**Verify API Call:**
```
POST /api/saveItem/{userId}
Body: {
  "type": "weekly_goal_template",
  "data": {
    "id": "template_...",
    "dreamId": "dream_...",
    "milestoneId": "milestone_...",
    "title": "Practice piano for 30 minutes",
    "recurrence": "weekly",
    "isActive": true
  }
}
```

**In Production (Cosmos DB):**
- Template saved to `dreams` container
- NO instances created yet (on-demand pattern)

---

### ✅ Step 4: View Week Ahead

**Test:**
1. Navigate to "Weeks Ahead" page
2. Select current week
3. Check console logs

**Expected Console Output:**
```
📅 Loading week: 2025-W44
📋 Found 1 active template(s)
🔄 Creating instances from templates for week 2025-W44
💾 Batch creating 1 week instance(s) for 2025-W44
✅ Week instances created
```

**Verify API Call:**
```
POST /api/saveWeekGoals/{userId}
Body: {
  "year": 2025,
  "weekId": "2025-W44",
  "goals": [
    {
      "id": "goal_...",
      "templateId": "template_...",
      "dreamId": "dream_...",
      "milestoneId": "milestone_...",
      "title": "Practice piano for 30 minutes",
      "completed": false,
      "weekId": "2025-W44"
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "year": 2025,
  "weekId": "2025-W44",
  "goalsCount": 1
}
```

**In Production (Cosmos DB):**
- Goal instance saved to `weeks2025` container
- Stored in nested structure: `weeks["2025-W44"].goals[]`
- ONE document per user per year (not 52 separate documents)

**In UI:**
- Week view shows goal
- Goal appears in correct week
- Checkbox is unchecked

---

### ✅ Step 5: Complete a Goal

**Test:**
1. In Weeks Ahead view
2. Check the goal checkbox
3. Check console logs

**Expected Console Output:**
```
✅ Goal completed: goal_...
💾 Updating goal in weeks2025 container
📊 Adding scoring entry for goal completion
✅ Score updated: 5 points
```

**Verify API Call:**
```
POST /api/saveWeekGoals/{userId}
Body: {
  "year": 2025,
  "weekId": "2025-W44",
  "goals": [
    {
      "id": "goal_...",
      "completed": true,
      "completedAt": "2025-10-31T..."
    }
  ]
}
```

**Verify Scoring API Call:**
```
POST /api/saveScoring/{userId}
Body: {
  "year": 2025,
  "entry": {
    "id": "score_...",
    "source": "week",
    "weekId": "2025-W44",
    "goalId": "goal_...",
    "points": 5,
    "activity": "Completed weekly goal",
    "date": "2025-10-31"
  }
}
```

**In Production (Cosmos DB):**
- Goal updated in `weeks2025` container
- Scoring entry added to `scoring` container
- User score increased by 5 points

**In UI:**
- Checkbox is checked
- Completion timestamp shown
- User score updated in header

---

### ✅ Step 6: Add a Connect

**Test:**
1. Navigate to Dream Connect page
2. Select a person to connect with
3. Send connection request
4. Check console logs

**Expected Console Output:**
```
💾 Saving connect to connects container: connect_...
✅ Connect saved successfully
📊 Adding scoring entry for connect
✅ Score updated: 3 points
```

**Verify API Call:**
```
POST /api/saveConnect/{userId}
Body: {
  "id": "connect_...",
  "type": "connect",
  "withWhom": "John Doe",
  "when": "2025-10-31",
  "notes": "Coffee chat about career goals",
  "dreamId": "dream_..." // Optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "id": "connect_...",
  "container": "connects"
}
```

**In Production (Cosmos DB):**
- Connect saved to `connects` container
- Scoring entry added to `scoring` container
- User score increased by 3 points

**In UI:**
- Connect appears in recent connects list
- User score updated
- Can view connect details

---

## Debugging Commands

### Check localStorage Data
```javascript
// In browser console

// List all DreamSpace keys
Object.keys(localStorage).filter(k => k.startsWith('dreamspace'))

// Get user data
const userId = 'your@email.com';
const data = JSON.parse(localStorage.getItem(`dreamspace_user_${userId}_data`));
console.log('User data:', data);
console.log('Data structure version:', data.dataStructureVersion);
console.log('Dreams count:', data.dreamsCount);
console.log('Connects count:', data.connectsCount);
console.log('Score:', data.score);

// Check for arrays (should NOT exist in v3)
console.log('Has dreamBook array?', !!data.dreamBook); // Should be false
console.log('Has connects array?', !!data.connects); // Should be false
console.log('Has weeklyGoals array?', !!data.weeklyGoals); // Should be false
```

### Check Cosmos DB Containers
```bash
# Use Azure Portal or Azure CLI

# Check users container
az cosmosdb sql container query \
  --account-name dreamspace-cosmos \
  --database-name dreamspace \
  --name users \
  --query-text "SELECT * FROM c WHERE c.userId = 'test@example.com'"

# Check dreams container
az cosmosdb sql container query \
  --account-name dreamspace-cosmos \
  --database-name dreamspace \
  --name dreams \
  --query-text "SELECT * FROM c WHERE c.userId = 'test@example.com'"

# Check weeks2025 container
az cosmosdb sql container query \
  --account-name dreamspace-cosmos \
  --database-name dreamspace \
  --name weeks2025 \
  --query-text "SELECT * FROM c WHERE c.userId = 'test@example.com'"

# Check scoring container
az cosmosdb sql container query \
  --account-name dreamspace-cosmos \
  --database-name dreamspace \
  --name scoring \
  --query-text "SELECT * FROM c WHERE c.userId = 'test@example.com'"

# Check connects container
az cosmosdb sql container query \
  --account-name dreamspace-cosmos \
  --database-name dreamspace \
  --name connects \
  --query-text "SELECT * FROM c WHERE c.userId = 'test@example.com'"
```

### Clear User Data (Fresh Start)
```javascript
// In browser console - clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared - refresh to start fresh');

// In Azure Portal - delete user documents (if needed)
// Or use deleteItem API endpoint
```

---

## Expected Behavior Summary

### ✅ Profile (users container)
- Minimal profile only
- NO arrays
- Only counts: dreamsCount, connectsCount, weeksActiveCount
- dataStructureVersion: 3

### ✅ Dreams (dreams container)
- Individual dream documents
- Individual template documents
- Each with userId partition key

### ✅ Connects (connects container)
- Individual connect documents
- Each with userId partition key
- Ordered by `when` date descending

### ✅ Weekly Goals (weeks2025 container)
- ONE document per user per year
- Nested structure: `weeks["2025-W44"].goals[]`
- Instances created on-demand when viewing week
- Each goal has weekId for tracking

### ✅ Scoring (scoring container)
- ONE document per user per year
- Array of scoring entries
- Tracks all point-earning activities
- Used to calculate total score

---

## Common Issues & Solutions

### Issue: localStorage not persisting
**Solution:** Check browser settings - ensure cookies/storage are enabled

### Issue: API calls failing in local mode
**Solution:** 
1. Ensure Azure Functions are running: `cd api && npm start`
2. Check Vite proxy configuration in `vite.config.js`
3. Verify port 7071 is not in use

### Issue: User data has arrays after login
**Solution:**
1. Clear localStorage
2. Verify `dataStructureVersion: 3` is set in AuthContext
3. Check saveUserData API logs

### Issue: Goals not appearing in week view
**Solution:**
1. Verify template is marked `isActive: true`
2. Check instance creation logic in DreamsWeekAhead component
3. Look for console errors during instance creation

### Issue: Score not updating
**Solution:**
1. Check scoringService is being called
2. Verify API call succeeds: `/api/saveScoring/{userId}`
3. Check AppContext is updating local state

---

## Success Criteria

✅ New users created with minimal profile (no arrays)  
✅ dataStructureVersion: 3 set automatically  
✅ Dreams save to correct container  
✅ Templates save to correct container  
✅ Goal instances created on-demand with weekId  
✅ Goal completion updates correct container  
✅ Connects save to correct container  
✅ Scoring entries track all activities  
✅ User score updates in real-time  
✅ Works in both local and production  
✅ No console errors  
✅ All API calls return 200 OK  

---

## Next Steps After Verification

1. **Production Deployment**
   - Deploy updated Azure Functions
   - Deploy updated React app
   - Monitor Application Insights

2. **User Migration** (Optional)
   - Create migration script for existing users
   - Batch update dataStructureVersion to 3
   - Move data from old containers to new

3. **Performance Monitoring**
   - Track RU consumption in Cosmos DB
   - Monitor API response times
   - Check for any errors

---

**Ready to test! Follow the checklist step by step. 🚀**


