// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Sparkles } from 'lucide-react';
import { aggregateDreamsByRadarCategory } from '../../utils/categoryMapping';

/**
 * 6-point radar chart showing dream distribution across grouped categories
 * Uses custom SVG for full visual control and minimal bundle size
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
  const size = 240;
  const center = size / 2;
  const maxRadius = 85;
  const levels = 3; // Concentric rings
  const numPoints = 6;

  // Calculate point positions on hexagon
  const getPointPosition = (index, radius) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // Generate grid lines (hexagonal rings)
  const gridRings = Array.from({ length: levels }, (_, i) => {
    const radius = (maxRadius / levels) * (i + 1);
    const points = Array.from({ length: numPoints }, (_, j) => {
      const pos = getPointPosition(j, radius);
      return `${pos.x},${pos.y}`;
    }).join(' ');
    return { radius, points };
  });

  // Generate axis lines from center to each vertex
  const axisLines = Array.from({ length: numPoints }, (_, i) => {
    const pos = getPointPosition(i, maxRadius);
    return { x1: center, y1: center, x2: pos.x, y2: pos.y };
  });

  // Generate data polygon points
  const dataPoints = radarData.map((cat, i) => {
    const radius = cat.value * maxRadius;
    // Minimum radius for visibility when count > 0
    const effectiveRadius = cat.count > 0 ? Math.max(radius, 20) : 0;
    return getPointPosition(i, effectiveRadius);
  });
  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Label positions (slightly outside the chart)
  const labelPositions = radarData.map((cat, i) => {
    const pos = getPointPosition(i, maxRadius + 35);
    return { ...pos, ...cat };
  });

  // Handle hover on data points
  const handlePointHover = (category, event) => {
    setHoveredCategory(category);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPos({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10 
    });
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center py-4 px-4"
      data-testid="dream-radar-chart"
      role="figure"
      aria-label="Dream category distribution radar chart"
    >
      {/* Chart title */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-netsurit-coral" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-professional-gray-800">
          Dream Balance
        </h2>
      </div>

      {/* SVG Radar Chart */}
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient for filled area */}
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E53935" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#FF6B5B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF8A65" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Glow filter for the data polygon */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background rings */}
        {gridRings.map((ring, i) => (
          <polygon
            key={`ring-${i}`}
            points={ring.points}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
            className="opacity-60"
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#D1D5DB"
            strokeWidth="1"
            className="opacity-50"
          />
        ))}

        {/* Data polygon - only show if has dreams */}
        {hasDreams && (
          <polygon
            points={dataPolygonPoints}
            fill="url(#radarGradient)"
            stroke="#E53935"
            strokeWidth="2"
            filter="url(#glow)"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Data points (interactive) */}
        {radarData.map((cat, i) => {
          const point = dataPoints[i];
          const isHovered = hoveredCategory?.id === cat.id;
          const hasValue = cat.count > 0;
          
          return (
            <g key={cat.id}>
              {/* Clickable area */}
              <circle
                cx={hasDreams ? point.x : getPointPosition(i, 0).x}
                cy={hasDreams ? point.y : getPointPosition(i, 0).y}
                r={hasValue ? (isHovered ? 10 : 7) : 5}
                fill={hasValue ? '#E53935' : '#9CA3AF'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={(e) => handlePointHover(cat, e)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={(e) => handlePointHover(cat, e)}
                onBlur={() => setHoveredCategory(null)}
                tabIndex={0}
                role="button"
                aria-label={`${cat.label}: ${cat.count} dreams`}
              />
            </g>
          );
        })}

        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="4"
          fill="#6B7280"
          className="opacity-40"
        />
      </svg>

      {/* Labels around the chart */}
      <div className="absolute inset-0 pointer-events-none">
        {labelPositions.map((label, i) => {
          // Position labels relative to chart center
          const offsetX = label.x - center;
          const offsetY = label.y - center;
          const isLeft = offsetX < -20;
          const isRight = offsetX > 20;
          const isTop = offsetY < -20;
          
          return (
            <div
              key={label.id}
              className={`absolute text-xs font-medium transition-colors duration-200 ${
                hoveredCategory?.id === label.id 
                  ? 'text-netsurit-red' 
                  : 'text-professional-gray-600'
              } ${isLeft ? 'text-right' : isRight ? 'text-left' : 'text-center'}`}
              style={{
                left: `calc(50% + ${offsetX}px)`,
                top: `calc(50% + ${offsetY}px + 16px)`, // Offset for title height
                transform: `translate(${isLeft ? '-100%' : isRight ? '0' : '-50%'}, ${isTop ? '-100%' : '0'})`,
                whiteSpace: 'nowrap'
              }}
            >
              {label.label}
              {label.count > 0 && (
                <span className="ml-1 text-netsurit-coral">({label.count})</span>
              )}
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
          <div className="text-professional-gray-400 text-[10px] mt-1">
            {hoveredCategory.sourceCategories.join(', ')}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-professional-gray-900" />
          </div>
        </div>
      )}

      {/* Empty state message */}
      {!hasDreams && (
        <div className="mt-4 text-center">
          <p className="text-professional-gray-500 text-sm">
            Start your journey by adding dreams
          </p>
          <p className="text-professional-gray-400 text-xs mt-1">
            Watch your balance grow as you add dreams across categories
          </p>
        </div>
      )}

      {/* Summary when has dreams */}
      {hasDreams && (
        <div className="mt-2 text-center">
          <p className="text-professional-gray-500 text-xs">
            {totalDreams} {totalDreams === 1 ? 'dream' : 'dreams'} across{' '}
            {radarData.filter(c => c.count > 0).length} categories
          </p>
        </div>
      )}
    </div>
  );
}

DreamRadarChart.propTypes = {
  /** Array of dream objects with category property */
  dreams: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  }))
};

export default memo(DreamRadarChart);

