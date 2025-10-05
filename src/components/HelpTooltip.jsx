import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const HelpTooltip = ({ content, title }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="text-professional-gray-400 hover:text-netsurit-red transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-full p-1"
        aria-label="Help information"
        type="button"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 animate-fadeIn">
          <div className="bg-professional-gray-900 text-white rounded-lg shadow-2xl p-4 w-80 max-w-sm">
            {/* Arrow pointing up */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-professional-gray-900"></div>
            {title && (
              <h4 className="font-bold text-sm mb-2 text-white">{title}</h4>
            )}
            <p className="text-xs leading-relaxed text-white/90">{content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
