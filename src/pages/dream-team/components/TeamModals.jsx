
import React from 'react';
import PropTypes from 'prop-types';
import AIImageGenerator from '../../../components/AIImageGenerator';
import { DreamTrackerLayout } from '../../dream-tracker/DreamTrackerLayout';

/**
 * TeamModals - Container for all team-related modals
 * @component
 */
export function TeamModals({
  showAIBackgroundGenerator,
  onSelectAIBackground,
  onCloseAIBackgroundGenerator,
  selectedDreamForCoachView,
  selectedMemberForCoachView,
  isCoach,
  onCloseDreamTrackerCoachView,
  onUpdateDreamInCoachView
}) {
  return (
    <>
      {/* AI Background Generator Modal */}
      {showAIBackgroundGenerator && (
        <AIImageGenerator
          onSelectImage={onSelectAIBackground}
          onClose={onCloseAIBackgroundGenerator}
        />
      )}

      {/* Dream Tracker Modal (Coach View) */}
      {selectedDreamForCoachView && selectedMemberForCoachView && isCoach && (
        <div 
          className="fixed inset-0 z-[100]" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseDreamTrackerCoachView();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dream-tracker-coach-view-title"
        >
          <DreamTrackerLayout
            dream={selectedDreamForCoachView}
            onClose={onCloseDreamTrackerCoachView}
            onUpdate={onUpdateDreamInCoachView}
            isCoachViewing={true}
            teamMember={selectedMemberForCoachView}
          />
        </div>
      )}
    </>
  );
}

TeamModals.propTypes = {
  showAIBackgroundGenerator: PropTypes.bool.isRequired,
  onSelectAIBackground: PropTypes.func.isRequired,
  onCloseAIBackgroundGenerator: PropTypes.func.isRequired,
  selectedDreamForCoachView: PropTypes.object,
  selectedMemberForCoachView: PropTypes.object,
  isCoach: PropTypes.bool.isRequired,
  onCloseDreamTrackerCoachView: PropTypes.func.isRequired,
  onUpdateDreamInCoachView: PropTypes.func.isRequired
};

export default TeamModals;