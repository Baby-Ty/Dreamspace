// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { 
  Image as ImageIcon, 
  FileText, 
  Palette, 
  ChevronDown, 
  ChevronUp,
  History
} from 'lucide-react';
import { HistoryButton, FieldHistoryPanel, useFieldHistory } from './PromptFieldHistory';

/**
 * Image Generation Section Component
 */
export function ImageGenerationSection({ 
  prompts, 
  expanded, 
  onToggle, 
  onUpdatePrompt,
  fieldHistoryView,
  onToggleFieldHistory,
  getFieldHistory,
  loadingHistory,
  onCloseHistory,
  onRestoreField
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
          <ImageIcon className="h-5 w-5 text-netsurit-red" />
          <h3 className="text-lg font-semibold text-professional-gray-900">Image Generation</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-professional-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-professional-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-professional-gray-200">
          <PromptField
            label="Dream Image Prompt"
            section="imageGeneration"
            fieldKey="dreamPrompt"
            value={prompts.imageGeneration?.dreamPrompt || ''}
            onChange={(value) => onUpdatePrompt('imageGeneration', 'dreamPrompt', value)}
            placeholder="Enter prompt template (use {userSearchTerm} as placeholder)"
            helperText="Template variable: {userSearchTerm} will be replaced with the user's search term"
            isHistoryActive={isFieldHistoryActive('imageGeneration', 'dreamPrompt')}
            onToggleHistory={() => onToggleFieldHistory('imageGeneration', 'dreamPrompt', 'Dream Image Prompt')}
            historyData={fieldHistoryView?.section === 'imageGeneration' && fieldHistoryView?.key === 'dreamPrompt' ? getFieldHistory('imageGeneration', 'dreamPrompt') : null}
            loadingHistory={loadingHistory}
            onCloseHistory={onCloseHistory}
            onRestore={(value) => onRestoreField('imageGeneration', 'dreamPrompt', value)}
          />
          
          <PromptField
            label="Background Card Prompt"
            section="imageGeneration"
            fieldKey="backgroundCardPrompt"
            value={prompts.imageGeneration?.backgroundCardPrompt || ''}
            onChange={(value) => onUpdatePrompt('imageGeneration', 'backgroundCardPrompt', value)}
            placeholder="Enter prompt template (use {userSearchTerm} as placeholder)"
            helperText="Template variable: {userSearchTerm} will be replaced with the user's search term"
            isHistoryActive={isFieldHistoryActive('imageGeneration', 'backgroundCardPrompt')}
            onToggleHistory={() => onToggleFieldHistory('imageGeneration', 'backgroundCardPrompt', 'Background Card Prompt')}
            historyData={fieldHistoryView?.section === 'imageGeneration' && fieldHistoryView?.key === 'backgroundCardPrompt' ? getFieldHistory('imageGeneration', 'backgroundCardPrompt') : null}
            loadingHistory={loadingHistory}
            onCloseHistory={onCloseHistory}
            onRestore={(value) => onRestoreField('imageGeneration', 'backgroundCardPrompt', value)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Vision Generation Section Component
 */
export function VisionGenerationSection({ 
  prompts, 
  expanded, 
  onToggle, 
  onUpdatePrompt,
  fieldHistoryView,
  onToggleFieldHistory,
  getFieldHistory,
  loadingHistory,
  onCloseHistory,
  onRestoreField
}) {
  const isFieldHistoryActive = (section, key) => 
    fieldHistoryView?.section === section && fieldHistoryView?.key === key;

  const fields = [
    { key: 'generateSystemPrompt', label: 'Generate Vision - System Prompt', height: 'h-32', helperText: "Template variables: {maxWords} will be replaced with the word limit" },
    { key: 'generateUserPrompt', label: 'Generate Vision - User Prompt', height: 'h-40', helperText: "Template variables: {userInput} and {dreamContext} will be replaced with actual values" },
    { key: 'polishSystemPrompt', label: 'Polish Vision - System Prompt', height: 'h-32' },
    { key: 'polishUserPrompt', label: 'Polish Vision - User Prompt', height: 'h-40' }
  ];

  return (
    <div className="bg-white rounded-lg border border-professional-gray-200 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-professional-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-netsurit-coral" />
          <h3 className="text-lg font-semibold text-professional-gray-900">Vision Statement Generation</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-professional-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-professional-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-professional-gray-200">
          {fields.map(field => (
            <PromptField
              key={field.key}
              label={field.label}
              section="visionGeneration"
              fieldKey={field.key}
              value={prompts.visionGeneration?.[field.key] || ''}
              onChange={(value) => onUpdatePrompt('visionGeneration', field.key, value)}
              height={field.height}
              helperText={field.helperText}
              isHistoryActive={isFieldHistoryActive('visionGeneration', field.key)}
              onToggleHistory={() => onToggleFieldHistory('visionGeneration', field.key, field.label)}
              historyData={fieldHistoryView?.section === 'visionGeneration' && fieldHistoryView?.key === field.key ? getFieldHistory('visionGeneration', field.key) : null}
              loadingHistory={loadingHistory}
              onCloseHistory={onCloseHistory}
              onRestore={(value) => onRestoreField('visionGeneration', field.key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

/**
 * Individual Prompt Field Component
 */
function PromptField({
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

