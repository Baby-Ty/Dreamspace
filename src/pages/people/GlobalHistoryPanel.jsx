// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { 
  Clock, 
  Loader2, 
  History, 
  RotateCw, 
  RotateCcw, 
  Eye 
} from 'lucide-react';
import { formatRelativeTime } from './PromptFieldHistory';

/**
 * Global History Panel Component
 * Shows all versions of prompts with preview and restore functionality
 */
export default function GlobalHistoryPanel({ 
  history, 
  loadingHistory, 
  restoring, 
  previewVersion, 
  onRefresh, 
  onPreview, 
  onRestore 
}) {
  return (
    <div className="bg-white rounded-lg border border-professional-gray-200 shadow-sm" data-testid="prompt-history-panel">
      <div className="p-4 border-b border-professional-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-netsurit-coral" />
            <h3 className="text-lg font-semibold text-professional-gray-900">Version History</h3>
          </div>
          <button
            onClick={onRefresh}
            disabled={loadingHistory}
            className="flex items-center gap-2 text-sm text-netsurit-coral hover:text-netsurit-red transition-colors"
          >
            <RotateCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="mt-1 text-sm text-professional-gray-600">
          View and restore previous versions of your AI prompts. Each save creates a new history entry.
        </p>
      </div>
      
      <div className="p-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-netsurit-coral" />
            <span className="ml-2 text-professional-gray-600">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-professional-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No history available yet.</p>
            <p className="text-sm">History entries are created when you save changes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <HistoryEntry
                key={entry.version}
                entry={entry}
                isPreview={previewVersion?.version === entry.version}
                restoring={restoring}
                onPreview={onPreview}
                onRestore={onRestore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual history entry component
 */
function HistoryEntry({ entry, isPreview, restoring, onPreview, onRestore }) {
  return (
    <div 
      className={`border rounded-lg p-4 transition-all ${
        isPreview 
          ? 'border-netsurit-coral bg-netsurit-coral/5' 
          : 'border-professional-gray-200 hover:border-professional-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-professional-gray-900">
              {formatRelativeTime(entry.timestamp)}
            </span>
            <span className="text-xs text-professional-gray-400">
              ({new Date(entry.timestamp).toLocaleString()})
            </span>
          </div>
          <p className="text-sm text-professional-gray-600 mt-1">
            Modified by: <span className="font-medium">{entry.modifiedBy}</span>
          </p>
          {entry.changeDescription && (
            <p className="text-xs text-professional-gray-500 mt-1 italic">
              {entry.changeDescription}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onPreview(isPreview ? null : entry)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isPreview
                ? 'bg-netsurit-coral text-white'
                : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
            }`}
          >
            <Eye className="h-4 w-4" />
            {isPreview ? 'Hide' : 'Preview'}
          </button>
          <button
            onClick={() => onRestore(entry)}
            disabled={restoring}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange disabled:opacity-50 transition-all"
          >
            {restoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Restore
          </button>
        </div>
      </div>
      
      {/* Preview Panel */}
      {isPreview && (
        <div className="mt-4 pt-4 border-t border-professional-gray-200">
          <h4 className="text-sm font-semibold text-professional-gray-700 mb-3">Prompt Preview</h4>
          <div className="grid gap-4 text-sm">
            <PreviewField 
              label="Dream Image Prompt" 
              value={entry.prompts?.imageGeneration?.dreamPrompt} 
            />
            <PreviewField 
              label="Vision System Prompt" 
              value={entry.prompts?.visionGeneration?.generateSystemPrompt} 
            />
            <div>
              <p className="font-medium text-professional-gray-600 mb-1">Style Modifiers:</p>
              <div className="bg-professional-gray-50 p-2 rounded text-xs">
                {Object.keys(entry.prompts?.styleModifiers || {}).length > 0 ? (
                  <ul className="list-disc list-inside">
                    {Object.entries(entry.prompts?.styleModifiers || {}).map(([id, style]) => (
                      <li key={id}>{style.label || id}</li>
                    ))}
                  </ul>
                ) : (
                  'No style modifiers'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preview field component
 */
function PreviewField({ label, value }) {
  return (
    <div>
      <p className="font-medium text-professional-gray-600 mb-1">{label}:</p>
      <pre className="bg-professional-gray-50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
        {value || 'Not set'}
      </pre>
    </div>
  );
}

