// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { X, MapPin, Award, BookOpen, Heart, Users2, Mail } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { DreamTrackerLayout } from '../dream-tracker/DreamTrackerLayout';
import { useApp } from '../../context/AppContext';

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

  // Focus management
  useEffect(() => {
    if (modalRef.current) {
      closeButtonRef.current?.focus();
    }
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
        <div className="relative bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 text-white flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={member.avatar && !member.avatar.startsWith('blob:') 
                    ? member.avatar 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=64`}
                  alt={`${member.name}'s profile`}
                  className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg object-cover"
                  onError={(e) => {
                    // Fallback to generated avatar if image fails to load (including blob URLs)
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=64`;
                  }}
                />
                {member.isCoach && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border-2 border-netsurit-red rounded-full flex items-center justify-center">
                    <Users2 className="w-3 h-3 text-netsurit-red" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div>
                <h3 id="member-modal-title" className="text-lg font-bold">
                  {member.name}
                </h3>
                <p className="text-white/90 text-sm">
                  {member.isCoach ? 'Dream Coach' : 'Team Member'}
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              aria-label="Close modal"
              data-testid="close-modal-button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-professional-gray-400" aria-hidden="true" />
                  <span className="text-sm text-professional-gray-600">{member.email}</span>
                </div>
              )}
              {member.office && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-professional-gray-400" aria-hidden="true" />
                  <span className="text-sm text-professional-gray-600">{member.office}</span>
                </div>
              )}
              {member.score !== undefined && (
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-netsurit-coral" aria-hidden="true" />
                  <span className="text-sm font-semibold text-professional-gray-900">
                    {member.score} points
                  </span>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-professional-gray-50 rounded-lg p-3 text-center">
                <BookOpen className="w-5 h-5 text-netsurit-red mx-auto mb-1" aria-hidden="true" />
                <p className="text-xs text-professional-gray-600">Dreams</p>
                <p className="text-lg font-bold text-professional-gray-900">
                  {member.dreamsCount || 0}
                </p>
              </div>
              <div className="bg-professional-gray-50 rounded-lg p-3 text-center">
                <Heart className="w-5 h-5 text-netsurit-coral mx-auto mb-1" aria-hidden="true" />
                <p className="text-xs text-professional-gray-600">Connects</p>
                <p className="text-lg font-bold text-professional-gray-900">
                  {member.connectsCount || 0}
                </p>
              </div>
            </div>

            {/* Dream Categories */}
            {member.dreamCategories && member.dreamCategories.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-professional-gray-900 mb-2">
                  Dream Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.dreamCategories.map((category, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-netsurit-red/10 text-netsurit-red text-sm rounded-full border border-netsurit-red/20"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Public Dreams */}
            <div>
              <h4 className="text-sm font-bold text-professional-gray-900 mb-3">
                Public Dreams
              </h4>
              {publicDreams.length === 0 ? (
                <div className="bg-professional-gray-50 rounded-lg p-4 text-center">
                  <BookOpen className="w-8 h-8 text-professional-gray-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-professional-gray-600">
                    No public dreams yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicDreams.map((dream) => (
                    isCoach ? (
                      <button
                        key={dream.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Button clicked:', { dreamTitle: dream.title, isCoach, dreamId: dream.id, selectedDream });
                          handleDreamClick(dream);
                        }}
                        className="w-full text-left bg-professional-gray-50 rounded-lg p-3 border border-professional-gray-200 transition-all duration-200 hover:border-netsurit-red hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 active:scale-[0.98] hover:bg-professional-gray-100"
                        data-testid={`public-dream-${dream.id}`}
                        aria-label={`View ${dream.title} details`}
                        type="button"
                      >
                        <div className="flex items-start space-x-3">
                          {dream.image && (
                            <img
                              src={dream.image}
                              alt={dream.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-professional-gray-900 mb-1">
                              {dream.title}
                              <span className="ml-2 text-xs text-netsurit-red font-normal">(Click to view)</span>
                            </h5>
                            <p className="text-xs text-professional-gray-600 mb-1">
                              {dream.category}
                            </p>
                            {dream.description && (
                              <p className="text-sm text-professional-gray-700 line-clamp-2">
                                {dream.description}
                              </p>
                            )}
                            {dream.progress !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-professional-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{dream.progress}%</span>
                                </div>
                                <div className="w-full bg-professional-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-netsurit-red h-1.5 rounded-full transition-all"
                                    style={{ width: `${dream.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div
                        key={dream.id}
                        className="w-full text-left bg-professional-gray-50 rounded-lg p-3 border border-professional-gray-200"
                        data-testid={`public-dream-${dream.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          {dream.image && (
                            <img
                              src={dream.image}
                              alt={dream.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-professional-gray-900 mb-1">
                              {dream.title}
                            </h5>
                            <p className="text-xs text-professional-gray-600 mb-1">
                              {dream.category}
                            </p>
                            {dream.description && (
                              <p className="text-sm text-professional-gray-700 line-clamp-2">
                                {dream.description}
                              </p>
                            )}
                            {dream.progress !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-professional-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{dream.progress}%</span>
                                </div>
                                <div className="w-full bg-professional-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-netsurit-red h-1.5 rounded-full transition-all"
                                    style={{ width: `${dream.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

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

