// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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
    // value is 0-1 based on max, but let's rely on count a bit more naturally
    // Cap at a reasonable visual max
    return Math.min(minSize + (count * 4), maxSize);
  };

  const bubbles = radarData.map((cat, i) => {
    const pos = getBubblePosition(i);
    const size = getBubbleSize(cat.value, cat.count);
    return { ...cat, ...pos, r: size };
  });

  // Interaction handlers
  const handleHover = (category, event) => {
    setHoveredCategory(category);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPos({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10 
    });
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center py-6 px-4"
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
            
            return (
              <g 
                key={bubble.id}
                className="transition-all duration-500 ease-out"
                style={{ transformOrigin: `${bubble.x}px ${bubble.y}px` }}
              >
                {/* The Bubble */}
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={bubble.r}
                  fill={isActive ? (isHovered ? "url(#bubbleGradientHover)" : "url(#bubbleGradient)") : "#F9FAFB"}
                  stroke={isActive ? (isHovered ? "#FF5722" : "#FF8A65") : "#E5E7EB"}
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? "url(#dropShadow)" : "none"}
                  className={`cursor-pointer transition-all duration-300 ${
                    isHovered ? 'scale-110' : 'scale-100'
                  }`}
                  onMouseEnter={(e) => handleHover(bubble, e)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={(e) => handleHover(bubble, e)}
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
      </div>

      {/* Tooltip */}
      {hoveredCategory && (
        <div 
          className="fixed z-50 bg-professional-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
          role="tooltip"
        >
          <div className="font-semibold mb-1">{hoveredCategory.label}</div>
          <div className="text-professional-gray-300">
            {hoveredCategory.count} {hoveredCategory.count === 1 ? 'dream' : 'dreams'}
          </div>
          <div className="text-professional-gray-400 text-[10px] mt-1 max-w-[150px] leading-tight">
            {hoveredCategory.sourceCategories.join(', ')}
          </div>
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-professional-gray-900" />
          </div>
        </div>
      )}

      {/* Footer Summary */}
      {hasDreams ? (
        <div className="mt-2 text-center">
          <p className="text-professional-gray-400 text-xs">
            {totalDreams} dreams planted
          </p>
        </div>
      ) : (
        <div className="mt-4 text-center text-professional-gray-400 text-xs">
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
