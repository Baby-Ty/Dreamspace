# GET /api/getItems/{userId}

## Overview

Retrieves items for a specific user from the Cosmos DB `items` container with optional filtering by type and weekId.

**Endpoint:** `/api/getItems/{userId}`  
**Method:** `GET`  
**Authentication:** Required (user-access)  
**Authorization:** User can access own items, or coach/admin can access team members' items

---

## Authentication & Authorization

### Authentication
- Requires valid Azure AD Bearer token in `Authorization` header
- Token must be valid JWT issued by configured Azure AD tenant

### Authorization Strategy: `user-access`
The endpoint enforces the following access rules:

1. **User accessing own data:** ✅ Always allowed
   - If authenticated userId matches route parameter userId

2. **Coach accessing team member:** ✅ Allowed
   - Coach must have `isCoach: true` or `roles.coach: true` in user profile
   - Target user must be in coach's team (validated via `teams` container)

3. **Admin accessing any user:** ✅ Allowed
   - User must have `roles.admin: true` in user profile

4. **User accessing other user:** ❌ Forbidden (403)
   - Unless users are in the same team

---

## Request

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ Yes | Email address of the user whose items to retrieve |

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `type` | string | ❌ No | Filter items by type | `weekly_goal`, `dream`, `connect` |
| `weekId` | string | ❌ No | Filter items by week identifier | `2024-W01`, `2025-W15` |

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer {token}` | ✅ Yes |
| `Content-Type` | `application/json` | Recommended |

---

## Response

### Success Response (200 OK)

Returns an array of item documents matching the query criteria.

**Response Body:**
```json
[
  {
    "id": "item_abc123",
    "userId": "user@example.com",
    "type": "weekly_goal",
    "weekId": "2025-W04",
    "title": "Complete project documentation",
    "status": "in_progress",
    "createdAt": "2025-01-20T10:30:00Z",
    "updatedAt": "2025-01-22T14:15:00Z"
  },
  {
    "id": "item_def456",
    "userId": "user@example.com",
    "type": "dream",
    "title": "Learn Azure architecture",
    "category": "Learning",
    "progress": "planning",
    "createdAt": "2025-01-15T09:00:00Z",
    "updatedAt": "2025-01-20T16:45:00Z"
  }
]
```

**Response for no items:** Empty array `[]`

### Error Responses

#### 400 Bad Request
Missing required userId parameter (should not occur with proper routing)

```json
{
  "error": "userId is required",
  "requestId": "abc-123-def-456"
}
```

#### 401 Unauthorized
Invalid or missing authentication token

```json
{
  "error": "Invalid or missing authentication token",
  "requestId": "abc-123-def-456"
}
```

#### 403 Forbidden
User does not have permission to access target user's items

```json
{
  "error": "You can only access data for members of your team",
  "requestId": "abc-123-def-456"
}
```

#### 429 Too Many Requests
Rate limit exceeded (120 requests per minute for read operations)

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": "45"
}
```

**Rate Limit Headers:**
- `X-RateLimit-Limit: 120`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1706012345`
- `Retry-After: 45`

#### 500 Internal Server Error
Database connection failure or unexpected error

```json
{
  "error": "Internal server error",
  "requestId": "abc-123-def-456"
}
```

---

## Examples

### Example 1: Get All Items for User

**Request:**
```http
GET /api/getItems/user@example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  { "id": "item1", "userId": "user@example.com", "type": "dream", "title": "Dream 1" },
  { "id": "item2", "userId": "user@example.com", "type": "weekly_goal", "title": "Goal 1" },
  { "id": "item3", "userId": "user@example.com", "type": "connect", "title": "Connect 1" }
]
```

### Example 2: Filter by Type

**Request:**
```http
GET /api/getItems/user@example.com?type=weekly_goal
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  { "id": "item2", "userId": "user@example.com", "type": "weekly_goal", "weekId": "2025-W04", "title": "Goal 1" },
  { "id": "item5", "userId": "user@example.com", "type": "weekly_goal", "weekId": "2025-W03", "title": "Goal 2" }
]
```

### Example 3: Filter by Type AND WeekId

**Request:**
```http
GET /api/getItems/user@example.com?type=weekly_goal&weekId=2025-W04
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  { "id": "item2", "userId": "user@example.com", "type": "weekly_goal", "weekId": "2025-W04", "title": "Goal 1" }
]
```

### Example 4: Filter by WeekId Only

**Request:**
```http
GET /api/getItems/user@example.com?weekId=2025-W04
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkjXVCJ9...
```

**Response:**
```json
[
  { "id": "item2", "userId": "user@example.com", "type": "weekly_goal", "weekId": "2025-W04", "title": "Goal 1" },
  { "id": "item7", "userId": "user@example.com", "type": "task", "weekId": "2025-W04", "title": "Task 1" }
]
```

### Example 5: Coach Accessing Team Member's Items

**Request:**
```http
GET /api/getItems/teammember@example.com?type=dream
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** Token must be for a coach who has `teammember@example.com` in their team

