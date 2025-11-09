# Fix Tyler Stewart Coach Role

## Problem
Tyler Stewart was promoted to coach via the People Hub UI. The team document was created successfully, but the user document in the `users` container was not updated with `role: 'coach'` and `isCoach: true`.

## Quick Fix

### Option 1: Call the Fix API Endpoint

I've created a special diagnostic/fix endpoint that will:
1. Try multiple ways to find Tyler's user document
2. Try multiple partition key configurations
3. Update the document with the correct role

**To run the fix:**

1. Make sure your Azure Functions are running locally or deployed
2. Call the endpoint:

```bash
# Local
curl -X POST http://localhost:7071/api/fixTylerCoachRole

# Production
curl -X POST https://your-function-app.azurewebsites.net/api/fixTylerCoachRole
```

### Option 2: Manual Update in Azure Portal

1. Go to Azure Portal → Your Cosmos DB account
2. Navigate to Data Explorer
3. Select `dreamspace` database → `users` container
4. Find Tyler's document (userId: `Tyler.Stewart@netsurit.com`)
5. Click "Edit"
6. Add/update these fields:
   ```json
   {
     "role": "coach",
     "isCoach": true,
     "promotedAt": "2025-11-09T...",
     "lastModified": "2025-11-09T..."
   }
   ```
7. Click "Update"

### Option 3: Update via Query in Data Explorer

Run this query in the Data Explorer:

```sql
SELECT * FROM c WHERE c.userId = "Tyler.Stewart@netsurit.com"
```

Then manually edit the returned document to add:
- `"role": "coach"`
- `"isCoach": true`

---

## Root Cause Investigation

The `promoteUserToCoach` API (lines 85-95) should be updating the user document, but it's not working. Possible causes:

1. **Partition Key Mismatch**: The partition key for the users container might be `/id` instead of `/userId`
2. **Case Sensitivity**: The userId might have case sensitivity issues
3. **Replace Operation Failing Silently**: The replace might be failing but not throwing an error

## Enhanced Logging

I've updated `api/promoteUserToCoach/index.js` with better logging to help diagnose the issue. The next time you promote a user, check the Azure Functions logs for:

```
Found user: id=..., userId=..., currentRole=...
Attempting to update user document with id=..., partition key=...
✅ User document updated successfully. Status: 200
```

Or error messages:
```
❌ Failed to update user document: [error details]
```

## After the Fix

Once Tyler's user document is updated with `role: 'coach'` and `isCoach: true`:

1. Have Tyler refresh his browser (F5)
2. The AuthContext will call `refreshUserRole()` automatically on window focus
3. The Dream Coach preview button (eye icon) should appear in the sidebar
4. Tyler should see coach-specific features

---

## Verification

After applying the fix, verify:

- [ ] Tyler's user document in Cosmos DB shows `"role": "coach"`
- [ ] Tyler's user document shows `"isCoach": true`
- [ ] Tyler can see the Dream Coach preview button (eye icon)
- [ ] Tyler's role in the UI shows as "coach"
- [ ] Tyler appears in the Coaches list in People Hub

---

**Created**: November 9, 2025  
**Status**: Ready to apply

