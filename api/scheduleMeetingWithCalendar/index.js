const { getCosmosProvider } = require('../utils/cosmosProvider');

module.exports = async function (context, req) {
  const teamId = context.bindingData.teamId;

  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

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

  const { title, date, time, accessToken, teamMembers } = req.body || {};

  if (!title || !date || !time || !accessToken) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        error: 'Invalid meeting data',
        details: 'title, date, time, and accessToken are required'
      }),
      headers
    };
    return;
  }

  if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    context.res = {
      status: 400,
      body: JSON.stringify({ 
        error: 'Invalid team members data',
        details: 'teamMembers array with email addresses is required'
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
    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid time format',
          details: 'Time must be in HH:MM format (e.g., 14:30)'
        }),
        headers
      };
      return;
    }

    // Parse date and time to create ISO datetime string
    const meetingDate = new Date(date);
    const [hours, minutes] = time.split(':');
    const hourInt = parseInt(hours, 10);
    const minuteInt = parseInt(minutes, 10);
    
    // Validate hour and minute ranges
    if (isNaN(hourInt) || isNaN(minuteInt) || hourInt < 0 || hourInt > 23 || minuteInt < 0 || minuteInt > 59) {
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'Invalid time values',
          details: 'Hours must be 0-23 and minutes must be 0-59'
        }),
        headers
      };
      return;
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
      context.res = {
        status: 400,
        body: JSON.stringify({ 
          error: 'No valid email addresses found',
          details: 'Team members must have email addresses to send calendar invites'
        }),
        headers
      };
      return;
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

      context.res = {
        status: graphResponse.status || 500,
        body: JSON.stringify({
          error: 'Failed to create calendar event',
          details: errorMessage,
          teamId: teamId
        }),
        headers
      };
      return;
    }

    const eventData = await graphResponse.json();
    const calendarEventId = eventData.id;

    context.log(`✅ Successfully created calendar event:`, {
      eventId: calendarEventId,
      teamId: teamId,
      title: title
    });

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          calendarEventId: calendarEventId,
          eventWebLink: eventData.webLink,
          startDateTime: startDateTime,
          endDateTime: endDateTime
        }
      }),
      headers
    };
  } catch (error) {
    context.log.error('Error scheduling meeting with calendar:', error);
    
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to schedule meeting',
        details: error.message,
        teamId: teamId,
        timestamp: new Date().toISOString()
      }),
      headers
    };
  }
};

