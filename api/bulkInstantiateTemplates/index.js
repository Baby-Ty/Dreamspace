const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
}

/**
 * Calculate week instances for a template based on duration settings
 * Duplicated from frontend to ensure consistency
 */
function calculateWeekInstancesForDuration(template) {
  // Parse ISO week format
  function parseIsoWeek(isoWeek) {
    const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
      return { year: new Date().getFullYear(), week: 1 };
    }
    return {
      year: parseInt(match[1], 10),
      week: parseInt(match[2], 10)
    };
  }

  // Get ISO week string from a date
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

  // Get week range dates from ISO week
  function getWeekRange(isoWeek) {
    const { year, week } = parseIsoWeek(isoWeek);
    
    const jan4 = new Date(year, 0, 4);
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return { start: weekStart, end: weekEnd };
  }

  // Get next N ISO weeks starting from a given week
  function getNextNWeeks(startWeekIso, n) {
    const weeks = [];
    const { start } = getWeekRange(startWeekIso);
    
    for (let i = 0; i < n; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + (i * 7));
      weeks.push(getIsoWeek(currentDate));
    }
    
    return weeks;
  }

  const startDate = template.startDate ? new Date(template.startDate) : new Date();
  const startWeek = getIsoWeek(startDate);
  
  // Handle different duration types
  if (template.durationType === 'unlimited') {
    // For unlimited goals, create instances for next 52 weeks (1 year)
    return getNextNWeeks(startWeek, 52);
  }
  
  if (template.durationType === 'weeks' && template.durationWeeks) {
    // Create instances for specific number of weeks
    return getNextNWeeks(startWeek, template.durationWeeks);
  }
  
  if (template.durationType === 'milestone' || template.recurrence === 'monthly') {
    // For monthly goals, calculate weeks based on targetMonths
    if (template.targetMonths) {
      // Approximate: ~4.33 weeks per month
      const approximateWeeks = Math.ceil(template.targetMonths * 4.33);
      return getNextNWeeks(startWeek, approximateWeeks);
    }
    // Default to 12 weeks for milestone-based goals
    return getNextNWeeks(startWeek, 12);
  }
  
  // Default fallback: create for 4 weeks
  return getNextNWeeks(startWeek, 4);
}

module.exports = async function (context, req) {
  // Set CORS headers
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

  const { userId, year, templates } = req.body || {};

  context.log('Bulk instantiating templates:', { userId, year, templateCount: templates?.length });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
      headers
    };
    return;
  }

  if (!year) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'year is required' }),
      headers
    };
    return;
  }

  if (!templates || !Array.isArray(templates)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'templates array is required' }),
      headers
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!database) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
    const containerName = `weeks${year}`;
    const weeksContainer = database.container(containerName);
    const documentId = `${userId}_${year}`;
    
    context.log(`Looking for container: ${containerName}`);
    
    // Try to load existing week document
    let weekDoc;
    try {
      const { resource } = await weeksContainer.item(documentId, userId).read();
      weekDoc = resource || {
        id: documentId,
        userId: userId,
        year: year,
        weeks: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      context.log(`Loaded existing week document for ${userId}`);
    } catch (error) {
      if (error.code === 404) {
        // Document doesn't exist, create new structure
        context.log(`Creating new week document for ${userId} year ${year}`);
        weekDoc = {
          id: documentId,
          userId: userId,
          year: year,
          weeks: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        throw error;
      }
    }

    let totalInstancesCreated = 0;
    const weeksAffected = new Set();

    // For each template, generate instances for applicable weeks
    templates.forEach(template => {
      const weekIds = calculateWeekInstancesForDuration(template);
      context.log(`Template ${template.id}: creating ${weekIds.length} instances`);
      
      weekIds.forEach(weekId => {
        // Initialize week structure if it doesn't exist
        if (!weekDoc.weeks[weekId]) {
          weekDoc.weeks[weekId] = { goals: [] };
        }
        
        // Check if instance already exists
        const existingInstance = weekDoc.weeks[weekId].goals.find(
          g => g.id === `${template.id}_${weekId}` || g.templateId === template.id
        );
        
        if (!existingInstance) {
          const instance = {
            id: `${template.id}_${weekId}`,
            type: 'weekly_goal',
            templateId: template.id,
            title: template.title,
            description: template.description || '',
            dreamId: template.dreamId,
            dreamTitle: template.dreamTitle,
            dreamCategory: template.dreamCategory,
            milestoneId: template.milestoneId,
            completed: false,
            weekId: weekId,
            recurrence: template.recurrence || 'weekly',
            createdAt: new Date().toISOString()
          };
          
          weekDoc.weeks[weekId].goals.push(instance);
          totalInstancesCreated++;
          weeksAffected.add(weekId);
        } else {
          context.log(`Instance already exists for ${weekId}, skipping`);
        }
      });
    });

    // Update timestamp
    weekDoc.updatedAt = new Date().toISOString();

    // Save updated document with all weeks
    context.log('💾 WRITE:', {
      container: containerName,
      partitionKey: userId,
      id: documentId,
      operation: 'upsert',
      totalWeeks: Object.keys(weekDoc.weeks).length,
      instancesCreated: totalInstancesCreated
    });
    
    await weeksContainer.items.upsert(weekDoc);
    
    context.log(`✅ Bulk instantiation complete: ${totalInstancesCreated} instances created across ${weeksAffected.size} weeks`);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        weeksCreated: weeksAffected.size,
        totalWeeks: Object.keys(weekDoc.weeks).length,
        instancesCreated: totalInstancesCreated,
        templatesProcessed: templates.length
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error bulk instantiating templates:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};





