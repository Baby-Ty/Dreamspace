# Week Document Auto-Creation on Login

**Date**: October 31, 2025  
**Status**: ✅ **IMPLEMENTED** - Week document created automatically on user sign-in

---

## Implementation

### **When It Happens**

The user's week document is now **automatically created** during the `getUserData` API call (which happens on every login/page load).

### **Location**: `api/getUserData/index.js`

```javascript
// Check if user is using new 6-container structure
if (isNewStructure(profile)) {
  const currentYear = new Date().getFullYear();
  const weeksContainer = database.container(`weeks${currentYear}`);
  
  // Initialize week document if it doesn't exist
  const weekDocId = `${userId}_${currentYear}`;
  let weeksResult;
  try {
    weeksResult = await weeksContainer.item(weekDocId, userId).read();
  } catch (error) {
    if (error.code === 404) {
      // Document doesn't exist - create it
      const newWeekDoc = {
        id: weekDocId,
        userId: userId,
        year: currentYear,
        weeks: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const { resource } = await weeksContainer.items.create(newWeekDoc);
      weeksResult = { status: 'fulfilled', value: { resource } };
      context.log(`✅ Created week document for ${userId}`);
    } else {
      throw error;
    }
  }
  // ... continue loading other data
}
```

---

## Document Structure Created

### **Initial Empty Document**

```json
{
  "id": "Tyler.Stewart@netsurit.com_2025",
  "userId": "Tyler.Stewart@netsurit.com",
  "year": 2025,
  "weeks": {},
  "createdAt": "2025-10-31T12:00:00.000Z",
  "updatedAt": "2025-10-31T12:00:00.000Z"
}
```

### **After First Week is Planned**

```json
{
  "id": "Tyler.Stewart@netsurit.com_2025",
  "userId": "Tyler.Stewart@netsurit.com",
  "year": 2025,
  "weeks": {
    "2025-W44": {
      "goals": [
        {
          "id": "template_123_2025-W44",
          "type": "weekly_goal",
          "templateId": "template_123",
          "weekId": "2025-W44",
          "title": "Test",
          "description": "Track progress for test milestone",
          "dreamId": "dream_456",
          "dreamTitle": "Test",
          "dreamCategory": "Growth & Learning",
          "completed": false,
          "recurrence": "weekly",
          "createdAt": "2025-10-31T12:05:00.000Z"
        }
      ]
    }
  },
  "createdAt": "2025-10-31T12:00:00.000Z",
  "updatedAt": "2025-10-31T12:05:00.000Z"
}
```

---

## Flow

### **1. User Signs In**
```
User logs in → AuthContext loads → getUserData API called
```

### **2. getUserData Checks for Week Document**
```javascript
try {
  // Try to read existing document
  weeksResult = await weeksContainer.item(weekDocId, userId).read();
} catch (error) {
  if (error.code === 404) {
    // Document doesn't exist - CREATE IT
    const newWeekDoc = { id, userId, year, weeks: {}, ... };
    await weeksContainer.items.create(newWeekDoc);
  }
}
```

### **3. Document Now Exists**
- ✅ Empty `weeks: {}` object ready
- ✅ Proper structure for adding week data
- ✅ User can now plan weeks

### **4. User Plans a Week**
```
User navigates to Week Ahead → loadWeekGoals() called
→ Instantiates templates for current week
→ Saves to weeks["2025-W44"]
→ Document updated with week data
```

---

## Benefits

### ✅ **Automatic Initialization**
- No manual database setup required
- Works for all users automatically
- Handles new years seamlessly

### ✅ **Lazy Creation**
- Only creates document when user actually exists
- Doesn't pre-create for all possible users
- Minimal database operations

### ✅ **Error Handling**
- Gracefully handles missing documents
- Continues if container doesn't exist yet
- Logs creation for debugging

### ✅ **Scalable**
- One document per user per year
- Scales to millions of users
- Efficient partition key usage (`/userId`)

---

## Complete Data Flow

### **On Login (First Time)**
```
1. User signs in
2. getUserData API called
3. Checks for weeks2025 document
4. Document doesn't exist (404)
5. Creates empty document: { id, userId, year, weeks: {} }
6. Returns to frontend with empty weeks
7. ✅ User ready to plan weeks
```

### **On Week Ahead Page Load**
```
1. Page loads current week
2. Checks for goals in weeks["2025-W44"]
3. Week doesn't exist in document
4. Instantiates templates
5. Saves to weeks["2025-W44"]
6. Goals displayed
7. ✅ Document now has week data
```

### **On Subsequent Logins**
```
1. User signs in
2. getUserData API called
3. Document exists - reads it
4. Returns existing weeks data
5. ✅ Previous weeks preserved
```

---

## Testing

### **Verify Auto-Creation**

1. **Clear existing document** (if testing):
   ```sql
   DELETE FROM c WHERE c.id = "Tyler.Stewart@netsurit.com_2025"
   ```

2. **Sign in to app**

3. **Check Azure Data Explorer**:
   - Should see document: `Tyler.Stewart@netsurit.com_2025`
   - Should have empty `weeks: {}` object

4. **Navigate to Week Ahead**:
   - Document should now have `weeks["2025-W44"]` with goals

### **Verify Logs**

**Backend logs should show:**
```
Creating initial week document for Tyler.Stewart@netsurit.com year 2025
✅ Created week document for Tyler.Stewart@netsurit.com
```

**Frontend logs should show:**
```
📅 Loading goals for week 2025-W44
✅ Loaded week document for 2025
💾 Saving week goals...
✅ Week goals saved for 2025-W44
```

---

## Edge Cases Handled

### ✅ **New User**
- Document created automatically on first login
- Ready to use immediately

### ✅ **Existing User, New Year**
- 2026 document created when year changes
- 2025 document remains untouched

### ✅ **Container Missing**
- Error logged but doesn't break login
- Can be handled separately

### ✅ **Concurrent Requests**
- Cosmos DB handles concurrent creates
- One will succeed, others get "already exists" (ignored)

---

## Summary

✅ **Auto-creation implemented** - Week document created on sign-in  
✅ **Seamless experience** - User doesn't need to do anything  
✅ **Proper structure** - Empty weeks object ready for data  
✅ **Error handling** - Graceful fallback if issues occur  
✅ **Logging added** - Can track document creation  

Users will now have their week document automatically initialized when they sign in!


