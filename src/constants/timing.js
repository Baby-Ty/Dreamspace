/**
 * Timing Constants
 * Centralized timing values with explanations for why specific delays are used
 */

/**
 * UI/Animation Delays
 */

// Allows React state batching to complete before dispatching custom events
// This ensures all state updates from a user action are reflected before other components react
export const EVENT_DISPATCH_DEBOUNCE = 300;

// Duration to show success notifications before auto-hiding
export const SUCCESS_NOTIFICATION_DURATION = 2000;

// Duration to show copied-to-clipboard feedback
export const CLIPBOARD_FEEDBACK_DURATION = 2000;

/**
 * API/Network Delays
 */

// Simulates network delay for mock/demo API responses
// Makes the UX feel more realistic when using mock data
export const MOCK_API_DELAY = 800;

/**
 * Database Delays
 */

// Cosmos DB eventual consistency delay
// Time to wait for changes to propagate across regions (if needed)
// Most operations don't need this, but it's here if required
export const COSMOS_CONSISTENCY_DELAY = 1000;
