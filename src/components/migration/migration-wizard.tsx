'use client';

/**
 * Universal Data Migration Wizard
 *
 * 6-step wizard for migrating data from ANY competitor platform.
 * Orchestrates file upload, classification, field mapping, validation,
 * conflict resolution, and dependency-ordered import.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportStepper } from '@/components/import/import-stepper';
import type { ParsedFile } from '@/lib/import/file-parser';
import type { ClassificationResult } from '@/lib/import/file-classifier';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';
import type { ValidationResult } from '@/lib/import/validator';
import { StepUploadFiles } from './step-upload-files';
import { StepDetectClassify } from './step-detect-classify';
import { StepFieldMapping } from './step-field-mapping';
import { StepValidation } from './step-validation';
import { StepConflictResolution } from './step-conflict-resolution';
import { StepImportProgress } from './step-import-progress';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIZARD_STEPS = ['Upload', 'Detect', 'Map Fields', 'Validate', 'Conflicts', 'Import'];

export const DEPENDENCY_ORDER: Record<string, number> = {
  properties: 0,
  units: 1,
  residents: 2,
  staff: 3,
  amenities: 4,
  fobs: 5,
  buzzer_codes: 5,
  emergency_contacts: 6,
  vehicles: 6,
  pets: 6,
  packages: 7,
  parking_permits: 7,
  maintenance: 8,
  events: 9,
};

export const ENTITY_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  units: { label: 'Units', color: '#3B82F6', icon: 'Building2' },
  residents: { label: 'Residents', color: '#10B981', icon: 'Users' },
  staff: { label: 'Staff', color: '#8B5CF6', icon: 'UserCog' },
  packages: { label: 'Packages', color: '#F59E0B', icon: 'Package' },
  maintenance: { label: 'Maintenance', color: '#EF4444', icon: 'Wrench' },
  maintenance_requests: { label: 'Maintenance', color: '#EF4444', icon: 'Wrench' },
  amenities: { label: 'Amenities', color: '#06B6D4', icon: 'Calendar' },
  fobs: { label: 'FOBs & Keys', color: '#6366F1', icon: 'Key' },
  buzzer_codes: { label: 'Buzzer Codes', color: '#EC4899', icon: 'Bell' },
  parking_permits: { label: 'Parking', color: '#F97316', icon: 'Car' },
  emergency_contacts: { label: 'Emergency Contacts', color: '#DC2626', icon: 'Phone' },
  vehicles: { label: 'Vehicles', color: '#14B8A6', icon: 'Car' },
  pets: { label: 'Pets', color: '#A855F7', icon: 'Heart' },
  events: { label: 'Events', color: '#0EA5E9', icon: 'Shield' },
  properties: { label: 'Properties', color: '#64748B', icon: 'Building' },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadedFile {
  file: File;
  parsed: ParsedFile;
  classification: ClassificationResult;
  entityTypeOverride?: EntityType;
}

export interface ConflictItem {
  key: string;
  entityType: string;
  existing: Record<string, unknown>;
  importing: Record<string, unknown>;
  differingFields: string[];
}

export interface FileImportProgress {
  status: 'waiting' | 'importing' | 'complete' | 'warning' | 'failed';
  processedRows: number;
  totalRows: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MigrationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Upload
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Step 3: Mappings
  const [fieldMappings, setFieldMappings] = useState<Map<number, ColumnMapping[]>>(new Map());

  // Step 4: Validation
  const [validationResults, setValidationResults] = useState<Map<number, ValidationResult>>(
    new Map(),
  );

  // Step 5: Conflicts
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<
    Map<string, 'skip' | 'overwrite' | 'merge'>
  >(new Map());

  // Step 6: Import progress
  const [importProgress, setImportProgress] = useState<Map<number, FileImportProgress>>(new Map());
  const [importStarted, setImportStarted] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // Completed steps for stepper
  const completedSteps = Array.from({ length: currentStep }, (_, i) => i);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 0:
        return uploadedFiles.length > 0;
      case 1:
        return uploadedFiles.length > 0;
      case 2:
        return fieldMappings.size > 0;
      case 3:
        return validationResults.size > 0;
      case 4:
        return true; // conflicts may be empty
      case 5:
        return importComplete;
      default:
        return false;
    }
  }, [currentStep, uploadedFiles, fieldMappings, validationResults, importComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    router.push('/data-migration');
  }, [router]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white px-8 py-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-neutral-900">Data Migration Wizard</h1>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
          </div>
          <ImportStepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-6xl">
          {currentStep === 0 && (
            <StepUploadFiles uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
          )}
          {currentStep === 1 && (
            <StepDetectClassify uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
          )}
          {currentStep === 2 && (
            <StepFieldMapping
              uploadedFiles={uploadedFiles}
              fieldMappings={fieldMappings}
              setFieldMappings={setFieldMappings}
            />
          )}
          {currentStep === 3 && (
            <StepValidation
              uploadedFiles={uploadedFiles}
              fieldMappings={fieldMappings}
              validationResults={validationResults}
              setValidationResults={setValidationResults}
            />
          )}
          {currentStep === 4 && (
            <StepConflictResolution
              conflicts={conflicts}
              setConflicts={setConflicts}
              conflictResolutions={conflictResolutions}
              setConflictResolutions={setConflictResolutions}
            />
          )}
          {currentStep === 5 && (
            <StepImportProgress
              uploadedFiles={uploadedFiles}
              fieldMappings={fieldMappings}
              conflictResolutions={conflictResolutions}
              importProgress={importProgress}
              setImportProgress={setImportProgress}
              importStarted={importStarted}
              setImportStarted={setImportStarted}
              importComplete={importComplete}
              setImportComplete={setImportComplete}
            />
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-neutral-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0 || importStarted}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-neutral-400">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </span>
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => router.push('/data-migration')} disabled={!importComplete}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
