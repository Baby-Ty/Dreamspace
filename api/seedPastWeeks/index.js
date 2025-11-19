/**
 * Azure Function: Seed Past Weeks (Development Only)
 * Seeds sample past weeks data for testing
 * 
 * Route: POST /api/seedPastWeeks
 * Body: { userId: string }
 */

const { getCosmosProvider } = require('../utils/cosmosProvider');

/**
 * Generate sample past weeks document
 */
function generateSamplePastWeeks(userId) {
  function generateWeekData(weekId, weekStartDate, totalGoals, completedGoals) {
    const score = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      totalGoals,
      completedGoals,
      skippedGoals: Math.max(0, totalGoals - completedGoals),
      score,
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      archivedAt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  const weekHistory = {};
  
  // Generate 10 weeks of historical data (Sept - Nov 2025)
  const weekData = [
    { weekId: '2025-W37', date: '2025-09-08', total: 5, completed: 4 },
    { weekId: '2025-W38', date: '2025-09-15', total: 6, completed: 6 },
    { weekId: '2025-W39', date: '2025-09-22', total: 7, completed: 3 },
    { weekId: '2025-W40', date: '2025-09-29', total: 5, completed: 3 },
    { weekId: '2025-W41', date: '2025-10-06', total: 6, completed: 5 },
    { weekId: '2025-W42', date: '2025-10-13', total: 5, completed: 5 },
    { weekId: '2025-W43', date: '2025-10-20', total: 7, completed: 6 },
    { weekId: '2025-W44', date: '2025-10-27', total: 6, completed: 2 },
    { weekId: '2025-W45', date: '2025-11-03', total: 5, completed: 4 },
    { weekId: '2025-W46', date: '2025-11-10', total: 6, completed: 5 },
  ];
  
  weekData.forEach(({ weekId, date, total, completed }) => {
    weekHistory[weekId] = generateWeekData(weekId, date, total, completed);
  });
  
  return {
    id: userId,
    userId: userId,
    weekHistory,
    totalWeeksTracked: Object.keys(weekHistory).length,
    createdAt: '2025-09-08T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  };
}

module.exports = async function (context, req) {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  const userId = req.body?.userId;

  // Validate userId
  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        success: false,
        error: 'userId is required in request body' 
      }),
      headers
    };
    return;
  }

  try {
    context.log(`🌱 Seeding past weeks data for user: ${userId}`);
    
    const cosmosProvider = getCosmosProvider();
    if (!cosmosProvider) {
      throw new Error('Cosmos DB not configured');
    }

    // Generate sample data
    const sampleData = generateSamplePastWeeks(userId);
    
    // Save to pastWeeks container
    const container = cosmosProvider.getContainer('pastWeeks');
    const { resource } = await container.items.upsert(sampleData);

    context.log(`✅ Seeded ${sampleData.totalWeeksTracked} weeks of past data for ${userId}`);
    
    // Calculate summary stats
    const weeks = Object.values(sampleData.weekHistory);
    const totalGoals = weeks.reduce((sum, w) => sum + w.totalGoals, 0);
    const completedGoals = weeks.reduce((sum, w) => sum + w.completedGoals, 0);
    const avgScore = Math.round(weeks.reduce((sum, w) => sum + w.score, 0) / weeks.length);

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: `Successfully seeded ${sampleData.totalWeeksTracked} weeks of past data`,
        data: {
          userId: resource.userId,
          totalWeeksTracked: resource.totalWeeksTracked,
          summary: {
            totalGoals,
            completedGoals,
            avgScore
          }
        }
      }),
      headers
    };

  } catch (error) {
    context.log.error('❌ Error seeding past weeks:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to seed past weeks data',
        details: error.message
      }),
      headers
    };
  }
};

