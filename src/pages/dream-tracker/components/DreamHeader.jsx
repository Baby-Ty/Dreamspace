// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { X, Save, Edit3, Check, Bookmark } from 'lucide-react';

/**
 * DreamHeader - Header section of dream tracker modal
 * Includes image thumbnail, title editing, progress slider, and action buttons
 * @component
 */
export function DreamHeader({
  localDream,
  isEditingTitle,
  editedTitle,
  onEditTitle,
  onUpdateTitle,
  onSetEditedTitle,
  selfProgressStage,
  onStageChange,
  hasChanges,
  onSave,
  onClose,
  onExpandImage,
  canEdit,
  isCoachViewing,
  teamMember,
  SELF_PROGRESS_STAGES
}) {
  const activeStage = SELF_PROGRESS_STAGES[selfProgressStage] || SELF_PROGRESS_STAGES[0];

  return (
    <div className="p-3 sm:p-4 border-b border-professional-gray-200 bg-white flex-shrink-0">
      <div className="flex items-start gap-4">
        {localDream.image && (
          <button
            onClick={onExpandImage}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0 hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 group relative"
            aria-label="View dream image full size"
            data-testid="dream-image-thumbnail"
          >
            <img 
              src={localDream.image} 
              alt={localDream.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                View
              </span>
            </div>
          </button>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              {isEditingTitle && canEdit ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => onSetEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editedTitle.trim()) {
                          onUpdateTitle(editedTitle);
                          onEditTitle(false);
                        }
                      } else if (e.key === 'Escape') {
                        onSetEditedTitle(localDream.title);
                        onEditTitle(false);
                      }
                    }}
                    className="flex-1 text-xl sm:text-2xl font-bold text-professional-gray-900 border-2 border-netsurit-red rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                    autoFocus
                    data-testid="dream-title-input"
                  />
                  <button
                    onClick={() => {
                      if (editedTitle.trim()) {
                        onUpdateTitle(editedTitle);
                        onEditTitle(false);
                      }
                    }}
                    className="p-1.5 text-netsurit-red hover:bg-netsurit-red hover:text-white rounded-lg transition-all duration-200"
                    aria-label="Save title"
                    data-testid="save-title-button"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      onSetEditedTitle(localDream.title);
                      onEditTitle(false);
                    }}
                    className="p-1.5 text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg transition-all duration-200"
                    aria-label="Cancel editing title"
                    data-testid="cancel-title-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-xl sm:text-2xl font-bold text-professional-gray-900 mb-1">{localDream.title}</h2>
                  {canEdit && (
                    <button
                      onClick={() => {
                        onSetEditedTitle(localDream.title);
                        onEditTitle(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-professional-gray-100 rounded transition-all duration-200"
                      aria-label="Edit dream title"
                      data-testid="edit-title-button"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-professional-gray-600 mb-3">
                {isCoachViewing && teamMember && (
                  <span className="px-2 py-0.5 bg-professional-gray-100 rounded-md text-professional-gray-700 text-xs font-medium">
                    Viewing {teamMember.name}'s Dream
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{localDream.category}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {hasChanges && canEdit && (
                <button
                  onClick={onSave}
                  className="bg-netsurit-red text-white px-3 py-1.5 rounded-lg hover:bg-netsurit-coral transition-all duration-200 flex items-center space-x-1.5 text-sm font-medium"
                  aria-label="Save changes"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1.5 text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 min-w-0">
            <div className="relative py-2" data-testid="dream-progress-self-assessment">
              {/* Track Background */}
              <div className="relative h-10 bg-professional-gray-200 rounded-full shadow-inner border border-professional-gray-300/50 overflow-hidden">
                {/* Filled Progress Track */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange rounded-full transition-all duration-500 ease-out shadow-md"
                  style={{ width: `${((selfProgressStage + 1) * 25)}%` }}
                />
                
                {/* Stage Labels Inside Bar */}
                <div className="absolute inset-0 flex">
                  {SELF_PROGRESS_STAGES.map((stage, index) => {
                    const isPassed = index <= selfProgressStage;
                    const sectionWidth = 100 / SELF_PROGRESS_STAGES.length;
                    
                    return (
                      <button
                        key={`section-${stage.id}`}
                        type="button"
                        onClick={() => canEdit && onStageChange(index)}
                        disabled={!canEdit}
                        className={`flex items-center justify-center transition-colors duration-300 text-xs sm:text-sm font-bold px-2 ${
                          canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                        } ${
                          isPassed 
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' 
                            : 'text-professional-gray-800'
                        }`}
                        style={{ 
                          width: `${sectionWidth}%`,
                          borderRight: index < SELF_PROGRESS_STAGES.length - 1 
                            ? (isPassed ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.1)')
                            : 'none'
                        }}
                        aria-label={stage.label}
                        data-testid={`progress-section-${stage.id}`}
                      >
                        {stage.shortLabel || stage.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Invisible Range Input for Dragging */}
                {canEdit && (
                  <input
                    type="range"
                    min="0"
                    max={SELF_PROGRESS_STAGES.length - 1}
                    step="1"
                    value={selfProgressStage}
                    onChange={(e) => onStageChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    style={{ margin: 0 }}
                    aria-label="Slide to adjust your dream progress stage"
                    role="slider"
                    aria-valuemin="0"
                    aria-valuemax={SELF_PROGRESS_STAGES.length - 1}
                    aria-valuenow={selfProgressStage}
                    aria-valuetext={activeStage.label}
                  />
                )}
              </div>
            </div>
            
            <p className="text-xs text-professional-gray-600 mt-2 line-clamp-1 italic">
              {activeStage.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

DreamHeader.propTypes = {
  localDream: PropTypes.shape({
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    image: PropTypes.string
  }).isRequired,
  isEditingTitle: PropTypes.bool.isRequired,
  editedTitle: PropTypes.string.isRequired,
  onEditTitle: PropTypes.func.isRequired,
  onUpdateTitle: PropTypes.func.isRequired,
  onSetEditedTitle: PropTypes.func.isRequired,
  selfProgressStage: PropTypes.number.isRequired,
  onStageChange: PropTypes.func.isRequired,
  hasChanges: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onExpandImage: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
  isCoachViewing: PropTypes.bool,
  teamMember: PropTypes.shape({
    name: PropTypes.string
  }),
  SELF_PROGRESS_STAGES: PropTypes.array.isRequired
};

export default DreamHeader;
