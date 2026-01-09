// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Wand2, X, Save, Edit3, Loader2 } from 'lucide-react';
import { gptService } from '../../services/gptService';
import { toErrorMessage } from '../../utils/errorHandling';

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
        // Extract message from error object (result.error is { code, message })
        setError(toErrorMessage(result.error) || 'Failed to generate vision');
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
        // Extract message from error object (result.error is { code, message })
        setError(toErrorMessage(result.error) || 'Failed to polish vision');
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
      {/* Vision Card Display - Sticky Note Style */}
      <div 
        className="h-full flex flex-col cursor-pointer group relative"
        onClick={handleOpenEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleOpenEdit(); }}
        aria-label={hasVision ? 'Edit your year vision' : 'Add your year vision'}
        data-testid="year-vision-card"
      >
        {/* Sticky Note Paper */}
        <div 
          className="relative h-full rounded-sm transition-transform duration-300 group-hover:rotate-0 group-hover:scale-[1.05] shadow-md hover:shadow-xl"
          style={{
            background: 'linear-gradient(to bottom right, #fef9c3 0%, #fef08a 100%)',
            transform: 'rotate(-2deg)',
          }}
        >
          {/* Lined Paper Effect */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm"
            style={{
              backgroundImage: `repeating-linear-gradient(
                transparent,
                transparent 27px,
                rgba(180, 160, 120, 0.25) 27px,
                rgba(180, 160, 120, 0.25) 28px
              )`,
              backgroundPosition: '0 32px',
            }}
          />
          
          {/* Top fold/tape effect */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.4)',
              transform: 'rotate(-1deg)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(1px)',
            }}
          />

          {/* Content Container */}
          <div className="relative z-10 h-full flex flex-col p-4 pt-5">
            
            {/* Handwritten Title */}
            <h2 
              className="text-center text-2xl font-bold mb-2 font-hand tracking-wide"
              style={{ 
                color: '#4a3b22',
                transform: 'rotate(-1deg)',
              }}
            >
              My 2025 Vision
            </h2>

            {/* Content */}
            <div className="flex-1 flex items-start justify-center overflow-hidden pt-1 px-1">
              {hasVision ? (
                <p 
                  className="text-center text-xl font-hand"
                  style={{ 
                    color: '#1f180b',
                    lineHeight: '1.5',
                    textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                  }}
                >
                  {safeVision}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-60">
                  <p 
                    className="text-center text-xl font-hand mb-2"
                    style={{ color: '#5c5030' }}
                  >
                    What's your vision for this year?
                  </p>
                  <p className="text-sm text-[#5c5030] italic font-hand">
                    (Tap to write it down...)
                  </p>
                </div>
              )}
            </div>

            {/* Subtle AI hint */}
            {gptConfigured && (
              <div className="mt-auto pt-1 flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                 <Sparkles className="w-3.5 h-3.5 text-[#8a7a50]" />
              </div>
            )}
          </div>
        </div>
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
                  Share what you want this year to look and feel like
                </label>
                <textarea
                  id="vision-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Your dreams are already added. Just describe the kind of year you want."
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
                  rows={6}
                  data-testid="vision-output"
                />
                <p className="mt-1 text-xs text-professional-gray-400">
                  {editedVision.length > 0 ? `${editedVision.split(/\s+/).filter(Boolean).length} words` : 'Aim for up to 100 words'}
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

