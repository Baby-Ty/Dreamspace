// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { z } from 'zod';

/**
 * Microsoft Graph User Schema
 * Only includes fields we actually use in the app
 */
export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  mail: z.string().email().nullable().optional(),
  userPrincipalName: z.string().optional(),
  givenName: z.string().optional(),
  surname: z.string().optional(),
  jobTitle: z.string().nullable().optional(),
  officeLocation: z.string().nullable().optional()
}).passthrough(); // Allow other fields from Graph API

/**
 * Schema for /me endpoint (same as User)
 */
export const MeSchema = UserSchema;

/**
 * Schema for user list responses (e.g., search results)
 */
export const UserListSchema = z.object({
  value: z.array(UserSchema)
});
