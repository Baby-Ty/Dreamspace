// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Globe } from 'lucide-react';

/**
 * Unified Flag Icon Component
 * Renders accurate SVG flags for all supported countries/regions
 * 
 * Features:
 * - Consistent sizing and alignment across all flags
 * - Accurate country flag representations
 * - Proper aspect ratios (3:2 standard)
 * - Rounded corners for modern UI
 * - Optimized for small sizes (16px - 48px)
 */
const FlagIcon = ({ countryCode, className = '', size = 24 }) => {
  // Calculate consistent sizing
  const width = size;
  const height = Math.round(size * 2 / 3); // 3:2 aspect ratio
  const sizeClasses = className || `w-${Math.round(size/4)} h-${Math.round(height/4)}`;

  const flags = {
    'All': (
      <Globe className={className || `w-6 h-6`} strokeWidth={2} aria-label="All regions" />
    ),
    
    // South Africa - Official design from Wikimedia Commons
    'ZA': (
      <svg 
        className={className || sizeClasses}
        width={width}
        height={height}
        viewBox="0 0 90 60" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="South Africa flag"
      >
        <defs>
          <clipPath id="za-clip">
            <rect width="90" height="60" rx="1"/>
          </clipPath>
        </defs>
        <g clipPath="url(#za-clip)">
          {/* Red top band */}
          <path fill="#e03c31" d="M 18.0279,0 H 90 V 20 H 48.0273 Z"/>
          
          {/* Blue bottom band */}
          <path fill="#001489" d="M 18.0279,60 H 90 V 40 H 48.0273 Z"/>
          
          {/* White borders (top and bottom) */}
          <path fill="#ffffff" d="m 10.8164,60 h 7.21153 L 48.027344,40 H 90 V 36 H 46.8164"/>
          <path fill="#ffffff" d="M 46.8164,24 H 90 V 20 H 48.027344 L 18.02793,0 H 10.8164"/>
          
          {/* Black triangle */}
          <path fill="#000000" d="M 0,12.0184 26.9727,30 0,47.9818"/>
          
          {/* Gold/Yellow Y-shape inner border */}
          <path fill="#ffb81c" d="m 0,7.2109 v 4.807264 L 26.972656,30 0,47.981836 V 52.7891 L 34.1863,30 Z"/>
          
          {/* Green Y-shape */}
          <path fill="#007749" d="M 0 0 L 0 7.2109375 L 34.183594 30 L 0 52.789062 L 0 60 L 10.816406 60 L 46.816406 36 L 90 36 L 90 24 L 46.816406 24 L 10.816406 0 L 0 0 z"/>
        </g>
      </svg>
    ),

    // United States
    'US': (
      <svg 
        className={className || sizeClasses}
        width={width}
        height={height}
        viewBox="0 0 300 200" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="United States flag"
      >
        <defs>
          <clipPath id="us-clip">
            <rect width="300" height="200" rx="4"/>
          </clipPath>
        </defs>
        <g clipPath="url(#us-clip)">
          {/* Red stripes */}
          <rect fill="#B22234" width="300" height="200"/>
          
          {/* White stripes */}
          <rect fill="#FFFFFF" y="15.38" width="300" height="15.38"/>
          <rect fill="#FFFFFF" y="46.15" width="300" height="15.38"/>
          <rect fill="#FFFFFF" y="76.92" width="300" height="15.38"/>
          <rect fill="#FFFFFF" y="107.69" width="300" height="15.38"/>
          <rect fill="#FFFFFF" y="138.46" width="300" height="15.38"/>
          <rect fill="#FFFFFF" y="169.23" width="300" height="15.38"/>
          
          {/* Blue canton */}
          <rect fill="#3C3B6E" width="120" height="107.69"/>
          
          {/* Simplified star representation (white dots for small size) */}
          <g fill="#FFFFFF">
            <circle cx="15" cy="15" r="3"/>
            <circle cx="35" cy="15" r="3"/>
            <circle cx="55" cy="15" r="3"/>
            <circle cx="75" cy="15" r="3"/>
            <circle cx="95" cy="15" r="3"/>
            <circle cx="105" cy="15" r="3"/>
            
            <circle cx="25" cy="30" r="3"/>
            <circle cx="45" cy="30" r="3"/>
            <circle cx="65" cy="30" r="3"/>
            <circle cx="85" cy="30" r="3"/>
            
            <circle cx="15" cy="45" r="3"/>
            <circle cx="35" cy="45" r="3"/>
            <circle cx="55" cy="45" r="3"/>
            <circle cx="75" cy="45" r="3"/>
            <circle cx="95" cy="45" r="3"/>
            <circle cx="105" cy="45" r="3"/>
            
            <circle cx="25" cy="60" r="3"/>
            <circle cx="45" cy="60" r="3"/>
            <circle cx="65" cy="60" r="3"/>
            <circle cx="85" cy="60" r="3"/>
            
            <circle cx="15" cy="75" r="3"/>
            <circle cx="35" cy="75" r="3"/>
            <circle cx="55" cy="75" r="3"/>
            <circle cx="75" cy="75" r="3"/>
            <circle cx="95" cy="75" r="3"/>
            <circle cx="105" cy="75" r="3"/>
            
            <circle cx="25" cy="90" r="3"/>
            <circle cx="45" cy="90" r="3"/>
            <circle cx="65" cy="90" r="3"/>
            <circle cx="85" cy="90" r="3"/>
          </g>
        </g>
      </svg>
    ),

    // Mexico
    'MX': (
      <svg 
        className={className || sizeClasses}
        width={width}
        height={height}
        viewBox="0 0 300 200" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Mexico flag"
      >
        <defs>
          <clipPath id="mx-clip">
            <rect width="300" height="200" rx="4"/>
          </clipPath>
        </defs>
        <g clipPath="url(#mx-clip)">
          {/* Green band */}
          <rect fill="#006847" width="100" height="200"/>
          
          {/* White band */}
          <rect fill="#FFFFFF" x="100" width="100" height="200"/>
          
          {/* Red band */}
          <rect fill="#CE1126" x="200" width="100" height="200"/>
          
          {/* Simplified coat of arms (circle for small size) */}
          <circle cx="150" cy="100" r="25" fill="#8B4513" opacity="0.3"/>
        </g>
      </svg>
    ),

    // Brazil
    'BR': (
      <svg 
        className={className || sizeClasses}
        width={width}
        height={height}
        viewBox="0 0 300 200" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Brazil flag"
      >
        <defs>
          <clipPath id="br-clip">
            <rect width="300" height="200" rx="4"/>
          </clipPath>
        </defs>
        <g clipPath="url(#br-clip)">
          {/* Green background */}
          <rect fill="#009B3A" width="300" height="200"/>
          
          {/* Yellow diamond */}
          <path 
            fill="#FFDF00" 
            d="M 150,20 L 260,100 L 150,180 L 40,100 Z"
          />
          
          {/* Blue circle */}
          <circle fill="#002776" cx="150" cy="100" r="35"/>
          
          {/* White band (simplified) */}
          <ellipse fill="#FFFFFF" cx="150" cy="100" rx="40" ry="12" opacity="0.9"/>
        </g>
      </svg>
    ),

    // Poland
    'PL': (
      <svg 
        className={className || sizeClasses}
        width={width}
        height={height}
        viewBox="0 0 300 200" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Poland flag"
      >
        <defs>
          <clipPath id="pl-clip">
            <rect width="300" height="200" rx="4"/>
          </clipPath>
        </defs>
        <g clipPath="url(#pl-clip)">
          {/* White top half */}
          <rect fill="#FFFFFF" width="300" height="100"/>
          
          {/* Red bottom half */}
          <rect fill="#DC143C" y="100" width="300" height="100"/>
        </g>
      </svg>
    ),

    // United Kingdom
    'GB': (
      <svg 
        className={className || sizeClasses}
        width={width}
        height={height}
        viewBox="0 0 300 200" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="United Kingdom flag"
      >
        <defs>
          <clipPath id="gb-clip">
            <rect width="300" height="200" rx="4"/>
          </clipPath>
        </defs>
        <g clipPath="url(#gb-clip)">
          {/* Blue background */}
          <rect fill="#012169" width="300" height="200"/>
          
          {/* White diagonals */}
          <path fill="#FFFFFF" d="M 0,0 L 60,0 L 300,160 L 300,200 L 240,200 L 0,40 Z"/>
          <path fill="#FFFFFF" d="M 300,0 L 240,0 L 0,160 L 0,200 L 60,200 L 300,40 Z"/>
          
          {/* Red diagonals */}
          <path fill="#C8102E" d="M 0,0 L 50,0 L 300,175 L 300,200 L 250,200 L 0,25 Z"/>
          <path fill="#C8102E" d="M 300,0 L 250,0 L 0,175 L 0,200 L 50,200 L 300,25 Z"/>
          
          {/* White cross */}
          <path fill="#FFFFFF" d="M 120,0 L 180,0 L 180,200 L 120,200 Z"/>
          <path fill="#FFFFFF" d="M 0,66.67 L 300,66.67 L 300,133.33 L 0,133.33 Z"/>
          
          {/* Red cross */}
          <path fill="#C8102E" d="M 130,0 L 170,0 L 170,200 L 130,200 Z"/>
          <path fill="#C8102E" d="M 0,80 L 300,80 L 300,120 L 0,120 Z"/>
        </g>
      </svg>
    ),

    // Remote/Global (alternative to 'All')
    'Remote': (
      <Globe className={className || `w-6 h-6`} strokeWidth={2} aria-label="Remote/Global" />
    )
  };

  return flags[countryCode] || <Globe className={className || `w-6 h-6`} strokeWidth={2} aria-label="Unknown region" />;
};

FlagIcon.propTypes = {
  countryCode: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.number
};

export default FlagIcon;

