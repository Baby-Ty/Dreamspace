// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import { z } from 'zod';

/**
 * Schema for individual component health check
 */
const componentHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  message: z.string().optional(),
  endpoint: z.string().optional(),
  responseTime: z.number().optional(),
  error: z.string().optional(),
});

/**
 * Schema for overall health response
 */
export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  service: z.string().optional(),
  version: z.string().optional(),
  timestamp: z.string().optional(),
  checks: z.record(componentHealthSchema).optional(),
});

/**
 * Parse and validate health response
 * @param {unknown} data - Raw health response data
 * @returns {Object} Validated health response
 */
export function parseHealthResponse(data) {
  return healthResponseSchema.parse(data);
}

/**
 * Safe parse health response with fallback
 * @param {unknown} data - Raw health response data
 * @returns {Object} Parse result with success flag
 */
export function safeParseHealthResponse(data) {
  return healthResponseSchema.safeParse(data);
}

