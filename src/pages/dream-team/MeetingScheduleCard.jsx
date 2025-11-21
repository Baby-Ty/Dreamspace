// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Calendar, MapPin, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { coachingService } from '../../services/coachingService';

/**
 * Meeting Schedule Card Component
 * Displays and allows editing of next team meeting (coach-only)
 */
export default function MeetingScheduleCard({ teamId, isCoach, onSave, nextMeeting }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    location: '',
    agenda: ''
  });

  // Load meeting data from prop (from API) or initialize empty
  useEffect(() => {
    if (nextMeeting) {
      setMeetingData({
        date: nextMeeting.date || '',
        time: nextMeeting.time || '',
        location: nextMeeting.location || '',
        agenda: nextMeeting.agenda || ''
      });
    } else {
      setMeetingData({
        date: '',
        time: '',
        location: '',
        agenda: ''
      });
    }
  }, [nextMeeting]);

  const handleSave = async () => {
    if (!teamId) {
      console.error('❌ Cannot save meeting: No team ID');
      return;
    }

    setIsSaving(true);
    try {
      const result = await coachingService.updateTeamMeeting(teamId, meetingData);
      if (result.success) {
        setIsEditing(false);
        if (onSave) {
          onSave(result.data);
        }
      } else {
        console.error('❌ Failed to save meeting:', result.error);
        alert(`Failed to save meeting: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving meeting:', error);
      alert(`Error saving meeting: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reload from prop (from API)
    if (nextMeeting) {
      setMeetingData({
        date: nextMeeting.date || '',
        time: nextMeeting.time || '',
        location: nextMeeting.location || '',
        agenda: nextMeeting.agenda || ''
      });
    } else {
      setMeetingData({
        date: '',
        time: '',
        location: '',
        agenda: ''
      });
    }
    setIsEditing(false);
  };

  const hasMeetingData = meetingData.date || meetingData.time || meetingData.location || meetingData.agenda;

  return (
    <div 
      className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 relative group"
      data-testid="meeting-schedule-card"
    >
      {/* Edit Button (Coach Only) - Aligned with mission card */}
      {isCoach && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 p-2 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Edit meeting schedule"
          data-testid="edit-meeting-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-netsurit-red mr-2" aria-hidden="true" />
        <h3 className="text-sm font-bold text-professional-gray-900">
          Next Team Meeting
        </h3>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="meeting-date" className="block text-xs font-semibold text-professional-gray-700 mb-1">
              Date
            </label>
            <input
              id="meeting-date"
              type="date"
              value={meetingData.date}
              onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-sm"
              data-testid="meeting-date-input"
            />
          </div>
          <div>
            <label htmlFor="meeting-time" className="block text-xs font-semibold text-professional-gray-700 mb-1">
              Time
            </label>
            <input
              id="meeting-time"
              type="time"
              value={meetingData.time}
              onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-sm"
              data-testid="meeting-time-input"
            />
          </div>
          <div>
            <label htmlFor="meeting-location" className="block text-xs font-semibold text-professional-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-professional-gray-400" aria-hidden="true" />
              <input
                id="meeting-location"
                type="text"
                value={meetingData.location}
                onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                placeholder="e.g., Microsoft Teams, Conference Room A"
                className="w-full pl-10 pr-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-sm"
                data-testid="meeting-location-input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="meeting-agenda" className="block text-xs font-semibold text-professional-gray-700 mb-1">
              Agenda / Topics
            </label>
            <textarea
              id="meeting-agenda"
              value={meetingData.agenda}
              onChange={(e) => setMeetingData({ ...meetingData, agenda: e.target.value })}
              placeholder="What will be discussed in this meeting?"
              rows={3}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-transparent text-sm resize-none"
              data-testid="meeting-agenda-input"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="save-meeting-button"
            >
              <Save className="w-4 h-4 mr-2" aria-hidden="true" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-professional-gray-100 text-professional-gray-700 rounded-lg hover:bg-professional-gray-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-300 transition-all duration-200 font-medium"
              data-testid="cancel-meeting-button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!hasMeetingData ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-professional-gray-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-professional-gray-600">
                {isCoach 
                  ? 'No meeting scheduled yet. Click edit to schedule one.'
                  : 'No meeting scheduled yet.'}
              </p>
            </div>
          ) : (
            <>
              {meetingData.date && (
                <div className="flex items-center text-sm text-professional-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-netsurit-red" aria-hidden="true" />
                  <span>
                    {new Date(meetingData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {meetingData.time && ` at ${meetingData.time}`}
                  </span>
                </div>
              )}
              {meetingData.location && (
                <div className="flex items-center text-sm text-professional-gray-700">
                  <MapPin className="w-4 h-4 mr-2 text-netsurit-coral" aria-hidden="true" />
                  <span>{meetingData.location}</span>
                </div>
              )}
              {meetingData.agenda && (
                <div className="pt-2 border-t border-professional-gray-200">
                  <p className="text-xs font-semibold text-professional-gray-700 mb-1">Agenda:</p>
                  <p className="text-sm text-professional-gray-600 whitespace-pre-wrap">
                    {meetingData.agenda}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

MeetingScheduleCard.propTypes = {
  teamId: PropTypes.string,
  isCoach: PropTypes.bool,
  onSave: PropTypes.func,
  nextMeeting: PropTypes.shape({
    date: PropTypes.string,
    time: PropTypes.string,
    location: PropTypes.string,
    agenda: PropTypes.string,
    updatedAt: PropTypes.string
  })
};

MeetingScheduleCard.defaultProps = {
  teamId: null,
  isCoach: false,
  onSave: null,
  nextMeeting: null
};

