// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Save, X, Upload, Search, Image, Repeat, Calendar, Target } from 'lucide-react';
import HelpTooltip from '../../components/HelpTooltip';

/**
 * Presentation component for dream creation and editing form
 * Handles all form fields including image upload, basic info, first goal, and visibility
 */
function DreamForm({ 
  formData, 
  setFormData, 
  onSave, 
  onCancel, 
  onImageUpload, 
  onOpenStockPhotoSearch, 
  dreamCategories, 
  isEditing, 
  inputRef, 
  uploadingImage 
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="dream-form">
      {/* Image Upload */}
      <div className="space-y-3">
        <div className="relative">
          {uploadingImage ? (
            <div 
              className="w-full h-32 bg-professional-gray-100 rounded-lg flex flex-col items-center justify-center"
              role="status"
              aria-live="polite"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-netsurit-red mb-2" aria-hidden="true"></div>
              <p className="text-sm text-professional-gray-600">Uploading image...</p>
            </div>
          ) : formData.image ? (
            <img
              src={formData.image}
              alt="Dream preview"
              className="w-full h-32 object-cover rounded-lg"
              data-testid="dream-image-preview"
            />
          ) : (
            <div className="w-full h-32 bg-professional-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Image className="w-8 h-8 text-professional-gray-400 mb-2" aria-hidden="true" />
              <p className="text-sm text-professional-gray-500">No image selected</p>
            </div>
          )}
          
          {formData.image && !uploadingImage && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, image: '' })}
              title="Remove image"
              aria-label="Remove image"
              data-testid="remove-image-button"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-netsurit-red"
            >
              <X className="w-4 h-4 text-professional-gray-700" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Image Upload Options */}
        <div className="grid grid-cols-2 gap-2">
          <label className={`btn-secondary cursor-pointer flex items-center justify-center space-x-2 py-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Upload File</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              disabled={uploadingImage}
              aria-label="Upload image file"
              data-testid="upload-image-input"
            />
          </label>
          
          <button
            type="button"
            onClick={handleStockPhotoSearch}
            disabled={uploadingImage}
            aria-label="Search stock photos"
            data-testid="stock-photo-button"
            className={`btn-secondary flex items-center justify-center space-x-2 py-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Stock Photos</span>
          </button>
        </div>
      </div>

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
        <div 
          className="border-2 border-dashed border-professional-gray-300 rounded-xl p-4 space-y-3 bg-professional-gray-50/50"
          role="region"
          aria-label="First goal setup"
        >
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableFirstGoal"
              checked={formData.firstGoal.enabled}
              onChange={(e) => setFormData({ 
                ...formData, 
                firstGoal: { ...formData.firstGoal, enabled: e.target.checked }
              })}
              className="w-4 h-4 text-netsurit-red border-professional-gray-300 rounded focus:ring-netsurit-red"
              data-testid="enable-first-goal-checkbox"
            />
            <label htmlFor="enableFirstGoal" className="text-sm font-medium text-professional-gray-700 cursor-pointer">
              Add first goal with consistency tracking
            </label>
            <HelpTooltip 
              title="First Goal"
              content="Set up a consistency goal to track daily, weekly, or monthly progress. Perfect for building habits like 'Exercise 3x per week' or 'Read daily'."
            />
          </div>

          {formData.firstGoal.enabled && (
            <div className="space-y-3 pt-2">
              {/* Goal Title */}
              <input
                type="text"
                placeholder={`Goal title (e.g., "${formData.title || 'Exercise 3x per week'}")`}
                value={formData.firstGoal.title}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  firstGoal: { ...formData.firstGoal, title: e.target.value }
                })}
                className="input-field text-sm"
                aria-label="Goal title"
                data-testid="goal-title-input"
              />

              {/* Consistency Chooser */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-professional-gray-600">How often?</label>
                <div 
                  className="grid grid-cols-3 gap-2"
                  role="group"
                  aria-label="Goal frequency"
                >
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      firstGoal: { 
                        ...formData.firstGoal, 
                        consistency: 'weekly',
                        frequency: formData.firstGoal.consistency === 'weekly' ? formData.firstGoal.frequency : 1
                      }
                    })}
                    aria-pressed={formData.firstGoal.consistency === 'weekly'}
                    data-testid="weekly-consistency-button"
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      formData.firstGoal.consistency === 'weekly'
                        ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                        : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                    }`}
                  >
                    <Repeat className="w-4 h-4 mb-1" aria-hidden="true" />
                    <span>Weekly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      firstGoal: { 
                        ...formData.firstGoal, 
                        consistency: 'monthly',
                        frequency: formData.firstGoal.consistency === 'monthly' ? formData.firstGoal.frequency : 2
                      }
                    })}
                    aria-pressed={formData.firstGoal.consistency === 'monthly'}
                    data-testid="monthly-consistency-button"
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      formData.firstGoal.consistency === 'monthly'
                        ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                        : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mb-1" aria-hidden="true" />
                    <span>Monthly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      firstGoal: { ...formData.firstGoal, consistency: 'deadline' }
                    })}
                    aria-pressed={formData.firstGoal.consistency === 'deadline'}
                    data-testid="deadline-consistency-button"
                    className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      formData.firstGoal.consistency === 'deadline'
                        ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                        : 'bg-white text-professional-gray-700 hover:bg-professional-gray-100 hover:shadow-sm border border-professional-gray-300'
                    }`}
                  >
                    <Target className="w-4 h-4 mb-1" aria-hidden="true" />
                    <span>Deadline</span>
                  </button>
                </div>
              </div>

              {/* Target Duration or Date */}
              {formData.firstGoal.consistency === 'deadline' ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-professional-gray-600">
                    Target Date <span className="text-netsurit-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.firstGoal.targetDate || ''}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        firstGoal: { 
                          ...formData.firstGoal, 
                          targetDate: e.target.value
                        }
                      });
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field text-sm"
                    aria-label="Target date"
                    data-testid="goal-deadline-input"
                  />
                  <p className="text-xs text-professional-gray-500">
                    Complete this goal by a specific date
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-professional-gray-600">
                    {formData.firstGoal.consistency === 'monthly' 
                      ? 'Track for how many months?' 
                      : 'Track for how many weeks?'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.firstGoal.consistency === 'monthly' ? 24 : 52}
                    value={formData.firstGoal.consistency === 'monthly' 
                      ? formData.firstGoal.targetMonths 
                      : formData.firstGoal.targetWeeks}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || (formData.firstGoal.consistency === 'monthly' ? 6 : 12);
                      setFormData({ 
                        ...formData, 
                        firstGoal: { 
                          ...formData.firstGoal, 
                          ...(formData.firstGoal.consistency === 'monthly' 
                            ? { targetMonths: value }
                            : { targetWeeks: value })
                        }
                      });
                    }}
                    className="input-field text-sm w-24"
                    aria-label={`Target ${formData.firstGoal.consistency === 'monthly' ? 'months' : 'weeks'}`}
                    data-testid="goal-duration-input"
                  />
                  <p className="text-xs text-professional-gray-500">
                    {formData.firstGoal.consistency === 'monthly' 
                      ? 'Default: 6 months' 
                      : 'Default: 12 weeks'}
                  </p>
                  
                  {/* Weekly frequency input */}
                  {formData.firstGoal.consistency === 'weekly' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-professional-gray-600">
                        Completions per week <span className="text-netsurit-red">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={formData.firstGoal.frequency || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setFormData({ 
                            ...formData, 
                            firstGoal: { 
                              ...formData.firstGoal, 
                              frequency: Math.max(1, Math.min(7, value))
                            }
                          });
                        }}
                        className="input-field text-sm w-24"
                        aria-label="Completions per week"
                        data-testid="goal-frequency-input-weekly"
                        placeholder="e.g., 3"
                      />
                      <p className="text-xs text-professional-gray-500 mt-1">
                        How many times you want to complete this goal each week
                      </p>
                    </div>
                  )}
                  
                  {/* Monthly frequency input */}
                  {formData.firstGoal.consistency === 'monthly' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-professional-gray-600">
                        Completions per month <span className="text-netsurit-red">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.firstGoal.frequency || 2}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setFormData({ 
                            ...formData, 
                            firstGoal: { 
                              ...formData.firstGoal, 
                              frequency: Math.max(1, Math.min(31, value))
                            }
                          });
                        }}
                        className="input-field text-sm w-24"
                        aria-label="Completions per month"
                        data-testid="goal-frequency-input-monthly"
                        placeholder="e.g., 2"
                      />
                      <p className="text-xs text-professional-gray-500 mt-1">
                        How many times you want to complete this goal each month
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
          aria-label={isEditing ? 'Update dream' : 'Save dream'}
          data-testid="save-dream-button"
          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{isEditing ? 'Update' : 'Save'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          data-testid="cancel-button"
          className="inline-flex items-center justify-center px-4 py-3 bg-white text-professional-gray-700 border border-professional-gray-300 rounded-xl hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

DreamForm.propTypes = {
  /** Form data object with all form fields */
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    isPublic: PropTypes.bool.isRequired,
    image: PropTypes.string,
    firstGoal: PropTypes.shape({
      enabled: PropTypes.bool.isRequired,
      title: PropTypes.string.isRequired,
      consistency: PropTypes.string.isRequired,
      targetWeeks: PropTypes.number.isRequired,
      targetMonths: PropTypes.number.isRequired,
      targetDate: PropTypes.string,
    }).isRequired,
  }).isRequired,
  /** Function to update form data */
  setFormData: PropTypes.func.isRequired,
  /** Callback when form is saved */
  onSave: PropTypes.func.isRequired,
  /** Callback when form is cancelled */
  onCancel: PropTypes.func.isRequired,
  /** Callback when image is uploaded */
  onImageUpload: PropTypes.func.isRequired,
  /** Callback to open stock photo search */
  onOpenStockPhotoSearch: PropTypes.func.isRequired,
  /** Array of available dream categories */
  dreamCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Whether in editing mode (vs creating) */
  isEditing: PropTypes.bool.isRequired,
  /** Ref for title input focus */
  inputRef: PropTypes.object,
  /** Whether image is currently uploading */
  uploadingImage: PropTypes.bool.isRequired,
};

// Memoize to prevent unnecessary re-renders
export default memo(DreamForm);





