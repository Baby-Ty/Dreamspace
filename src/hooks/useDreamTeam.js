// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { coachingService } from '../services/coachingService';
import { useApp } from '../context/AppContext';
import databaseService from '../services/databaseService';
import { getCurrentWeek } from '../services/currentWeekService';
import peopleService from '../services/peopleService';

/**
 * Custom hook for Dream Team data management
 * Handles fetching team data, computing stats, and determining coach status
 */
export function useDreamTeam() {
  const { currentUser } = useApp();
  
  // Data state
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load team data
  useEffect(() => {
    loadTeamData();
  }, [currentUser?.id, currentUser?.userId]);

  const loadTeamData = useCallback(async () => {
    const userId = currentUser?.id || currentUser?.userId;
    if (!userId) {
      console.log('❌ DreamTeam: No user ID, skipping load');
      setIsLoading(false);
      return;
    }

    console.log('🔄 DreamTeam: Loading team data', {
      currentUserId: userId,
      currentUserName: currentUser?.name
    });

    try {
      setError(null);
      setIsLoading(true);

      // Get team metrics - try as coach first
      let metricsResult = await coachingService.getTeamMetrics(userId);
      
      console.log('🔍 Team metrics result:', {
        success: metricsResult.success,
        hasData: !!metricsResult.data,
        managerId: metricsResult.data?.managerId,
        teamMembersCount: metricsResult.data?.teamMembers?.length,
        userId
      });
      
      if (!metricsResult.success) {
        // If not found as coach, user might be a member - need to find their team
        // Check if user has assignedCoachId or teamManagerId (both fields are used)
        let coachId = currentUser?.assignedCoachId || currentUser?.teamManagerId;
        
        // If coachId is not available, try to find it by querying team relationships
        if (!coachId || coachId === userId) {
          console.log('🔍 Coach ID not found in user data, querying team relationships...');
          try {
            const teamsResult = await peopleService.getTeamRelationships();
            if (teamsResult.success && Array.isArray(teamsResult.data)) {
              // Find the team that contains this user as a member
              const userTeam = teamsResult.data.find(team => 
                team.teamMembers && team.teamMembers.includes(userId)
              );
              if (userTeam && userTeam.managerId) {
                coachId = userTeam.managerId;
                console.log('✅ Found team via team relationships:', coachId);
              }
            }
          } catch (teamQueryError) {
            console.warn('⚠️ Could not query team relationships:', teamQueryError);
          }
        }
        
        if (coachId && coachId !== userId) {
          metricsResult = await coachingService.getTeamMetrics(coachId);
          if (!metricsResult.success) {
            // Extract error message properly (error might be an object or string)
            const errorMsg = typeof metricsResult.error === 'string' 
              ? metricsResult.error 
              : (metricsResult.error?.message || metricsResult.error?.error || 'Team not found');
            throw new Error(errorMsg);
          }
          console.log('✅ DreamTeam: Loaded as team member', {
            coachId,
            managerId: metricsResult.data?.managerId,
            teamMembers: metricsResult.data?.teamMembers?.length
          });
        } else {
          // Extract error message properly (error might be an object or string)
          const errorMsg = typeof metricsResult.error === 'string' 
            ? metricsResult.error 
            : (metricsResult.error?.message || metricsResult.error?.error || 'Team not found');
          throw new Error(errorMsg);
        }
      } else {
        console.log('✅ DreamTeam: Loaded as coach', {
          managerId: metricsResult.data?.managerId,
          teamMembers: metricsResult.data?.teamMembers?.length
        });
      }
      
      // Enhance team members with dreams data if missing, and ensure avatar is loaded
      if (metricsResult.data?.teamMembers) {
        const enhancedMembers = await Promise.all(
          metricsResult.data.teamMembers.map(async (member) => {
            const memberId = member.id || member.userId;
            let updatedMember = { ...member };
            
            // Check if this is the current user FIRST and prioritize their avatar from context
            const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.email;
            const isCurrentUser = memberId === currentUserId || 
                                 memberId === currentUser?.id || 
                                 memberId === currentUser?.userId ||
                                 memberId === currentUser?.email ||
                                 (currentUser?.email && memberId?.includes(currentUser.email)) ||
                                 (currentUser?.id && memberId?.includes(currentUser.id));
            
            if (isCurrentUser) {
              // Use current user's avatar from context (this is the most reliable source)
              if (currentUser?.avatar) {
                const avatarUrl = currentUser.avatar;
                // Only use if it's a real URL (not a fallback)
                if (avatarUrl && !avatarUrl.includes('ui-avatars.com') && !avatarUrl.startsWith('blob:')) {
                  console.log(`✅ Using current user's avatar from context for ${member.name}:`, avatarUrl.substring(0, 80));
                  updatedMember.avatar = avatarUrl;
                }
              }
              
              // Use current user's card background image from context if available
              if (currentUser?.cardBackgroundImage) {
                const bgImageUrl = currentUser.cardBackgroundImage;
                if (bgImageUrl && typeof bgImageUrl === 'string' && bgImageUrl.trim()) {
                  console.log(`✅ Using current user's card background from context for ${member.name}:`, bgImageUrl.substring(0, 80));
                  updatedMember.cardBackgroundImage = bgImageUrl;
                }
              }
            }
            
            // Always load avatar and background image from user data for consistency (same mechanism for all users)
            // This ensures we get the latest avatar and background from the user container
            // But only if we don't already have a real avatar from context
            if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com') || updatedMember.avatar.startsWith('blob:')) {
            try {
              const userDataResult = await databaseService.loadUserData(memberId);
                console.log(`🔍 Loading avatar for ${member.name} (${memberId}):`, {
                  success: userDataResult.success,
                  hasData: !!userDataResult.data,
                  dataKeys: userDataResult.data ? Object.keys(userDataResult.data) : []
                });
                
              if (userDataResult.success && userDataResult.data) {
                // Extract avatar from userData (check multiple possible locations)
                // Priority: avatar field > currentUser.avatar > picture > profile.avatar
                let avatar = userDataResult.data.avatar || 
                            userDataResult.data.currentUser?.avatar || 
                            userDataResult.data.picture ||
                              userDataResult.data.profile?.avatar ||
                              userDataResult.data.profilePicture;
                  
                  console.log(`🔍 Avatar extraction for ${member.name}:`, {
                    'data.avatar': userDataResult.data.avatar,
                    'data.currentUser?.avatar': userDataResult.data.currentUser?.avatar,
                    'data.picture': userDataResult.data.picture,
                    'data.profile?.avatar': userDataResult.data.profile?.avatar,
                    'data.profilePicture': userDataResult.data.profilePicture,
                    extracted: avatar
                  });
                  
                  // Extract card background image
                  const cardBackgroundImage = userDataResult.data.cardBackgroundImage || 
                                            userDataResult.data.currentUser?.cardBackgroundImage;
                  
                  console.log(`🖼️ Card background extraction for ${member.name}:`, {
                    'data.cardBackgroundImage': userDataResult.data.cardBackgroundImage,
                    'data.currentUser?.cardBackgroundImage': userDataResult.data.currentUser?.cardBackgroundImage,
                    extracted: cardBackgroundImage,
                    type: typeof cardBackgroundImage,
                    isString: typeof cardBackgroundImage === 'string',
                    trimmed: cardBackgroundImage && typeof cardBackgroundImage === 'string' ? cardBackgroundImage.trim() : null
                  });
                
                // Check if avatar is a blob URL (temporary, origin-scoped, can't be used)
                if (avatar && typeof avatar === 'string' && avatar.startsWith('blob:')) {
                  console.log(`⚠️ Avatar for ${member.name} is a blob URL (temporary), will use fallback`);
                  avatar = null; // Blob URLs don't work across origins/sessions
                }
                
                // Update avatar if we found a real one (not a fallback or blob URL)
                  // Allow Azure Blob Storage URLs and other valid URLs
                if (avatar && typeof avatar === 'string' && avatar.trim() && 
                    !avatar.includes('ui-avatars.com') && !avatar.startsWith('blob:')) {
                    console.log(`✅ Loaded avatar for ${member.name}:`, avatar.substring(0, 80));
                  updatedMember.avatar = avatar;
                } else {
                  // If no real avatar found, use fallback
                    console.log(`ℹ️ No real avatar found for ${member.name}, using fallback. Extracted value:`, avatar);
                  // Keep existing fallback or set new one
                    if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com') || updatedMember.avatar.startsWith('blob:')) {
                      updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
                    }
                  }

                  // Update card background image if found
                  if (cardBackgroundImage && typeof cardBackgroundImage === 'string' && cardBackgroundImage.trim()) {
                    console.log(`✅ Loaded card background for ${member.name}:`, cardBackgroundImage.substring(0, 80));
                    updatedMember.cardBackgroundImage = cardBackgroundImage;
                  } else {
                    console.log(`ℹ️ No card background found for ${member.name}. Value:`, cardBackgroundImage);
                  }
                } else {
                  console.warn(`⚠️ No user data found for ${member.name} (${memberId})`);
                  // Set fallback if we still don't have an avatar
                  if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com') || updatedMember.avatar.startsWith('blob:')) {
                    updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
                  }
                }
            } catch (avatarError) {
                console.warn(`⚠️ Could not load avatar/background for ${member.name}:`, avatarError);
                // Set fallback if we still don't have an avatar
                if (!updatedMember.avatar || updatedMember.avatar.includes('ui-avatars.com') || updatedMember.avatar.startsWith('blob:')) {
                  updatedMember.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=100`;
                }
              }
            }
            
            // If dreamBook is empty or missing, fetch from dreams container
            if (!updatedMember.dreamBook || updatedMember.dreamBook.length === 0) {
              try {
                const userDataResult = await databaseService.loadUserData(memberId);
                if (userDataResult.success && userDataResult.data) {
                  // Extract dreamBook from userData (could be dreams or dreamBook field)
                  const dreams = userDataResult.data.dreams || userDataResult.data.dreamBook || [];
                  if (dreams.length > 0) {
                    console.log(`✅ Loaded ${dreams.length} dreams for ${member.name}`);
                    updatedMember.dreamBook = dreams;
                    updatedMember.dreamsCount = dreams.length; // Update dreamsCount to match actual dreams
                  }
                }
              } catch (dreamError) {
                console.warn(`⚠️ Could not load dreams for ${member.name}:`, dreamError);
              }
            } else {
              // If dreamBook exists, ensure dreamsCount matches
              const actualCount = updatedMember.dreamBook.length;
              if (updatedMember.dreamsCount !== actualCount) {
                updatedMember.dreamsCount = actualCount;
              }
            }
            
            return updatedMember;
          })
        );
        
        // Update teamData with enhanced members
        setTeamData({
          ...metricsResult.data,
          teamMembers: enhancedMembers
        });
      } else {
        setTeamData(metricsResult.data);
      }
    } catch (err) {
      console.error('❌ Error loading Dream Team data:', err);
      setError(err.message || 'Failed to load team data');
      setTeamData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Helper: Generate accent color from user ID hash
  const getAccentColor = useCallback((userId) => {
    if (!userId) return 'netsurit-red';
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map to Netsurit colors
    const colors = ['netsurit-red', 'netsurit-coral', 'netsurit-orange'];
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Helper: Calculate activity status based on recent activity
  const getActivityStatus = useCallback((member) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check dreams for recent updates (most reliable indicator)
    const recentDreamUpdates = (member.dreamBook || []).filter(dream => {
      const updatedAt = dream.updatedAt || dream.createdAt;
      if (!updatedAt) return false;
      const updateDate = new Date(updatedAt);
      return updateDate > oneWeekAgo;
    });

    // Check connects count change (if connectsCount exists and was recently updated)
    // Note: We don't have access to individual connect timestamps here,
    // so we'll rely primarily on dream updates
    const hasRecentActivity = recentDreamUpdates.length > 0;

    if (hasRecentActivity) {
      return 'active'; // Active this week
    }

    // Check for activity in the past month
    const monthDreamUpdates = (member.dreamBook || []).filter(dream => {
      const updatedAt = dream.updatedAt || dream.createdAt;
      if (!updatedAt) return false;
      const updateDate = new Date(updatedAt);
      return updateDate > oneMonthAgo;
    });

    if (monthDreamUpdates.length > 0) {
      return 'recent'; // Active this month
    }

    return 'inactive'; // No recent activity
  }, []);

  // Helper: Calculate completed goals and dreams counts
  const calculateCompletionStats = useCallback((member) => {
    const dreams = member.dreamBook || [];
    
    // Count completed goals across all dreams
    let completedGoalsCount = 0;
    dreams.forEach(dream => {
      const goals = dream.goals || [];
      completedGoalsCount += goals.filter(g => g.completed === true).length;
    });

    // Count completed dreams (progress === 100 or completed === true)
    const completedDreamsCount = dreams.filter(dream => 
      dream.progress === 100 || dream.completed === true
    ).length;

    return { completedGoalsCount, completedDreamsCount };
  }, []);

  // Helper: Calculate weekly progress percentage
  const calculateWeeklyProgress = useCallback(async (memberId) => {
    try {
      const weekResult = await getCurrentWeek(memberId);
      if (weekResult.success && weekResult.data?.goals) {
        const goals = weekResult.data.goals;
        const totalGoals = goals.length;
        if (totalGoals === 0) return 0;
        const completedGoals = goals.filter(g => g.completed === true).length;
        return Math.round((completedGoals / totalGoals) * 100);
      }
      return 0;
    } catch (error) {
      console.warn(`⚠️ Could not calculate weekly progress for member ${memberId}:`, error);
      return 0;
    }
  }, []);

  // Determine if current user is the coach
  // Check multiple sources: team relationship, user role field, or roles.coach
  const isCoach = useMemo(() => {
    if (!currentUser) return false;
    
    const userId = currentUser.id || currentUser.userId;
    
    // Check 1: User role field (string) - primary check
    if (currentUser.role === 'coach' || currentUser.role === 'manager') {
      console.log('✅ User is coach (role field):', currentUser.role);
      return true;
    }
    
    // Check 2: User roles object (nested) - secondary check
    if (currentUser.roles?.coach === true || currentUser.isCoach === true) {
      console.log('✅ User is coach (roles.coach or isCoach):', currentUser.roles?.coach, currentUser.isCoach);
      return true;
    }
    
    // Check 3: Team relationship (userId matches team managerId) - fallback check
    if (teamData?.managerId) {
      const isTeamCoach = userId === teamData.managerId;
      if (isTeamCoach) {
        console.log('✅ User is coach (team manager):', userId, '===', teamData.managerId);
        return true;
      }
    }
    
    // Check 4: If user has team members assigned, they're likely a coach
    // This is a fallback for cases where team data structure might be different
    if (teamData?.teamMembers && teamData.teamMembers.length > 0) {
      const hasTeamMembers = teamData.teamMembers.some(member => {
        const memberId = member.id || member.userId;
        return memberId !== userId; // Exclude self
      });
      if (hasTeamMembers && teamData.managerId === userId) {
        console.log('✅ User is coach (has team members and is manager):', teamData.teamMembers.length);
        return true;
      }
    }
    
    console.log('❌ User is NOT a coach:', {
      userId,
      role: currentUser.role,
      rolesCoach: currentUser.roles?.coach,
      isCoach: currentUser.isCoach,
      teamManagerId: teamData?.managerId,
      hasTeamMembers: teamData?.teamMembers?.length > 0
    });
    
    return false;
  }, [teamData, currentUser]);

  // Get team members with enhanced metrics (exclude coach if viewing as member)
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const enhanceMembers = async () => {
      if (!teamData?.teamMembers) {
        setTeamMembers([]);
        return;
      }

      const enhanced = await Promise.all(
        teamData.teamMembers.map(async (member) => {
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

    enhanceMembers();
  }, [teamData, calculateCompletionStats, calculateWeeklyProgress, getActivityStatus, getAccentColor]);

  // Compute team statistics
  const teamStats = useMemo(() => {
    if (!teamData || !teamMembers.length) {
      return {
        totalScore: 0,
        averageScore: 0,
        engagementRate: 0,
        totalDreams: 0,
        totalConnects: 0,
        memberRegions: [],
        sharedInterests: [],
        recentlyCompletedDreams: [],
        goalsCloseToFinish: []
      };
    }

    // Basic stats from API
    const totalScore = teamData.totalScore || 0;
    const averageScore = teamData.averageScore || 0;
    const engagementRate = teamData.engagementRate || 0;
    const totalDreams = teamData.totalDreams || 0;
    const totalConnects = teamData.totalConnects || 0;

    // Member regions (unique offices)
    const memberRegions = [...new Set(
      teamMembers
        .map(m => m.office)
        .filter(Boolean)
    )];

    // Shared interests (dream categories that appear in multiple members)
    const categoryCounts = {};
    teamMembers.forEach(member => {
      // Extract categories from dreamCategories or dreamBook
      let categories = member.dreamCategories || [];
      if (categories.length === 0 && member.dreamBook) {
        categories = [...new Set(member.dreamBook.map(d => d.category).filter(Boolean))];
      }
      categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });
    const sharedInterests = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 1)
      .map(([category]) => category)
      .slice(0, 10); // Top 10 shared interests

    // Recently completed dreams (from dreamBook history or completed goals)
    // Only include public dreams
    const recentlyCompletedDreams = [];
    teamMembers.forEach(member => {
      const dreams = (member.dreamBook || []).filter(dream => dream.isPublic === true);
      dreams.forEach(dream => {
        // Check if dream has completed goals or is marked as completed
        const hasCompletedGoals = dream.goals?.some(g => g.completed) || false;
        const isCompleted = dream.progress === 100 || dream.completed;
        if (hasCompletedGoals || isCompleted) {
          recentlyCompletedDreams.push({
            dreamId: dream.id,
            title: dream.title,
            category: dream.category,
            memberName: member.name,
            memberId: member.id,
            completedAt: dream.updatedAt || dream.createdAt
          });
        }
      });
    });
    // Sort by completion date (most recent first) and limit to 5
    recentlyCompletedDreams.sort((a, b) => {
      const dateA = new Date(a.completedAt || 0);
      const dateB = new Date(b.completedAt || 0);
      return dateB - dateA;
    });

    // Goals close to finish (weeksRemaining <= 2)
    // Only include goals from public dreams
    const goalsCloseToFinish = [];
    teamMembers.forEach(member => {
      const dreams = (member.dreamBook || []).filter(dream => dream.isPublic === true);
      dreams.forEach(dream => {
        const goals = dream.goals || [];
        goals.forEach(goal => {
          if (goal.active && !goal.completed && goal.weeksRemaining !== undefined) {
            if (goal.weeksRemaining <= 2 && goal.weeksRemaining > 0) {
              goalsCloseToFinish.push({
                goalId: goal.id,
                goalTitle: goal.title,
                dreamTitle: dream.title,
                dreamCategory: dream.category,
                memberName: member.name,
                memberId: member.id,
                weeksRemaining: goal.weeksRemaining
              });
            }
          }
        });
      });
    });
    // Sort by weeks remaining (fewest first)
    goalsCloseToFinish.sort((a, b) => a.weeksRemaining - b.weeksRemaining);

    return {
      totalScore,
      averageScore,
      engagementRate,
      totalDreams,
      totalConnects,
      memberRegions,
      sharedInterests,
      recentlyCompletedDreams: recentlyCompletedDreams.slice(0, 5),
      goalsCloseToFinish: goalsCloseToFinish.slice(0, 5)
    };
  }, [teamData, teamMembers]);

  return {
    // Data
    teamData,
    teamMembers,
    teamStats,
    isCoach,
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshData: loadTeamData
  };
}

