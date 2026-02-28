const { createApiHandler } = require('../utils/apiWrapper');
const { generateMeetingId } = require('../utils/idGenerator');

module.exports = createApiHandler({
  auth: 'coach'
}, async (context, req, { provider }) => {
  const teamId = context.bindingData.teamId;

  if (!teamId) {
    throw { status: 400, message: 'Team ID is required' };
  }

  const { id, title, date, time, timezone, duration, attendees, completedBy, isScheduledViaCalendar, calendarEventId, status } = req.body || {};

  if (!title || !date) {
    throw { 
      status: 400, 
      message: 'Invalid meeting data',
      details: 'title and date are required'
    };
  }

  // Validate status field if provided
  const meetingStatus = status || 'completed'; // Default to 'completed' for backwards compatibility
  if (!['scheduled', 'completed', 'cancelled'].includes(meetingStatus)) {
    throw { 
      status: 400, 
      message: 'Invalid status',
      details: 'status must be "scheduled", "completed", or "cancelled"'
    };
  }

  // For scheduled/cancelled meetings, attendees are optional (will be filled in later)
  // For completed meetings, require attendees
  if (meetingStatus === 'completed' && (!Array.isArray(attendees) || attendees.length === 0)) {
    throw { 
      status: 400, 
      message: 'Invalid attendees',
      details: 'attendees array is required and must not be empty for completed meetings'
    };
  }

  const attendanceContainer = provider.getContainer('meeting_attendance');
  
  // Generate meeting ID if not provided (for new meetings)
  const meetingId = id || generateMeetingId(teamId);
  
  // Try to fetch existing meeting (for updates)
  let existingMeeting = null;
  if (id) {
    try {
      const result = await attendanceContainer.item(id, teamId).read();
      existingMeeting = result.resource;
    } catch (error) {
      if (error.code !== 404) throw error;
      // Not found is okay, we're creating a new meeting
    }
  }
  
  const now = new Date().toISOString();
  
  // Build meeting document
  const meetingDoc = {
    id: meetingId,
    teamId: teamId,
    title: title.trim(),
    date: date,
    time: time || null,
    timezone: timezone || null,
    duration: duration || 60, // Store duration in minutes (default 60 for legacy meetings)
    status: meetingStatus,
    attendees: attendees || [],
    completedBy: completedBy || null,
    isScheduledViaCalendar: isScheduledViaCalendar || false,
    calendarEventId: calendarEventId || null,
    createdAt: existingMeeting?.createdAt || now,
    updatedAt: now
  };

  // Upsert the meeting
  const { resource: savedMeeting } = await attendanceContainer.items.upsert(meetingDoc);

  context.log(`✅ ${existingMeeting ? 'Updated' : 'Created'} meeting ${meetingId} for team ${teamId} with status: ${meetingStatus}`);

  return {
    success: true,
    meeting: savedMeeting,
    action: existingMeeting ? 'updated' : 'created'
  };
});
