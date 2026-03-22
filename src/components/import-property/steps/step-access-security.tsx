'use client';

/**
 * Step 5: Access & Security (Skippable)
 * Three collapsible sections: FOBs/Keys, Buzzer Codes, Parking Permits.
 */

import { useState } from 'react';
import { ChevronDown, Key, Phone, Car, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepHeader } from '../shared/step-header';
import { EntityImportSection } from '../shared/entity-import-section';

interface StepAccessSecurityProps {
  propertyId: string;
  onFobsImported: (result: { created: number; skipped: number; errors: number }) => void;
  onBuzzerCodesImported: (result: { created: number; skipped: number; errors: number }) => void;
  onParkingPermitsImported: (result: { created: number; skipped: number; errors: number }) => void;
  onSkip: () => void;
  onNext: () => void;
  onBack?: () => void;
}

export function StepAccessSecurity({
  propertyId,
  onFobsImported,
  onBuzzerCodesImported,
  onParkingPermitsImported,
  onSkip,
  onNext,
  onBack,
}: StepAccessSecurityProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['fobs']));

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
        stepNumber={5}
        title="Access & Security"
        description="Import FOBs, buzzer codes, and parking permits. Each section is independent."
      />

      <div className="space-y-3">
        {/* FOBs / Keys */}
        <CollapsibleSection
          id="fobs"
          title="FOBs / Keys"
          description="Key fobs, access cards, and physical keys"
          icon={Key}
          isExpanded={expandedSections.has('fobs')}
          onToggle={() => toggleSection('fobs')}
        >
          <EntityImportSection
            entityType="fobs"
            propertyId={propertyId}
            title="Import FOBs / Keys"
            description="Upload a file with serial numbers, unit assignments, and statuses."
            onImportComplete={onFobsImported}
          />
        </CollapsibleSection>

        {/* Buzzer Codes */}
        <CollapsibleSection
          id="buzzer"
          title="Buzzer Codes"
          description="Intercom and entry phone codes"
          icon={Phone}
          isExpanded={expandedSections.has('buzzer')}
          onToggle={() => toggleSection('buzzer')}
        >
          <EntityImportSection
            entityType="buzzer_codes"
            propertyId={propertyId}
            title="Import Buzzer Codes"
            description="Upload a file with unit numbers and buzzer codes."
            onImportComplete={onBuzzerCodesImported}
          />
        </CollapsibleSection>

        {/* Parking Permits */}
        <CollapsibleSection
          id="parking"
          title="Parking Permits"
          description="Vehicle permits and parking spot assignments"
          icon={Car}
          isExpanded={expandedSections.has('parking')}
          onToggle={() => toggleSection('parking')}
        >
          <EntityImportSection
            entityType="parking_permits"
            propertyId={propertyId}
            title="Import Parking Permits"
            description="Upload a file with license plates, vehicles, and permit details."
            onImportComplete={onParkingPermitsImported}
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
