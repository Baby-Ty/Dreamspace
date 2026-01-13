import PropTypes from 'prop-types';

/**
 * Public Dream Card Component
 * Displays a dream card that's clickable for coaches
 */
export default function PublicDreamCard({ dream, isCoach, onDreamClick }) {
  const DreamContent = () => (
    <div className="flex items-start space-x-3">
      {dream.image && (
        <img
          src={dream.image}
          alt={dream.title}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-professional-gray-900 mb-1">
          {dream.title}
          {isCoach && (
            <span className="ml-2 text-xs text-netsurit-red font-normal">(Click to view)</span>
          )}
        </h5>
        <p className="text-xs text-professional-gray-600 mb-1">
          {dream.category}
        </p>
        {dream.description && (
          <p className="text-sm text-professional-gray-700 line-clamp-2">
            {dream.description}
          </p>
        )}
        {dream.progress !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-professional-gray-600 mb-1">
              <span>Progress</span>
              <span>{dream.progress}%</span>
            </div>
            <div className="w-full bg-professional-gray-200 rounded-full h-1.5">
              <div
                className="bg-netsurit-red h-1.5 rounded-full transition-all"
                style={{ width: `${dream.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // For coaches, render as a clickable button
  if (isCoach) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️ Button clicked:', { dreamTitle: dream.title, isCoach, dreamId: dream.id });
          onDreamClick(dream);
        }}
        className="w-full text-left bg-professional-gray-50 rounded-lg p-3 border border-professional-gray-200 transition-all duration-200 hover:border-netsurit-red hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 active:scale-[0.98] hover:bg-professional-gray-100"
        data-testid={`public-dream-${dream.id}`}
        aria-label={`View ${dream.title} details`}
        type="button"
      >
        <DreamContent />
      </button>
    );
  }

  // For non-coaches, render as a static div
  return (
    <div
      className="w-full text-left bg-professional-gray-50 rounded-lg p-3 border border-professional-gray-200"
      data-testid={`public-dream-${dream.id}`}
    >
      <DreamContent />
    </div>
  );
}

PublicDreamCard.propTypes = {
  dream: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    progress: PropTypes.number
  }).isRequired,
  isCoach: PropTypes.bool.isRequired,
  onDreamClick: PropTypes.func
};

PublicDreamCard.defaultProps = {
  onDreamClick: () => {}
};
