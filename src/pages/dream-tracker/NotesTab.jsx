
import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Edit3, Calendar } from 'lucide-react';

/**
 * Notes Tab - User personal notes for dreams
 * @component
 */
export function NotesTab({ notes, newNote, setNewNote, onAddNote, formatDate, canEdit = true }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-professional-gray-900">Personal Notes</h3>
        {!canEdit && (
          <span className="text-xs text-professional-gray-500 italic">
            View only - Coach viewing mode
          </span>
        )}
      </div>

      {/* Add New Note */}
      {canEdit && (
        <div className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about your progress, thoughts, or experiences..."
            className="w-full h-24 px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 resize-none text-sm"
          />
          <button
            onClick={onAddNote}
            disabled={!newNote.trim()}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-3 py-1.5 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <Edit3 className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
            <p className="text-professional-gray-500 text-sm">No notes yet. Add your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white border border-professional-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 text-xs text-professional-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(note.timestamp)}</span>
                  </div>
                </div>
                <p className="text-professional-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{note.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

NotesTab.propTypes = {
  notes: PropTypes.array.isRequired,
  newNote: PropTypes.string.isRequired,
  setNewNote: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  canEdit: PropTypes.bool
};

export default React.memo(NotesTab);






