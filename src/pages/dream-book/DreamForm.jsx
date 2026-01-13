// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Save, X, Loader2 } from 'lucide-react';
import { ImageUploadSection, FirstGoalSetup } from './dream-form';

/**
 * Presentation component for dream creation and editing form - Orchestrator
 * Handles all form fields including image upload, basic info, first goal, and visibility
 */
function DreamForm({ 
  formData, 
  setFormData, 
  onSave, 
  onCancel, 
  onImageUpload, 
  onOpenStockPhotoSearch,
  onOpenAIImageGenerator,
  dreamCategories, 
  isEditing, 
  inputRef, 
  uploadingImage,
  isSaving = false
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim()) {
      onSave();
    }
  };

  const handleStockPhotoSearch = () => {
    onOpenStockPhotoSearch({ formData, setFormData });
  };

  const handleAIImageGenerator = () => {
    onOpenAIImageGenerator({ formData, setFormData });
  };

  const handleFirstGoalChange = (updates) => {
    setFormData({ ...formData, firstGoal: updates });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="dream-form">
      {/* Image Upload */}
      <ImageUploadSection
        image={formData.image}
        uploadingImage={uploadingImage}
        onImageUpload={onImageUpload}
        onRemoveImage={() => setFormData({ ...formData, image: '' })}
        onOpenStockPhotoSearch={handleStockPhotoSearch}
        onOpenAIImageGenerator={handleAIImageGenerator}
      />

      {/* Title */}
      <input
        type="text"
        placeholder="Dream title..."
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="input-field"
        ref={inputRef}
        required
        aria-label="Dream title"
        data-testid="dream-title-input"
      />

      {/* Category */}
      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        className="input-field"
        required
        aria-label="Dream category"
        data-testid="dream-category-select"
      >
        <option value="">Select a category...</option>
        {dreamCategories?.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      {/* Description */}
      <textarea
        placeholder="Describe your dream in detail..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="input-field h-24 resize-none"
        required
        aria-label="Dream description"
        data-testid="dream-description-input"
      />

      {/* Optional First Goal Setup */}
      {!isEditing && (
        <FirstGoalSetup
          firstGoal={formData.firstGoal}
          dreamTitle={formData.title}
          onChange={handleFirstGoalChange}
        />
      )}

      {/* Visibility Toggle */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-professional-gray-700">Visibility:</label>
        <div 
          className="flex items-center space-x-2"
          role="group"
          aria-label="Dream visibility"
        >
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPublic: false })}
            aria-pressed={!formData.isPublic}
            data-testid="private-button"
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              !formData.isPublic 
                ? 'bg-professional-gray-600 text-white' 
                : 'bg-professional-gray-100 text-professional-gray-600 hover:bg-professional-gray-200'
            }`}
          >
            Private
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPublic: true })}
            aria-pressed={formData.isPublic}
            data-testid="public-button"
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              formData.isPublic 
                ? 'bg-netsurit-red text-white' 
                : 'bg-professional-gray-100 text-professional-gray-600 hover:bg-professional-gray-200'
            }`}
          >
            Public
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={isSaving || uploadingImage}
          aria-label={isEditing ? 'Update dream' : 'Save dream'}
          data-testid="save-dream-button"
          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving || uploadingImage ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{uploadingImage ? 'Uploading image...' : (isEditing ? 'Updating...' : 'Saving...')}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{isEditing ? 'Update' : 'Save'}</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving || uploadingImage}
          aria-label="Cancel"
          data-testid="cancel-button"
          className="inline-flex items-center justify-center px-4 py-3 bg-white text-professional-gray-700 border border-professional-gray-300 rounded-xl hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

DreamForm.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    isPublic: PropTypes.bool.isRequired,
    image: PropTypes.string,
    firstGoal: PropTypes.object.isRequired,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
  onOpenStockPhotoSearch: PropTypes.func.isRequired,
  onOpenAIImageGenerator: PropTypes.func.isRequired,
  dreamCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  isEditing: PropTypes.bool.isRequired,
  inputRef: PropTypes.object,
  uploadingImage: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool,
};

export default memo(DreamForm);