**Response:**
```json
[
  { "id": "item10", "userId": "teammember@example.com", "type": "dream", "title": "Team Member Dream" }
]
```

---

## Performance Considerations

### Query Performance
- **Partition Key:** All queries include `WHERE c.userId = @userId` which uses the partition key
- **Cost:** 1 RU per query (partition key optimization)
- **Latency:** ~20-50ms typical (same-region Cosmos DB)

### Rate Limiting
- **Per-minute limit:** 120 requests
- **Per-user tracking:** Based on authenticated userId
- **Enforcement:** In-memory store (resets on function restart)

### Best Practices
1. Always use the most specific filter available (type + weekId is most efficient)
2. Cache results on client-side when appropriate
3. Use pagination if expecting large result sets (not currently implemented)
4. Avoid polling—consider event-based updates for real-time needs

---

## Database Schema

### Container: `items`

**Partition Key:** `/userId`

**Typical Document Structure:**
```json
{
  "id": "item_abc123",
  "userId": "user@example.com",
  "type": "weekly_goal|dream|connect|task",
  "weekId": "2025-W04",
  "title": "Item title",
  "description": "Item description",
  "status": "pending|in_progress|completed",
  "createdAt": "2025-01-20T10:30:00Z",
  "updatedAt": "2025-01-22T14:15:00Z",
  // Type-specific fields
  "category": "Health",
  "progress": "planning",
  "completedAt": "2025-01-25T18:00:00Z"
}
```

---

## Technical Implementation

### Architecture Pattern
- **Wrapper:** Uses `createApiHandler` from `api/utils/apiWrapper.js`
- **Auth Mode:** `user-access` (validates requester can access target userId)
- **Container:** Direct access to `items` container via Cosmos provider

### Query Building Strategy
The endpoint builds SQL queries dynamically based on provided filters:

1. **Both type AND weekId:** 3-parameter query
2. **Type only:** 2-parameter query
3. **WeekId only:** 2-parameter query
4. **No filters:** 1-parameter query (just userId)

All queries include the partition key (`userId`) for optimal performance.

### Error Handling
- Input validation errors: 400 status
- Cosmos DB 404: Returns empty array (not an error)
- Unexpected errors: Caught by apiWrapper, logged with request ID, returns 500

### Logging
```
Getting items for user: user@example.com type: weekly_goal weekId: 2025-W04
Found 3 items for user user@example.com
```

---

## Related Endpoints

- `POST /api/saveItem` - Save/update a single item
- `POST /api/batchSaveItems` - Save/update multiple items in one transaction
- `DELETE /api/deleteItem/{userId}/{itemId}` - Delete a specific item

---

## Code Location

**File:** `api/getItems/index.js`  
**Middleware:** `api/utils/apiWrapper.js`  
**Auth:** `api/utils/authMiddleware.js` (requireUserAccess function)  
**Database:** `api/utils/cosmosProvider.js` (getContainer method)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial implementation with type and weekId filtering |

---

## Support & Debugging

### Common Issues

**Issue:** 403 Forbidden when accessing team member's items  
**Solution:** Verify the coach has the team member in their `teams` container `teamMembers` array

**Issue:** Empty array returned when expecting results  
**Solution:** Check that userId, type, and weekId values match exactly (case-sensitive)

**Issue:** 429 Rate Limit errors  
**Solution:** Implement client-side throttling or caching, wait for `Retry-After` seconds

### Debug Checklist
1. ✅ Valid Bearer token in Authorization header?
2. ✅ Token not expired (check exp claim)?
3. ✅ userId in route matches partition key format (email)?
4. ✅ Query parameters spelled correctly (type, weekId)?
5. ✅ User has permission (self, coach, admin)?
6. ✅ Items actually exist in database for that userId?

---

**Last Updated:** January 2026  
**Maintained By:** Netsurit Development Team
