// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
// CoachDetailModal - Thin wrapper for backward compatibility
// All implementation moved to modular components in ./coach/
// New files:
//   - CoachDetailModal.jsx (main modal shell with tabs & accessibility)
//   - CoachMetrics.jsx (pure presentational metrics display)
//   - TeamMemberList.jsx (pure presentational member list)
//   - CoachingAlerts.jsx (pure presentational alerts)
//   - useCoachDetail.js hook for all modal state & logic

import CoachDetailModal from './coach/CoachDetailModal';

export default CoachDetailModal;
