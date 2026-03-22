'use client';

/**
 * Step 3: Residents (Skippable)
 * Import residents from a file with unit linking preview.
 */

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepHeader } from '../shared/step-header';
import { EntityImportSection } from '../shared/entity-import-section';

interface StepResidentsProps {
  propertyId: string;
  onImportComplete: (result: { created: number; skipped: number; errors: number }) => void;
  onSkip: () => void;
  onNext: () => void;
  onBack?: () => void;
}

export function StepResidents({
  propertyId,
  onImportComplete,
  onSkip,
  onNext,
  onBack,
}: StepResidentsProps) {
  return (
    <div>
      <StepHeader
        stepNumber={3}
        title="Residents"
        description="Import your resident directory. Residents will be linked to units based on the unit number column in your file."
      />

      <EntityImportSection
        entityType="residents"
        propertyId={propertyId}
        title="Import Residents from File"
        description="Upload a CSV or Excel file with resident names, emails, phone numbers, and unit assignments."
        onImportComplete={(result) => {
          onImportComplete(result);
        }}
      />

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
