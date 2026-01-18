import PropTypes from 'prop-types';
import { Trophy } from 'lucide-react';

/**
 * History/Detailed view for the scorecard
 * Shows chronological scoring history grouped by date
 */
function HistoryView({ groupedHistory, sortedDates, totalActivities }) {
  // Early return for empty state
  if (totalActivities === 0) {
    return (
      <div className="space-y-6" data-testid="history-view">
        <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6">
          <div className="text-center py-8" role="status">
            <Trophy className="w-12 h-12 text-professional-gray-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-professional-gray-500">
              No activities yet. Start your dream journey!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="history-view">
      <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-professional-gray-900">
            Points History
          </h3>
          <div className="text-sm text-professional-gray-500">
            {totalActivities} {totalActivities === 1 ? 'activity' : 'total activities'}
          </div>
        </div>
        
        <div className="space-y-6" role="list" aria-label="Activity history by date">
          {sortedDates.map((date) => {
            const dayItems = groupedHistory[date];
            const dayTotal = dayItems.reduce((sum, item) => sum + item.points, 0);
            
            return (
              <div 
                key={date} 
                className="border-l-4 border-netsurit-red pl-4"
                role="listitem"
                data-testid={`history-day-${date}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-professional-gray-900">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span 
                    className="text-sm font-bold text-netsurit-red"
                    aria-label={`Daily total: ${dayTotal} points`}
                  >
                    +{dayTotal} pts
                  </span>
                </div>
                
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  role="list"
                  aria-label={`Activities for ${new Date(date).toLocaleDateString()}`}
                >
                  {dayItems.map((item) => {
                    // Support both old (title/category) and new (activity/source) field names
                    const displayTitle = item.title || item.activity || 'Activity';
                    const displayCategory = item.category || item.source || 'Points';
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 bg-professional-gray-50 rounded-lg hover:bg-professional-gray-100 transition-colors duration-200"
                        role="listitem"
                        data-testid={`history-item-${item.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-professional-gray-900 text-sm truncate">
                            {displayTitle}
                          </h5>
                          <p className="text-xs text-professional-gray-600 mt-1 capitalize">
                            {displayCategory}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <span 
                            className="text-sm font-bold text-netsurit-red"
                            aria-label={`Earned ${item.points} points`}
                          >
                            +{item.points}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

HistoryView.propTypes = {
  groupedHistory: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        // Support both naming conventions
        title: PropTypes.string,
        activity: PropTypes.string,
        category: PropTypes.string,
        source: PropTypes.string,
        points: PropTypes.number.isRequired,
        date: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.instanceOf(Date)
        ]).isRequired
      })
    )
  ).isRequired,
  sortedDates: PropTypes.arrayOf(PropTypes.string).isRequired,
  totalActivities: PropTypes.number.isRequired
};

export default HistoryView;
