import { Calendar } from 'lucide-react';

/**
 * Week progress header component showing date range and progress bar
 */
export default function WeekProgressHeader({ weekRange, weeklyProgress }) {
  return (
    <div className="px-4 py-3 bg-gradient-to-br from-netsurit-red/5 via-netsurit-coral/5 to-transparent border-b border-professional-gray-200 flex-shrink-0">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Calendar className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-professional-gray-800">{weekRange}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-lg shadow-sm">
            <span className="text-lg font-bold text-netsurit-red">{weeklyProgress}%</span>
          </div>
        </div>
        <div className="w-full bg-white/80 rounded-full h-2.5 shadow-inner border border-professional-gray-200/50">
          <div
            className="bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
            style={{ width: `${weeklyProgress}%` }}
            role="progressbar"
            aria-valuenow={weeklyProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Weekly progress"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
