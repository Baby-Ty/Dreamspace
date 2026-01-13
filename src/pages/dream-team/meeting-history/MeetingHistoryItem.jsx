import { Calendar, Clock, Check, Edit2, Save, XCircle, Loader2 } from 'lucide-react';
import { formatDate, formatTime } from './meetingHistoryUtils';

/**
 * Single meeting history item with attendance list
 * Supports edit mode for coaches
 */
export default function MeetingHistoryItem({
  meeting,
  isEditing,
  editedAttendees,
  isSaving,
  isCoach,
  onEdit,
  onToggleAttendance,
  onSave,
  onCancelEdit
}) {
  const attendeesToDisplay = isEditing ? Object.values(editedAttendees) : (meeting.attendees || []);
  const presentCount = attendeesToDisplay.filter(a => a.present).length || 0;
  const totalCount = attendeesToDisplay.length || 0;
  const meetingStatus = meeting.status || 'completed';

  return (
    <div
      className={`bg-white/80 rounded-lg p-4 border-2 transition-shadow ${
        isEditing 
          ? 'border-[#4a3b22] shadow-md' 
          : meetingStatus === 'scheduled'
            ? 'border-[#8a7a50] shadow-md'
            : 'border-[#8a7a50]/30 shadow-sm hover:shadow-md'
      }`}
      data-testid={`meeting-history-item-${meeting.id}`}
    >
      {/* Meeting Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#4a3b22] font-hand mb-1">
            {meeting.title || 'Untitled Meeting'}
          </h3>
          <div className="flex items-center gap-4 text-sm text-[#5c5030] font-hand">
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
            {meetingStatus === 'scheduled' ? (
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
            {isEditing && (
              <span className="px-2 py-1 bg-[#4a3b22] text-[#fef9c3] rounded text-xs font-semibold">
                Editing
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex items-start gap-2">
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
              aria-label="Edit attendance"
              data-testid={`edit-meeting-${meeting.id}`}
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Attendees List */}
      {attendeesToDisplay.length > 0 && (
        <div className="border-t border-[#8a7a50]/20 pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#5c5030] font-hand uppercase tracking-wide">
              Attendees
            </p>
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => onSave(meeting)}
                  disabled={isSaving}
                  className="px-2 py-1 bg-[#4a3b22] text-[#fef9c3] rounded text-xs font-semibold hover:bg-[#5c5030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
    </div>
  );
}
