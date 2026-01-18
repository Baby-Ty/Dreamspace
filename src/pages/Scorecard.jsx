// Scorecard - Thin re-export of modular scorecard components
// All UI and logic have been moved to src/pages/scorecard/
// New files:
//   - ScorecardLayout.jsx (main orchestrator with header & tabs)
//   - SummaryView.jsx (overview tab with activity breakdown)
//   - HistoryView.jsx (chronological history view)
//   - ActivityCard.jsx (pure presentational activity card)
//   - ProgressCard.jsx (pure presentational progress card)
//   - Plus: useScorecardData.js hook for all calculations

export { default } from './scorecard/ScorecardLayout';