// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  Bookmark, 
  Save,
  Edit3,
  Check
} from 'lucide-react';
import { useDreamTracker } from '../../hooks/useDreamTracker';
import { OverviewTab } from './OverviewTab';
import { GoalsTab } from './GoalsTab';
import { CoachNotesTab } from './CoachNotesTab';
import { HistoryTab } from './HistoryTab';

/**
 * DreamTrackerLayout - Main orchestration component for dream tracking modal
 * Uses useDreamTracker hook for state and renders tabs
 * @component
 */
export function DreamTrackerLayout({ dream, onClose, onUpdate, isCoachViewing, teamMember }) {
  const SELF_PROGRESS_STAGES = [
    {
      id: 0,
      label: 'Just Started',
      description: 'You\'ve begun your journey. This dream is taking shape and you\'re ready to move forward.',
      shortLabel: 'Just Started',
    },
    {
      id: 1,
      label: 'In Motion',
      description: 'You\'re actively working on this dream. Progress is happening and momentum is building.',
      shortLabel: 'In Motion',
    },
    {
      id: 2,
      label: 'Almost There',
      description: 'You\'re close to achieving this dream. Final steps are in sight and completion is near.',
      shortLabel: 'Almost There',
    },
    {
      id: 3,
      label: 'Done',
      description: 'Congratulations! You\'ve achieved this dream. Time to celebrate and reflect on your success.',
      shortLabel: 'Done',
    },
  ];

  const [selfProgressStage, setSelfProgressStage] = useState(() => {
    const numericProgress = typeof dream?.progress === 'number' ? dream.progress : 25;

    if (numericProgress >= 87.5) return 3; // 75-100% = Done
    if (numericProgress >= 62.5) return 2;  // 50-75% = Almost There
    if (numericProgress >= 37.5) return 1;  // 25-50% = In Motion
    return 0; // 0-25% = Just Started (but should start at 25%)
  });

  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(dream?.title || '');

  // Sync editedTitle when dream prop or localDream changes
  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(localDream?.title || dream?.title || '');
    }
  }, [localDream?.title, dream?.title, isEditingTitle]);

  const activeStage = SELF_PROGRESS_STAGES[selfProgressStage] || SELF_PROGRESS_STAGES[0];

  // Handle stage change and persist
  const handleStageChange = (newStage) => {
    setSelfProgressStage(newStage);
    
    // Map stage to numeric progress for persistence (4 stages: 25%, 50%, 75%, 100%)
    const stageToProgress = [25, 50, 75, 100];
    const newProgress = stageToProgress[newStage] || 25;
    
    // Call handleProgressChange from the hook to trigger save
    if (handleProgressChange) {
      handleProgressChange(newProgress);
    }
  };
  const {
    // State
    activeTab,
    setActiveTab,
    localDream,
    hasChanges,
    isAddingGoal,
    setIsAddingGoal,
    newGoalData,
    setNewGoalData,
    editingGoal,
    goalEditData,
    setGoalEditData,
    
    // Progress handlers
    handleProgressChange,
    toggleComplete,
    
    // Goal handlers
    handleAddGoal,
    toggleGoal,
    handleDeleteGoal,
    startEditingGoal,
    cancelEditingGoal,
    saveEditedGoal,
    
    // Coach message handlers
    addCoachMessage,
    
    // Save handler
    handleSave,
    
    // Privacy handler
    handlePrivacyChange,
    
    // What/Why/How handlers
    handleUpdateDescription,
    handleUpdateMotivation,
    handleUpdateApproach,
    handleUpdateTitle,
    
    // Helpers
    getCategoryIcon,
    getProgressColor,
    formatDate,
    
    // Calculated
    completedGoals,
    totalGoals,
    dreamGoals,
    
    // Coach mode
    canEdit,
    coachNotes,
  } = useDreamTracker(dream, onUpdate, isCoachViewing, teamMember);

  return (
    <>
      {/* Image Lightbox Modal */}
      {isImageExpanded && localDream.image && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200"
          onClick={() => setIsImageExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Dream image full view"
        >
          <button
            onClick={() => setIsImageExpanded(false)}
            className="absolute top-4 right-4 text-white hover:text-netsurit-coral transition-colors p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white z-10"
            aria-label="Close image view"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={localDream.image}
              alt={localDream.title}
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-2xl">
              <h3 className="text-white font-bold text-lg sm:text-xl mb-1">{localDream.title}</h3>
              {localDream.description && (
                <p className="text-white/80 text-sm">{localDream.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl flex flex-col max-h-full overflow-hidden">
          {/* Header with Title, Image, and Actions */}
          <div className="p-3 sm:p-4 border-b border-professional-gray-200 bg-white flex-shrink-0">
            <div className="flex items-start gap-4">
              {localDream.image && (
                <button
                  onClick={() => setIsImageExpanded(true)}
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
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editedTitle.trim()) {
                                handleUpdateTitle(editedTitle);
                                setIsEditingTitle(false);
                              }
                            } else if (e.key === 'Escape') {
                              setEditedTitle(localDream.title);
                              setIsEditingTitle(false);
                            }
                          }}
                          className="flex-1 text-xl sm:text-2xl font-bold text-professional-gray-900 border-2 border-netsurit-red rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                          autoFocus
                          data-testid="dream-title-input"
                        />
                        <button
                          onClick={() => {
                            if (editedTitle.trim()) {
                              handleUpdateTitle(editedTitle);
                              setIsEditingTitle(false);
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
                            setEditedTitle(localDream.title);
                            setIsEditingTitle(false);
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
                              setEditedTitle(localDream.title);
                              setIsEditingTitle(true);
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
                        onClick={handleSave}
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
                
                {/* Progress Bar - Directly below category */}
                <div className="flex-1 min-w-0">
                {/* Slider Container */}
                <div className="relative py-2" data-testid="dream-progress-self-assessment">
                    {/* Track Background - Thicker bar with labels inside */}
                    <div className="relative h-10 bg-professional-gray-200 rounded-full shadow-inner border border-professional-gray-300/50 overflow-hidden">
                      {/* Filled Progress Track - Fill up to stage boundary (25%, 50%, 75%, 100%) */}
                      <div 
                        className="absolute h-full bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange rounded-full transition-all duration-500 ease-out shadow-md"
                        style={{ width: `${((selfProgressStage + 1) * 25)}%` }}
                      />
                      
                      {/* Stage Labels Inside Bar */}
                      <div className="absolute inset-0 flex">
                        {SELF_PROGRESS_STAGES.map((stage, index) => {
                          const isPassed = index <= selfProgressStage;
                          const isActive = index === selfProgressStage;
                          const sectionWidth = 100 / SELF_PROGRESS_STAGES.length;
                          
                          return (
                            <button
                              key={`section-${stage.id}`}
                              type="button"
                              onClick={() => canEdit && handleStageChange(index)}
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
                          onChange={(e) => handleStageChange(parseInt(e.target.value))}
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

          {/* Navigation Tabs */}
          <div className="border-b border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
            <nav className="flex space-x-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'goals'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
                }`}
              >
                <span className="hidden sm:inline">Goals</span>
                <span className="sm:hidden">Goals</span>
                <span className="ml-1">({totalGoals})</span>
              </button>
              <button
                onClick={() => setActiveTab('coach-notes')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'coach-notes'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
                }`}
              >
                <span className="hidden sm:inline">Coach Notes</span>
                <span className="sm:hidden">Coach</span>
                <span className="ml-1">({coachNotes?.length || localDream.coachNotes?.length || localDream.notes?.filter(note => note.isCoachNote).length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
                }`}
              >
                History ({localDream.history?.length || 0})
              </button>
            </nav>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeTab === 'overview' && (
              <OverviewTab
                localDream={localDream}
                completedGoals={completedGoals}
                totalGoals={totalGoals}
                getCategoryIcon={getCategoryIcon}
                formatDate={formatDate}
                handlePrivacyChange={handlePrivacyChange}
                handleUpdateDescription={handleUpdateDescription}
                handleUpdateMotivation={handleUpdateMotivation}
                handleUpdateApproach={handleUpdateApproach}
                canEdit={canEdit}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsTab
                goals={dreamGoals}
                isAddingGoal={isAddingGoal}
                setIsAddingGoal={setIsAddingGoal}
                newGoalData={newGoalData}
                setNewGoalData={setNewGoalData}
                onAddGoal={handleAddGoal}
                onToggleGoal={toggleGoal}
                onDeleteGoal={handleDeleteGoal}
                dreamId={localDream.id}
                dreamProgress={localDream.progress}
                editingGoal={editingGoal}
                onStartEditingGoal={startEditingGoal}
                onCancelEditingGoal={cancelEditingGoal}
                onSaveEditedGoal={saveEditedGoal}
                goalEditData={goalEditData}
                setGoalEditData={setGoalEditData}
                canEdit={canEdit}
              />
            )}

            {activeTab === 'coach-notes' && (
              <CoachNotesTab 
                coachNotes={coachNotes || localDream.coachNotes || []}
                formatDate={formatDate}
                onAddMessage={addCoachMessage}
                currentUser={isCoachViewing ? teamMember : undefined}
                isCoach={isCoachViewing}
                teamMember={teamMember}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab 
                history={localDream.history || []}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

DreamTrackerLayout.propTypes = {
  dream: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string,
    progress: PropTypes.number.isRequired,
    image: PropTypes.string,
    goals: PropTypes.array,
    notes: PropTypes.array,
    coachNotes: PropTypes.array,
    history: PropTypes.array
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  isCoachViewing: PropTypes.bool,
  teamMember: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  })
};

export default DreamTrackerLayout;


