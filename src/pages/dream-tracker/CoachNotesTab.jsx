// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { MessageSquare } from 'lucide-react';

/**
 * Coach Notes Tab - View coach feedback and insights
 * @component
 */
export function CoachNotesTab({ coachNotes, formatDate }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-professional-gray-900">Coach Notes</h3>
        <span className="text-xs text-professional-gray-600 bg-netsurit-light-coral/20 text-netsurit-red px-2 py-1 rounded-md font-medium">
          {coachNotes.length} insights
        </span>
      </div>

      {coachNotes.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
          <p className="text-professional-gray-500 text-sm">No coaching notes yet.</p>
          <p className="text-xs mt-2 text-professional-gray-500">Your coach will add insights and feedback here to help guide your progress.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coachNotes.map((note) => (
            <div key={note.id} className="bg-white border border-professional-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-netsurit-red" />
                    <span className="text-xs font-medium text-professional-gray-800 capitalize">
                      {note.type?.replace('_', ' ') || 'Coach Note'}
                    </span>
                  </div>
                  <span className="text-xs text-netsurit-red font-medium">
                    {note.coachName || 'Your Coach'}
                  </span>
                </div>
                <p className="text-professional-gray-800 leading-relaxed mb-2 text-sm">{note.note || note.text}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-netsurit-red font-medium">
                    {formatDate(note.createdAt || note.timestamp)}
                  </span>
                  {note.type && (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      note.type === 'encouragement' ? 'bg-professional-gray-100 text-professional-gray-700' :
                      note.type === 'suggestion' ? 'bg-netsurit-light-coral/20 text-netsurit-red' :
                      note.type === 'concern' ? 'bg-netsurit-warm-orange/20 text-netsurit-orange' :
                      note.type === 'milestone' ? 'bg-netsurit-coral/20 text-netsurit-coral' :
                      'bg-professional-gray-100 text-professional-gray-700'
                    }`}>
                      {note.type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

CoachNotesTab.propTypes = {
  coachNotes: PropTypes.array.isRequired,
  formatDate: PropTypes.func.isRequired
};

export default React.memo(CoachNotesTab);





