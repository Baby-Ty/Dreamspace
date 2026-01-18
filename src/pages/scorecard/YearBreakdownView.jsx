import PropTypes from 'prop-types';
import { Calendar, TrendingUp } from 'lucide-react';

/**
 * Year-by-Year Breakdown component
 * Displays scoring breakdown across multiple years
 */
function YearBreakdownView({ yearlyBreakdown, allTimeScore }) {
  // Early return if no data
  if (!yearlyBreakdown || yearlyBreakdown.length === 0) {
    return (
      <div 
        className="bg-white rounded-lg shadow p-6 text-center" 
        data-testid="year-breakdown-empty"
        role="region"
        aria-label="Year breakdown"
      >
        <p className="text-professional-gray-500">No scoring data available yet.</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow p-6" 
      data-testid="year-breakdown-view"
      role="region"
      aria-label="Yearly scoring breakdown"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="h-6 w-6 text-netsurit-red" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-professional-gray-900">
          Year-by-Year Breakdown
        </h3>
      </div>
      
      <div className="space-y-3">
        {yearlyBreakdown.map((yearData) => (
          <div 
            key={yearData.year} 
            className="flex items-center justify-between border-b border-professional-gray-200 pb-3 last:border-b-0"
            data-testid={`year-${yearData.year}`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-professional-gray-400" aria-hidden="true" />
                <span className="font-medium text-professional-gray-900">{yearData.year}</span>
              </div>
              <span className="text-sm text-professional-gray-500">
                {yearData.entries} {yearData.entries === 1 ? 'activity' : 'activities'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span 
                className="text-lg font-bold text-netsurit-red"
                aria-label={`${yearData.year} score: ${yearData.totalScore} points`}
              >
                {yearData.totalScore}
              </span>
              <span className="text-sm text-professional-gray-500">pts</span>
            </div>
          </div>
        ))}
        
        {/* All-Time Total */}
        <div 
          className="flex items-center justify-between pt-4 border-t-2 border-netsurit-red mt-4"
          data-testid="all-time-total"
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-netsurit-red" aria-hidden="true" />
            <span className="font-bold text-lg text-professional-gray-900">All-Time Total</span>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className="text-2xl font-bold text-netsurit-red"
              aria-label={`All-time total: ${allTimeScore} points`}
            >
              {allTimeScore}
            </span>
            <span className="text-sm text-professional-gray-500">pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

YearBreakdownView.propTypes = {
  yearlyBreakdown: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.number.isRequired,
      totalScore: PropTypes.number.isRequired,
      entries: PropTypes.number.isRequired
    })
  ).isRequired,
  allTimeScore: PropTypes.number.isRequired
};

export default YearBreakdownView;
