/**
 * Week calculation and initialization utilities
 * Extracted from getUserData for reusability
 */

// Helper to generate all ISO weeks for a given year (52 or 53 weeks)
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
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    
    const jan4 = new Date(year, 0, 4);
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

// Initialize or update week document with all weeks for the year
async function initializeWeekDocument(database, userId, currentYear, context) {
  const weeksContainer = database.container(`weeks${currentYear}`);
  const weekDocId = `${userId}_${currentYear}`;
  
  try {
    const weeksResult = await weeksContainer.item(weekDocId, userId).read();
    context.log(`📂 Found existing week document for ${userId}, checking weeks...`);
    
    // Ensure all weeks for the year are initialized in existing document
    if (weeksResult.resource) {
      const allWeeks = getAllWeeksForYear(currentYear);
      context.log(`📅 Generated ${allWeeks.length} weeks for year ${currentYear}`);
      context.log(`📊 Current weeks in document: ${Object.keys(weeksResult.resource.weeks || {}).length}`);
      
      let updated = false;
      let addedCount = 0;
      allWeeks.forEach(weekId => {
        if (!weeksResult.resource.weeks[weekId]) {
          weeksResult.resource.weeks[weekId] = { goals: [] };
          updated = true;
          addedCount++;
        }
      });
      
      if (updated) {
        weeksResult.resource.updatedAt = new Date().toISOString();
        await weeksContainer.items.upsert(weeksResult.resource);
        context.log(`✅ Added ${addedCount} missing weeks (total: ${Object.keys(weeksResult.resource.weeks).length})`);
      } else {
        context.log(`✅ All ${allWeeks.length} weeks already exist in document`);
      }
      
      return weeksResult.resource;
    }
  } catch (error) {
    if (error.code === 404) {
      context.log(`📝 Week document does not exist - creating for ${userId} year ${currentYear}`);
      
      // Generate all weeks for the year
      const allWeeks = getAllWeeksForYear(currentYear);
      context.log(`📅 Generated ${allWeeks.length} weeks for initialization`);
      
      const weeks = {};
      allWeeks.forEach(weekId => {
        weeks[weekId] = { goals: [] };
      });
      
      context.log(`📦 Prepared weeks object with ${Object.keys(weeks).length} entries`);
      
      // Create week document with ALL weeks initialized
      const newWeekDoc = {
        id: weekDocId,
        userId: userId,
        year: currentYear,
        weeks: weeks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      context.log(`💾 Creating week document in container weeks${currentYear}...`);
      const { resource } = await weeksContainer.items.create(newWeekDoc);
      context.log(`✅ Created week document with ${allWeeks.length} weeks initialized for ${userId}`);
      return resource;
    } else {
      context.log.error(`❌ Error reading week document: ${error.code} - ${error.message}`);
      throw error;
    }
  }
}

// Extract and flatten weekly goals from nested week structure
function extractWeeklyGoals(weekDoc, templates, context) {
  const weeklyGoals = [...templates]; // Start with templates
  
  if (weekDoc && weekDoc.weeks) {
    context.log(`Processing week document with ${Object.keys(weekDoc.weeks).length} weeks`);
    // Flatten nested weeks structure: { "2025-W43": { goals: [...] } } → flat array with weekId
    Object.entries(weekDoc.weeks).forEach(([weekId, weekData]) => {
      if (weekData.goals && Array.isArray(weekData.goals)) {
        weekData.goals.forEach(goal => {
          weeklyGoals.push({
            ...goal,
            type: goal.type || 'weekly_goal', // Ensure type is set for instances
            weekId: weekId // Add weekId to each goal instance
          });
        });
      }
    });
  }
  
  return weeklyGoals;
}

module.exports = {
  getAllWeeksForYear,
  initializeWeekDocument,
  extractWeeklyGoals
};
