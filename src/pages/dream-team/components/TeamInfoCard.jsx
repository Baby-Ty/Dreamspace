
import React from 'react';
import PropTypes from 'prop-types';
import { Edit3, Sparkles } from 'lucide-react';
import MeetingAttendanceCard from '../MeetingAttendanceCard';

/**
 * TeamInfoCard - Sticky note style card with team info and meeting attendance
 * @component
 */
export function TeamInfoCard({
  teamData,
  teamMembers,
  teamStats,
  isCoach,
  teamId,
  isEditingTeamInfo,
  isEditingTeamName,
  editedTeamName,
  setEditedTeamName,
  editedTeamInterests,
  setEditedTeamInterests,
  editedTeamRegions,
  setEditedTeamRegions,
  onEditTeamInfo,
  onSaveTeamInfo,
  onCancelEdit,
  onGenerateRandomTeamName,
  onComplete
}) {
  return (
    <div className="relative group">
      <div 
        className="absolute inset-0 rounded-sm shadow-md group-hover:shadow-xl transition-all duration-300"
        style={{
          background: 'linear-gradient(to bottom right, #fef9c3 0%, #fef08a 100%)',
        }}
      >
        {/* Lined Paper Effect */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm"
          style={{
            backgroundImage: `repeating-linear-gradient(
              transparent,
              transparent 27px,
              rgba(180, 160, 120, 0.25) 27px,
              rgba(180, 160, 120, 0.25) 28px
            )`,
            backgroundPosition: '0 32px',
          }}
        />

        {/* Top fold/tape effect */}
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 opacity-50"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(1px)',
          }}
        />
      </div>

      {/* Content Container - Two Column Layout (1/3 Team Info, 2/3 Meeting Attendance) */}
      <div className="relative z-10 px-6 pb-6" style={{ paddingTop: '32px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Team Name + Team Info (1/3) */}
          <div className="flex flex-col lg:col-span-1">
            {/* Edit Button (Coach Only) */}
            {isCoach && !isEditingTeamInfo && !isEditingTeamName && (
              <button
                className="absolute top-4 left-4 p-2 text-[#8a7a50] hover:text-[#5c5030] hover:bg-[#5c5030]/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Edit team information"
                onClick={onEditTeamInfo}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}

            {/* Team Name */}
            <div style={{ marginBottom: '28px' }}>
              {isEditingTeamName ? (
                <div>
                  <div className="flex items-center gap-2" style={{ height: '28px', lineHeight: '28px' }}>
                    <input
                      type="text"
                      value={editedTeamName}
                      onChange={(e) => setEditedTeamName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onSaveTeamInfo();
                        } else if (e.key === 'Escape') {
                          onCancelEdit();
                        }
                      }}
                      className="flex-1 text-lg font-bold font-hand text-[#4a3b22] px-2 border-2 border-[#8a7a50] bg-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7a50]"
                      style={{ height: '28px', lineHeight: '28px' }}
                      autoFocus
                    />
                    <button
                      onClick={onGenerateRandomTeamName}
                      className="text-[#8a7a50] hover:text-[#5c5030] hover:bg-[#5c5030]/10 rounded transition-colors"
                      style={{ height: '28px', width: '28px', padding: '4px' }}
                      aria-label="Generate random team name"
                      title="Generate random team name"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#5c5030] uppercase tracking-wide font-medium font-hand" style={{ lineHeight: '28px' }}>
                    {teamMembers.length} Team Member{teamMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold text-[#4a3b22] font-hand tracking-wide" style={{ lineHeight: '28px' }}>
                    {teamData.teamName || 'Dream Team'}
                  </h2>
                  <p className="text-xs text-[#5c5030] uppercase tracking-wide font-medium font-hand" style={{ lineHeight: '28px' }}>
                    {teamMembers.length} Team Member{teamMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Team Interests & Regions */}
            <div className="flex-1" style={{ lineHeight: '28px' }}>
              {isEditingTeamInfo ? (
                <div className="space-y-[28px]">
                  <div>
                    <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
                      Team Interests:
                    </p>
                    <input
                      id="team-interests"
                      type="text"
                      value={editedTeamInterests}
                      onChange={(e) => setEditedTeamInterests(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          onCancelEdit();
                        }
                      }}
                      placeholder="e.g., Adventure, Fitness, Growth"
                      className="w-full px-2 text-[#1f180b] font-hand text-base border-2 border-[#8a7a50] bg-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7a50] focus:border-transparent"
                      style={{ height: '28px', lineHeight: '28px' }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
                      Team Regions:
                    </p>
                    <input
                      id="team-regions"
                      type="text"
                      value={editedTeamRegions}
                      onChange={(e) => setEditedTeamRegions(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          onCancelEdit();
                        }
                      }}
                      placeholder="e.g., Cape Town, Mexico, America"
                      className="w-full px-2 text-[#1f180b] font-hand text-base border-2 border-[#8a7a50] bg-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7a50] focus:border-transparent"
                      style={{ height: '28px', lineHeight: '28px' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onSaveTeamInfo}
                      className="px-3 bg-[#4a3b22] text-[#fef9c3] rounded-lg hover:bg-[#5c5030] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm font-hand"
                      style={{ height: '28px', lineHeight: '28px' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="px-3 border-2 border-[#8a7a50] text-[#4a3b22] rounded-lg hover:bg-[#8a7a50]/10 transition-all duration-200 font-medium text-sm font-hand"
                      style={{ height: '28px', lineHeight: '24px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-[28px]">
                  <div>
                    <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
                      Team Interests:
                    </p>
                    <p className="text-[#1f180b] text-base font-hand" style={{ lineHeight: '28px' }}>
                      {teamData.teamInterests || (teamStats?.sharedInterests?.length > 0 ? teamStats.sharedInterests.join(', ') : 'No interests specified')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#5c5030] font-hand" style={{ lineHeight: '28px' }}>
                      Team Regions:
                    </p>
                    <p className="text-[#1f180b] text-base font-hand" style={{ lineHeight: '28px' }}>
                      {teamData.teamRegions || (teamStats?.memberRegions?.length > 0 ? teamStats.memberRegions.join(', ') : 'No regions specified')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block absolute left-1/3 top-6 bottom-6 w-px bg-[#8a7a50]/20" />

          {/* Right: Meeting Attendance (2/3) */}
          <div className="border-t lg:border-t-0 pt-4 lg:pt-0 lg:col-span-2 border-[#8a7a50]/20">
            {teamId ? (
              <MeetingAttendanceCard
                teamId={teamId}
                teamMembers={teamMembers}
                isCoach={isCoach}
                managerId={teamData?.managerId}
                onComplete={onComplete}
                embedded={true}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-5 border border-professional-gray-200 h-full flex flex-col">
                <h3 className="text-sm font-bold text-professional-gray-900 uppercase tracking-wide mb-3">Meeting Attendance</h3>
                <p className="text-sm text-professional-gray-600 flex-1">Unable to load meeting attendance. Please refresh the page.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

TeamInfoCard.propTypes = {
  teamData: PropTypes.object.isRequired,
  teamMembers: PropTypes.array.isRequired,
  teamStats: PropTypes.object,
  isCoach: PropTypes.bool.isRequired,
  teamId: PropTypes.string,
  isEditingTeamInfo: PropTypes.bool.isRequired,
  isEditingTeamName: PropTypes.bool.isRequired,
  editedTeamName: PropTypes.string.isRequired,
  setEditedTeamName: PropTypes.func.isRequired,
  editedTeamInterests: PropTypes.string.isRequired,
  setEditedTeamInterests: PropTypes.func.isRequired,
  editedTeamRegions: PropTypes.string.isRequired,
  setEditedTeamRegions: PropTypes.func.isRequired,
  onEditTeamInfo: PropTypes.func.isRequired,
  onSaveTeamInfo: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onGenerateRandomTeamName: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired
};

export default TeamInfoCard;