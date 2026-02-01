import React, { useState } from 'react';
import { Sparkles, X, Loader2, Image, RefreshCw, Check, ChevronDown } from 'lucide-react';
import { dalleService, STYLE_MODIFIERS, IMAGE_TYPES } from '../services/dalleService';


/**
 * AI Image Generator Modal
 * @param {function} onSelectImage - Callback when image is selected
 * @param {function} onClose - Callback to close modal
 * @param {string} imageType - Type of image: 'dream' or 'background_card' (default: 'dream')
 */
const AIImageGenerator = ({ onSelectImage, onClose, imageType = IMAGE_TYPES.DREAM }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  
  // Get style options for dropdown
  const styleOptions = Object.values(STYLE_MODIFIERS);
  
  // Check if custom style is selected
  const isCustomStyle = selectedStyle === 'custom';

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const result = await dalleService.generate(query.trim(), {
        imageType: imageType,
        styleModifierId: isCustomStyle ? null : (selectedStyle || null),
        customStyle: isCustomStyle ? customStyle.trim() : null
      });
      
      if (result.success) {
        setGeneratedImage(result.data.url);
      } else {
        setError(result.error.message || 'Failed to generate image. Please try again.');
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error('AI image generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGeneratedImage = () => {
    if (generatedImage) {
      onSelectImage(generatedImage);
      onClose();
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-image-generator-title"
      data-testid="ai-image-generator-modal"
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-netsurit-red to-netsurit-coral bg-opacity-10 rounded-lg">
              <Sparkles className="w-6 h-6 text-netsurit-red" aria-hidden="true" />
            </div>
            <div>
              <h2 
                id="ai-image-generator-title"
                className="text-xl font-bold text-gray-900"
              >
                {imageType === IMAGE_TYPES.BACKGROUND_CARD 
                  ? 'Generate Background Image' 
                  : 'Generate Dream Image'}
              </h2>
              <p className="text-sm text-gray-600">
                {imageType === IMAGE_TYPES.BACKGROUND_CARD 
                  ? 'Create a custom background for your profile card' 
                  : 'Create a custom image for your dream'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            data-testid="close-ai-generator-button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Search/Generate Bar */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Description Input */}
            <div className="flex-1 relative">
              <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={imageType === IMAGE_TYPES.BACKGROUND_CARD 
                  ? "Describe your background theme (e.g., mountain sunset, city lights, ocean waves)..."
                  : "Describe your dream image (e.g., running marathon, learning guitar, mountain peak)..."}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                aria-label={imageType === IMAGE_TYPES.BACKGROUND_CARD ? "Background theme description" : "Dream image description"}
                data-testid="ai-image-query-input"
                disabled={loading}
              />
            </div>
            
            {/* Style Modifier Dropdown */}
            <div className="relative">
              <label 
                htmlFor="style-modifier" 
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Art Style (optional)
              </label>
              <div className="relative">
                <select
                  id="style-modifier"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={loading}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-gray-700 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  aria-label="Select art style"
                  data-testid="style-modifier-select"
                >
                  <option value="">No style preference</option>
                  {styleOptions.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.label}
                    </option>
                  ))}
                  <option value="custom">✨ Custom Style...</option>
                </select>
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
                  aria-hidden="true" 
                />
              </div>
              
              {/* Custom Style Input */}
              {isCustomStyle ? (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="e.g., watercolor painting, neon cyberpunk, vintage oil painting..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-gray-700"
                    aria-label="Enter custom art style"
                    data-testid="custom-style-input"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe your preferred art style, medium, or visual aesthetic
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedStyle 
                    ? styleOptions.find(s => s.id === selectedStyle)?.modifier || ''
                    : 'Choose a style to influence the visual aesthetic'}
                </p>
              )}
            </div>
            
            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              aria-label="Generate image"
              data-testid="generate-ai-image-button"
              className="w-full btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Image generation is limited to 5 per day
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div 
              className="flex flex-col items-center justify-center py-12"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="w-12 h-12 text-netsurit-red animate-spin mb-4" aria-hidden="true" />
              <p className="text-gray-600 font-medium">Generating your dream image...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-20 seconds</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <X className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
                <p className="font-medium">{error}</p>
              </div>
              <button
                onClick={() => handleGenerate()}
                className="btn-secondary"
                data-testid="retry-generate-button"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && !generatedImage && !query && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium">
                {imageType === IMAGE_TYPES.BACKGROUND_CARD 
                  ? 'Describe your background theme' 
                  : 'Describe your dream image'}
              </p>
              <p className="text-sm mt-2">Enter a description above and click "Generate Image" to create a custom image</p>
              <p className="text-xs mt-3 text-gray-400">
                {imageType === IMAGE_TYPES.BACKGROUND_CARD 
                  ? 'Examples: "mountain sunset", "city lights at night", "peaceful ocean waves"'
                  : 'Examples: "running marathon", "learning guitar", "mountain peak adventure"'}
              </p>
            </div>
          )}

          {!loading && !error && !generatedImage && query && (
            <div className="text-center py-12 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p>Click "Generate Image" to create your custom image</p>
            </div>
          )}

          {!loading && !error && generatedImage && (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={generatedImage}
                  alt="Generated dream image"
                  className="w-full h-auto rounded-xl"
                  data-testid="generated-ai-image"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSelectGeneratedImage}
                  aria-label="Use this image"
                  data-testid="use-generated-image-button"
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" aria-hidden="true" />
                  <span>Use This Image</span>
                </button>
                <button
                  onClick={handleGenerateAgain}
                  aria-label="Generate again"
                  data-testid="generate-again-button"
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  <span>Generate Again</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Powered by Netsurit
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIImageGenerator;
