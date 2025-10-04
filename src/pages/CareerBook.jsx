// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
// CareerBook - Thin re-export of modular career components
// All UI and logic have been moved to src/pages/career/
// New files:
//   - CareerBookLayout.jsx (main orchestrator with tabs)
//   - MyCareerTab.jsx (current role & highlights)
//   - CareerGoalsTab.jsx (goals management)
//   - DevelopmentPlanTab.jsx (development plans)
//   - MySkillsTab.jsx (skills tracking)
//   - Plus: useCareerData.js hook for all data/mutations

export { default } from './career/CareerBookLayout';
