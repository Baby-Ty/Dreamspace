# Field Name Mismatch Fix - Dreams Not Loading

## Issue
Users' dreams were not loading after login even though they existed in Cosmos DB.

## Root Cause
**Field name mismatch** between save and load operations:

- `saveDreams` API saved to Cosmos DB as: `dreams: [...]`
- `getUserData` API tried to read as: `dreamBook: []`

## Example
Cosmos DB document structure (saved):
```json
{
  "id": "Tyler.Stewart@netsurit.com",
  "userId": "Tyler.Stewart@netsurit.com",
  "dreams": [
    {
      "id": "dream_1761939433267",
      "title": "Backpack Through Patagonia",
      "goals": [...]
    }
  ]
}
```

But API was looking for:
```javascript
dreamBook = dreamsDoc.dreamBook || []; // ❌ Wrong field name!
```

## Fix Applied

**File**: `api/getUserData/index.js` (Line 305)

**Before**:
```javascript
dreamBook = dreamsDoc.dreamBook || [];
```

**After**:
```javascript
// Support both 'dreams' (new) and 'dreamBook' (legacy) field names
dreamBook = dreamsDoc.dreams || dreamsDoc.dreamBook || [];
```

## Changes Made

1. ✅ Updated `getUserData` API to read from `dreams` field (new format)
2. ✅ Added fallback to `dreamBook` for backwards compatibility with any legacy data
3. ✅ Deployed fix to Azure Functions

## Testing Steps

1. Log out of DreamSpace
2. Log back in
3. Dreams should now load correctly from Cosmos DB
4. Check console for: `Using aggregated format: X dreams, Y templates`

## Related Files

- `api/getUserData/index.js` - Fixed to read `dreams` field
- `api/saveDreams/index.js` - Already correctly saves as `dreams`
- `src/context/AuthContext.jsx` - Creates empty dreams document for new users

## Status

✅ **FIXED** - Deployed to production

Users should now see their dreams load correctly after login!

