import { 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { PromptField } from './PromptField';
import { ImageTestPanel } from '../PromptTestPanel';

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