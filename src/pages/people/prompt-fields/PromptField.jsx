import { HistoryButton, FieldHistoryPanel } from '../PromptFieldHistory';

/**
 * Individual Prompt Field Component
 * Shared component used by all section components
 */
export function PromptField({
  label,
  section,
  fieldKey,
  value,
  onChange,
  placeholder,
  helperText,
  height = 'h-32',
  isHistoryActive,
  onToggleHistory,
  historyData,
  loadingHistory,
  onCloseHistory,
  onRestore
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-professional-gray-700">{label}</label>
        <HistoryButton isActive={isHistoryActive} onClick={onToggleHistory} label={label} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${height} p-3 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red font-mono text-sm`}
        placeholder={placeholder}
      />
      {helperText && (
        <p className="mt-1 text-xs text-professional-gray-500">{helperText}</p>
      )}
      {historyData && (
        <FieldHistoryPanel
          label={label}
          history={historyData}
          currentValue={value}
          loading={loadingHistory}
          onClose={onCloseHistory}
          onRestore={onRestore}
        />
      )}
    </div>
  );
}