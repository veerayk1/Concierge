'use client';

/**
 * Import Wizard — 4-Step Full-Page Overlay
 *
 * The flagship import experience for Concierge.
 * Accepts any file format, auto-maps columns, validates, and imports.
 */

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft } from 'lucide-react';
import { ImportStepper } from './import-stepper';
import { StepUpload } from './step-upload';
import { StepMapping } from './step-mapping';
import { StepReview } from './step-review';
import { StepProgress } from './step-progress';
import type { ParsedFile } from '@/lib/import/file-parser';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';
import type { ValidationResult } from '@/lib/import/validator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  propertyId: string;
  onSuccess?: () => void;
}

interface WizardState {
  step: number;
  parsedFile: ParsedFile | null;
  mappings: ColumnMapping[];
  validationResult: ValidationResult | null;
  duplicateStrategy: 'skip' | 'overwrite' | 'merge';
  importResult: {
    created: number;
    skipped: number;
    errors: Array<{ index: number; number?: string; message: string }>;
  } | null;
  isImporting: boolean;
}

const STEP_LABELS = ['Upload File', 'Map Columns', 'Review Data', 'Import'];
const SESSION_KEY = 'concierge_import_wizard';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportWizard({
  open,
  onOpenChange,
  entityType,
  propertyId,
  onSuccess,
}: ImportWizardProps) {
  const [state, setState] = useState<WizardState>(() => {
    // Restore from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.entityType === entityType && parsed.propertyId === propertyId) {
            return parsed.state;
          }
        }
      } catch {
        // ignore
      }
    }
    return getInitialState();
  });

  // Save state to sessionStorage on changes
  useEffect(() => {
    if (open && state.parsedFile) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ entityType, propertyId, state }));
      } catch {
        // Storage full, ignore
      }
    }
  }, [state, open, entityType, propertyId]);

  const resetWizard = useCallback(() => {
    setState(getInitialState());
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const handleClose = useCallback(() => {
    if (state.isImporting) return; // Don't close during import
    onOpenChange(false);
  }, [state.isImporting, onOpenChange]);

  const goToStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const handleFileParsed = useCallback((parsedFile: ParsedFile, mappings: ColumnMapping[]) => {
    setState((s) => ({
      ...s,
      parsedFile,
      mappings,
      step: 1, // Go to mapping step
    }));
  }, []);

  const handleMappingConfirmed = useCallback(
    (mappings: ColumnMapping[], validationResult: ValidationResult) => {
      setState((s) => ({
        ...s,
        mappings,
        validationResult,
        step: 2, // Go to review step
      }));
    },
    [],
  );

  const handleImportStarted = useCallback(() => {
    setState((s) => ({ ...s, isImporting: true, step: 3 }));
  }, []);

  const handleImportComplete = useCallback((result: WizardState['importResult']) => {
    setState((s) => ({
      ...s,
      importResult: result,
      isImporting: false,
    }));
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const entityLabel = entityType === 'units' ? 'Units' : 'Residents';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {state.step > 0 && !state.isImporting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToStep(state.step - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Import {entityLabel}</h2>
              <p className="text-sm text-neutral-500">
                Upload a file and we&apos;ll map your data automatically
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={state.isImporting}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stepper */}
        <div className="border-b border-neutral-100 px-6 py-3">
          <ImportStepper
            steps={STEP_LABELS}
            currentStep={state.step}
            completedSteps={getCompletedSteps(state)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {state.step === 0 && (
            <StepUpload
              entityType={entityType}
              propertyId={propertyId}
              onFileParsed={handleFileParsed}
            />
          )}
          {state.step === 1 && state.parsedFile && (
            <StepMapping
              parsedFile={state.parsedFile}
              entityType={entityType}
              initialMappings={state.mappings}
              propertyId={propertyId}
              onConfirm={handleMappingConfirmed}
            />
          )}
          {state.step === 2 && state.validationResult && (
            <StepReview
              validationResult={state.validationResult}
              mappings={state.mappings}
              entityType={entityType}
              propertyId={propertyId}
              duplicateStrategy={state.duplicateStrategy}
              onDuplicateStrategyChange={(s) =>
                setState((prev) => ({ ...prev, duplicateStrategy: s }))
              }
              onImport={handleImportStarted}
              onBack={() => goToStep(1)}
            />
          )}
          {state.step === 3 && (
            <StepProgress
              validationResult={state.validationResult!}
              mappings={state.mappings}
              entityType={entityType}
              propertyId={propertyId}
              duplicateStrategy={state.duplicateStrategy}
              importResult={state.importResult}
              onComplete={handleImportComplete}
              onViewResults={() => {
                resetWizard();
                onOpenChange(false);
                onSuccess?.();
              }}
              onImportMore={resetWizard}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitialState(): WizardState {
  return {
    step: 0,
    parsedFile: null,
    mappings: [],
    validationResult: null,
    duplicateStrategy: 'skip',
    importResult: null,
    isImporting: false,
  };
}

function getCompletedSteps(state: WizardState): number[] {
  const completed: number[] = [];
  if (state.parsedFile) completed.push(0);
  if (state.mappings.length > 0 && state.validationResult) completed.push(1);
  if (state.validationResult) completed.push(2);
  if (state.importResult) completed.push(3);
  return completed;
}
