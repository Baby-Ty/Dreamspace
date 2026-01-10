const { getCosmosProvider } = require('../utils/cosmosProvider');
const { generateMeetingId } = require('../utils/idGenerator');
const { requireCoach, isAuthRequired, getCorsHeaders } = require('../utils/authMiddleware');

module.exports = async function (context, req) {
  const teamId = context.bindingData.teamId;

  // Set CORS headers
  const headers = getCorsHeaders();

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  if (!teamId) {
    context.res = {
      status: 400,
      body: JSON.stringify({ error: 'Team ID is required' }),
      headers
    };
    return;
  }

  // AUTH CHECK: Only coaches can save meeting attendance
  if (isAuthRequired()) {
    const user = await requireCoach(context, req);
    if (!user) return; // 401/403 already sent
  }

  const { id, title, date, time, attendees, completedBy, isScheduledViaCalendar, calendarEventId } = req.body || {};

  if (!title || !date || !attendees || !Array.isArray(attendees)) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        error: 'Invalid meeting data',
        details: 'title, date, and attendees array are required'
      }),
      headers
    };
    return;
  }

  const cosmosProvider = getCosmosProvider();
  if (!cosmosProvider) {
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
    const attendanceContainer = cosmosProvider.getContainer('meeting_attendance');
    
    // Verify container is accessible by checking its metadata
    try {
      await attendanceContainer.read();
      context.log(`✅ Container 'meeting_attendance' is accessible`);
    } catch (containerError) {
      context.log.error('❌ Container access error:', containerError);
      context.res = {
        status: 500,
        body: JSON.stringify({
          error: 'Container access failed',
          details: containerError.message,
          teamId: teamId
        }),
        headers
      };
      return;
    }
    
    // Validate teamId format (should be a valid string, not empty)
    if (typeof teamId !== 'string' || !teamId.trim()) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid team ID',
          details: 'teamId must be a non-empty string'
        }),
        headers
      };
      return;
    }
    
    // Validate attendees array has valid structure
    if (!Array.isArray(attendees) || attendees.length === 0) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid attendees data',
          details: 'attendees must be a non-empty array'
        }),
        headers
      };
      return;
    }
    
    // Validate each attendee has required fields
    const invalidAttendees = attendees.filter(a => !a.id || !a.name);
    if (invalidAttendees.length > 0) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid attendee data',
          details: 'All attendees must have id and name fields'
        }),
        headers
      };
      return;
    }
    
    // Create or update meeting attendance record
    const trimmedTeamId = teamId.trim();
    
    // Use provided ID for updates, or generate new one for creates
    const meetingId = id || generateMeetingId(trimmedTeamId); // e.g., "mtg_a1b2c3d4"
    const isUpdate = !!id;
    
    // For updates, fetch existing record to preserve metadata
    let existingRecord = null;
    if (isUpdate) {
      try {
        const existingItem = await attendanceContainer.item(meetingId, trimmedTeamId).read();
        existingRecord = existingItem.resource;
      } catch (e) {
        context.log.warn(`⚠️ Could not find existing meeting ${meetingId} for update, will create new`);
      }
    }
    
    const meetingRecord = {
      id: meetingId,
      teamId: trimmedTeamId, // Partition key - must match /teamId
      title: title.trim(),
      date: date,
      time: time || undefined, // Optional time field (HH:MM format)
      attendees: attendees.map(attendee => ({
        id: attendee.id,
        name: attendee.name.trim(),
        present: attendee.present || false
      })),
      // Preserve completedAt for updates, set new timestamp for creates
      completedAt: existingRecord?.completedAt || new Date().toISOString(),
      completedBy: completedBy || existingRecord?.completedBy || trimmedTeamId,
      isScheduledViaCalendar: isScheduledViaCalendar !== undefined ? isScheduledViaCalendar : (existingRecord?.isScheduledViaCalendar || false),
      calendarEventId: calendarEventId || existingRecord?.calendarEventId || undefined
    };

    context.log(`📝 Attempting to ${isUpdate ? 'update' : 'save'} meeting attendance:`, {
      meetingId,
      teamId: trimmedTeamId,
      title: meetingRecord.title,
      date: meetingRecord.date,
      attendeeCount: meetingRecord.attendees.length,
      isUpdate: isUpdate,
      containerName: 'meeting_attendance'
    });

    // Upsert the meeting record
    // Note: Cosmos DB will automatically use meetingRecord.teamId as partition key
    // since the container partition key is /teamId
    const { resource } = await attendanceContainer.items.upsert(meetingRecord);

    context.log(`✅ Successfully ${isUpdate ? 'updated' : 'saved'} meeting attendance for team ${trimmedTeamId}`, {
      documentId: resource.id,
      teamId: resource.teamId,
      title: resource.title,
      isUpdate: isUpdate
    });

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: cosmosProvider.cleanMetadata(resource)
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error saving meeting attendance:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to save meeting attendance',
        details: error.message,
        teamId: teamId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};

