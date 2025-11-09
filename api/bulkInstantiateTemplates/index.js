const { CosmosClient } = require('@azure/cosmos');
const { getCosmosProvider } = require('../utils/cosmosProvider');

// Initialize Cosmos client only if environment variables are present
let client, database;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
}

// Get cosmosProvider instance for helper methods
const cosmosProvider = getCosmosProvider();

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

/**
 * Group week IDs by year
 * Helper function for splitting instances across year containers
 */
function groupWeekIdsByYear(weekIds) {
  const grouped = {};
  weekIds.forEach(weekId => {
    const year = parseInt(weekId.split('-')[0]);
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(weekId);
  });
  return grouped;
}

/**
 * Get all ISO week strings for a given year
 * Returns array of week IDs like ["2025-W01", "2025-W02", ..., "2025-W52"]
 */
function getAllWeeksForYear(year) {
  // Helper: Get ISO week string from a date
  function getIsoWeek(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    const isoYear = target.getFullYear();
    return `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;
  }

  // Helper: Get week range from ISO week
  function getWeekRange(isoWeek) {
    const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
      return { start: new Date(), end: new Date() };
    }
    const yearNum = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    
    const jan4 = new Date(yearNum, 0, 4);
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return { start: weekStart, end: weekEnd };
  }

  const weeks = [];
  
  // Start from week 1 of the year
  const firstWeek = `${year}-W01`;
  const { start } = getWeekRange(firstWeek);
  
  // Keep generating weeks until we reach the next year
  let currentDate = new Date(start);
  let currentWeekIso = getIsoWeek(currentDate);
  
  while (currentWeekIso.startsWith(`${year}-`)) {
    weeks.push(currentWeekIso);
    currentDate.setDate(currentDate.getDate() + 7);
    currentWeekIso = getIsoWeek(currentDate);
  }
  
  return weeks;
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

  // NOTE: year parameter is NO LONGER REQUIRED - we determine years from week IDs
  const { userId, templates } = req.body || {};

  context.log('Bulk instantiating templates:', { userId, templateCount: templates?.length });

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'userId is required' }),
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
    // Step 1: Calculate all week instances for all templates
    const allWeekInstances = [];
    templates.forEach(template => {
      const weekIds = calculateWeekInstancesForDuration(template);
      context.log(`Template ${template.id}: ${weekIds.length} weeks calculated`);
      
      weekIds.forEach(weekId => {
        allWeekInstances.push({
          weekId,
          template,
          instance: {
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
          }
        });
      });
    });

    // Step 2: Group week instances by year
    const instancesByYear = {};
    allWeekInstances.forEach(({ weekId, instance }) => {
      const year = parseInt(weekId.split('-')[0]);
      if (!instancesByYear[year]) {
        instancesByYear[year] = [];
      }
      instancesByYear[year].push({ weekId, instance });
    });

    context.log(`📊 Instances span ${Object.keys(instancesByYear).length} year(s):`, Object.keys(instancesByYear).join(', '));

    // Step 3: Process each year separately
    let totalInstancesCreated = 0;
    const yearSummaries = {};

    for (const [yearStr, yearInstances] of Object.entries(instancesByYear)) {
      const year = parseInt(yearStr);
      
      // Ensure container exists for this year
      if (cosmosProvider) {
        await cosmosProvider.ensureWeeksContainerExists(year, context);
      }
      
      const containerName = `weeks${year}`;
      const weeksContainer = database.container(containerName);
      const documentId = `${userId}_${year}`;
      
      context.log(`📦 Processing year ${year}: ${yearInstances.length} instances`);
      
      // Load or create year document
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
        context.log(`   Loaded existing document for ${userId}`);
      } catch (error) {
        if (error.code === 404) {
          context.log(`   Creating new document for ${userId} year ${year}`);
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

      // ✅ Ensure ALL weeks for the year are initialized (not just weeks with goals)
      const allWeeks = getAllWeeksForYear(year);
      context.log(`   📅 Initializing all ${allWeeks.length} weeks for year ${year}`);
      allWeeks.forEach(weekId => {
        if (!weekDoc.weeks[weekId]) {
          weekDoc.weeks[weekId] = { goals: [] };
        }
      });

      // Add instances to document
      let yearInstancesCreated = 0;
      const yearWeeksAffected = new Set();

      yearInstances.forEach(({ weekId, instance }) => {
        // Initialize week structure if needed
        if (!weekDoc.weeks[weekId]) {
          weekDoc.weeks[weekId] = { goals: [] };
        }
        
        // Check if instance already exists
        const existingInstance = weekDoc.weeks[weekId].goals.find(
          g => g.id === instance.id || g.templateId === instance.templateId
        );
        
        if (!existingInstance) {
          weekDoc.weeks[weekId].goals.push(instance);
          yearInstancesCreated++;
          yearWeeksAffected.add(weekId);
        } else {
          context.log(`   Instance already exists for ${weekId}, skipping`);
        }
      });

      // Update timestamp
      weekDoc.updatedAt = new Date().toISOString();

      // Save document for this year
      context.log(`   💾 WRITE: ${containerName} - ${yearInstancesCreated} new instances`);
      await weeksContainer.items.upsert(weekDoc);

      // Track summary
      totalInstancesCreated += yearInstancesCreated;
      yearSummaries[year] = {
        instancesCreated: yearInstancesCreated,
        weeksAffected: yearWeeksAffected.size,
        totalWeeks: Object.keys(weekDoc.weeks).length
      };

      context.log(`   ✅ Year ${year}: ${yearInstancesCreated} instances in ${yearWeeksAffected.size} weeks`);
    }
    
    context.log(`🎉 Bulk instantiation complete: ${totalInstancesCreated} total instances across ${Object.keys(instancesByYear).length} year(s)`);
    
    context.res = {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        totalInstancesCreated,
        yearsAffected: Object.keys(instancesByYear).map(y => parseInt(y)),
        yearSummaries,
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





