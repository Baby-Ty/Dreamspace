import { 
  FileText, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { PromptField } from './PromptField';
import { VisionTestPanel } from '../PromptTestPanel';

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