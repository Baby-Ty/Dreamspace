// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Server, BarChart3 } from 'lucide-react';
import SectionCard from './SectionCard';

export function ArchitectureSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="architecture"
      icon={Server}
      title="Architecture & Tech Stack"
      description="How the plumbing hangs together—minus the buzzwords."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div data-testid="build-overview-architecture">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Platform Layers
          </h3>
          <ul className="space-y-4" role="list">
            {data.overview.map((layer) => (
              <li
                key={layer.title}
                role="listitem"
                className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <h4 className="text-sm font-semibold text-professional-gray-900">{layer.title}</h4>
                <ul className="mt-2 space-y-1 text-sm text-professional-gray-600 list-disc list-inside">
                  {layer.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-stack" className="space-y-3">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide">
            Stack at a Glance
          </h3>
          <ul className="space-y-2" role="list">
            {data.stack.map((entry) => (
              <li
                key={entry.label}
                role="listitem"
                className="flex items-center justify-between bg-professional-gray-50 border border-professional-gray-200 rounded-xl px-4 py-3 text-sm text-professional-gray-700"
              >
                <span className="font-medium">{entry.label}</span>
                <span>{entry.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

export function DataStrategySection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="data-caching"
      icon={BarChart3}
      title="Data & Caching Strategy"
      description="Where the data lives and how we keep it zippy."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div data-testid="build-overview-data-models">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Core Models
          </h3>
          <ul className="space-y-3" role="list">
            {data.models.map((model) => (
              <li
                key={model.title}
                role="listitem"
                className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-professional-gray-900">{model.title}</p>
                <p className="text-sm text-professional-gray-600 mt-1">{model.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-caching">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Caching Layers
          </h3>
          <ul className="space-y-3" role="list">
            {data.caching.map((strategy) => (
              <li
                key={strategy}
                role="listitem"
                className="flex items-start gap-3 bg-professional-gray-50 border border-professional-gray-200 rounded-xl p-4"
              >
                <Server className="w-5 h-5 text-netsurit-coral mt-0.5" aria-hidden="true" />
                <p className="text-sm text-professional-gray-700">{strategy}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}


