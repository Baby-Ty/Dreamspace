/**
 * Create Mock Data for DreamSpace Testing
 * 
 * This script creates realistic mock users, dreams, goals, and teams
 * exactly as they would be created through the app by real users.
 * 
 * Usage: node scripts/createMockData.js
 * 
 * Requires: COSMOS_ENDPOINT and COSMOS_KEY environment variables
 */

const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client
if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
  console.error('❌ Error: COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
  process.exit(1);
}

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

const database = client.database('dreamspace');

// Helper: Get ISO week string from date
function getIsoWeek(date = new Date()) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  const year = target.getFullYear();
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper: Get week start date (Monday)
function getWeekStartDate(weekId) {
  const [year, week] = weekId.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4Day + 1);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  return weekStart.toISOString().split('T')[0];
}

// Helper: Get week end date (Sunday)
function getWeekEndDate(weekId) {
  const startDate = getWeekStartDate(weekId);
  const start = new Date(startDate);
  start.setDate(start.getDate() + 6);
  return start.toISOString().split('T')[0];
}

// Helper: Generate unique ID
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Mock Users Data
const mockUsers = [
  // Admin
  {
    id: 'admin@netsurit.com',
    userId: 'admin@netsurit.com',
    name: 'Sarah Johnson',
    email: 'admin@netsurit.com',
    office: 'Cape Town',
    avatar: '',
    role: 'admin',
    isCoach: true,
    assignedCoachId: null,
    assignedTeamName: null,
    score: 245,
    dreamsCount: 6,
    connectsCount: 8,
    dataStructureVersion: 4,
    createdAt: '2025-01-15T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  // Coach 1
  {
    id: 'coach1@netsurit.com',
    userId: 'coach1@netsurit.com',
    name: 'Michael Chen',
    email: 'coach1@netsurit.com',
    office: 'Cape Town',
    avatar: '',
    role: 'coach',
    isCoach: true,
    assignedCoachId: null,
    assignedTeamName: 'Team Alpha',
    score: 180,
    dreamsCount: 5,
    connectsCount: 12,
    dataStructureVersion: 4,
    createdAt: '2025-01-20T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  // Coach 2
  {
    id: 'coach2@netsurit.com',
    userId: 'coach2@netsurit.com',
    name: 'Emma Williams',
    email: 'coach2@netsurit.com',
    office: 'Johannesburg',
    avatar: '',
    role: 'coach',
    isCoach: true,
    assignedCoachId: null,
    assignedTeamName: 'Team Beta',
    score: 195,
    dreamsCount: 4,
    connectsCount: 10,
    dataStructureVersion: 4,
    createdAt: '2025-01-22T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  // Regular Users
  {
    id: 'user1@netsurit.com',
    userId: 'user1@netsurit.com',
    name: 'David Thompson',
    email: 'user1@netsurit.com',
    office: 'Cape Town',
    avatar: '',
    role: 'user',
    isCoach: false,
    assignedCoachId: 'coach1@netsurit.com',
    assignedTeamName: 'Team Alpha',
    score: 125,
    dreamsCount: 4,
    connectsCount: 6,
    dataStructureVersion: 4,
    assignedAt: '2025-02-01T10:00:00.000Z',
    createdAt: '2025-02-01T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'user2@netsurit.com',
    userId: 'user2@netsurit.com',
    name: 'Lisa Anderson',
    email: 'user2@netsurit.com',
    office: 'Cape Town',
    avatar: '',
    role: 'user',
    isCoach: false,
    assignedCoachId: 'coach1@netsurit.com',
    assignedTeamName: 'Team Alpha',
    score: 95,
    dreamsCount: 3,
    connectsCount: 4,
    dataStructureVersion: 4,
    assignedAt: '2025-02-05T10:00:00.000Z',
    createdAt: '2025-02-05T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'user3@netsurit.com',
    userId: 'user3@netsurit.com',
    name: 'James Wilson',
    email: 'user3@netsurit.com',
    office: 'Johannesburg',
    avatar: '',
    role: 'user',
    isCoach: false,
    assignedCoachId: 'coach2@netsurit.com',
    assignedTeamName: 'Team Beta',
    score: 110,
    dreamsCount: 3,
    connectsCount: 5,
    dataStructureVersion: 4,
    assignedAt: '2025-02-10T10:00:00.000Z',
    createdAt: '2025-02-10T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'user4@netsurit.com',
    userId: 'user4@netsurit.com',
    name: 'Rachel Martinez',
    email: 'user4@netsurit.com',
    office: 'Johannesburg',
    avatar: '',
    role: 'user',
    isCoach: false,
    assignedCoachId: 'coach2@netsurit.com',
    assignedTeamName: 'Team Beta',
    score: 75,
    dreamsCount: 2,
    connectsCount: 3,
    dataStructureVersion: 4,
    assignedAt: '2025-02-15T10:00:00.000Z',
    createdAt: '2025-02-15T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'user5@netsurit.com',
    userId: 'user5@netsurit.com',
    name: 'Alex Brown',
    email: 'user5@netsurit.com',
    office: 'Cape Town',
    avatar: '',
    role: 'user',
    isCoach: false,
    assignedCoachId: 'coach1@netsurit.com',
    assignedTeamName: 'Team Alpha',
    score: 60,
    dreamsCount: 2,
    connectsCount: 2,
    dataStructureVersion: 4,
    assignedAt: '2025-02-20T10:00:00.000Z',
    createdAt: '2025-02-20T10:00:00.000Z',
    lastUpdated: new Date().toISOString()
  }
];

// Dream categories
const categories = [
  'Family & Friends',
  'Skills & Hobbies',
  'Growth & Learning',
  'Spirituality & Mind',
  'Adventure & Fun',
  'Love & Relationships',
  'Wellness & Fitness',
  'Money & Wealth',
  'Contribution & Giving Back'
];

// Generate dreams for a user
function generateDreams(userId, userName, count = 3) {
  const dreams = [];
  const dreamTitles = [
    ['Run a Marathon', 'Learn Spanish', 'Start a Side Business', 'Write a Book', 'Travel to Japan'],
    ['Complete a Triathlon', 'Master Guitar', 'Launch a Podcast', 'Volunteer Weekly', 'Buy a House'],
    ['Get Certified in AWS', 'Learn Photography', 'Start a Blog', 'Mentor Someone', 'Learn to Cook'],
    ['Run 5km Weekly', 'Read 50 Books', 'Save for Retirement', 'Build an App', 'Join a Club']
  ];
  
  const selectedTitles = dreamTitles[Math.floor(Math.random() * dreamTitles.length)];
  
  for (let i = 0; i < Math.min(count, selectedTitles.length); i++) {
    const dreamId = generateId('dream');
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString();
    const category = categories[Math.floor(Math.random() * categories.length)];
    const progress = Math.floor(Math.random() * 60) + 10;
    
    // Generate goals for this dream
    const goals = [];
    
    // Consistency goal (weekly)
    if (Math.random() > 0.3) {
      const targetWeeks = [8, 12, 16, 20][Math.floor(Math.random() * 4)];
      const weeksRemaining = Math.max(0, targetWeeks - Math.floor(Math.random() * targetWeeks * 0.6));
      goals.push({
        id: generateId('goal'),
        title: `Work on ${selectedTitles[i]}`,
        description: `Weekly progress towards ${selectedTitles[i]}`,
        type: 'consistency',
        recurrence: 'weekly',
        targetWeeks: targetWeeks,
        weeksRemaining: weeksRemaining,
        active: weeksRemaining > 0,
        completed: weeksRemaining === 0,
        createdAt: createdAt
      });
    }
    
    // Deadline goal
    if (Math.random() > 0.5) {
      const targetDate = new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000);
      const weeksUntilDeadline = Math.ceil((targetDate - new Date()) / (7 * 24 * 60 * 60 * 1000));
      goals.push({
        id: generateId('goal'),
        title: `Complete milestone for ${selectedTitles[i]}`,
        description: `Reach a key milestone`,
        type: 'deadline',
        targetDate: targetDate.toISOString().split('T')[0],
        targetWeeks: Math.max(1, weeksUntilDeadline),
        weeksRemaining: Math.max(0, weeksUntilDeadline),
        active: weeksUntilDeadline > 0,
        completed: false,
        createdAt: createdAt
      });
    }
    
    dreams.push({
      id: dreamId,
      title: selectedTitles[i],
      description: `I want to ${selectedTitles[i].toLowerCase()} and make meaningful progress.`,
      category: category,
      progress: progress,
      goals: goals,
      notes: [],
      history: [],
      createdAt: createdAt,
      updatedAt: new Date().toISOString()
    });
  }
  
  return dreams;
}

// Generate weekly goal templates from dreams
function generateWeeklyGoalTemplates(dreams) {
  const templates = [];
  
  dreams.forEach(dream => {
    dream.goals.forEach(goal => {
      if (goal.type === 'consistency' && goal.recurrence === 'weekly' && goal.active) {
        templates.push({
          id: generateId('template'),
          type: 'weekly_goal_template',
          goalType: 'consistency',
          title: goal.title,
          description: goal.description,
          dreamId: dream.id,
          dreamTitle: dream.title,
          dreamCategory: dream.category,
          goalId: goal.id,
          recurrence: 'weekly',
          active: true,
          durationType: 'weeks',
          durationWeeks: goal.targetWeeks,
          targetWeeks: goal.targetWeeks,
          weeksRemaining: goal.weeksRemaining,
          startDate: goal.createdAt.split('T')[0],
          createdAt: goal.createdAt
        });
      }
    });
  });
  
  return templates;
}

// Generate current week goals
function generateCurrentWeekGoals(dreams, templates, weekId) {
  const goals = [];
  const currentDate = new Date();
  
  templates.forEach(template => {
    if (template.active && template.weeksRemaining > 0) {
      // Create goal instance for current week
      goals.push({
        id: generateId('goal_instance'),
        templateId: template.id,
        type: 'weekly_goal',
        title: template.title,
        dreamId: template.dreamId,
        dreamTitle: template.dreamTitle,
        dreamCategory: template.dreamCategory,
        recurrence: 'weekly',
        targetWeeks: template.targetWeeks,
        weeksRemaining: template.weeksRemaining,
        completed: Math.random() > 0.6, // 40% chance of being completed
        completedAt: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        skipped: false,
        weekId: weekId,
        createdAt: getWeekStartDate(weekId)
      });
    }
  });
  
  // Add deadline goals
  dreams.forEach(dream => {
    dream.goals.forEach(goal => {
      if (goal.type === 'deadline' && goal.active && goal.weeksRemaining > 0) {
        goals.push({
          id: generateId('goal_deadline'),
          templateId: goal.id,
          type: 'deadline',
          title: goal.title,
          dreamId: dream.id,
          dreamTitle: dream.title,
          dreamCategory: dream.category,
          targetWeeks: goal.targetWeeks,
          targetDate: goal.targetDate,
          weeksRemaining: goal.weeksRemaining,
          completed: false,
          completedAt: null,
          skipped: false,
          weekId: weekId,
          createdAt: goal.createdAt
        });
      }
    });
  });
  
  return goals;
}

// Generate past weeks history
function generatePastWeeksHistory(userId, weeksBack = 5) {
  const currentWeekId = getIsoWeek();
  const [currentYear, currentWeek] = currentWeekId.split('-W').map(Number);
  
  const weekHistory = {};
  
  for (let i = weeksBack; i >= 1; i--) {
    const weekNum = currentWeek - i;
    if (weekNum < 1) continue; // Skip if before current year
    
    const weekId = `${currentYear}-W${String(weekNum).padStart(2, '0')}`;
    const totalGoals = Math.floor(Math.random() * 5) + 2;
    const completedGoals = Math.floor(Math.random() * (totalGoals - 1)) + 1;
    
    weekHistory[weekId] = {
      totalGoals: totalGoals,
      completedGoals: completedGoals,
      score: completedGoals * 3, // 3 points per completed goal
      weekStartDate: getWeekStartDate(weekId),
      weekEndDate: getWeekEndDate(weekId)
    };
  }
  
  return {
    id: userId,
    userId: userId,
    weekHistory: weekHistory,
    totalWeeksTracked: Object.keys(weekHistory).length,
    createdAt: new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Generate connects for a user
function generateConnects(userId, userName, allUsers, dreams, count = 3) {
  const connects = [];
  const otherUsers = allUsers.filter(u => u.userId !== userId && u.role !== 'admin');
  
  if (otherUsers.length === 0 || !dreams || dreams.length === 0) return connects;
  
  for (let i = 0; i < Math.min(count, otherUsers.length); i++) {
    const otherUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    const dream = dreams[Math.floor(Math.random() * dreams.length)];
    const daysAgo = Math.floor(Math.random() * 60);
    const when = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    connects.push({
      id: generateId('connect'),
      userId: userId,
      type: 'connect',
      dreamId: dream.id,
      withWhom: otherUser.name,
      withWhomId: otherUser.userId,
      when: when.toISOString().split('T')[0],
      notes: `Great conversation about ${dream.title} with ${otherUser.name.split(' ')[0]}.`,
      createdAt: when.toISOString(),
      updatedAt: when.toISOString()
    });
  }
  
  return connects;
}

// Generate scoring document for a user
function generateScoring(userId, year, dreams, connects, pastWeeks) {
  const entries = [];
  let totalScore = 0;
  
  // Scoring rules: dream=10, connect=5, weekly goal=3
  const scoringRules = {
    dream: 10,
    connect: 5,
    week: 3
  };
  
  // Add dream entries
  if (dreams && dreams.length > 0) {
    dreams.forEach((dream, index) => {
      const dreamDate = new Date(Date.now() - (dreams.length - index) * 7 * 24 * 60 * 60 * 1000);
      entries.push({
        id: generateId('score'),
        date: dreamDate.toISOString().split('T')[0],
        source: 'dream',
        dreamId: dream.id,
        points: scoringRules.dream,
        activity: `Added dream: ${dream.title}`,
        createdAt: dreamDate.toISOString()
      });
      totalScore += scoringRules.dream;
    });
  }
  
  // Add connect entries
  if (connects && connects.length > 0) {
    connects.forEach(connect => {
      entries.push({
        id: generateId('score'),
        date: connect.when,
        source: 'connect',
        connectId: connect.id,
        dreamId: connect.dreamId,
        points: scoringRules.connect,
        activity: `Connected with ${connect.withWhom}`,
        createdAt: connect.createdAt
      });
      totalScore += scoringRules.connect;
    });
  }
  
  // Add weekly goal entries from past weeks
  if (pastWeeks && pastWeeks.weekHistory) {
    Object.entries(pastWeeks.weekHistory).forEach(([weekId, weekData]) => {
      for (let i = 0; i < weekData.completedGoals; i++) {
        const weekStart = new Date(weekData.weekStartDate);
        const goalDate = new Date(weekStart.getTime() + (i % 7) * 24 * 60 * 60 * 1000);
        entries.push({
          id: generateId('score'),
          date: goalDate.toISOString().split('T')[0],
          source: 'week',
          weekId: weekId,
          points: scoringRules.week,
          activity: `Completed weekly goal`,
          createdAt: goalDate.toISOString()
        });
        totalScore += scoringRules.week;
      }
    });
  }
  
  // Sort entries by date
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return {
    id: `${userId}_${year}_scoring`,
    userId: userId,
    year: year,
    totalScore: totalScore,
    entries: entries,
    createdAt: entries.length > 0 ? entries[0].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Main function
async function createMockData() {
  console.log('🚀 Starting mock data creation...\n');
  
  try {
    const usersContainer = database.container('users');
    const dreamsContainer = database.container('dreams');
    const currentWeekContainer = database.container('currentWeek');
    const pastWeeksContainer = database.container('pastWeeks');
    const teamsContainer = database.container('teams');
    const connectsContainer = database.container('connects');
    const scoringContainer = database.container('scoring');
    
    const currentWeekId = getIsoWeek();
    console.log(`📅 Current week: ${currentWeekId}\n`);
    
    // 1. Create users
    console.log('👥 Creating users...');
    for (const user of mockUsers) {
      try {
        await usersContainer.items.upsert(user);
        console.log(`  ✅ Created user: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`  ❌ Error creating user ${user.email}:`, error.message);
      }
    }
    console.log('');
    
    // 2. Create dreams and templates for each user
    console.log('💭 Creating dreams and goals...');
    for (const user of mockUsers) {
      if (user.role === 'admin') continue; // Skip admin for now
      
      try {
        const dreams = generateDreams(user.userId, user.name, user.dreamsCount);
        const templates = generateWeeklyGoalTemplates(dreams);
        
        const dreamsDoc = {
          id: user.userId,
          userId: user.userId,
          dreamBook: dreams,
          weeklyGoalTemplates: templates,
          createdAt: user.createdAt,
          updatedAt: new Date().toISOString()
        };
        
        await dreamsContainer.items.upsert(dreamsDoc);
        console.log(`  ✅ Created ${dreams.length} dreams and ${templates.length} templates for ${user.name}`);
      } catch (error) {
        console.error(`  ❌ Error creating dreams for ${user.email}:`, error.message);
      }
    }
    console.log('');
    
    // 3. Create current week documents
    console.log('📆 Creating current week goals...');
    for (const user of mockUsers) {
      if (user.role === 'admin') continue;
      
      try {
        // Get user's dreams to generate goals
        const { resource: dreamsDoc } = await dreamsContainer.item(user.userId, user.userId).read();
        
        if (dreamsDoc && dreamsDoc.dreamBook) {
          const goals = generateCurrentWeekGoals(
            dreamsDoc.dreamBook,
            dreamsDoc.weeklyGoalTemplates || [],
            currentWeekId
          );
          
          const currentWeekDoc = {
            id: user.userId,
            userId: user.userId,
            weekId: currentWeekId,
            weekStartDate: getWeekStartDate(currentWeekId),
            weekEndDate: getWeekEndDate(currentWeekId),
            goals: goals,
            stats: {
              totalGoals: goals.length,
              completedGoals: goals.filter(g => g.completed).length,
              skippedGoals: goals.filter(g => g.skipped).length,
              score: goals.filter(g => g.completed).length * 3
            },
            createdAt: getWeekStartDate(currentWeekId),
            updatedAt: new Date().toISOString()
          };
          
          await currentWeekContainer.items.upsert(currentWeekDoc);
          console.log(`  ✅ Created current week with ${goals.length} goals for ${user.name}`);
        }
      } catch (error) {
        if (error.code === 404) {
          console.log(`  ⚠️  No dreams found for ${user.name}, skipping current week`);
        } else {
          console.error(`  ❌ Error creating current week for ${user.email}:`, error.message);
        }
      }
    }
    console.log('');
    
    // 4. Create past weeks history
    console.log('📚 Creating past weeks history...');
    for (const user of mockUsers) {
      if (user.role === 'admin') continue;
      
      try {
        const pastWeeksDoc = generatePastWeeksHistory(user.userId, 5);
        await pastWeeksContainer.items.upsert(pastWeeksDoc);
        console.log(`  ✅ Created past weeks history for ${user.name} (${pastWeeksDoc.totalWeeksTracked} weeks)`);
      } catch (error) {
        console.error(`  ❌ Error creating past weeks for ${user.email}:`, error.message);
      }
    }
    console.log('');
    
    // 5. Create teams
    console.log('👨‍👩‍👧‍👦 Creating teams...');
    
    // Team Alpha (Coach 1)
    const teamAlpha = {
      id: `team_${Date.now()}_alpha`,
      managerId: 'coach1@netsurit.com',
      managerName: 'Michael Chen',
      teamName: 'Team Alpha',
      type: 'team_relationship',
      teamMembers: [
        'user1@netsurit.com',
        'user2@netsurit.com',
        'user5@netsurit.com'
      ],
      createdAt: '2025-02-01T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    try {
      await teamsContainer.items.upsert(teamAlpha);
      console.log(`  ✅ Created Team Alpha with ${teamAlpha.teamMembers.length} members`);
    } catch (error) {
      console.error(`  ❌ Error creating Team Alpha:`, error.message);
    }
    
    // Team Beta (Coach 2)
    const teamBeta = {
      id: `team_${Date.now()}_beta`,
      managerId: 'coach2@netsurit.com',
      managerName: 'Emma Williams',
      teamName: 'Team Beta',
      type: 'team_relationship',
      teamMembers: [
        'user3@netsurit.com',
        'user4@netsurit.com'
      ],
      createdAt: '2025-02-10T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    try {
      await teamsContainer.items.upsert(teamBeta);
      console.log(`  ✅ Created Team Beta with ${teamBeta.teamMembers.length} members`);
    } catch (error) {
      console.error(`  ❌ Error creating Team Beta:`, error.message);
    }
    
    // 6. Create connects
    console.log('🤝 Creating connects...');
    for (const user of mockUsers) {
      if (user.role === 'admin') continue;
      
      try {
        const { resource: dreamsDoc } = await dreamsContainer.item(user.userId, user.userId).read();
        
        if (dreamsDoc && dreamsDoc.dreamBook) {
          const connects = generateConnects(
            user.userId,
            user.name,
            mockUsers,
            dreamsDoc.dreamBook,
            user.connectsCount || 3
          );
          
          for (const connect of connects) {
            await connectsContainer.items.upsert(connect);
          }
          
          console.log(`  ✅ Created ${connects.length} connects for ${user.name}`);
        }
      } catch (error) {
        if (error.code === 404) {
          console.log(`  ⚠️  No dreams found for ${user.name}, skipping connects`);
        } else {
          console.error(`  ❌ Error creating connects for ${user.email}:`, error.message);
        }
      }
    }
    console.log('');
    
    // 7. Create scoring documents
    console.log('📊 Creating scoring documents...');
    const currentYear = new Date().getFullYear();
    
    for (const user of mockUsers) {
      if (user.role === 'admin') continue;
      
      try {
        const { resource: dreamsDoc } = await dreamsContainer.item(user.userId, user.userId).read().catch(() => ({ resource: null }));
        let pastWeeksDoc = null;
        try {
          const result = await pastWeeksContainer.item(user.userId, user.userId).read();
          pastWeeksDoc = result.resource;
        } catch (error) {
          if (error.code !== 404) {
            throw error;
          }
        }
        
        // Get user's connects
        const connectsQuery = {
          query: 'SELECT * FROM c WHERE c.userId = @userId',
          parameters: [{ name: '@userId', value: user.userId }]
        };
        const { resources: connects } = await connectsContainer.items.query(connectsQuery).fetchAll();
        
        const scoringDoc = generateScoring(
          user.userId,
          currentYear,
          dreamsDoc?.dreamBook || [],
          connects,
          pastWeeksDoc
        );
        
        await scoringContainer.items.upsert(scoringDoc);
        console.log(`  ✅ Created scoring document for ${user.name} (${scoringDoc.totalScore} points)`);
      } catch (error) {
        console.error(`  ❌ Error creating scoring for ${user.email}:`, error.message);
      }
    }
    console.log('');
    
    console.log('✅ Mock data creation complete!');
    console.log('\n📊 Summary:');
    console.log(`  - Users: ${mockUsers.length}`);
    console.log(`  - Teams: 2`);
    console.log(`  - Current week: ${currentWeekId}`);
    console.log(`  - Connects: Created for all users`);
    console.log(`  - Scoring: Created for year ${currentYear}`);
    console.log('\n💡 You can now test the admin and team sections with this data.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
createMockData().catch(console.error);

