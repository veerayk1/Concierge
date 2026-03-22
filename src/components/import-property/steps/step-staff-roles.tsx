'use client';

/**
 * Step 6: Staff & Roles (Skippable)
 * Import staff members from a file.
 */

import { Button } from '@/components/ui/button';
import { StepHeader } from '../shared/step-header';
import { EntityImportSection } from '../shared/entity-import-section';

interface StepStaffRolesProps {
  propertyId: string;
  onImportComplete: (result: { created: number; skipped: number; errors: number }) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function StepStaffRoles({
  propertyId,
  onImportComplete,
  onSkip,
  onNext,
}: StepStaffRolesProps) {
  return (
    <div>
      <StepHeader
        stepNumber={6}
        title="Staff & Roles"
        description="Import your staff directory. Each staff member will receive login credentials via email."
      />

      <EntityImportSection
        entityType="staff"
        propertyId={propertyId}
        title="Import Staff Members"
        description="Upload a CSV or Excel file with staff names, emails, and roles (e.g., Concierge, Security, Manager)."
        onImportComplete={onImportComplete}
      />

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip this step
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
