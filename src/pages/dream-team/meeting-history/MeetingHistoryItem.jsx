import { Calendar, Clock, Check, Edit2, Save, XCircle, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from './meetingHistoryUtils';

const DURATION_OPTIONS = [
  { value: 30, label: '30 mins' },
  { value: 45, label: '45 mins' },
  { value: 60, label: '60 mins' },
  { value: 90, label: '90 mins' },
  { value: 120, label: '2 hours' },
];

/**
 * Single meeting history item with attendance list.
 * Supports editing all meeting details and attendance for coaches.
 * Supports cancelling and completing scheduled meetings directly from history.
 */
export default function MeetingHistoryItem({
  meeting,
  isEditing,
  editedAttendees,
  editedMeetingDetails,
  isSaving,
  isCoach,
  onEdit,
  onToggleAttendance,
  onMeetingDetailsChange,
  onSave,
  onCancelEdit,
  onCancelMeeting,
  onCompleteMeeting
}) {
  const attendeesToDisplay = isEditing ? Object.values(editedAttendees) : (meeting.attendees || []);
  const presentCount = attendeesToDisplay.filter(a => a.present).length || 0;
  const totalCount = attendeesToDisplay.length || 0;
  const meetingStatus = meeting.status || 'completed';
  const isScheduled = meetingStatus === 'scheduled';

  return (
    <div
      className={`bg-white/80 rounded-lg p-4 border-2 transition-shadow ${
        isEditing 
          ? 'border-[#4a3b22] shadow-md' 
          : isScheduled
            ? 'border-[#8a7a50] shadow-md'
            : 'border-[#8a7a50]/30 shadow-sm hover:shadow-md'
      }`}
      data-testid={`meeting-history-item-${meeting.id}`}
    >
      {/* Meeting Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editedMeetingDetails.title}
              onChange={(e) => onMeetingDetailsChange('title', e.target.value)}
              className="w-full text-lg font-bold text-[#4a3b22] font-hand bg-transparent border-b-2 border-[#8a7a50] focus:border-[#4a3b22] focus:outline-none mb-2 pb-0.5"
              placeholder="Meeting title"
              aria-label="Meeting title"
            />
          ) : (
            <h3 className="text-lg font-bold text-[#4a3b22] font-hand mb-1">
              {meeting.title || 'Untitled Meeting'}
            </h3>
          )}

          {isEditing ? (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#5c5030]" aria-hidden="true" />
                <input
                  type="date"
                  value={editedMeetingDetails.date}
                  onChange={(e) => onMeetingDetailsChange('date', e.target.value)}
                  className="text-sm text-[#5c5030] font-hand bg-transparent border-b border-[#8a7a50] focus:border-[#4a3b22] focus:outline-none"
                  aria-label="Meeting date"
                />
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#5c5030]" aria-hidden="true" />
                <input
                  type="time"
                  value={editedMeetingDetails.time}
                  onChange={(e) => onMeetingDetailsChange('time', e.target.value)}
                  className="text-sm text-[#5c5030] font-hand bg-transparent border-b border-[#8a7a50] focus:border-[#4a3b22] focus:outline-none"
                  aria-label="Meeting time"
                />
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={editedMeetingDetails.duration}
                  onChange={(e) => onMeetingDetailsChange('duration', Number(e.target.value))}
                  className="text-sm text-[#5c5030] font-hand bg-transparent border-b border-[#8a7a50] focus:border-[#4a3b22] focus:outline-none"
                  aria-label="Meeting duration"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#5c5030] font-hand">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{formatDate(meeting.date)}</span>
              </div>
              {meeting.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>{formatTime(meeting.time)}</span>
                </div>
              )}
              {/* Status Badge */}
              {isScheduled ? (
                <span className="px-2 py-1 bg-[#8a7a50] text-[#fef9c3] rounded text-xs font-semibold">
                  Scheduled
                </span>
              ) : (
                <span className="px-2 py-1 bg-[#4a3b22]/10 text-[#4a3b22] rounded text-xs font-semibold">
                  Completed
                </span>
              )}
              {meeting.isScheduledViaCalendar && (
                <span className="px-2 py-1 bg-[#4a3b22]/10 text-[#4a3b22] rounded text-xs font-semibold">
                  Calendar Event
                </span>
              )}
            </div>
          )}
        </div>

        <div className="text-right flex items-start gap-2 ml-3 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-[#4a3b22] font-hand">
              {presentCount}/{totalCount} Present
            </p>
            {meeting.completedAt && (
              <p className="text-xs text-[#8a7a50] font-hand mt-1">
                {formatDate(meeting.completedAt)}
              </p>
            )}
          </div>
          {isCoach && !isEditing && (
            <button
              onClick={() => onEdit(meeting)}
              className="p-1.5 text-[#5c5030] hover:text-[#4a3b22] hover:bg-[#8a7a50]/20 rounded-lg transition-colors"
              aria-label="Edit meeting"
              data-testid={`edit-meeting-${meeting.id}`}
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons for scheduled meetings (not in edit mode) */}
      {isCoach && isScheduled && !isEditing && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onCompleteMeeting(meeting)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4a3b22] text-[#fef9c3] rounded-lg text-xs font-semibold hover:bg-[#5c5030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-hand"
            data-testid={`complete-meeting-${meeting.id}`}
          >
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Complete Meeting
          </button>
          <button
            onClick={() => onCancelMeeting(meeting)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8a7a50]/20 text-[#4a3b22] rounded-lg text-xs font-semibold hover:bg-[#8a7a50]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-hand"
            data-testid={`cancel-meeting-${meeting.id}`}
          >
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Cancel Meeting
          </button>
        </div>
      )}

      {/* Attendees List */}
      {attendeesToDisplay.length > 0 && (
        <div className="border-t border-[#8a7a50]/20 pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#5c5030] font-hand uppercase tracking-wide">
              Attendees
            </p>
            {isEditing && (
              <div className="flex gap-2">
                {isScheduled && (
                  <button
                    onClick={() => onCompleteMeeting(meeting)}
                    disabled={isSaving}
                    className="px-2 py-1 bg-[#4a3b22] text-[#fef9c3] rounded text-xs font-semibold hover:bg-[#5c5030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    data-testid={`complete-meeting-edit-${meeting.id}`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                    )}
                    Complete
                  </button>
                )}
                <button
                  onClick={() => onSave(meeting)}
                  disabled={isSaving}
                  className="px-2 py-1 bg-[#8a7a50] text-[#fef9c3] rounded text-xs font-semibold hover:bg-[#5c5030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  data-testid={`save-meeting-${meeting.id}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" aria-hidden="true" />
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className="px-2 py-1 bg-[#8a7a50]/30 text-[#5c5030] rounded text-xs font-semibold hover:bg-[#8a7a50]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  data-testid={`cancel-edit-${meeting.id}`}
                >
                  <XCircle className="w-3 h-3" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {attendeesToDisplay.map((attendee) => {
              const isPresent = attendee.present || false;
              return (
                <label
                  key={attendee.id}
                  className={`flex items-center gap-2 text-sm ${
                    isEditing 
                      ? 'cursor-pointer hover:bg-[#8a7a50]/10 rounded px-1 py-0.5 transition-colors' 
                      : ''
                  }`}
                  data-testid={`attendee-${attendee.id}`}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={() => onToggleAttendance(attendee.id)}
                      disabled={!isEditing || isSaving}
                      className="sr-only"
                      aria-label={`Mark ${attendee.name} as present`}
                    />
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      isPresent 
                        ? 'bg-[#4a3b22]' 
                        : 'bg-[#8a7a50]/30 border border-[#8a7a50]'
                    }`}>
                      {isPresent && (
                        <Check className="w-3 h-3 text-[#fef9c3]" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <span className={`font-hand ${
                    isPresent 
                      ? 'text-[#4a3b22] font-semibold' 
                      : 'text-[#5c5030]'
                  }`}>
                    {attendee.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* If no attendees but in edit mode for a scheduled meeting, still show save/cancel */}
      {attendeesToDisplay.length === 0 && isEditing && (
        <div className="border-t border-[#8a7a50]/20 pt-3 flex justify-end gap-2">
          <button
            onClick={() => onSave(meeting)}
            disabled={isSaving}
            className="px-2 py-1 bg-[#8a7a50] text-[#fef9c3] rounded text-xs font-semibold hover:bg-[#5c5030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            data-testid={`save-meeting-empty-${meeting.id}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3" aria-hidden="true" />
                Save
              </>
            )}
          </button>
          <button
            onClick={onCancelEdit}
            disabled={isSaving}
            className="px-2 py-1 bg-[#8a7a50]/30 text-[#5c5030] rounded text-xs font-semibold hover:bg-[#8a7a50]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            data-testid={`cancel-edit-empty-${meeting.id}`}
          >
            <XCircle className="w-3 h-3" aria-hidden="true" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
