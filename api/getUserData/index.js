const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, usersContainer, dreamsContainer, connectsContainer, scoringContainer;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  usersContainer = database.container('users');
  dreamsContainer = database.container('dreams');
  connectsContainer = database.container('connects');
  scoringContainer = database.container('scoring');
}

// Helper to check if user is using new 6-container structure
function isNewStructure(profile) {
  return profile && profile.dataStructureVersion >= 2;
}

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

// Helper to migrate old weekLog pattern to new week-specific instances (DEPRECATED - for backward compatibility only)
async function migrateWeekLogGoals(userId, items, context) {
  const goalsToMigrate = items.filter(item => 
    item.type === 'weekly_goal' && item.weekLog && Object.keys(item.weekLog).length > 0
  );
  
  if (goalsToMigrate.length === 0) {
    return items; // No migration needed
  }
  
  context.log(`Migrating ${goalsToMigrate.length} goals with weekLog pattern`);
  
  const newItems = [...items.filter(item => !goalsToMigrate.includes(item))];
  
  for (const goal of goalsToMigrate) {
    // Create template for recurring goals
    if (goal.recurrence === 'weekly') {
      const template = {
        id: `${goal.id}_template`,
        userId: userId,
        type: 'weekly_goal_template',
        title: goal.title,
        description: goal.description || '',
        dreamId: goal.dreamId,
        dreamTitle: goal.dreamTitle,
        dreamCategory: goal.dreamCategory,
        milestoneId: goal.milestoneId,
        recurrence: 'weekly',
        active: goal.active !== false,
        durationType: goal.durationType || 'unlimited',
        durationWeeks: goal.durationWeeks,
        startDate: goal.createdAt || new Date().toISOString(),
        createdAt: goal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save template
      await itemsContainer.items.upsert(template);
      newItems.push(template);
      
      // Create instances for each week in weekLog
      for (const [weekId, completed] of Object.entries(goal.weekLog)) {
        const instance = {
          id: `${goal.id}_${weekId}`,
          userId: userId,
          type: 'weekly_goal',
          title: goal.title,
          description: goal.description || '',
          weekId: weekId,
          completed: completed || false,
          dreamId: goal.dreamId,
          dreamTitle: goal.dreamTitle,
          dreamCategory: goal.dreamCategory,
          milestoneId: goal.milestoneId,
          recurrence: 'weekly',
          templateId: template.id,
          createdAt: goal.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await itemsContainer.items.upsert(instance);
        newItems.push(instance);
      }
    } else {
      // One-time goal with weekLog (unusual, but handle it)
      // Just pick the first week from weekLog
      const weekId = Object.keys(goal.weekLog)[0];
      const instance = {
        id: goal.id,
        userId: userId,
        type: 'weekly_goal',
        title: goal.title,
        description: goal.description || '',
        weekId: weekId,
        completed: goal.weekLog[weekId] || goal.completed || false,
        dreamId: goal.dreamId,
        dreamTitle: goal.dreamTitle,
        dreamCategory: goal.dreamCategory,
        milestoneId: goal.milestoneId,
        recurrence: 'once',
        createdAt: goal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await itemsContainer.items.upsert(instance);
      newItems.push(instance);
    }
    
    // Delete old goal with weekLog
    try {
      await itemsContainer.item(goal.id, userId).delete();
      context.log(`Deleted old weekLog goal: ${goal.id}`);
    } catch (err) {
      context.log.warn(`Could not delete old goal ${goal.id}:`, err.message);
    }
  }
  
  context.log(`Migration complete: created ${newItems.length - items.length + goalsToMigrate.length} new items`);
  return newItems;
}

// Helper to group items by type
function groupItemsByType(items) {
  const grouped = {
    dreamBook: [],
    weeklyGoals: [],
    scoringHistory: [],
    connects: [],
    careerGoals: [],
    developmentPlan: []
  };
  
  items.forEach(item => {
    // Remove Cosmos metadata
    const { _rid, _self, _etag, _attachments, _ts, userId, type, createdAt, updatedAt, ...cleanItem } = item;
    
    switch (item.type) {
      case 'dream':
        grouped.dreamBook.push(cleanItem);
        break;
      case 'weekly_goal':
        // Include week instances (have weekId)
        grouped.weeklyGoals.push(cleanItem);
        break;
      case 'weekly_goal_template':
        // Include templates - needed to generate week instances on-demand
        grouped.weeklyGoals.push(cleanItem);
        break;
      case 'scoring_entry':
        grouped.scoringHistory.push(cleanItem);
        break;
      case 'connect':
        grouped.connects.push(cleanItem);
        break;
      case 'career_goal':
        grouped.careerGoals.push(cleanItem);
        break;
      case 'development_plan':
        grouped.developmentPlan.push(cleanItem);
        break;
    }
  });
  
  return grouped;
}

module.exports = async function (context, req) {
  const userId = context.bindingData.userId;

  if (!userId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'User ID is required' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    return;
  }

  // Check if Cosmos DB is configured
  if (!usersContainer || !dreamsContainer) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
    return;
  }

  try {
    // Try to load user profile
    let profile;
    try {
      const { resource } = await usersContainer.item(userId, userId).read();
      profile = resource;
      context.log(`✅ Profile read successfully for userId: ${userId}`, {
        hasCardBackgroundImage: !!profile.cardBackgroundImage,
        cardBackgroundImage: profile.cardBackgroundImage ? profile.cardBackgroundImage.substring(0, 80) : 'undefined',
        profileKeys: Object.keys(profile).filter(k => !k.startsWith('_')).join(', ')
      });
    } catch (error) {
      if (error.code === 404) {
        context.log(`⚠️ User profile not found for userId: ${userId}`);
        context.res = {
          status: 404,
          body: JSON.stringify({ error: 'User not found' }),
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        };
        return;
      }
      throw error;
    }
    
    // Ensure profile exists and is valid
    if (!profile || !profile.id) {
      context.log.error(`❌ Profile validation failed for userId: ${userId}`, {
        profileExists: !!profile,
        profileId: profile?.id,
        profileKeys: profile ? Object.keys(profile) : [],
        profileType: typeof profile
      });
      context.res = {
        status: 500,
        body: JSON.stringify({ 
          error: 'Invalid profile data',
          details: profile ? `Profile exists but missing 'id' field. Found keys: ${Object.keys(profile).join(', ')}` : 'Profile is null or undefined'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
      return;
    }
    
    // Auto-upgrade v1 users to v3 (6-container architecture)
    if (!profile.dataStructureVersion || profile.dataStructureVersion < 3) {
      context.log(`⬆️ Auto-upgrading user from v${profile.dataStructureVersion || 1} to v3`);
      profile.dataStructureVersion = 3;
      try {
        await usersContainer.items.upsert(profile);
        context.log('✅ User upgraded to v3 6-container architecture');
      } catch (upgradeError) {
        context.log.warn('Failed to upgrade user profile:', upgradeError.message);
      }
    }
    
    // Check if user is using new 6-container structure
    if (isNewStructure(profile)) {
      context.log('User is using new 6-container structure, loading from all containers');
      
      const currentYear = new Date().getFullYear();
      const weeksContainer = database.container(`weeks${currentYear}`);
      
      // Initialize week document if it doesn't exist
      const weekDocId = `${userId}_${currentYear}`;
      let weeksResult;
      try {
        weeksResult = await weeksContainer.item(weekDocId, userId).read();
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
          weeksResult = { status: 'fulfilled', value: { resource } };
          context.log(`✅ Created week document with ${allWeeks.length} weeks initialized for ${userId}`);
        } else {
          context.log.error(`❌ Error reading week document: ${error.code} - ${error.message}`);
          throw error;
        }
      }
      
      // Try to load aggregated dreams document (new format)
      let dreamsDoc;
      let needsMigration = false;
      
      try {
        const { resource } = await dreamsContainer.item(userId, userId).read();
        dreamsDoc = resource;
        context.log(`✅ Loaded aggregated dreams document for ${userId}`);
      } catch (error) {
        if (error.code === 404) {
          context.log(`No aggregated dreams document found, checking for old format`);
          needsMigration = true;
        } else {
          throw error;
        }
      }
      
      // Fetch from all containers in parallel
      // First, query connects separately (both sender and recipient)
      let connects = [];
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
      } catch (connectsError) {
        context.log.warn(`⚠️ Failed to load connects: ${connectsError.message}`);
        connects = [];
      }
      
      const [
        oldDreamsResult,
        scoringResult
      ] = await Promise.allSettled([
        // 1. Check for old individual documents (for migration)
        needsMigration ? dreamsContainer.items.query({
          query: 'SELECT * FROM c WHERE c.userId = @userId',
          parameters: [{ name: '@userId', value: userId }]
        }).fetchAll() : Promise.resolve({ resources: [] }),
        
        // 2. Current year scoring from scoring container
        scoringContainer.item(`${userId}_${currentYear}_scoring`, userId).read()
      ]);
      
      let dreamBook = [];
      let templates = [];
      let yearVision = '';
      
      if (dreamsDoc) {
        // New format - extract from aggregated document
        // Support both 'dreams' (new) and 'dreamBook' (legacy) field names
        dreamBook = dreamsDoc.dreams || dreamsDoc.dreamBook || [];
        templates = dreamsDoc.weeklyGoalTemplates || [];
        // Ensure yearVision is always a string (might be error object from failed save)
        const rawVision = dreamsDoc.yearVision;
        yearVision = typeof rawVision === 'string' ? rawVision : '';
        context.log(`Using aggregated format: ${dreamBook.length} dreams, ${templates.length} templates, vision: ${yearVision ? 'yes' : 'no'}`);
      } else if (needsMigration && oldDreamsResult.status === 'fulfilled') {
        // Old format - migrate to new structure
        const oldItems = oldDreamsResult.value.resources || [];
        context.log(`Migrating ${oldItems.length} old documents to new format`);
        
        dreamBook = oldItems
          .filter(d => d.type === 'dream')
          .map(cleanCosmosMetadata);
        
        templates = oldItems
          .filter(d => d.type === 'weekly_goal_template')
          .map(cleanCosmosMetadata);
        
        // Create aggregated document
        if (dreamBook.length > 0 || templates.length > 0) {
          const newDreamsDoc = {
            id: userId,
            userId: userId,
            dreamBook: dreamBook,
            weeklyGoalTemplates: templates,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          try {
            await dreamsContainer.items.upsert(newDreamsDoc);
            context.log(`✅ Created aggregated dreams document during migration`);
            
            // Delete old individual documents
            for (const oldDoc of oldItems) {
              try {
                await dreamsContainer.item(oldDoc.id, userId).delete();
                context.log(`Deleted old document: ${oldDoc.id}`);
              } catch (deleteError) {
                context.log.warn(`Could not delete old document ${oldDoc.id}:`, deleteError.message);
              }
            }
          } catch (migrationError) {
            context.log.error(`Migration failed:`, migrationError);
          }
        }
      }
      
      // Connects are already loaded above (both sender and recipient)
      // Clean Cosmos metadata
      connects = connects.map(cleanCosmosMetadata);
      
      // Extract and flatten week goals from nested structure
      let weeklyGoals = [...templates]; // Start with templates
      
      // weeksResult is already resolved from the try/catch above
      if (weeksResult && weeksResult.value && weeksResult.value.resource) {
        const weekDoc = weeksResult.value.resource;
        context.log(`Processing week document with ${Object.keys(weekDoc.weeks || {}).length} weeks`);
        // Flatten nested weeks structure: { "2025-W43": { goals: [...] } } → flat array with weekId
        Object.entries(weekDoc.weeks || {}).forEach(([weekId, weekData]) => {
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
      } else if (weeksResult && weeksResult.status === 'fulfilled' && weeksResult.value.resource) {
        // Handle Promise.allSettled format
        const weekDoc = weeksResult.value.resource;
        Object.entries(weekDoc.weeks || {}).forEach(([weekId, weekData]) => {
          if (weekData.goals && Array.isArray(weekData.goals)) {
            weekData.goals.forEach(goal => {
              weeklyGoals.push({
                ...goal,
                type: goal.type || 'weekly_goal',
                weekId: weekId
              });
            });
          }
        });
      }
      
      // Extract scoring
      let scoringHistory = [];
      let totalScore = profile.score || 0;
      if (scoringResult.status === 'fulfilled' && scoringResult.value.resource) {
        const scoringDoc = scoringResult.value.resource;
        scoringHistory = scoringDoc.entries || [];
        totalScore = scoringDoc.totalScore || 0;
      }
      
      // Combine into legacy format for backward compatibility
      const { _rid, _self, _etag, _attachments, _ts, lastUpdated, ...cleanProfile } = profile;
      
      const userData = {
        ...cleanProfile,
        dataStructureVersion: profile.dataStructureVersion, // ✅ Keep this so frontend knows structure
        score: totalScore, // Override with score from scoring container
        dreamBook,
        yearVision,
        weeklyGoals,
        connects,
        scoringHistory,
        careerGoals: [], // Disabled in Phase 1
        developmentPlan: [] // Disabled in Phase 1
      };
      
      context.log(`✅ Loaded 6-container data: ${dreamBook.length} dreams, ${weeklyGoals.length} goals, ${connects.length} connects, ${scoringHistory.length} scoring entries`, {
        cardBackgroundImageInResponse: !!userData.cardBackgroundImage,
        cardBackgroundImage: userData.cardBackgroundImage ? userData.cardBackgroundImage.substring(0, 80) : 'undefined',
        responseKeys: Object.keys(userData).filter(k => !k.startsWith('_')).join(', ')
      });
      
      context.res = {
        status: 200,
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } else {
      // Old monolithic format - return as-is
      context.log('User is using old monolithic format');
      
      const { _rid, _self, _etag, _attachments, _ts, lastUpdated, ...userData } = profile;
      
      context.res = {
        status: 200,
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
  } catch (error) {
    context.log.error('Error loading user data:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
