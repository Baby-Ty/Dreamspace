const { createApiHandler } = require('../utils/apiWrapper');

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

// Helper to clean Cosmos metadata from documents
function cleanCosmosMetadata(doc) {
  const { _rid, _self, _etag, _attachments, _ts, userId, ...cleanDoc } = doc;
  // Keep the type field - it's essential for filtering templates vs instances
  return cleanDoc;
}

// Load and validate user profile
async function loadUserProfile(usersContainer, userId, context) {
  try {
    const { resource } = await usersContainer.item(userId, userId).read();
    context.log(`✅ Profile read successfully for userId: ${userId}`, {
      hasCardBackgroundImage: !!resource.cardBackgroundImage,
      cardBackgroundImage: resource.cardBackgroundImage ? resource.cardBackgroundImage.substring(0, 80) : 'undefined',
      profileKeys: Object.keys(resource).filter(k => !k.startsWith('_')).join(', ')
    });
    
    // Validate profile
    if (!resource || !resource.id) {
      throw new Error('Invalid profile data: missing id field');
    }
    
    return resource;
  } catch (error) {
    if (error.code === 404) {
      context.log(`⚠️ User profile not found for userId: ${userId}`);
      return null;
    }
    throw error;
  }
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

// Load connects (both sender and recipient), deduplicate, and sort
async function loadConnects(connectsContainer, userId, context) {
  try {
    // Query 1: Sender connects (in user's partition)
    const senderQuery = await connectsContainer.items.query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }).fetchAll();
    const senderConnects = senderQuery.resources || [];
    context.log(`Found ${senderConnects.length} connects where user is sender`);
    
    // Query 2: Recipient connects (cross-partition query)
    const recipientQuery = await connectsContainer.items.query({
      query: 'SELECT * FROM c WHERE IS_DEFINED(c.withWhomId) AND c.withWhomId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    }, { enableCrossPartitionQuery: true }).fetchAll();
    const recipientConnects = recipientQuery.resources || [];
    context.log(`Found ${recipientConnects.length} connects where user is recipient`);
    
    // Combine and deduplicate
    const seenIds = new Set();
    const connects = [];
    senderConnects.forEach(c => {
      if (!seenIds.has(c.id)) {
        connects.push(c);
        seenIds.add(c.id);
      }
    });
    recipientConnects.forEach(c => {
      if (!seenIds.has(c.id)) {
        connects.push(c);
        seenIds.add(c.id);
      }
    });
    
    // Sort in JavaScript (more reliable than SQL ORDER BY with nullable fields)
    connects.sort((a, b) => {
      const aCreated = new Date(a.createdAt || 0).getTime();
      const bCreated = new Date(b.createdAt || 0).getTime();
      if (aCreated !== bCreated) return bCreated - aCreated;
      
      const aWhen = a.when ? new Date(a.when).getTime() : 0;
      const bWhen = b.when ? new Date(b.when).getTime() : 0;
      if (aWhen !== bWhen) return bWhen - aWhen;
      
      return (b.id || '').localeCompare(a.id || '');
    });
    
    context.log(`Loaded ${connects.length} connects (${senderConnects.length} sent, ${recipientConnects.length} received)`);
    
    // Clean Cosmos metadata
    return connects.map(cleanCosmosMetadata);
  } catch (error) {
    context.log.warn(`⚠️ Failed to load connects: ${error.message}`);
    return [];
  }
}

// Load aggregated dreams document
async function loadDreamsDocument(dreamsContainer, userId, context) {
  try {
    const { resource } = await dreamsContainer.item(userId, userId).read();
    context.log(`✅ Loaded aggregated dreams document for ${userId}`);
    return resource;
  } catch (error) {
    if (error.code === 404) {
      context.log(`No dreams document found for ${userId}`);
      return null;
    }
    throw error;
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

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;

  if (!userId) {
    throw { status: 400, message: 'User ID is required' };
  }

  const usersContainer = provider.getContainer('users');
  const dreamsContainer = provider.getContainer('dreams');
  const connectsContainer = provider.getContainer('connects');
  const scoringContainer = provider.getContainer('scoring');
  const database = provider.database;

  // Load user profile
  const profile = await loadUserProfile(usersContainer, userId, context);
  
  if (!profile) {
    throw { status: 404, message: 'User not found' };
  }
  
  // All users are on v3 (6-container architecture)
  context.log('Loading v3 6-container structure data');
  
  const currentYear = new Date().getFullYear();
  
  // Load ALL data in parallel - dreams and connects don't depend on weekDoc
  // This significantly improves load time by not waiting for week initialization
  const [weekDoc, dreamsDoc, connects, scoringResult] = await Promise.all([
    initializeWeekDocument(database, userId, currentYear, context),
    loadDreamsDocument(dreamsContainer, userId, context),
    loadConnects(connectsContainer, userId, context),
    scoringContainer.item(`${userId}_${currentYear}_scoring`, userId).read().catch(error => {
      if (error.code === 404) {
        context.log(`No scoring document found for ${userId}`);
        return { status: 'rejected', reason: error };
      }
      throw error;
    })
  ]);
  
  // Extract data from aggregated dreams document
  const dreamBook = dreamsDoc ? (dreamsDoc.dreams || dreamsDoc.dreamBook || []) : [];
  const templates = dreamsDoc ? (dreamsDoc.weeklyGoalTemplates || []) : [];
  const rawVision = dreamsDoc?.yearVision;
  const yearVision = typeof rawVision === 'string' ? rawVision : '';
  context.log(`Loaded dreams: ${dreamBook.length} dreams, ${templates.length} templates, vision: ${yearVision ? 'yes' : 'no'}`);
  
  // Extract and flatten weekly goals from week document
  const weeklyGoals = extractWeeklyGoals(weekDoc, templates, context);
  
  // Extract scoring
  let scoringHistory = [];
  let totalScore = profile.score || 0;
  if (scoringResult && scoringResult.resource) {
    const scoringDoc = scoringResult.resource;
    scoringHistory = scoringDoc.entries || [];
    totalScore = scoringDoc.totalScore || 0;
  }
  
  // Combine into legacy format for backward compatibility
  // Exclude yearVision from profile - it belongs in dreams container, not users container
  const { _rid, _self, _etag, _attachments, _ts, lastUpdated, yearVision: _, ...cleanProfile } = profile;
  
  const userData = {
    ...cleanProfile,
    dataStructureVersion: profile.dataStructureVersion, // ✅ Keep this so frontend knows structure
    score: totalScore, // Override with score from scoring container
    dreamBook,
    yearVision, // From dreams container (source of truth)
    weeklyGoals,
    connects,
    scoringHistory,
    careerGoals: [], // Disabled in Phase 1
    developmentPlan: [] // Disabled in Phase 1
  };
  
  context.log(`✅ Loaded 6-container data: ${dreamBook.length} dreams, ${weeklyGoals.length} goals, ${connects.length} connects, ${scoringHistory.length} scoring entries`, {
    cardBackgroundImageInResponse: !!userData.cardBackgroundImage,
    cardBackgroundImage: userData.cardBackgroundImage ? userData.cardBackgroundImage.substring(0, 80) : 'undefined',
    yearVision: userData.yearVision ? `"${userData.yearVision.substring(0, 50)}${userData.yearVision.length > 50 ? '...' : ''}"` : '(empty)',
    responseKeys: Object.keys(userData).filter(k => !k.startsWith('_')).join(', ')
  });
  
  return userData;
});
