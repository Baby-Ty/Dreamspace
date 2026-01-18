
import { memo, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Sparkles } from 'lucide-react';
import { aggregateDreamsByRadarCategory } from '../../utils/categoryMapping';

/**
 * "Dream Flower" visualization
 * Replaces the traditional radar chart with a soft, organic bubble/petal layout
 * showcasing the balance of dreams across categories.
 */
function DreamRadarChart({ dreams = [] }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Aggregate dreams into radar categories
  const radarData = useMemo(() => aggregateDreamsByRadarCategory(dreams), [dreams]);
  
  // Check if user has any dreams
  const hasDreams = dreams.length > 0;
  const totalDreams = dreams.length;

  // SVG configuration
  const size = 240; // Slightly larger canvas for bubbles
  const center = size / 2;
  const orbitRadius = 70; // Where the bubbles center
  const numPoints = 6;

  // Calculate position for each category bubble
  const getBubblePosition = (index) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    return {
      x: center + orbitRadius * Math.cos(angle),
      y: center + orbitRadius * Math.sin(angle),
      angle // store for animations
    };
  };

  // Dynamic bubble sizing
  const getBubbleSize = (value, count) => {
    const minSize = 12; // Empty state dot
    const maxSize = 40; // Full blooming dream
    
    if (count === 0) return minSize;
    // Logarithmic scale to handle large disparities gracefully
    return Math.min(minSize + (count * 4), maxSize);
  };

  const bubbles = radarData.map((cat, i) => {
    const pos = getBubblePosition(i);
    const size = getBubbleSize(cat.value, cat.count);
    return { ...cat, ...pos, r: size };
  });

  // Interaction handlers
  const handleHover = (category) => {
    setHoveredCategory(category);
  };

  // Get currently hovered bubble for robust positioning
  const activeBubble = hoveredCategory ? bubbles.find(b => b.id === hoveredCategory.id) : null;

  // Helper to format dreams list
  const getDreamsList = (dreamsList) => {
    if (!dreamsList || dreamsList.length === 0) return null;
    const maxToShow = 3;
    const showDreams = dreamsList.slice(0, maxToShow);
    const remaining = dreamsList.length - maxToShow;
    
    return (
      <ul className="mt-2 space-y-0.5 text-[11px] text-professional-gray-200 border-t border-professional-gray-700 pt-2">
        {showDreams.map((title, idx) => (
          <li key={idx} className="truncate max-w-[180px] flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-netsurit-coral flex-shrink-0" />
            {title}
          </li>
        ))}
        {remaining > 0 && (
          <li className="text-professional-gray-400 pl-2.5 italic">
            + {remaining} more
          </li>
        )}
      </ul>
    );
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center py-4 px-4"
      data-testid="dream-radar-chart"
      role="figure"
      aria-label="Dream balance visualization"
    >
      {/* Chart title */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-netsurit-coral" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-professional-gray-800">
          Dream Balance
        </h2>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Main SVG */}
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Soft gradients for bubbles */}
            <radialGradient id="bubbleGradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF8A65" stopOpacity="0.2" />
            </radialGradient>
            
            <radialGradient id="bubbleGradientHover" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FF5722" stopOpacity="0.4" />
            </radialGradient>

            {/* Drop shadow for depth */}
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feOffset in="blur" dx="0" dy="2" result="offsetBlur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Central Orbit Track (subtle guide) */}
          <circle 
            cx={center} 
            cy={center} 
            r={orbitRadius} 
            fill="none" 
            stroke="#F3F4F6" 
            strokeWidth="1" 
            strokeDasharray="4 4"
          />

          {/* Connecting lines to center (Star/Flower structure) */}
          {bubbles.map((bubble, i) => (
            <line
              key={`link-${i}`}
              x1={center}
              y1={center}
              x2={bubble.x}
              y2={bubble.y}
              stroke={bubble.count > 0 ? '#FFCCBC' : '#F3F4F6'}
              strokeWidth={bubble.count > 0 ? 2 : 1}
              className="transition-colors duration-500"
            />
          ))}

          {/* Center Core */}
          <circle
            cx={center}
            cy={center}
            r={hasDreams ? 8 : 4}
            fill={hasDreams ? '#FF8A65' : '#E5E7EB'}
            className="transition-all duration-500"
          />

          {/* Bubbles */}
          {bubbles.map((bubble) => {
            const isHovered = hoveredCategory?.id === bubble.id;
            const isActive = bubble.count > 0;
            const currentR = isHovered ? bubble.r * 1.1 : bubble.r;
            
            return (
              <g 
                key={bubble.id}
                className="transition-all duration-500 ease-out"
              >
                {/* The Bubble */}
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={currentR}
                  fill={isActive ? (isHovered ? "url(#bubbleGradientHover)" : "url(#bubbleGradient)") : "#F9FAFB"}
                  stroke={isActive ? (isHovered ? "#FF5722" : "#FF8A65") : "#E5E7EB"}
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? "url(#dropShadow)" : "none"}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => handleHover(bubble)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => handleHover(bubble)}
                  onBlur={() => setHoveredCategory(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${bubble.label}: ${bubble.count} dreams`}
                />
                
                {/* Count text inside bubble (if large enough) */}
                {bubble.count > 0 && bubble.r > 15 && (
                  <text
                    x={bubble.x}
                    y={bubble.y}
                    dy=".35em"
                    textAnchor="middle"
                    className={`text-xs font-bold pointer-events-none transition-colors duration-300 ${
                      isHovered ? 'fill-netsurit-red' : 'fill-netsurit-coral'
                    }`}
                  >
                    {bubble.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Labels positioned outside bubbles */}
        {bubbles.map((bubble) => {
          // Push label slightly further out from bubble edge
          const labelDist = bubble.r + 15;
          const dx = bubble.x - center;
          const dy = bubble.y - center;
          const angle = Math.atan2(dy, dx);
          const labelX = bubble.x + Math.cos(angle) * labelDist;
          const labelY = bubble.y + Math.sin(angle) * labelDist;
          
          // Alignment adjustments
          const isLeft = labelX < center - 20;
          const isRight = labelX > center + 20;
          const isTop = labelY < center - 20;

          return (
            <div
              key={`label-${bubble.id}`}
              className={`absolute text-xs font-medium transition-colors duration-300 pointer-events-none
                ${hoveredCategory?.id === bubble.id ? 'text-netsurit-red scale-105' : 'text-professional-gray-500'}
                ${isLeft ? 'text-right' : isRight ? 'text-left' : 'text-center'}
              `}
              style={{
                left: labelX,
                top: labelY,
                transform: `translate(${isLeft ? '-100%' : isRight ? '0' : '-50%'}, ${isTop ? '-100%' : '0'})`,
                width: 'max-content'
              }}
            >
              {bubble.label}
            </div>
          );
        })}

        {/* Tooltip - Rendered INSIDE the relative container for stable positioning */}
        {activeBubble && (
          <div 
            className="absolute z-50 bg-professional-gray-900 text-white text-xs rounded-lg px-3 py-3 shadow-lg pointer-events-none min-w-[200px]"
            style={{ 
              left: activeBubble.x, 
              top: activeBubble.y - 12, // Gap above center
              transform: 'translate(-50%, -100%)' // Centered horizontally, anchored to bottom
            }}
            role="tooltip"
          >
            <div className="font-semibold text-sm mb-1">{activeBubble.label}</div>
            
            {/* Category Description */}
            <div className="text-professional-gray-400 text-[11px] italic leading-tight mb-2 border-b border-professional-gray-700 pb-2">
              {activeBubble.description}
            </div>
            
            {/* Count */}
            <div className="text-professional-gray-300 mb-1">
              <span className="font-bold text-white">{activeBubble.count}</span> {activeBubble.count === 1 ? 'dream' : 'dreams'} planted
            </div>
            
            {/* Dream List */}
            {getDreamsList(activeBubble.dreams)}
            
            {/* Pointer */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-professional-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {hasDreams ? (
        <div className="mt-1 text-center">
          <p className="text-professional-gray-400 text-xs">
            {totalDreams} dreams planted
          </p>
        </div>
      ) : (
        <div className="mt-2 text-center text-professional-gray-400 text-xs">
          Start adding dreams to grow your garden
        </div>
      )}
    </div>
  );
}

DreamRadarChart.propTypes = {
  dreams: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  }))
};

export default memo(DreamRadarChart);