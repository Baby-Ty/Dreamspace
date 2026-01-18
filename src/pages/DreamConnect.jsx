// DreamConnect - Thin re-export of modular dream-connect components
// All UI and logic have been moved to src/pages/dream-connect/
// New files:
//   - DreamConnectLayout.jsx (main orchestrator with pagination)
//   - ConnectionFilters.jsx (controlled filter inputs)
//   - ConnectionCard.jsx (pure presentational card)
//   - Plus: useDreamConnections.js hook for queries & infinite scroll

export { default } from './dream-connect/DreamConnectLayout';