// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Wand2, X, Save, Edit3, Loader2 } from 'lucide-react';
import { gptService } from '../../services/gptService';

/**
 * Year Vision card - displays and allows editing of user's year vision statement
 * Includes AI-powered enhancement using GPT
 */
function YearVisionCard({ vision, dreams = [], onSaveVision }) {
  // CRITICAL: Sanitize vision prop immediately - it might be an error object {code, message}
  const safeVision = (vision && typeof vision === 'string') ? vision : '';
  
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [editedVision, setEditedVision] = useState('');
  const [error, setError] = useState(null);

  const hasVision = safeVision.trim().length > 0;
  
  // AI features available via backend proxy
  const gptConfigured = true;

  // Handle opening the edit modal
  const handleOpenEdit = useCallback(() => {
    setEditedVision(safeVision);
    setUserInput('');
    setError(null);
    setIsEditing(true);
  }, [safeVision]);

  // Handle closing the modal
  const handleClose = useCallback(() => {
    setIsEditing(false);
    setUserInput('');
    setError(null);
  }, []);

  // Generate vision from user input using GPT (via backend)
  const handleGenerate = useCallback(async () => {
    if (!userInput.trim()) {
      setError('Please describe your mindset, goals, and hopes first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await gptService.generateVisionStatement(userInput, dreams);
      
      if (result.success) {
        setEditedVision(result.data.text);
      } else {
        setError(result.error || 'Failed to generate vision');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [userInput, dreams]);

  // Polish existing vision using GPT (via backend)
  const handlePolish = useCallback(async () => {
    if (!editedVision.trim()) {
      setError('Write something first to polish');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await gptService.polishVision(editedVision, dreams);
      
      if (result.success) {
        setEditedVision(result.data.text);
      } else {
        setError(result.error || 'Failed to polish vision');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [editedVision, dreams]);

  // Save the vision
  const handleSave = useCallback(() => {
    if (onSaveVision && editedVision.trim()) {
      onSaveVision(editedVision.trim());
    }
    setIsEditing(false);
  }, [editedVision, onSaveVision]);

  return (
    <>
      {/* Vision Card Display */}
      <div 
        className="h-full flex flex-col cursor-pointer group"
        onClick={handleOpenEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleOpenEdit(); }}
        aria-label={hasVision ? 'Edit your year vision' : 'Add your year vision'}
        data-testid="year-vision-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-netsurit-coral" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-professional-gray-800">
              My Year Vision
            </h2>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenEdit(); }}
            className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-professional-gray-100 transition-all"
            aria-label="Edit vision"
          >
            <Edit3 className="w-4 h-4 text-professional-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pb-5 flex items-center justify-center">
          {hasVision ? (
            <blockquote className="text-center">
              <p className="text-professional-gray-700 italic leading-relaxed text-sm">
                "{safeVision}"
              </p>
            </blockquote>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-netsurit-red/10 to-netsurit-coral/10 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-netsurit-coral" aria-hidden="true" />
              </div>
              <p className="text-professional-gray-600 text-sm font-medium mb-1">
                Define your year
              </p>
              <p className="text-professional-gray-400 text-xs">
                Click to add your vision statement
              </p>
            </div>
          )}
        </div>

        {/* AI badge */}
        {gptConfigured && (
          <div className="px-5 pb-4">
            <div className="flex items-center justify-center gap-1 text-xs text-professional-gray-400">
              <Wand2 className="w-3 h-3" />
              <span>AI-powered</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vision-modal-title"
          data-testid="vision-edit-modal"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-professional-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-netsurit-coral" />
                <h3 id="vision-modal-title" className="text-xl font-semibold text-professional-gray-900">
                  {hasVision ? 'Edit Your Vision' : 'Create Your Vision'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5">
              {/* User Input Section */}
              <div>
                <label 
                  htmlFor="vision-input"
                  className="block text-sm font-medium text-professional-gray-700 mb-2"
                >
                  Describe your mindset, goals, and hopes for the year ahead
                </label>
                <textarea
                  id="vision-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="What do you want to achieve? How do you want to feel? What matters most to you this year?..."
                  className="w-full px-4 py-3 border-2 border-professional-gray-200 rounded-xl focus:border-netsurit-coral focus:outline-none resize-none transition-colors"
                  rows={4}
                  data-testid="vision-user-input"
                />
                {gptConfigured && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !userInput.trim()}
                    className="mt-3 w-full py-2.5 px-4 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="generate-vision-button"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Crafting your vision...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Generate Vision with AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-professional-gray-200" />
                <span className="text-xs text-professional-gray-400 uppercase tracking-wide">or write directly</span>
                <div className="flex-1 h-px bg-professional-gray-200" />
              </div>

              {/* Vision Preview/Edit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="vision-output"
                    className="block text-sm font-medium text-professional-gray-700"
                  >
                    Your Vision Statement
                  </label>
                  {gptConfigured && editedVision.trim() && (
                    <button
                      onClick={handlePolish}
                      disabled={isGenerating}
                      className="text-xs text-netsurit-coral hover:text-netsurit-red flex items-center gap-1 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Polish with AI</span>
                    </button>
                  )}
                </div>
                <textarea
                  id="vision-output"
                  value={editedVision}
                  onChange={(e) => setEditedVision(e.target.value)}
                  placeholder="Your inspiring vision statement will appear here..."
                  className="w-full px-4 py-3 border-2 border-professional-gray-200 rounded-xl focus:border-netsurit-coral focus:outline-none resize-none transition-colors bg-professional-gray-50"
                  rows={3}
                  data-testid="vision-output"
                />
                <p className="mt-1 text-xs text-professional-gray-400">
                  {editedVision.length > 0 ? `${editedVision.split(/\s+/).filter(Boolean).length} words` : 'Aim for 30-60 words'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-professional-gray-200 bg-professional-gray-50 rounded-b-2xl">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 text-professional-gray-700 hover:bg-professional-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editedVision.trim()}
                className="px-5 py-2.5 bg-netsurit-red text-white rounded-xl font-medium flex items-center gap-2 hover:bg-netsurit-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="save-vision-button"
              >
                <Save className="w-4 h-4" />
                <span>Save Vision</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

YearVisionCard.propTypes = {
  /** Current vision statement */
  vision: PropTypes.string,
  /** Array of user's dreams for context */
  dreams: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    category: PropTypes.string
  })),
  /** Callback when vision is saved */
  onSaveVision: PropTypes.func.isRequired
};

export default memo(YearVisionCard);

