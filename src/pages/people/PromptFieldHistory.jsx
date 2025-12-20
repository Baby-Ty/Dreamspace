// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Clock, Loader2, History } from 'lucide-react';

/**
 * Format relative time for display
 */
function formatRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

/**
 * History button component for prompt fields
 */
export function HistoryButton({ isActive, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
        isActive
          ? 'bg-netsurit-coral text-white'
          : 'text-professional-gray-500 hover:text-netsurit-coral hover:bg-netsurit-coral/10'
      }`}
      title={`View history for ${label}`}
    >
      <History className="h-3 w-3" />
      History
    </button>
  );
}

/**
 * Field history panel component
 * Shows history entries for a specific prompt field with restore functionality
 */
export function FieldHistoryPanel({ 
  label, 
  history, 
  currentValue, 
  loading, 
  onClose, 
  onRestore 
}) {
  if (!history) return null;

  return (
    <div className="mt-3 border border-netsurit-coral/30 rounded-lg bg-netsurit-coral/5 overflow-hidden">
      <div className="px-3 py-2 bg-netsurit-coral/10 border-b border-netsurit-coral/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-netsurit-coral" />
          <span className="text-sm font-medium text-professional-gray-800">
            History: {label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-professional-gray-500 hover:text-professional-gray-700"
        >
          Close
        </button>
      </div>
      
      <div className="p-3 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-netsurit-coral" />
            <span className="ml-2 text-sm text-professional-gray-600">Loading...</span>
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-professional-gray-500 text-center py-4">
            No history for this field yet.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const isDifferent = entry.value !== currentValue;
              return (
                <div 
                  key={entry.version}
                  className={`border rounded p-2 ${isDifferent ? 'border-professional-gray-200 bg-white' : 'border-green-200 bg-green-50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-professional-gray-700">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                      {!isDifferent && (
                        <span className="text-xs text-green-600">(current)</span>
                      )}
                    </div>
                    {isDifferent && (
                      <button
                        onClick={() => onRestore(entry.value)}
                        className="text-xs px-2 py-0.5 bg-netsurit-coral text-white rounded hover:bg-netsurit-red transition-colors"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-professional-gray-500 mb-1">
                    by {entry.modifiedBy}
                  </p>
                  <pre className="text-xs bg-professional-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-20 overflow-y-auto">
                    {entry.value || '(empty)'}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage field history state
 */
export function useFieldHistory(history, loadHistory) {
  // Get history for a specific field
  const getFieldHistory = (section, key) => {
    return history
      .filter(entry => entry.prompts?.[section]?.[key] !== undefined)
      .map(entry => ({
        version: entry.version,
        timestamp: entry.timestamp,
        modifiedBy: entry.modifiedBy,
        value: entry.prompts[section][key]
      }));
  };

  // Get history for a style modifier
  const getStyleModifierHistory = (styleId) => {
    return history
      .filter(entry => entry.prompts?.styleModifiers?.[styleId]?.modifier !== undefined)
      .map(entry => ({
        version: entry.version,
        timestamp: entry.timestamp,
        modifiedBy: entry.modifiedBy,
        value: entry.prompts.styleModifiers[styleId].modifier
      }));
  };

  return { getFieldHistory, getStyleModifierHistory };
}

export { formatRelativeTime };
export default { HistoryButton, FieldHistoryPanel, useFieldHistory, formatRelativeTime };

