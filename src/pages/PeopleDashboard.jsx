// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
// PeopleDashboard - Thin re-export of modular people components
// All UI and logic have been moved to src/pages/people/
// New files:
//   - PeopleDashboardLayout.jsx (main orchestrator with filters & modals)
//   - CoachList.jsx (pure presentational coach list)
//   - TeamMetrics.jsx (pure presentational team metrics)
//   - Plus: usePeopleData.js hook for all data fetching & caching

export { default } from './people/PeopleDashboardLayout';
