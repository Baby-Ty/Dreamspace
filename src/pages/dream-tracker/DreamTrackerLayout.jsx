// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  Target, 
  Bookmark, 
  Save 
} from 'lucide-react';
import { useDreamTracker } from '../../hooks/useDreamTracker';
import { OverviewTab } from './OverviewTab';
import { GoalsTab } from './GoalsTab';
import { NotesTab } from './NotesTab';
import { CoachNotesTab } from './CoachNotesTab';
import { HistoryTab } from './HistoryTab';

/**
 * DreamTrackerLayout - Main orchestration component for dream tracking modal
 * Uses useDreamTracker hook for state and renders tabs
 * @component
 */
export function DreamTrackerLayout({ dream, onClose, onUpdate }) {
  const SELF_PROGRESS_STAGES = [
    {
      id: 0,
      label: 'Dream Sparked',
      description: 'This dream is taking shape in your mind and heart. You are getting clear on what you want.',
      shortLabel: 'Sparked',
    },
    {
      id: 1,
      label: 'Building Momentum',
      description: 'You are taking action on your goals and building positive habits around this dream.',
      shortLabel: 'Building',
    },
    {
      id: 2,
      label: 'Making Progress',
      description: 'Your efforts are paying off. This dream is becoming real through consistent steps.',
      shortLabel: 'Progress',
    },
    {
      id: 3,
      label: 'Nearly There',
      description: 'You can see the finish line. Final goals are within reach and you are closing the gap.',
      shortLabel: 'Nearly There',
    },
    {
      id: 4,
      label: 'Dream Achieved',
      description: 'You have done it! This dream is now your reality. Time to celebrate and reflect.',
      shortLabel: 'Achieved',
    },
  ];

  const [selfProgressStage, setSelfProgressStage] = useState(() => {
    const numericProgress = typeof dream?.progress === 'number' ? dream.progress : 0;

    if (numericProgress >= 90) return 4;
    if (numericProgress >= 65) return 3;
    if (numericProgress >= 40) return 2;
    if (numericProgress >= 15) return 1;
    return 0;
  });

  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const activeStage = SELF_PROGRESS_STAGES[selfProgressStage] || SELF_PROGRESS_STAGES[0];

  // Handle stage change and persist
  const handleStageChange = (newStage) => {
    setSelfProgressStage(newStage);
    
    // Map stage to numeric progress for persistence
    const stageToProgress = [0, 25, 50, 75, 100];
    const newProgress = stageToProgress[newStage] || 0;
    
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
    newNote,
    setNewNote,
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
    
    // Note handlers
    addNote,
    
    // Save handler
    handleSave,
    
    // Privacy handler
    handlePrivacyChange,
    
    // Helpers
    getCategoryIcon,
    getProgressColor,
    formatDate,
    
    // Calculated
    completedGoals,
    totalGoals,
    dreamGoals,
  } = useDreamTracker(dream, onUpdate);

  return (
    <>
      {/* Image Lightbox Modal */}
      {isImageExpanded && localDream.image && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl flex flex-col max-h-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-3 sm:p-4 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <span className="text-xl sm:text-2xl emoji-white flex-shrink-0">{getCategoryIcon(localDream.category)}</span>
                <div className="text-white min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">{localDream.title}</h2>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                    <span className="flex items-center space-x-1">
                      <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{localDream.category}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{activeStage.label}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {hasChanges && (
                  <button
                    onClick={handleSave}
                    className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-1.5 text-sm font-medium"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Overview - Compact */}
          <div className="p-3 sm:p-4 border-b border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {localDream.image && (
                  <button
                    onClick={() => setIsImageExpanded(true)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0 hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 group relative"
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-professional-gray-600">
                      Where are you with this dream?
                    </span>
                    <span className="text-xs font-bold text-netsurit-red">
                      {activeStage.label}
                    </span>
                  </div>
                  
                  {/* Slider Container */}
                  <div className="relative py-2" data-testid="dream-progress-self-assessment">
                    {/* Track Background */}
                    <div className="relative h-3 bg-professional-gray-200 rounded-full shadow-inner border border-professional-gray-300/50">
                      {/* Filled Progress Track */}
                      <div 
                        className="absolute h-full bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange rounded-full transition-all duration-500 ease-out shadow-md"
                        style={{ width: `${(selfProgressStage / (SELF_PROGRESS_STAGES.length - 1)) * 100}%` }}
                      />
                      
                      {/* Stage Markers (Dots) */}
                      {SELF_PROGRESS_STAGES.map((stage, index) => {
                        const isActive = index === selfProgressStage;
                        const isPassed = index < selfProgressStage;
                        
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => handleStageChange(index)}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-300 hover:scale-125 focus:outline-none z-10"
                            style={{ 
                              left: `${(index / (SELF_PROGRESS_STAGES.length - 1)) * 100}%`,
                              width: isActive ? '20px' : '14px',
                              height: isActive ? '20px' : '14px',
                              background: isActive || isPassed
                                ? 'linear-gradient(135deg, #e63946 0%, #f77f7f 100%)' 
                                : '#fff',
                              border: isActive 
                                ? '3px solid rgba(230, 57, 70, 0.4)'
                                : isPassed 
                                  ? '3px solid #e63946' 
                                  : '3px solid #d1d5db',
                              boxShadow: isActive 
                                ? '0 0 0 5px rgba(230, 57, 70, 0.2), 0 3px 10px rgba(230, 57, 70, 0.4)' 
                                : isPassed
                                  ? '0 2px 4px rgba(230, 57, 70, 0.2)'
                                  : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            aria-label={stage.label}
                            data-testid={`dream-progress-stage-${stage.id}`}
                          />
                        );
                      })}
                      
                      {/* Invisible Range Input for Dragging */}
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
                    </div>
                    
                    {/* Stage Labels Below Slider */}
                    <div className="relative flex justify-between mt-3 -mx-1">
                      {SELF_PROGRESS_STAGES.map((stage, index) => (
                        <button
                          key={`label-${stage.id}`}
                          type="button"
                          onClick={() => handleStageChange(index)}
                          className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-200 text-center hover:text-netsurit-coral focus:outline-none px-1 ${
                            index === selfProgressStage 
                              ? 'text-netsurit-red font-semibold' 
                              : 'text-professional-gray-500'
                          }`}
                          style={{ width: '20%' }}
                        >
                          {stage.shortLabel || stage.label}
                        </button>
                      ))}
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
                onClick={() => setActiveTab('notes')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'notes'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
                }`}
              >
                <span className="hidden sm:inline">Personal Notes</span>
                <span className="sm:hidden">Notes</span>
                <span className="ml-1">({localDream.notes?.filter(note => !note.isCoachNote).length || 0})</span>
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
                <span className="ml-1">({localDream.notes?.filter(note => note.isCoachNote).length || 0})</span>
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
              />
            )}

            {activeTab === 'notes' && (
              <NotesTab 
                notes={localDream.notes?.filter(note => !note.isCoachNote) || []}
                newNote={newNote}
                setNewNote={setNewNote}
                onAddNote={addNote}
                formatDate={formatDate}
              />
            )}

            {activeTab === 'coach-notes' && (
              <CoachNotesTab 
                coachNotes={localDream.notes?.filter(note => note.isCoachNote) || []}
                formatDate={formatDate}
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
    history: PropTypes.array
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default DreamTrackerLayout;


