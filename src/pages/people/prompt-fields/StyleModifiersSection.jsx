import { 
  Palette, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { HistoryButton, FieldHistoryPanel } from '../PromptFieldHistory';

/**
 * Style Modifiers Section Component
 */
export function StyleModifiersSection({ 
  prompts, 
  expanded, 
  onToggle, 
  onUpdateStyleModifier,
  fieldHistoryView,
  onToggleFieldHistory,
  getStyleModifierHistory,
  loadingHistory,
  onCloseHistory,
  onRestoreStyleModifier
}) {
  const isFieldHistoryActive = (section, key) => 
    fieldHistoryView?.section === section && fieldHistoryView?.key === key;

  return (
    <div className="bg-white rounded-lg border border-professional-gray-200 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-professional-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-netsurit-orange" />
          <h3 className="text-lg font-semibold text-professional-gray-900">Style Modifiers</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-professional-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-professional-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-professional-gray-200">
          {Object.entries(prompts.styleModifiers || {}).map(([styleId, style]) => (
            <div key={styleId} className="border border-professional-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                  Style Label
                </label>
                <input
                  type="text"
                  value={style.label || ''}
                  onChange={(e) => onUpdateStyleModifier(styleId, 'label', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                  placeholder="Style display name"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-professional-gray-700">
                    Style Modifier Text
                  </label>
                  <HistoryButton
                    isActive={isFieldHistoryActive(`styleModifiers.${styleId}`, 'modifier')}
                    onClick={() => onToggleFieldHistory(`styleModifiers.${styleId}`, 'modifier', `${style.label || styleId} Modifier`)}
                    label={`${style.label || styleId} modifier`}
                  />
                </div>
                <textarea
                  value={style.modifier || ''}
                  onChange={(e) => onUpdateStyleModifier(styleId, 'modifier', e.target.value)}
                  className="w-full h-24 p-3 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red font-mono text-sm"
                  placeholder="Enter style modifier description"
                />
                {isFieldHistoryActive(`styleModifiers.${styleId}`, 'modifier') && (
                  <FieldHistoryPanel
                    label={`${style.label || styleId} Modifier`}
                    history={getStyleModifierHistory(styleId)}
                    currentValue={style.modifier || ''}
                    loading={loadingHistory}
                    onClose={onCloseHistory}
                    onRestore={(value) => onRestoreStyleModifier(styleId, value)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}