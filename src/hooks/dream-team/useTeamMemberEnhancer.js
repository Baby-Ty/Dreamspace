import { useState, useEffect } from 'react';
import databaseService from '../../services/databaseService';
import { getAccentColor, getActivityStatus, calculateCompletionStats, calculateWeeklyProgress } from './teamHelpers';

/**
 * Hook to enhance team members with avatars, dreams, and computed stats
 */
export function useTeamMemberEnhancer(teamData, currentUser) {
  const [enhancedMembers, setEnhancedMembers] = useState([]);

  // Initial enhancement: load avatars and dreams
  useEffect(() => {
    const enhanceInitialMembers = async () => {
      if (!teamData?.teamMembers) {
        setEnhancedMembers([]);
        return;
      }

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
          
          // Load avatar and background if needed
          const needsAvatarLoad = !updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com') || updatedMember.avatar.startsWith('blob:');
          const needsBackgroundLoad = !updatedMember.cardBackgroundImage || 
                                    (typeof updatedMember.cardBackgroundImage === 'string' && !updatedMember.cardBackgroundImage.trim());
          
          if (needsAvatarLoad || needsBackgroundLoad) {
            try {
              const userDataResult = await databaseService.loadUserData(memberId);
              
              if (userDataResult.success && userDataResult.data) {
                // Extract avatar
                let avatar = userDataResult.data.avatar || 
                            userDataResult.data.currentUser?.avatar || 
                            userDataResult.data.picture ||
                            userDataResult.data.profile?.avatar ||
                            userDataResult.data.profilePicture;
                
                // Skip blob URLs
                if (avatar && typeof avatar === 'string' && avatar.startsWith('blob:')) {
                  avatar = null;
                }
                
                if (avatar && typeof avatar === 'string' && avatar.trim() && 
                    !avatar.includes('ui-avatars.com') && !avatar.startsWith('blob:')) {
                  updatedMember.avatar = avatar;
                } else if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com')) {
                  updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
                }

                // Extract card background
                const cardBackgroundImage = userDataResult.data.cardBackgroundImage || 
                                          userDataResult.data.currentUser?.cardBackgroundImage;
                
                if (cardBackgroundImage && typeof cardBackgroundImage === 'string' && cardBackgroundImage.trim()) {
                  updatedMember.cardBackgroundImage = cardBackgroundImage;
                }
              } else {
                if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com')) {
                  updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
                }
              }
            } catch (avatarError) {
              console.warn(`⚠️ Could not load avatar/background for ${member.name}:`, avatarError);
              if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com')) {
                updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
              }
            }
          }
          
          // Load dreams if missing
          if (!updatedMember.dreamBook || updatedMember.dreamBook.length === 0) {
            try {
              const userDataResult = await databaseService.loadUserData(memberId);
              if (userDataResult.success && userDataResult.data) {
                const dreams = userDataResult.data.dreams || userDataResult.data.dreamBook || [];
                if (dreams.length > 0) {
                  console.log(`✅ Loaded ${dreams.length} dreams for ${member.name}`);
                  updatedMember.dreamBook = dreams;
                  updatedMember.dreamsCount = dreams.length;
                }
              }
            } catch (dreamError) {
              console.warn(`⚠️ Could not load dreams for ${member.name}:`, dreamError);
            }
          } else {
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
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const enhanceWithStats = async () => {
      if (!enhancedMembers.length) {
        setTeamMembers([]);
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
    };

    enhanceWithStats();
  }, [enhancedMembers]);

  return teamMembers;
}
