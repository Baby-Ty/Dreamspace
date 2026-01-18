import { ShieldCheck, FileText, CalendarDays, BarChart3 } from 'lucide-react';
import SectionCard from './SectionCard';

export function SecuritySection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="security"
      icon={ShieldCheck}
      title="Security & Compliance"
      description="How we keep trust high and regulators relaxed."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div data-testid="build-overview-security-highlights">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Highlights
          </h3>
          <ul className="space-y-3" role="list">
            {data.highlights.map((highlight) => (
              <li
                key={highlight}
                role="listitem"
                className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm text-sm text-professional-gray-700"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-compliance">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Compliance Matrix
          </h3>
          <ul className="space-y-3" role="list">
            {data.compliance.map((item) => (
              <li
                key={item.label}
                role="listitem"
                className="flex items-center justify-between bg-professional-gray-50 border border-professional-gray-200 rounded-xl px-4 py-3 text-sm text-professional-gray-700"
              >
                <span className="font-medium">{item.label}</span>
                <span>{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

export function OperationsSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="operations"
      icon={FileText}
      title="Operational Excellence"
      description="Deploying, watching, and supporting without drama."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div data-testid="build-overview-release-pipeline">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Release Pipeline
          </h3>
          <ul className="space-y-3" role="list">
            {data.releasePipeline.map((item) => (
              <li
                key={item}
                role="listitem"
                className="flex items-start gap-3 bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <CalendarDays className="w-5 h-5 text-netsurit-red mt-0.5" aria-hidden="true" />
                <p className="text-sm text-professional-gray-700">{item}</p>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-monitoring">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Monitoring & Support
          </h3>
          <ul className="space-y-3" role="list">
            {data.monitoring.map((item) => (
              <li
                key={item}
                role="listitem"
                className="flex items-start gap-3 bg-professional-gray-50 border border-professional-gray-200 rounded-xl p-4"
              >
                <BarChart3 className="w-5 h-5 text-netsurit-orange mt-0.5" aria-hidden="true" />
                <p className="text-sm text-professional-gray-700">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

