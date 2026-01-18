import PropTypes from 'prop-types';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import ConnectionCard from './ConnectionCard';

/**
 * Suggested connections grid with pagination
 */
export default function SuggestedConnections({
  connections,
  filteredCount,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  categoryFilter,
  onConnectRequest,
  onGoToNextPage,
  onGoToPrevPage,
  onGoToPage,
  onRefresh,
  onClearFilters,
  rovingProps
}) {
  const { getItemProps, onKeyDown: handleRovingKeyDown } = rovingProps;

  return (
    <div className="mb-8 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-professional-gray-900">
          Suggested Connections
        </h2>
        <p className="text-xs text-professional-gray-500">
          {filteredCount} match{filteredCount !== 1 ? 'es' : ''}
          {totalPages > 1 && (
            <span> · Page {currentPage} of {totalPages}</span>
          )}
        </p>
      </div>
      
      {/* Connection Cards or Empty State */}
      {connections.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-professional-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
            {categoryFilter === 'All' ? 'No colleagues found' : `No colleagues with "${categoryFilter}" dreams`}
          </h3>
          <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
            {categoryFilter === 'All' 
              ? 'No other users are available for connections at the moment.'
              : `Try selecting "All" to see all colleagues, or choose a different dream category.`
            }
          </p>
          <button 
            onClick={() => {
              if (categoryFilter === 'All') {
                onRefresh();
              } else {
                onClearFilters();
              }
            }}
            className="mt-6 px-6 py-3 bg-netsurit-red text-white rounded-xl hover:bg-netsurit-red transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            {categoryFilter === 'All' ? 'Refresh' : 'Show All Colleagues'}
          </button>
        </div>
      ) : (
        <>
          {/* Grid of Connection Cards */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="grid"
            aria-label="Dream connections"
            onKeyDown={handleRovingKeyDown}
          >
            {connections.map((user, index) => (
              <ConnectionCard
                key={user.id}
                item={user}
                onInvite={onConnectRequest}
                rovingProps={getItemProps(index)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={onGoToPrevPage}
                disabled={!hasPrevPage}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  !hasPrevPage
                    ? 'border-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
                    : 'bg-professional-gray-600 text-white border-transparent hover:bg-professional-gray-700 hover:shadow-md'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onGoToPage(pageNum)}
                    className={`w-10 h-10 rounded-lg border font-medium text-sm transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-netsurit-red text-white border-netsurit-red shadow-md'
                        : 'bg-professional-gray-600 text-white border-transparent hover:bg-professional-gray-700 hover:shadow-md'
                    }`}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={onGoToNextPage}
                disabled={!hasNextPage}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  !hasNextPage
                    ? 'border-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
                    : 'bg-professional-gray-600 text-white border-transparent hover:bg-professional-gray-700 hover:shadow-md'
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

SuggestedConnections.propTypes = {
  connections: PropTypes.array.isRequired,
  filteredCount: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  hasPrevPage: PropTypes.bool.isRequired,
  categoryFilter: PropTypes.string.isRequired,
  onConnectRequest: PropTypes.func.isRequired,
  onGoToNextPage: PropTypes.func.isRequired,
  onGoToPrevPage: PropTypes.func.isRequired,
  onGoToPage: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  rovingProps: PropTypes.shape({
    getItemProps: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired
  }).isRequired
};