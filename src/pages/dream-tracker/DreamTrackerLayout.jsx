
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDreamTracker } from '../../hooks/useDreamTracker';
import { useProgressStage } from '../../hooks/useProgressStage';
import { OverviewTab } from './OverviewTab';
import { GoalsTab } from './GoalsTab';
import { CoachNotesTab } from './CoachNotesTab';
import { HistoryTab } from './HistoryTab';
import ImageLightbox from './components/ImageLightbox';
import DreamHeader from './components/DreamHeader';
import DreamTabNavigation from './components/DreamTabNavigation';

/**
 * DreamTrackerLayout - Main orchestration component for dream tracking modal
 * Uses useDreamTracker hook for state and renders tabs
 * @component
 */
export function DreamTrackerLayout({ dream, onClose, onUpdate, isCoachViewing, teamMember }) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(dream?.title || '');
  
  // ✅ FIX: Call hook BEFORE using its return values
  const {
    // State
    activeTab,
    setActiveTab,
    localDream,
    hasChanges,
    isAddingGoal,
    setIsAddingGoal,
    isSavingGoal,
    newGoalData,
    setNewGoalData,
    editingGoal,
    isSavingGoalEdit,
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

  // Use progress stage hook for stage management
  const {
    selfProgressStage,
    activeStage,
    handleStageChange,
    SELF_PROGRESS_STAGES
  } = useProgressStage(dream, handleProgressChange);

  // ✅ FIX: Sync editedTitle AFTER localDream is available from hook
  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(localDream?.title || dream?.title || '');
    }
  }, [localDream?.title, dream?.title, isEditingTitle]);

  return (
    <>
      {/* Image Lightbox Modal */}
      <ImageLightbox
        isOpen={isImageExpanded}
        imageUrl={localDream.image}
        title={localDream.title}
        description={localDream.description}
        onClose={() => setIsImageExpanded(false)}
      />

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
        <div className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl flex flex-col max-h-full overflow-hidden">
          {/* Header with Title, Image, and Actions */}
          <DreamHeader
            localDream={localDream}
            isEditingTitle={isEditingTitle}
            editedTitle={editedTitle}
            onEditTitle={setIsEditingTitle}
            onUpdateTitle={handleUpdateTitle}
            onSetEditedTitle={setEditedTitle}
            selfProgressStage={selfProgressStage}
            onStageChange={handleStageChange}
            hasChanges={hasChanges}
            onSave={handleSave}
            onClose={onClose}
            onExpandImage={() => setIsImageExpanded(true)}
            canEdit={canEdit}
            isCoachViewing={isCoachViewing}
            teamMember={teamMember}
            SELF_PROGRESS_STAGES={SELF_PROGRESS_STAGES}
          />

          {/* Navigation Tabs */}
          <DreamTabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalGoals={totalGoals}
            coachNotesCount={coachNotes?.length || localDream.coachNotes?.length || localDream.notes?.filter(note => note.isCoachNote).length || 0}
            historyCount={localDream.history?.length || 0}
          />

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
                handleSave={handleSave}
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
                isSavingGoal={isSavingGoal}
                isSavingGoalEdit={isSavingGoalEdit}
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

