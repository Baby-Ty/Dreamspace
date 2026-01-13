// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import React from 'react';
import PropTypes from 'prop-types';
import { Users2, TrendingUp, Crown, UserPlus, AlertCircle, Sparkles, BarChart3 } from 'lucide-react';
import HelpTooltip from '../../../components/HelpTooltip';

export function PeopleHeader({ overallMetrics, currentView, onViewChange, onReportBuilder }) {
  return (
    <div className="pt-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Users2 className="h-8 w-8 text-netsurit-red" />
            <h1 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">People Dashboard</h1>
            <HelpTooltip title="People Dashboard Guide" content="HR oversight dashboard to manage coaches and teams. View all coaches and their teams, monitor program engagement metrics, promote users to coaches, assign/unassign team members, and generate reports." />
          </div>
          <p className="text-professional-gray-600">HR oversight of coaches, teams, and program engagement</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Adoption', value: `${overallMetrics.programAdoption}%`, color: 'netsurit-red' },
            { icon: Crown, label: 'Coaches', value: overallMetrics.totalCoaches, color: 'netsurit-coral' },
            { icon: UserPlus, label: 'Unassigned', value: overallMetrics.totalUnassigned, color: 'netsurit-orange' },
            { icon: AlertCircle, label: 'Alerts', value: overallMetrics.totalAlerts, color: 'netsurit-warm-orange' }
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon className={`h-6 w-6 text-${color}`} />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-professional-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onViewChange} className={`px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center ${currentView === 'prompts' ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white' : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:bg-professional-gray-50'}`}>
            <Sparkles className="w-4 h-4 mr-2" />
            <span>{currentView === 'dashboard' ? 'AI Prompts' : 'Dashboard'}</span>
          </button>
          {currentView === 'dashboard' && (
            <button onClick={onReportBuilder} className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Report Builder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

PeopleHeader.propTypes = {
  overallMetrics: PropTypes.object.isRequired,
  currentView: PropTypes.string.isRequired,
  onViewChange: PropTypes.func.isRequired,
  onReportBuilder: PropTypes.func.isRequired
};

export default PeopleHeader;
