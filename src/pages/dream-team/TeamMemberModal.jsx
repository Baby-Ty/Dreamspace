import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { DreamTrackerLayout } from '../dream-tracker/DreamTrackerLayout';
import { useApp } from '../../context/AppContext';
import { useModalKeyboard } from './components/useModalKeyboard';
import TeamMemberModalHeader from './components/TeamMemberModalHeader';
import TeamMemberModalBody from './components/TeamMemberModalBody';

/**
 * Team Member Modal Component
 * Displays detailed profile information for a team member
 * Coaches can click on dreams to view them in detail
 */
export default function TeamMemberModal({ member, onClose, isCoach }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const { currentUser } = useApp();
  const [selectedDream, setSelectedDream] = useState(null);

  // Use custom hook for keyboard handling
  useModalKeyboard(onClose, closeButtonRef);

  if (!member) return null;

  // Get public dreams (only show dreams explicitly marked as public)
  const publicDreams = (member.dreamBook || []).filter(dream => 
    dream.isPublic === true
  );

  // Debug logging
  useEffect(() => {
    console.log('👤 TeamMemberModal rendered:', {
      memberName: member.name,
      isCoach,
      isCoachProp: isCoach,
      totalDreams: member.dreamBook?.length || 0,
      publicDreams: publicDreams.length,
      dreams: member.dreamBook?.map(d => ({ 
        id: d.id,
        title: d.title, 
        isPublic: d.isPublic 
      }))
    });
  }, [member, isCoach, publicDreams.length]);

  // Handle dream click - open Dream Tracker for coaches
  const handleDreamClick = (dream) => {
    console.log('🎯 Dream clicked:', { 
      dreamTitle: dream.title, 
      isCoach, 
      dreamId: dream.id,
      dream: dream
    });
    if (isCoach) {
      console.log('✅ Opening Dream Tracker for coach, setting selectedDream');
      setSelectedDream(dream);
      console.log('✅ selectedDream state updated');
    } else {
      console.warn('⚠️ Cannot open dream - user is not a coach', { isCoach });
    }
  };
  
  // Debug selectedDream changes
  useEffect(() => {
    console.log('🔄 selectedDream changed:', { 
      hasSelectedDream: !!selectedDream,
      dreamTitle: selectedDream?.title,
      dreamId: selectedDream?.id,
      isCoach
    });
  }, [selectedDream, isCoach]);

  // Handle coach message save callback
  const handleSaveCoachMessage = async (dream, message) => {
    // This will be handled by the service layer
    // For now, just close the dream tracker and refresh
    setSelectedDream(null);
    // Trigger refresh if needed
    if (onClose) {
      // Could trigger a refresh here if needed
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-labelledby="member-modal-title"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="team-member-modal"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-professional-gray-200 overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <TeamMemberModalHeader 
          member={member}
          closeButtonRef={closeButtonRef}
          onClose={onClose}
        />

        {/* Modal Body */}
        <TeamMemberModalBody
          member={member}
          isCoach={isCoach}
          onDreamClick={handleDreamClick}
          publicDreams={publicDreams}
        />

        {/* Modal Footer */}
        <div className="p-4 border-t border-professional-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Dream Tracker Modal (for coaches viewing member dreams) */}
      {selectedDream && isCoach && (
        <div 
          className="fixed inset-0 z-[100]" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log('🔙 Closing Dream Tracker (backdrop click)');
              setSelectedDream(null);
            }
          }}
        >
          <DreamTrackerLayout
            dream={selectedDream}
            onClose={() => {
              console.log('🔙 Closing Dream Tracker');
              setSelectedDream(null);
            }}
            onUpdate={handleSaveCoachMessage}
            isCoachViewing={true}
            teamMember={member}
          />
        </div>
      )}
    </div>
  );
}

TeamMemberModal.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
    avatar: PropTypes.string,
    office: PropTypes.string,
    score: PropTypes.number,
    dreamsCount: PropTypes.number,
    connectsCount: PropTypes.number,
    dreamCategories: PropTypes.arrayOf(PropTypes.string),
    dreamBook: PropTypes.arrayOf(PropTypes.object),
    isCoach: PropTypes.bool
  }),
  onClose: PropTypes.func.isRequired,
  isCoach: PropTypes.bool
};

TeamMemberModal.defaultProps = {
  member: null
};
