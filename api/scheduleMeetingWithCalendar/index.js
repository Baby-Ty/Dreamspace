const { createApiHandler } = require('../utils/apiWrapper');
const { generateMeetingId } = require('../utils/idGenerator');

module.exports = createApiHandler({
  auth: 'coach'
}, async (context, req, { provider }) => {
  const teamId = context.bindingData.teamId;

  if (!teamId) {
    throw { status: 400, message: 'Team ID is required' };
  }

  const { title, date, time, accessToken, teamMembers } = req.body || {};

  if (!title || !date || !time || !accessToken) {
    throw { 
      status: 400, 
      message: 'Invalid meeting data',
      details: 'title, date, time, and accessToken are required'
    };
  }

  if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    throw { 
      status: 400, 
      message: 'Invalid team members data',
      details: 'teamMembers array with email addresses is required'
    };
  }

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw { 
      status: 400, 
      message: 'Invalid time format',
      details: 'Time must be in HH:MM format (e.g., 14:30)'
    };
  }

  // Parse date and time to create ISO datetime string
  const meetingDate = new Date(date);
  const [hours, minutes] = time.split(':');
  const hourInt = parseInt(hours, 10);
  const minuteInt = parseInt(minutes, 10);
  
  // Validate hour and minute ranges
  if (isNaN(hourInt) || isNaN(minuteInt) || hourInt < 0 || hourInt > 23 || minuteInt < 0 || minuteInt > 59) {
    throw { 
      status: 400, 
      message: 'Invalid time values',
      details: 'Hours must be 0-23 and minutes must be 0-59'
    };
  }
  
  meetingDate.setHours(hourInt, minuteInt, 0, 0);
  
  // End time: 1 hour after start (default duration)
  const endDate = new Date(meetingDate);
  endDate.setHours(endDate.getHours() + 1);

  // Format dates for Graph API (ISO 8601)
  const startDateTime = meetingDate.toISOString();
  const endDateTime = endDate.toISOString();

  // Extract email addresses from team members (including coach)
  const attendeeEmails = teamMembers
    .map(member => member.email || member.userPrincipalName || member.mail)
    .filter(email => email && email.trim());

  if (attendeeEmails.length === 0) {
    throw { 
      status: 400, 
      message: 'No valid email addresses found',
      details: 'Team members must have email addresses to send calendar invites'
    };
  }

  // Create calendar event using Microsoft Graph API
  const graphApiUrl = 'https://graph.microsoft.com/v1.0/me/calendar/events';
  
  const eventPayload = {
    subject: title,
    start: {
      dateTime: startDateTime,
      timeZone: 'UTC'
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'UTC'
    },
    attendees: attendeeEmails.map(email => ({
      emailAddress: {
        address: email,
        name: teamMembers.find(m => (m.email || m.userPrincipalName || m.mail) === email)?.name || email
      },
      type: 'required'
    })),
    isOnlineMeeting: false,
    body: {
      contentType: 'HTML',
      content: `<p>Meeting scheduled via DreamSpace</p>`
    }
  };

  context.log(`📅 Creating calendar event:`, {
    title,
    date,
    time,
    attendeeCount: attendeeEmails.length,
    startDateTime,
    endDateTime
  });

  // Call Microsoft Graph API to create the event
  const graphResponse = await fetch(graphApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  });

  if (!graphResponse.ok) {
    const errorText = await graphResponse.text();
    context.log.error('❌ Graph API error:', errorText);
    
    let errorMessage = 'Failed to create calendar event';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }

    throw {
      status: graphResponse.status || 500,
      message: 'Failed to create calendar event',
      details: errorMessage,
      teamId: teamId
    };
  }

  const eventData = await graphResponse.json();
  const calendarEventId = eventData.id;

  context.log(`✅ Successfully created calendar event:`, {
    eventId: calendarEventId,
    teamId: teamId,
    title: title
  });

  // Save scheduled meeting to database
  const attendanceContainer = provider.getContainer('meeting_attendance');
  const trimmedTeamId = teamId.trim();
  const meetingId = generateMeetingId(trimmedTeamId);

  const meetingRecord = {
    id: meetingId,
    teamId: trimmedTeamId,
    title: title.trim(),
    date: date,
    time: time,
    status: 'scheduled',
    attendees: teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      present: false // Will be updated when meeting is completed
    })),
    scheduledAt: new Date().toISOString(),
    isScheduledViaCalendar: true,
    calendarEventId: calendarEventId
  };

  context.log(`💾 Saving scheduled meeting to database:`, {
    meetingId,
    teamId: trimmedTeamId,
    title: meetingRecord.title
  });

  try {
    const { resource } = await attendanceContainer.items.upsert(meetingRecord);
    context.log(`✅ Successfully saved scheduled meeting to database`, {
      meetingId: resource.id,
      teamId: resource.teamId
    });
  } catch (dbError) {
    context.log.error('⚠️ Failed to save scheduled meeting to database (calendar event was created):', dbError);
    // Don't fail the whole request - calendar event was created successfully
    // The frontend can still work, but the scheduled meeting won't persist in the form
  }

  return {
    success: true,
    data: {
      meetingId: meetingId,
      calendarEventId: calendarEventId,
      eventWebLink: eventData.webLink,
      startDateTime: startDateTime,
      endDateTime: endDateTime
    }
  };
});
