// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { 
  Image as ImageIcon, 
  FileText, 
  Palette, 
  ChevronDown, 
  ChevronUp,
  History,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { HistoryButton, FieldHistoryPanel, useFieldHistory } from './PromptFieldHistory';
import { ImageTestPanel, VisionTestPanel } from './PromptTestPanel';

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
          <ImageTestPanel 
            promptType="dream" 
            prompts={prompts}
            styleModifiers={prompts.styleModifiers}
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
          <ImageTestPanel 
            promptType="background_card" 
            prompts={prompts}
            styleModifiers={prompts.styleModifiers}
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
          
          {/* Test panels for generate and polish */}
          <div className="pt-2 border-t border-professional-gray-200 space-y-4">
            <VisionTestPanel promptType="generate" prompts={prompts} />
            <VisionTestPanel promptType="polish" prompts={prompts} />
          </div>
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

/**
 * AI Limits Section Component
 * Allows administrators to configure daily usage limits for AI features
 */
export function AILimitsSection({ 
  prompts, 
  expanded, 
  onToggle, 
  onUpdateLimits
}) {
  const aiLimits = prompts.aiLimits || {
    imageGeneration: { dailyLimitPerUser: 25, dailyLimitTotal: 500, perMinuteLimit: 10, costPerRequest: 0.08, modelName: 'DALL-E 3 HD' },
    visionGeneration: { dailyLimitPerUser: 100, dailyLimitTotal: 2000, perMinuteLimit: 20, costPerRequest: 0.00015, modelName: 'GPT-4o-mini' }
  };

  const updateLimit = (section, field, value) => {
    // Handle numeric fields
    if (['dailyLimitPerUser', 'dailyLimitTotal', 'perMinuteLimit'].includes(field)) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) return;
      onUpdateLimits(section, field, numValue);
    } 
    // Handle cost field (float)
    else if (field === 'costPerRequest') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
      onUpdateLimits(section, field, numValue);
    }
    // Handle string fields
    else {
      onUpdateLimits(section, field, value);
    }
  };

  // Calculate estimated costs using configurable prices
  const imagePrice = aiLimits.imageGeneration?.costPerRequest || 0.08;
  const visionPrice = aiLimits.visionGeneration?.costPerRequest || 0.00015;
  const estimatedImageCost = (aiLimits.imageGeneration?.dailyLimitTotal || 500) * imagePrice;
  const estimatedVisionCost = (aiLimits.visionGeneration?.dailyLimitTotal || 2000) * visionPrice;

  return (
    <div className="bg-white rounded-lg border border-professional-gray-200 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-professional-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <Gauge className="h-5 w-5 text-netsurit-red" />
          <h3 className="text-lg font-semibold text-professional-gray-900">AI Usage Limits</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-professional-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-professional-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-6 border-t border-professional-gray-200">
          {/* Cost estimate banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Daily Cost Estimate</h4>
                <div className="text-sm text-amber-700 mt-1 space-y-1">
                  <p>Max daily cost for image generation: <strong>${estimatedImageCost.toFixed(2)}</strong> ({aiLimits.imageGeneration?.dailyLimitTotal || 500} images)</p>
                  <p>Max daily cost for text generation: <strong>${estimatedVisionCost.toFixed(2)}</strong> ({aiLimits.visionGeneration?.dailyLimitTotal || 2000} requests)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Generation Limits */}
          <div className="border border-professional-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-professional-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Generation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={aiLimits.imageGeneration?.modelName || 'DALL-E 3 HD'}
                  onChange={(e) => updateLimit('imageGeneration', 'modelName', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Display name for cost tracking</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Cost Per Request ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={aiLimits.imageGeneration?.costPerRequest || 0.08}
                  onChange={(e) => updateLimit('imageGeneration', 'costPerRequest', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">USD cost per image generation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Per User Daily Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={aiLimits.imageGeneration?.dailyLimitPerUser || 25}
                  onChange={(e) => updateLimit('imageGeneration', 'dailyLimitPerUser', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Max images per user per day</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Organization Daily Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={aiLimits.imageGeneration?.dailyLimitTotal || 500}
                  onChange={(e) => updateLimit('imageGeneration', 'dailyLimitTotal', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Max images org-wide per day</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Per Minute Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={aiLimits.imageGeneration?.perMinuteLimit || 10}
                  onChange={(e) => updateLimit('imageGeneration', 'perMinuteLimit', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Burst protection per user</p>
              </div>
            </div>
          </div>

          {/* Vision Generation Limits */}
          <div className="border border-professional-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-professional-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vision Statement Generation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={aiLimits.visionGeneration?.modelName || 'GPT-4o-mini'}
                  onChange={(e) => updateLimit('visionGeneration', 'modelName', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Display name for cost tracking</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Cost Per Request ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.00001"
                  value={aiLimits.visionGeneration?.costPerRequest || 0.00015}
                  onChange={(e) => updateLimit('visionGeneration', 'costPerRequest', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">USD cost per text generation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Per User Daily Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={aiLimits.visionGeneration?.dailyLimitPerUser || 100}
                  onChange={(e) => updateLimit('visionGeneration', 'dailyLimitPerUser', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Max requests per user per day</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Organization Daily Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={aiLimits.visionGeneration?.dailyLimitTotal || 2000}
                  onChange={(e) => updateLimit('visionGeneration', 'dailyLimitTotal', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Max requests org-wide per day</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Per Minute Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={aiLimits.visionGeneration?.perMinuteLimit || 20}
                  onChange={(e) => updateLimit('visionGeneration', 'perMinuteLimit', e.target.value)}
                  className="w-full p-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                />
                <p className="text-xs text-professional-gray-500 mt-1">Burst protection per user</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-professional-gray-500">
            Note: Daily limits reset at midnight UTC. Changes take effect immediately after saving.
          </p>
        </div>
      )}
    </div>
  );
}

