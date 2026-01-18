import { MonitorPlay } from 'lucide-react';
import SectionCard from './SectionCard';

export default function ExperienceSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="experience-gallery"
      icon={MonitorPlay}
      title="Experience Gallery"
      description="Screens and clips so stakeholders can feel the flow."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <ul className="space-y-4" role="list" data-testid="build-overview-gallery">
            {data.screenshots.map((shot) => (
              <li
                key={shot.title}
                role="listitem"
                className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-professional-gray-900">
                  {shot.title}
                </h3>
                <p className="text-sm text-professional-gray-600 mt-1">{shot.caption}</p>
                <p className="text-xs text-professional-gray-500 mt-3">Asset: {shot.asset}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-professional-gray-900 to-professional-gray-700 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-professional-gray-200">Screen recording</p>
            <h3 className="text-lg font-semibold mt-2">{data.recording.title}</h3>
            <p className="text-sm text-professional-gray-200 mt-1">
              Duration {data.recording.duration}
            </p>
          </div>
          <a
            href={data.recording.href}
            className="mt-6 inline-flex items-center gap-2 bg-white text-professional-gray-900 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-professional-gray-100 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-testid="build-overview-recording-link"
          >
            <MonitorPlay className="w-4 h-4" aria-hidden="true" />
            Watch recording
          </a>
        </div>
      </div>
    </SectionCard>
  );
}

