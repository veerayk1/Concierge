'use client';

/**
 * Step 7: Historical Data (Skippable)
 * Three collapsible sections: Packages, Maintenance, Events/Incidents.
 */

import { useState } from 'react';
import { ChevronDown, Package, Wrench, CalendarClock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepHeader } from '../shared/step-header';
import { EntityImportSection } from '../shared/entity-import-section';

interface StepHistoricalDataProps {
  propertyId: string;
  onPackagesImported: (result: { created: number; skipped: number; errors: number }) => void;
  onMaintenanceImported: (result: { created: number; skipped: number; errors: number }) => void;
  onEventsImported: (result: { created: number; skipped: number; errors: number }) => void;
  onSkip: () => void;
  onNext: () => void;
  onBack?: () => void;
}

export function StepHistoricalData({
  propertyId,
  onPackagesImported,
  onMaintenanceImported,
  onEventsImported,
  onSkip,
  onNext,
  onBack,
}: StepHistoricalDataProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['packages']));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <div>
      <StepHeader
        stepNumber={7}
        title="Historical Data"
        description="Import historical records from your previous system. This step is entirely optional."
      />

      <div className="space-y-3">
        {/* Package History */}
        <CollapsibleSection
          id="packages"
          title="Package History"
          description="Past package deliveries and pickups"
          icon={Package}
          isExpanded={expandedSections.has('packages')}
          onToggle={() => toggleSection('packages')}
        >
          <EntityImportSection
            entityType="packages"
            propertyId={propertyId}
            title="Import Package History"
            description="Upload a file with package records including recipients, couriers, and dates."
            onImportComplete={onPackagesImported}
          />
        </CollapsibleSection>

        {/* Maintenance History */}
        <CollapsibleSection
          id="maintenance"
          title="Maintenance History"
          description="Past maintenance requests and work orders"
          icon={Wrench}
          isExpanded={expandedSections.has('maintenance')}
          onToggle={() => toggleSection('maintenance')}
        >
          <EntityImportSection
            entityType="maintenance_requests"
            propertyId={propertyId}
            title="Import Maintenance History"
            description="Upload a file with maintenance requests, categories, statuses, and assignments."
            onImportComplete={onMaintenanceImported}
          />
        </CollapsibleSection>

        {/* Event / Incident Logs */}
        <CollapsibleSection
          id="events"
          title="Event / Incident Logs"
          description="Security events, incidents, and log entries"
          icon={CalendarClock}
          isExpanded={expandedSections.has('events')}
          onToggle={() => toggleSection('events')}
        >
          <EntityImportSection
            entityType="events"
            propertyId={propertyId}
            title="Import Event / Incident Logs"
            description="Upload a file with event types, descriptions, dates, and statuses."
            onImportComplete={onEventsImported}
          />
        </CollapsibleSection>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={onSkip}>
            Skip this step
          </Button>
        </div>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  id,
  title,
  description,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
      >
        <Icon className="h-5 w-5 text-neutral-500" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-neutral-900">{title}</p>
          <p className="text-[13px] text-neutral-500">{description}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-neutral-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <div id={`section-${id}`} className="border-t border-neutral-100 p-4">
          {children}
        </div>
      )}
    </div>
  );
}
