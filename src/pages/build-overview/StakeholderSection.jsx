// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { CalendarDays, Compass } from 'lucide-react';
import SectionCard from './SectionCard';

export default function StakeholderSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="stakeholders"
      icon={CalendarDays}
      title="Who to Ping"
      description="Key contacts and meeting cadence."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div data-testid="build-overview-stakeholder-roles">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Core Roles
          </h3>
          <ul className="space-y-3" role="list">
            {data.roles.map((role) => (
              <li
                key={role.title}
                role="listitem"
                className="bg-professional-gray-50 border border-professional-gray-200 rounded-xl p-4"
              >
                <p className="text-sm font-semibold text-professional-gray-900">{role.title}</p>
                <p className="text-sm text-professional-gray-600">{role.owner}</p>
                <p className="text-xs text-professional-gray-500 mt-1">
                  Availability: {role.availability}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-stakeholder-cadence">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Engagement Cadence
          </h3>
          <ul className="space-y-3" role="list">
            {data.cadence.map((item) => (
              <li
                key={item.label}
                role="listitem"
                className="flex items-start gap-3 bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <Compass className="w-5 h-5 text-netsurit-orange mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-professional-gray-900">{item.label}</p>
                  <p className="text-sm text-professional-gray-600">{item.frequency}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}


