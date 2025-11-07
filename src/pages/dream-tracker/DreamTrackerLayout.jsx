// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
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
    
    // Helpers
    getCategoryIcon,
    getProgressColor,
    formatDate,
    
    // Calculated
    completedGoals,
    totalGoals,
  } = useDreamTracker(dream, onUpdate);

  return (
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
                      <span>{localDream.progress}%</span>
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {localDream.image && (
                  <img 
                    src={localDream.image} 
                    alt={localDream.title}
                    className="w-16 h-16 rounded-lg object-cover shadow-md border border-white flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-professional-gray-600">Overall Progress</span>
                    <span className="text-sm font-bold text-netsurit-red">{localDream.progress}%</span>
                  </div>
                  <div className="w-full bg-professional-gray-200 rounded-full h-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${localDream.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-professional-gray-600 mt-2 line-clamp-1">{localDream.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-professional-gray-600 bg-white px-2 py-1 rounded-md whitespace-nowrap">
                  {completedGoals}/{totalGoals} goals
                </span>
                <button
                  onClick={toggleComplete}
                  className="bg-professional-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-professional-gray-600 focus:outline-none focus:ring-2 focus:ring-professional-gray-400 transition-all duration-200 text-xs font-medium shadow-md whitespace-nowrap"
                >
                  {localDream.progress === 100 ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
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
              />
            )}

            {activeTab === 'goals' && (
              <GoalsTab
                goals={localDream.goals}
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


