# Bulk Instantiation Troubleshooting Guide

## Current Issue

WeekYear document has all 52 weeks initialized ✅, but goals are only appearing in the current week (W45) instead of being distributed across their target weeks (e.g., 12 weeks for a weekly goal).

---

## Step 1: Check Console Logs

Open your browser console (F12) and look for these specific log messages:

### When Creating a New Goal

Look for:
```
🚀 Bulk instantiating template across weeks: { templateId: "...", targetWeeks: 12, startDate: "..." }
📤 Sending to bulkInstantiateTemplates API: { ... }
📥 bulkInstantiateTemplates result: { ... }
```

**If you see:**
- ✅ `✅ Template instantiated across all target weeks` → API call succeeded
- ❌ `❌ Failed to bulk instantiate template: ...` → API call failed (check error message)
- ❌ Nothing → The code isn't running (refresh and try again)

### On Page Load/Login

Look for:
```
🚀 Found X templates to bulk instantiate on login: [...]
📤 Sending templates to bulkInstantiateTemplates API: [...]
📥 Bulk instantiation result on login: { ... }
```

---

## Step 2: Deploy New API Functions

The new `initializeAllWeeks` API function needs to be deployed to Azure:

### Option A: Deploy via VS Code

1. Open VS Code
2. Install "Azure Functions" extension if not already installed
3. Click Azure icon in sidebar
4. Right-click on your Functions App
5. Select "Deploy to Function App"
6. Select the `api` folder

### Option B: Deploy via Azure CLI

```bash
cd api
func azure functionapp publish <your-function-app-name>
```

### Option C: Deploy via GitHub Actions (if configured)

```bash
git add .
git commit -m "Add bulk instantiation API"
git push origin main
```

---

## Step 3: Verify API Endpoints Exist

### Check Locally

Start the local dev server:

```bash
cd api
npm install
npm start
```

Then test the endpoint:

```bash
# Test initializeAllWeeks
curl -X POST http://localhost:7071/api/initializeAllWeeks \
  -H "Content-Type: application/json" \
  -d '{"userId":"test@example.com","year":2025}'

# Test bulkInstantiateTemplates
curl -X POST http://localhost:7071/api/bulkInstantiateTemplates \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test@example.com",
    "year":2025,
    "templates":[{
      "id":"test123",
      "title":"Test Goal",
      "durationType":"weeks",
      "durationWeeks":12,
      "startDate":"2025-11-08T00:00:00Z"
    }]
  }'
```

### Check Production

After deploying, test the production endpoint:

```bash
curl -X POST https://func-dreamspace-prod.azurewebsites.net/api/bulkInstantiateTemplates \
  -H "Content-Type: application/json" \
  -d '{"userId":"Tyler.Stewart@netsurit.com","year":2025,"templates":[]}'
```

Expected response:
```json
{
  "success": true,
  "weeksCreated": 0,
  "totalWeeks": 52,
  "instancesCreated": 0,
  "templatesProcessed": 0
}
```

---

## Step 4: Manual Database Test

You can manually test by calling the bulk instantiation from console:

```javascript
// In browser console:
const weekService = window.weekService || await import('./src/services/weekService.js').then(m => m.default);

const result = await weekService.bulkInstantiateTemplates(
  'Tyler.Stewart@netsurit.com',
  2025,
  [{
    id: 'goal_1762556365640', // Your existing template ID
    title: 'weekly',
    dreamId: 'dream_1762556352908',
    dreamTitle: 'Read a Book a Month',
    dreamCategory: 'Skills & Hobbies',
    durationType: 'weeks',
    durationWeeks: 12,
    startDate: '2025-11-07T00:00:00Z',
    type: 'weekly_goal_template'
  }]
);

console.log('Result:', result);
```

Then check your Cosmos DB to see if weeks W45-W56 now have the goal instances.

---

## Step 5: Check for Template Properties

Verify your templates have the required properties:

```javascript
// In browser console, check existing templates:
const templates = window.appState?.weeklyGoals?.filter(g => g.type === 'weekly_goal_template');
console.log('Templates:', templates);

// Each should have:
// - id
// - targetWeeks (number, e.g., 12)
// - startDate (ISO string)
// - title, dreamId, etc.
```

---

## Expected Behavior After Fix

1. **When you create a 12-week goal:**
   - Console shows: "✅ Template instantiated across all target weeks"
   - Database: Weeks W45-W56 all have goal instances
   - Week Ahead: Browsing to week W50 shows the goal

2. **When you reload the page:**
   - Console shows: "✅ Bulk instantiation complete on login"
   - All existing templates are checked and missing weeks are populated

3. **Database structure:**
   ```json
   {
     "weeks": {
       "2025-W45": { "goals": [{ "id": "goal_xxx_2025-W45", ... }] },
       "2025-W46": { "goals": [{ "id": "goal_xxx_2025-W46", ... }] },
       "2025-W47": { "goals": [{ "id": "goal_xxx_2025-W47", ... }] },
       // ... 9 more weeks ...
       "2025-W56": { "goals": [{ "id": "goal_xxx_2025-W56", ... }] }
     }
   }
   ```

---

## Common Issues

### Issue 1: API Not Deployed
**Symptom:** Console shows fetch error or 404
**Solution:** Deploy the API functions (see Step 2)

### Issue 2: Template Missing Properties
**Symptom:** Console shows "durationType: undefined"
**Solution:** Template needs `targetWeeks` or will default to 52 weeks

### Issue 3: Bulk Instantiation Runs But No Instances Created
**Symptom:** Console shows success but database unchanged
**Solution:** Check if instances already exist (API skips duplicates)

### Issue 4: Wrong Week Format
**Symptom:** Instances created but not showing in Week Ahead
**Solution:** Verify weekId format is "YYYY-Www" (e.g., "2025-W45")

---

## Quick Fix (Temporary)

If you need goals in multiple weeks NOW before deploying:

1. Go to Cosmos DB
2. Open your weekYear document
3. Manually copy the goal from W45 to other weeks
4. Change the `id` and `weekId` for each copy:

```json
{
  "2025-W46": {
    "goals": [{
      "id": "goal_1762556365640_2025-W46",  // Change week in ID
      "weekId": "2025-W46",                  // Change weekId
      // ... rest stays same ...
    }]
  }
}
```

---

## Need More Help?

1. **Share console logs:** Copy all logs that mention "bulk instantiate"
2. **Share network tab:** Check if API calls are being made and what responses they get
3. **Share template data:** From console: `console.log(window.appState?.weeklyGoals?.filter(g => g.type === 'weekly_goal_template'))`


