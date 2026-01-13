// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import promptService from '../../services/promptService';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../components/ConfirmModal';
import { useFieldHistory } from './PromptFieldHistory';
import GlobalHistoryPanel from './GlobalHistoryPanel';
import { ImageGenerationSection, VisionGenerationSection, StyleModifiersSection, AILimitsSection } from './PromptFields';

/**
 * Prompt Editor Section Component
 * Allows administrators to edit AI prompts used for image and text generation
 */
export default function PromptEditorSection() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [prompts, setPrompts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);
  
  // Per-field history state
  const [fieldHistoryView, setFieldHistoryView] = useState(null); // { section, key, label }
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    imageGeneration: false,
    visionGeneration: false,
    styleModifiers: false,
    aiLimits: false
  });

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await promptService.getPrompts();
      
      if (result.success) {
        setPrompts(result.data);
        setLastSaved(result.data.lastModified ? new Date(result.data.lastModified) : null);
        setHasChanges(false);
      } else {
        setError(result.error || 'Failed to load prompts');
      }
    } catch (err) {
      setError(err.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prompts || !hasChanges) return;

    try {
      setSaving(true);
      const result = await promptService.savePrompts(prompts, user?.email || 'unknown');
      
      if (result.success) {
        setPrompts(result.data);
        setLastSaved(new Date());
        setHasChanges(false);
        showToast('Prompts saved successfully', 'success');
      } else {
        // Extract error message from error object
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || result.error?.code || 'Failed to save prompts');
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save prompts', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset Prompts',
      message: 'Are you sure you want to reset all prompts to defaults? This will discard all unsaved changes.',
      type: 'warning',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    await loadPrompts();
  };

  const updatePrompt = (section, key, value) => {
    setPrompts(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateStyleModifier = (styleId, field, value) => {
    setPrompts(prev => ({
      ...prev,
      styleModifiers: {
        ...prev.styleModifiers,
        [styleId]: {
          ...prev.styleModifiers[styleId],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const updateAILimit = (section, field, value) => {
    setPrompts(prev => ({
      ...prev,
      aiLimits: {
        ...prev.aiLimits,
        [section]: {
          ...(prev.aiLimits?.[section] || {}),
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Load history when history panel is opened
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const result = await promptService.getPromptHistory(50);
      
      if (result.success) {
        setHistory(result.data || []);
      } else {
        showToast(result.error || 'Failed to load history', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to load history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);
    if (newShowHistory && history.length === 0) {
      loadHistory();
    }
    setPreviewVersion(null);
  };

  const handleRestore = async (version) => {
    const confirmed = await confirm({
      title: 'Restore Version',
      message: `Are you sure you want to restore to version from ${new Date(version.timestamp).toLocaleString()}? Current prompts will be saved to history before restoring.`,
      type: 'warning',
      confirmText: 'Restore',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      setRestoring(true);
      const result = await promptService.restorePrompt(version.version, user?.email || 'unknown');
      
      if (result.success) {
        setPrompts(result.data.prompts);
        setLastSaved(new Date());
        setHasChanges(false);
        setPreviewVersion(null);
        showToast(`Restored prompts from ${new Date(version.timestamp).toLocaleString()}`, 'success');
        // Refresh history to include the new snapshot
        loadHistory();
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : (result.error?.message || 'Failed to restore prompts');
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to restore prompts', 'error');
    } finally {
      setRestoring(false);
    }
  };

  // Use field history hook
  const { getFieldHistory, getStyleModifierHistory } = useFieldHistory(history, loadHistory);

  // Toggle field history view
  const toggleFieldHistory = async (section, key, label) => {
    if (fieldHistoryView?.section === section && fieldHistoryView?.key === key) {
      setFieldHistoryView(null);
    } else {
      setFieldHistoryView({ section, key, label });
      if (history.length === 0) await loadHistory();
    }
  };

  // Restore a single field from history
  const restoreFieldValue = (section, key, value) => {
    updatePrompt(section, key, value);
    setFieldHistoryView(null);
    showToast('Field value restored. Remember to save changes.', 'success');
  };

  // Restore a style modifier value
  const restoreStyleModifierValue = (styleId, value) => {
    updateStyleModifier(styleId, 'modifier', value);
    setFieldHistoryView(null);
    showToast('Style modifier restored. Remember to save changes.', 'success');
  };


  // Early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // Early return for error state
  if (error && !prompts) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Prompts</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadPrompts}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!prompts) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="prompt-editor-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-netsurit-red" />
          <div>
            <h2 className="text-2xl font-bold text-professional-gray-900">AI Prompts Configuration</h2>
            <p className="text-sm text-professional-gray-600">
              Edit prompts used for generating images and text in DreamSpace
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && !showHistory && (
            <span className="text-sm text-netsurit-orange flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </span>
          )}
          {lastSaved && !hasChanges && !showHistory && (
            <span className="text-sm text-professional-gray-500 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Saved {lastSaved.toLocaleString()}
            </span>
          )}
          <button
            onClick={toggleHistory}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showHistory 
                ? 'bg-netsurit-coral text-white border-netsurit-coral hover:bg-netsurit-red' 
                : 'bg-white border-professional-gray-300 text-professional-gray-700 hover:bg-professional-gray-50'
            }`}
          >
            {showHistory ? (
              <>
                <ArrowLeft className="h-4 w-4" />
                Back to Editor
              </>
            ) : (
              <>
                <History className="h-4 w-4" />
                History
              </>
            )}
          </button>
          {!showHistory && (
            <>
              <button
                onClick={handleReset}
                disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-professional-gray-300 text-professional-gray-700 rounded-lg hover:bg-professional-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <GlobalHistoryPanel
          history={history}
          loadingHistory={loadingHistory}
          restoring={restoring}
          previewVersion={previewVersion}
          onRefresh={loadHistory}
          onPreview={setPreviewVersion}
          onRestore={handleRestore}
        />
      )}

      {/* Image Generation Section */}
      {!showHistory && (
        <ImageGenerationSection
          prompts={prompts}
          expanded={expandedSections.imageGeneration}
          onToggle={() => toggleSection('imageGeneration')}
          onUpdatePrompt={updatePrompt}
          fieldHistoryView={fieldHistoryView}
          onToggleFieldHistory={toggleFieldHistory}
          getFieldHistory={getFieldHistory}
          loadingHistory={loadingHistory}
          onCloseHistory={() => setFieldHistoryView(null)}
          onRestoreField={restoreFieldValue}
        />
      )}

      {/* Vision Generation Section */}
      {!showHistory && (
        <VisionGenerationSection
          prompts={prompts}
          expanded={expandedSections.visionGeneration}
          onToggle={() => toggleSection('visionGeneration')}
          onUpdatePrompt={updatePrompt}
          fieldHistoryView={fieldHistoryView}
          onToggleFieldHistory={toggleFieldHistory}
          getFieldHistory={getFieldHistory}
          loadingHistory={loadingHistory}
          onCloseHistory={() => setFieldHistoryView(null)}
          onRestoreField={restoreFieldValue}
        />
      )}

      {/* Style Modifiers Section */}
      {!showHistory && (
        <StyleModifiersSection
          prompts={prompts}
          expanded={expandedSections.styleModifiers}
          onToggle={() => toggleSection('styleModifiers')}
          onUpdateStyleModifier={updateStyleModifier}
          fieldHistoryView={fieldHistoryView}
          onToggleFieldHistory={toggleFieldHistory}
          getStyleModifierHistory={getStyleModifierHistory}
          loadingHistory={loadingHistory}
          onCloseHistory={() => setFieldHistoryView(null)}
          onRestoreStyleModifier={restoreStyleModifierValue}
        />
      )}

      {/* AI Usage Limits Section */}
      {!showHistory && (
        <AILimitsSection
          prompts={prompts}
          expanded={expandedSections.aiLimits}
          onToggle={() => toggleSection('aiLimits')}
          onUpdateLimits={updateAILimit}
        />
      )}

      {/* Footer Info */}
      {!showHistory && prompts.modifiedBy && (
        <div className="text-sm text-professional-gray-500 text-center">
          Last modified by {prompts.modifiedBy} on {prompts.lastModified ? new Date(prompts.lastModified).toLocaleString() : 'unknown'}
        </div>
      )}
    </div>
  );
}

