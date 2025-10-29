// Mock data for DreamSpace application
// Note: This file is kept for local development structure only
// All user data will be loaded from Cosmos DB in production

export const currentUser = {
  id: null,
  name: "",
  email: "",
  office: "",
  avatar: "",
  dreamCategories: [],
  dreamBook: [],
  weeklyGoals: [],
  careerGoals: [],
  developmentPlan: [],
  careerProfile: {
    currentRole: {
      jobTitle: "",
      department: "",
      startDate: "",
      location: ""
    },
    aspirations: {
      desiredJobTitle: "",
      preferredDepartment: "",
      interestedInRelocation: false,
      preferredGeography: ""
    },
    preferences: {
      wantToDo: [],
      dontWantToDo: [],
      motivators: []
    },
    careerHighlights: [],
    skills: {
      technical: [],
      soft: []
    }
  },
  score: 0,
  connects: []
};

export const dreamCategories = [
  "Family & Friends",
  "Skills & Hobbies",
  "Growth & Learning",
  "Spirituality & Mind",
  "Adventure & Fun",
  "Love & Relationships",
  "Wellness & Fitness",
  "Money & Wealth",
  "Contribution & Giving Back"
];

// Empty array - users will be loaded from database in production
export const allUsers = [];

export const offices = ["Cape Town", "Johannesburg", "Durban", "Pretoria"];

export const scoringRules = {
  dreamCompleted: 10,
  dreamConnect: 5,
  groupAttendance: 3,
  milestoneCompleted: 15,
  weeklyGoalCompleted: 3
};

// Helper functions
export const getSharedCategories = (user1Categories, user2Categories) => {
  return user1Categories.filter(cat => user2Categories.includes(cat));
};

export const getSuggestedConnections = (currentUserId) => {
  const currentUserData = allUsers.find(u => u.id === currentUserId);
  if (!currentUserData) return [];
  
  return allUsers
    .filter(user => user.id !== currentUserId)
    .map(user => ({
      ...user,
      sharedCategories: getSharedCategories(currentUserData.dreamCategories, user.dreamCategories)
    }))
    .sort((a, b) => {
      const diff = b.sharedCategories.length - a.sharedCategories.length;
      if (diff !== 0) return diff;
      return (b.score || 0) - (a.score || 0);
    });
};

// Team management data - empty in production, loaded from database
export const teamRelationships = [];

// Coaching notes - empty in production, loaded from database
export const coachingNotes = [];

// Team performance metrics
export const getTeamMetrics = (managerId) => {
  const team = teamRelationships.find(t => t.managerId === managerId);
  if (!team) return null;

  const teamMembers = allUsers.filter(u => team.teamMembers.includes(u.id));
  
  const totalDreams = teamMembers.reduce((sum, member) => sum + (member.dreamsCount || 0), 0);
  const totalConnects = teamMembers.reduce((sum, member) => sum + (member.connectsCount || 0), 0);
  const totalScore = teamMembers.reduce((sum, member) => sum + (member.score || 0), 0);
  const averageScore = teamMembers.length ? Math.round(totalScore / teamMembers.length) : 0;
  
  const activeMembersCount = teamMembers.filter(member => {
    const hasRecentActivity = member.score > 0;
    return hasRecentActivity;
  }).length;
  
  const engagementRate = teamMembers.length ? Math.round((activeMembersCount / teamMembers.length) * 100) : 0;
  
  return {
    teamSize: teamMembers.length,
    totalDreams,
    totalConnects,
    averageScore,
    engagementRate,
    activeMembersCount,
    teamMembers
  };
};

// Get coaching alerts for a manager
export const getCoachingAlerts = (managerId) => {
  const team = teamRelationships.find(t => t.managerId === managerId);
  if (!team) return [];

  const teamMembers = allUsers.filter(u => team.teamMembers.includes(u.id));
  const alerts = [];

  teamMembers.forEach(member => {
    // Low engagement alert
    if (member.score < 20) {
      alerts.push({
        id: `low-engagement-${member.id}`,
        type: 'low_engagement',
        priority: 'medium',
        memberId: member.id,
        memberName: member.name,
        message: `${member.name} has low engagement (${member.score} points)`,
        actionSuggestion: 'Schedule a one-on-one check-in'
      });
    }

    // High performer recognition
    if (member.score > 60) {
      alerts.push({
        id: `high-performer-${member.id}`,
        type: 'recognition',
        priority: 'low',
        memberId: member.id,
        memberName: member.name,
        message: `${member.name} is a high performer (${member.score} points)`,
        actionSuggestion: 'Consider for peer mentoring opportunities'
      });
    }

    // Few dreams alert
    if ((member.dreamsCount || 0) < 3) {
      alerts.push({
        id: `few-dreams-${member.id}`,
        type: 'goal_setting',
        priority: 'medium',
        memberId: member.id,
        memberName: member.name,
        message: `${member.name} has only ${member.dreamsCount || 0} dreams`,
        actionSuggestion: 'Help with dream brainstorming session'
      });
    }
  });

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Weekly Goals Helper Functions
export const getWeeklyGoals = (userId = 1) => {
  const user = allUsers.find(u => u.id === userId) || currentUser;
  return user.weeklyGoals || null;
};

export const updateWeeklyGoalProgress = (userId, goalId, completed) => {
  const user = allUsers.find(u => u.id === userId);
  if (!user || !user.weeklyGoals) return false;
  
  const goal = user.weeklyGoals.goals?.find(g => g.id === goalId);
  if (!goal) return false;
  
  goal.completed = completed;
  
  // Update overall progress
  const completedCount = user.weeklyGoals.goals.filter(g => g.completed).length;
  user.weeklyGoals.completedGoals = completedCount;
  user.weeklyGoals.progressPercentage = Math.round((completedCount / user.weeklyGoals.totalGoals) * 100);
  
  return true;
};

export const addWeeklyGoal = (userId, goalData) => {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return false;
  
  if (!user.weeklyGoals) {
    user.weeklyGoals = {
      weekNumber: 1,
      dateRange: "",
      year: new Date().getFullYear(),
      totalGoals: 0,
      completedGoals: 0,
      progressPercentage: 0,
      goals: []
    };
  }
  
  const newGoal = {
    id: (user.weeklyGoals.goals?.length || 0) + 1,
    ...goalData,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  user.weeklyGoals.goals.push(newGoal);
  user.weeklyGoals.totalGoals = user.weeklyGoals.goals.length;
  
  return newGoal;
};
