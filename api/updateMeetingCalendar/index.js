const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'coach'
}, async (context, req, { provider }) => {
  const teamId = context.bindingData.teamId;

  if (!teamId) {
    throw { status: 400, message: 'Team ID is required' };
  }

  const { meetingId, calendarEventId, title, date, time, timezone, duration, teamMembers, accessToken } = req.body || {};

  if (!meetingId) {
    throw { status: 400, message: 'meetingId is required' };
  }

  if (!title || !date || !time) {
    throw {
      status: 400,
      message: 'Invalid meeting data',
      details: 'title, date, and time are required'
    };
  }

  // accessToken only needed when a calendar event must be updated
  if (calendarEventId && !accessToken) {
    throw { status: 400, message: 'accessToken is required to update the calendar event' };
  }

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw {
      status: 400,
      message: 'Invalid time format',
      details: 'Time must be in HH:MM format (e.g., 14:30)'
    };
  }

  const meetingTimezone = timezone || 'Eastern Standard Time';
  const meetingDuration = (typeof duration === 'number' && duration > 0) ? duration : 60;

  // Build start/end datetimes using timezone-safe arithmetic
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const startDateTime = `${date}T${time}:00`;

  const startTotalMinutes = hours * 60 + minutes;
  const endTotalMinutes = startTotalMinutes + meetingDuration;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  const daysToAdd = Math.floor(endHour / 24);
  const finalEndHour = endHour % 24;

  const endDateUTC = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  const endYear = endDateUTC.getUTCFullYear();
  const endMonth = String(endDateUTC.getUTCMonth() + 1).padStart(2, '0');
  const endDay = String(endDateUTC.getUTCDate()).padStart(2, '0');
  const endDateTime = `${endYear}-${endMonth}-${endDay}T${String(finalEndHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

  // Update the Microsoft Graph calendar event if calendarEventId provided
  if (calendarEventId) {
    const graphApiUrl = `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(calendarEventId)}`;

    const patchPayload = {
      subject: title,
      start: {
        dateTime: startDateTime,
        timeZone: meetingTimezone
      },
      end: {
        dateTime: endDateTime,
        timeZone: meetingTimezone
      }
    };

    // Include updated attendees if teamMembers provided
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      const attendeeEmails = teamMembers
        .map(member => member.email || member.userPrincipalName || member.mail)
        .filter(email => email && email.trim());

      if (attendeeEmails.length > 0) {
        patchPayload.attendees = attendeeEmails.map(email => ({
          emailAddress: {
            address: email,
            name: teamMembers.find(m => (m.email || m.userPrincipalName || m.mail) === email)?.name || email
          },
          type: 'required'
        }));
      }
    }

    context.log(`📅 Updating calendar event ${calendarEventId}:`, { title, date, time });

    const graphResponse = await fetch(graphApiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patchPayload)
    });

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      context.log.error('❌ Graph API PATCH error:', errorText);

      let errorMessage = 'Failed to update calendar event';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      throw {
        status: graphResponse.status || 500,
        message: 'Failed to update calendar event',
        details: errorMessage
      };
    }

    context.log(`✅ Successfully updated calendar event ${calendarEventId}`);
  }

  // Upsert the meeting DB record with updated fields
  const attendanceContainer = provider.getContainer('meeting_attendance');
  const trimmedTeamId = teamId.trim();
  const now = new Date().toISOString();

  // Fetch existing meeting to preserve createdAt and other fields
  let existingMeeting = null;
  try {
    const result = await attendanceContainer.item(meetingId, trimmedTeamId).read();
    existingMeeting = result.resource;
  } catch (error) {
    if (error.code !== 404) throw error;
  }

  const updatedRecord = {
    ...(existingMeeting || {}),
    id: meetingId,
    teamId: trimmedTeamId,
    title: title.trim(),
    date: date,
    time: time,
    timezone: meetingTimezone,
    duration: meetingDuration,
    status: existingMeeting?.status || 'scheduled',
    attendees: existingMeeting?.attendees || (teamMembers ? teamMembers.map(m => ({ id: m.id, name: m.name, present: false })) : []),
    isScheduledViaCalendar: existingMeeting?.isScheduledViaCalendar ?? Boolean(calendarEventId),
    calendarEventId: calendarEventId || existingMeeting?.calendarEventId || null,
    createdAt: existingMeeting?.createdAt || now,
    updatedAt: now
  };

  const { resource: savedMeeting } = await attendanceContainer.items.upsert(updatedRecord);

  context.log(`✅ Updated meeting ${meetingId} for team ${trimmedTeamId}`);

  return {
    success: true,
    data: {
      meetingId: savedMeeting.id,
      calendarEventId: savedMeeting.calendarEventId
    }
  };
});
