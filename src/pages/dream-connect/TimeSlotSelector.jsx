// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useMemo } from 'react';
import { Calendar, X, Plus } from 'lucide-react';
import { getIsoWeek } from '../../utils/dateUtils';

/**
 * WeekSelector Component (Simplified)
 * Allows selecting multiple weeks within the next 2 weeks
 * Props:
 * - value: Array of week strings ["2025-W45", "2025-W46"]
 * - onChange: Callback when weeks change (weeks) => void
 * - maxWeeks: Maximum number of weeks (default: 3)
 */
export default function TimeSlotSelector({ value = [], onChange, maxWeeks = 3 }) {
  // Generate available weeks (next 2 weeks)
  const availableWeeks = useMemo(() => {
    const weeks = [];
    const today = new Date();
    
    // Get current week and next 2 weeks
    for (let i = 0; i < 3; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() + (i * 7));
      const isoWeek = getIsoWeek(weekDate);
      
      // Get Monday of this week for display
      const monday = new Date(weekDate);
      const dayOfWeek = monday.getDay();
      const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
      monday.setDate(diff);
      
      const weekLabel = monday.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      weeks.push({
        value: isoWeek,
        label: `Week of ${weekLabel}`,
        weekNumber: isoWeek.split('-W')[1]
      });
    }
    return weeks;
  }, []);

  const handleAddWeek = (weekValue) => {
    if (value.includes(weekValue)) {
      return; // Already selected
    }
    
    const updatedWeeks = [...value, weekValue];
    onChange(updatedWeeks);
  };

  const handleRemoveWeek = (weekValue) => {
    const updatedWeeks = value.filter(w => w !== weekValue);
    onChange(updatedWeeks);
  };

  const formatWeekDisplay = (weekValue) => {
    const week = availableWeeks.find(w => w.value === weekValue);
    return week ? week.label : weekValue;
  };

  return (
    <div className="space-y-3" data-testid="week-selector">
      {/* Selected Weeks Display */}
      {value.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-professional-gray-700">
            Selected Weeks ({value.length}/{maxWeeks})
          </label>
          <div className="flex flex-wrap gap-2">
            {value.map((weekValue) => (
              <div
                key={weekValue}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-professional-gray-50 to-professional-gray-100 border border-professional-gray-200 rounded-lg text-sm"
                data-testid={`selected-week-${weekValue}`}
              >
                <Calendar className="w-4 h-4 text-professional-gray-600" />
                <span className="text-professional-gray-800 font-medium">
                  {formatWeekDisplay(weekValue)}
                </span>
                <button
                  onClick={() => handleRemoveWeek(weekValue)}
                  className="ml-1 p-1 hover:bg-professional-gray-200 rounded transition-colors"
                  aria-label={`Remove week ${weekValue}`}
                  data-testid={`remove-week-${weekValue}`}
                >
                  <X className="w-3 h-3 text-professional-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Weeks */}
      {value.length < maxWeeks && (
        <div className="p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
          <label className="block text-sm font-bold text-professional-gray-700 mb-3">
            Select Available Weeks {value.length > 0 ? `(${value.length + 1}/${maxWeeks})` : ''}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availableWeeks
              .filter(week => !value.includes(week.value))
              .map((week) => (
                <button
                  key={week.value}
                  onClick={() => handleAddWeek(week.value)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-professional-gray-300 rounded-lg hover:bg-professional-gray-50 hover:border-netsurit-red transition-all duration-200 text-sm font-medium text-professional-gray-800"
                  data-testid={`add-week-${week.value}`}
                >
                  <Calendar className="w-4 h-4 text-professional-gray-600" />
                  <span>{week.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Max Weeks Message */}
      {value.length >= maxWeeks && (
        <p className="text-sm text-professional-gray-500 italic">
          Maximum {maxWeeks} weeks selected. Remove one to add another.
        </p>
      )}
    </div>
  );
}
