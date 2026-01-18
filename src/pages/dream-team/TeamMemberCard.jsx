import { MapPin, Award, Heart, Sparkles, RotateCw, X, Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Team Member Card Component
 * Displays a team member's info in a vertical, centered card layout with flip interaction
 */
export default function TeamMemberCard({ member, currentUserId, isCoach, onGenerateBackground, onViewDreamInCoachMode }) {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter public dreams from member's dreamBook
  const publicDreams = useMemo(() => {
    if (!member.dreamBook || !Array.isArray(member.dreamBook)) return [];
    return member.dreamBook.filter(dream => dream.isPublic === true);
  }, [member.dreamBook]);

  const handleConnect = () => {
    navigate('/dream-connect', { state: { targetUserId: member.id } });
  };

  const handleFlip = (e) => {
    // Don't flip if clicking buttons or if selecting text
    if (e.target.closest('button') || window.getSelection().toString()) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  // Get accent color class based on member's accentColor
  const getAccentColorClass = () => {
    const color = member.accentColor || 'netsurit-red';
    const colorMap = {
      'netsurit-red': 'ring-netsurit-red',
      'netsurit-coral': 'ring-netsurit-coral',
      'netsurit-orange': 'ring-netsurit-orange'
    };
    return colorMap[color] || 'ring-netsurit-red';
  };

  // Get progress bar color based on percentage
  const getProgressBarColor = () => {
    const progress = member.weeklyProgress || 0;
    if (progress >= 67) return 'bg-green-600';
    if (progress >= 34) return 'bg-netsurit-orange';
    return 'bg-netsurit-red';
  };

  // Helper to get valid avatar URL - blob URLs don't work across page loads, so use fallback
  const getAvatarUrl = (avatar) => {
    if (!avatar || typeof avatar !== 'string') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=128`;
    }
    const trimmed = avatar.trim();
    // Blob URLs are temporary and cause security errors - use fallback instead
    if (trimmed.startsWith('blob:')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=128`;
    }
    // Only use http/https URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Fallback for invalid URLs
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=128`;
  };

  // Check if this is the current user's card
  const isCurrentUser = member.id === currentUserId;
  const hasBackground = !!member.cardBackgroundImage;

  return (
    <div 
      className="group relative h-[420px] w-full perspective-1000 cursor-pointer"
      role="listitem"
      aria-label={`Team member: ${member.name}`}
      data-testid={`team-member-card-${member.id}`}
      onClick={handleFlip}
    >
      {/* Inner Container for Flip Animation */}
      <div 
        className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT FACE */}
        <div 
          className={`absolute w-full h-full backface-hidden rounded-2xl border shadow-lg overflow-hidden flex flex-col ${
            hasBackground ? 'border-white/30' : 'bg-white border-professional-gray-200'
          }`}
          style={{
            backgroundImage: hasBackground ? `url(${member.cardBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Background overlay */}
          {hasBackground && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent via-40% to-black/90 pointer-events-none z-0" />
          )}

          {/* Front Content */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full p-6">
            
            {/* Top Actions */}
            <div className="w-full flex justify-end items-start">
              {/* Generate Background Button (Current User Only) */}
              {isCurrentUser && onGenerateBackground && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onGenerateBackground(member);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-50 hover:!opacity-100 ${
                    hasBackground 
                      ? 'text-white/80 hover:text-netsurit-coral hover:bg-white/20 backdrop-blur-sm border border-white/30' 
                      : 'text-professional-gray-400 hover:text-netsurit-coral hover:bg-professional-gray-100 border border-professional-gray-200'
                  }`}
                  aria-label="Generate background image"
                  title="Generate AI Background"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Profile Picture - Large & Centered */}
            <div className="flex flex-col items-center justify-center flex-1">
              <div className={`relative rounded-full p-1 ${getAccentColorClass().replace('ring-', 'bg-')}`}>
                <img
                  src={getAvatarUrl(member.avatar)}
                  alt={`${member.name}'s profile`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover"
                  onError={(e) => {
                    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=128`;
                    if (e.target.src !== fallbackUrl) {
                      e.target.src = fallbackUrl;
                    }
                  }}
                />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="w-full text-center mt-auto pb-2">
              <h3 className={`text-2xl font-bold mb-1 ${hasBackground ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-professional-gray-900'}`}>
          {member.name}
        </h3>
              
        {member.office && (
                <div className={`flex items-center justify-center text-sm mb-2 ${hasBackground ? 'text-white/95 drop-shadow-md font-medium' : 'text-professional-gray-500'}`}>
                  <MapPin className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            <span>{member.office}</span>
          </div>
        )}

              <div className={`text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80 ${hasBackground ? 'text-white' : 'text-professional-gray-400'}`}>
                <RotateCw className="w-3 h-3" /> Click to view details
              </div>
          </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-white border border-professional-gray-200 shadow-xl overflow-hidden flex flex-col z-20"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {/* Header / Close */}
          <div className="p-4 border-b border-professional-gray-100 flex justify-between items-center bg-professional-gray-50/50">
            <div className="flex items-center gap-2">
              <img
                src={getAvatarUrl(member.avatar)}
                alt={`${member.name}'s profile`}
                className="w-8 h-8 rounded-full border border-professional-gray-200 object-cover"
                onError={(e) => {
                  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=80`;
                  if (e.target.src !== fallbackUrl) {
                    e.target.src = fallbackUrl;
                  }
                }}
              />
              <span className="font-semibold text-sm text-professional-gray-900 truncate max-w-[140px]">
                {member.name}
          </span>
        </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              className="p-1.5 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-full transition-colors"
              aria-label="Flip back"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            
            {/* Stats Row */}
            <div className="flex items-center justify-center gap-2 w-full">
              <div className="flex-1 flex flex-col items-center justify-center p-2 bg-professional-gray-50 rounded-xl border border-professional-gray-100">
                <Award className="w-4 h-4 text-netsurit-orange mb-1" />
                <span className="text-xs text-professional-gray-500">Score</span>
                <span className="font-bold text-professional-gray-900">{member.score || 0}</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-2 bg-professional-gray-50 rounded-xl border border-professional-gray-100">
                <Heart className="w-4 h-4 text-netsurit-red mb-1" />
                <span className="text-xs text-professional-gray-500">Connects</span>
                <span className="font-bold text-professional-gray-900">{member.connectsCount || 0}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-professional-gray-600">Weekly Progress</span>
                <span className="font-bold text-professional-gray-900">{member.weeklyProgress || 0}%</span>
              </div>
              <div className="w-full h-2 bg-professional-gray-100 rounded-full overflow-hidden">
            <div 
                  className={`h-full ${getProgressBarColor()} transition-all duration-500`}
              style={{ width: `${member.weeklyProgress || 0}%` }}
            />
          </div>
        </div>

            {/* Public Dreams */}
            <div>
              <h4 className="text-xs font-semibold text-professional-gray-500 uppercase tracking-wide mb-2">
            Public Dreams
          </h4>
          {publicDreams.length > 0 ? (
                <ul className="space-y-2">
              {publicDreams.slice(0, 3).map((dream, idx) => (
                    <li key={dream.id || idx} className="flex items-start gap-2 text-xs text-professional-gray-700 bg-professional-gray-50 p-2 rounded-lg">
                      <span className="text-netsurit-coral mr-0.5 flex-shrink-0">•</span>
                      <span className="line-clamp-2 flex-1">{dream.title}</span>
                      {isCoach && onViewDreamInCoachMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDreamInCoachMode(dream, member);
                          }}
                          className="flex-shrink-0 p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-professional-gray-100 rounded transition-colors"
                          aria-label={`View ${dream.title} in coach mode`}
                          title="View dream in coach mode"
                          data-testid={`coach-view-dream-${dream.id || idx}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                </li>
              ))}
              {publicDreams.length > 3 && (
                    <li className="text-center text-xs text-professional-gray-400 italic pt-1">
                      + {publicDreams.length - 3} more
                </li>
              )}
            </ul>
          ) : (
                <p className="text-xs text-professional-gray-400 italic text-center py-2 bg-professional-gray-50 rounded-lg">
                  No public dreams visible
            </p>
          )}
            </div>
        </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-professional-gray-100 bg-white">
        <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnect();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:shadow-lg transform transition-all duration-200 active:scale-95 font-medium text-sm flex items-center justify-center gap-2"
        >
              <Heart className="w-4 h-4 fill-white/20" />
          Quick Connect
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}

TeamMemberCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    office: PropTypes.string,
    score: PropTypes.number,
    dreamsCount: PropTypes.number,
    connectsCount: PropTypes.number,
    completedGoalsCount: PropTypes.number,
    completedDreamsCount: PropTypes.number,
    weeklyProgress: PropTypes.number,
    activityStatus: PropTypes.oneOf(['active', 'recent', 'inactive']),
    accentColor: PropTypes.string,
    isCoach: PropTypes.bool,
    cardBackgroundImage: PropTypes.string,
    dreamBook: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      isPublic: PropTypes.bool
    }))
  }).isRequired,
  currentUserId: PropTypes.string,
  isCoach: PropTypes.bool,
  onGenerateBackground: PropTypes.func,
  onViewDreamInCoachMode: PropTypes.func
};