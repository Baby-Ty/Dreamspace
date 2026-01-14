import { useState, useEffect, useRef } from 'react';
import { getAccentColor, getActivityStatus, calculateCompletionStats, calculateWeeklyProgress } from './teamHelpers';

/**
 * Hook to enhance team members with avatars, dreams, and computed stats
 * Returns { teamMembers, isEnhancing } to track loading state
 */
export function useTeamMemberEnhancer(teamData, currentUser) {
  const [enhancedMembers, setEnhancedMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Track if we're expecting data to be enhanced
  const pendingEnhancementRef = useRef(false);

  // Initial enhancement: load avatars and dreams
  useEffect(() => {
    const enhanceInitialMembers = async () => {
      if (!teamData?.teamMembers || teamData.teamMembers.length === 0) {
        setEnhancedMembers([]);
        setIsEnhancing(false);
        pendingEnhancementRef.current = false;
        return;
      }

      // Mark as enhancing when we have data to process
      setIsEnhancing(true);
      pendingEnhancementRef.current = true;

      const enhanced = await Promise.all(
        teamData.teamMembers.map(async (member) => {
          const memberId = member.id || member.userId;
          let updatedMember = { ...member };
          
          // Check if this is the current user and prioritize their avatar from context
          const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.email;
          const isCurrentUser = memberId === currentUserId || 
                               memberId === currentUser?.id || 
                               memberId === currentUser?.userId ||
                               memberId === currentUser?.email ||
                               (currentUser?.email && memberId?.includes(currentUser.email)) ||
                               (currentUser?.id && memberId?.includes(currentUser.id));
          
          if (isCurrentUser) {
            if (currentUser?.avatar) {
              const avatarUrl = currentUser.avatar;
              if (avatarUrl && !avatarUrl.includes('ui-avatars.com') && !avatarUrl.startsWith('blob:')) {
                console.log(`✅ Using current user's avatar from context for ${member.name}:`, avatarUrl.substring(0, 80));
                updatedMember.avatar = avatarUrl;
              }
            }
            
            if (currentUser?.cardBackgroundImage) {
              const bgImageUrl = currentUser.cardBackgroundImage;
              if (bgImageUrl && typeof bgImageUrl === 'string' && bgImageUrl.trim()) {
                console.log(`✅ Using current user's card background from context for ${member.name}:`, bgImageUrl.substring(0, 80));
                updatedMember.cardBackgroundImage = bgImageUrl;
              }
            }
          }
          
          // Use avatar/background from member data (already loaded via getAllUsers)
          // Don't fetch individual user data - it requires coach/admin access for other users
          if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com') || updatedMember.avatar.startsWith('blob:')) {
            // Use fallback avatar
            updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
          }
          
          // cardBackgroundImage should already be set from getAllUsers response
          // No need to fetch - it's included in the user data from getAllUsers
          
          // Dreams are already loaded from getAllUsers (public dreams only for non-coaches)
          // No need to fetch individual user data - just use what's already provided
          if (updatedMember.dreamBook && updatedMember.dreamBook.length > 0) {
            const actualCount = updatedMember.dreamBook.length;
            if (updatedMember.dreamsCount !== actualCount) {
              updatedMember.dreamsCount = actualCount;
            }
          }
          
          return updatedMember;
        })
      );
      
      setEnhancedMembers(enhanced);
    };

    enhanceInitialMembers();
  }, [teamData, currentUser]);

  // Second enhancement: compute stats
  useEffect(() => {
    const enhanceWithStats = async () => {
      if (!enhancedMembers.length) {
        setTeamMembers([]);
        // Only clear isEnhancing if we're not expecting data
        if (!pendingEnhancementRef.current) {
          setIsEnhancing(false);
        }
        return;
      }

      const enhanced = await Promise.all(
        enhancedMembers.map(async (member) => {
          const memberId = member.id || member.userId;
          const { completedGoalsCount, completedDreamsCount } = calculateCompletionStats(member);
          const weeklyProgress = await calculateWeeklyProgress(memberId);
          const activityStatus = getActivityStatus(member);
          const accentColor = getAccentColor(memberId);

          return {
            ...member,
            completedGoalsCount,
            completedDreamsCount,
            weeklyProgress,
            activityStatus,
            accentColor
          };
        })
      );

      setTeamMembers(enhanced);
      // Enhancement complete
      setIsEnhancing(false);
      pendingEnhancementRef.current = false;
    };

    enhanceWithStats();
  }, [enhancedMembers]);

  return { teamMembers, isEnhancing };
}
