// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Users2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useBuildOverview } from '../../hooks/useBuildOverview';
import StakeholderSection from './StakeholderSection';
import { BusinessOutcomesSection, ScopeRoadmapSection } from './DeliverySections';
import ExperienceSection from './ExperienceSection';
import { ArchitectureSection, DataStrategySection } from './ArchitectureSections';
import { SecuritySection, OperationsSection } from './GovernanceSections';
import { FutureRoadmapSection, ResourcesSection } from './FutureSection';
import { CodebaseOverviewSection, CodingStandardsSection } from './CodebaseSections';

export default function BuildOverviewLayout() {
  const { overview, loading, error } = useBuildOverview();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="build-overview-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center px-4"
        data-testid="build-overview-error"
      >
        <div className="max-w-md text-center bg-white shadow-lg border border-professional-gray-200 rounded-xl p-6">
          <ShieldCheck className="w-10 h-10 text-netsurit-red mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-professional-gray-900 mb-2">Unable to load overview</h1>
          <p className="text-professional-gray-600">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  const {
    hero,
    stakeholderSnapshot,
    businessOutcomes,
    scope,
    experienceGallery,
    architecture,
    codebase,
    codingStandards,
    dataStrategy,
    security,
    operations,
    futureRoadmap,
    resources
  } = overview;

  return (
    <main
      className="bg-professional-gray-50 min-h-screen pb-12"
      data-testid="build-overview-page"
      aria-labelledby="build-overview-title"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <HeroPanel hero={hero} />
        <StakeholderSection data={stakeholderSnapshot} />
        <BusinessOutcomesSection data={businessOutcomes} />
        <ScopeRoadmapSection data={scope} />
        <ExperienceSection data={experienceGallery} />
        <ArchitectureSection data={architecture} />
        <DataStrategySection data={dataStrategy} />
        <CodebaseOverviewSection data={codebase} />
        <CodingStandardsSection data={codingStandards} />
        <SecuritySection data={security} />
        <OperationsSection data={operations} />
        <FutureRoadmapSection data={futureRoadmap} />
        <ResourcesSection data={resources} />
      </div>
    </main>
  );
}

function HeroPanel({ hero }) {
  return (
    <header
      className="bg-white border border-professional-gray-200 rounded-2xl p-8 shadow-sm"
      data-testid="build-overview-hero"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4 lg:max-w-3xl">
          <p className="text-sm uppercase tracking-wide text-professional-gray-500">
            {hero.releaseTrain} • Snapshot as of {hero.snapshotDate}
          </p>
          <h1
            id="build-overview-title"
            className="text-3xl sm:text-4xl font-bold text-professional-gray-900"
          >
            {hero.projectName}
          </h1>
          <p className="text-lg text-professional-gray-700">
            {hero.valueHeadline}
          </p>
          <div className="flex flex-wrap gap-3" role="list" aria-label="Project sponsors">
            {hero.sponsors.map((sponsor) => (
              <div
                key={sponsor.role}
                role="listitem"
                className="inline-flex items-center gap-2 bg-professional-gray-100 text-professional-gray-700 px-4 py-2 rounded-full text-sm"
                data-testid={`build-overview-sponsor-${sponsor.role.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Users2 className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
                <span className="font-medium">{sponsor.role}:</span>
                <span>{sponsor.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {hero.callsToAction.map((cta) => (
            <a
              key={cta.label}
              href={cta.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-netsurit-red to-netsurit-coral hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-md hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-netsurit-red"
              aria-label={cta.label}
              data-testid={`build-overview-cta-${cta.label.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {cta.label}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}



