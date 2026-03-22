'use client';

/**
 * Property Import Wizard — "Dump Everything" 3-Phase Wizard
 *
 * Redesigned from 8 sequential steps to a 3-phase approach:
 * Phase 0: Property Details (manual form)
 * Phase 1: Upload & Process (multi-file drop, auto-classify)
 * Phase 2: Review Data (category dashboard + per-category review)
 * Phase 3: Activate Property (summary + go-live)
 *
 * The sidebar shows dynamic sub-items under "Review Data" for each
 * detected category after processing completes.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Upload,
  Search,
  Rocket,
  Check,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Users,
  CalendarDays,
  Key,
  Phone,
  Car,
  UserCog,
  Package,
  Wrench,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { StepPropertyDetails } from './steps/step-property-details';
import { PhaseDataUpload, type ProcessedResults } from './phases/phase-data-upload';
import { PhaseReviewDashboard } from './phases/phase-review-dashboard';
import { PhaseCategoryReview } from './phases/phase-category-review';
import { PhaseActivate } from './phases/phase-activate';
import type { EntityType } from '@/lib/import/column-mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardState {
  currentPhase: number; // 0=property, 1=upload, 2=review, 3=activate
  propertyId: string | null;
  propertyName: string | null;
  processedResults: ProcessedResults | null;
  reviewingCategory: EntityType | null;
  importedCategories: Record<string, { created: number; skipped: number; errors: number }>;
  completedPhases: number[];
  activated: boolean;
}

interface PhaseConfig {
  id: number;
  label: string;
  icon: React.ElementType;
}

const PHASES: PhaseConfig[] = [
  { id: 0, label: 'Property Details', icon: Building2 },
  { id: 1, label: 'Upload & Process', icon: Upload },
  { id: 2, label: 'Review Data', icon: Search },
  { id: 3, label: 'Activate Property', icon: Rocket },
];

const ENTITY_SIDEBAR_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  units: { label: 'Units', icon: Building2 },
  residents: { label: 'Residents', icon: Users },
  amenities: { label: 'Amenities', icon: CalendarDays },
  fobs: { label: 'FOBs / Keys', icon: Key },
  buzzer_codes: { label: 'Buzzer Codes', icon: Phone },
  parking_permits: { label: 'Parking Permits', icon: Car },
  staff: { label: 'Staff', icon: UserCog },
  packages: { label: 'Packages', icon: Package },
  maintenance_requests: { label: 'Maintenance', icon: Wrench },
  events: { label: 'Events', icon: Shield },
  properties: { label: 'Properties', icon: Building2 },
};

const STORAGE_KEY = 'concierge_property_import_wizard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSavedState(): WizardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed.currentPhase === 'number' && parsed.propertyId) {
      return parsed as WizardState;
    }
    return null;
  } catch {
    return null;
  }
}

function saveState(state: WizardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may be unavailable
  }
}

function getInitialState(): WizardState {
  return {
    currentPhase: 0,
    propertyId: null,
    propertyName: null,
    processedResults: null,
    reviewingCategory: null,
    importedCategories: {},
    completedPhases: [],
    activated: false,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PropertyImportWizard() {
  const router = useRouter();

  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [savedState, setSavedState] = useState<WizardState | null>(null);
  const initialized = useRef(false);

  const [state, setState] = useState<WizardState>(getInitialState);

  // Check localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = loadSavedState();
    if (saved) {
      setSavedState(saved);
      setShowResumeBanner(true);
    }
  }, []);

  // Persist state
  useEffect(() => {
    if (state.propertyId) {
      saveState(state);
    }
  }, [state]);

  const handleResume = useCallback(() => {
    if (savedState) {
      setState(savedState);
    }
    setShowResumeBanner(false);
    setSavedState(null);
  }, [savedState]);

  const handleStartFresh = useCallback(() => {
    clearSavedState();
    setShowResumeBanner(false);
    setSavedState(null);
  }, []);

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  const goToPhase = useCallback((phase: number) => {
    setState((s) => ({ ...s, currentPhase: phase, reviewingCategory: null }));
  }, []);

  const completePhase = useCallback((phase: number) => {
    setState((s) => ({
      ...s,
      completedPhases: s.completedPhases.includes(phase)
        ? s.completedPhases
        : [...s.completedPhases, phase],
    }));
  }, []);

  // -----------------------------------------------------------------------
  // Phase callbacks
  // -----------------------------------------------------------------------

  const handlePropertyCreated = useCallback((propertyId: string, propertyName: string) => {
    setState((s) => ({
      ...s,
      propertyId,
      propertyName,
      completedPhases: s.completedPhases.includes(0)
        ? s.completedPhases
        : [...s.completedPhases, 0],
      currentPhase: 1,
    }));
  }, []);

  const handleProcessingComplete = useCallback((results: ProcessedResults) => {
    setState((s) => ({
      ...s,
      processedResults: results,
      completedPhases: s.completedPhases.includes(1)
        ? s.completedPhases
        : [...s.completedPhases, 1],
      currentPhase: 2,
      reviewingCategory: null,
    }));
  }, []);

  const handleReviewCategory = useCallback((entityType: EntityType) => {
    setState((s) => ({ ...s, reviewingCategory: entityType }));
  }, []);

  const handleBackToOverview = useCallback(() => {
    setState((s) => ({ ...s, reviewingCategory: null }));
  }, []);

  const handleCategoryImportComplete = useCallback(
    (result: { created: number; skipped: number; errors: number }) => {
      setState((s) => {
        if (!s.reviewingCategory) return s;
        return {
          ...s,
          importedCategories: {
            ...s.importedCategories,
            [s.reviewingCategory]: result,
          },
          reviewingCategory: null,
        };
      });
    },
    [],
  );

  const handleGoToActivate = useCallback(() => {
    setState((s) => ({
      ...s,
      completedPhases: s.completedPhases.includes(2)
        ? s.completedPhases
        : [...s.completedPhases, 2],
      currentPhase: 3,
      reviewingCategory: null,
    }));
  }, []);

  const handleWizardComplete = useCallback(() => {
    setState((s) => ({
      ...s,
      activated: true,
      completedPhases: s.completedPhases.includes(3)
        ? s.completedPhases
        : [...s.completedPhases, 3],
    }));
    clearSavedState();
  }, []);

  // -----------------------------------------------------------------------
  // Sidebar helpers
  // -----------------------------------------------------------------------

  const canNavigateToPhase = (phaseId: number): boolean => {
    if (phaseId <= state.currentPhase) return true;
    if (phaseId > 0 && !state.completedPhases.includes(0)) return false;
    if (phaseId > 1 && !state.completedPhases.includes(1)) return false;
    if (phaseId > 2 && !state.completedPhases.includes(2)) return false;
    return true;
  };

  // Detected categories for sidebar sub-items
  const detectedCategories: EntityType[] = state.processedResults
    ? [...new Set(state.processedResults.files.map((f) => f.detectedEntityType))]
    : [];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex h-screen w-full bg-neutral-50">
      {/* Left sidebar */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-neutral-200 bg-white">
        {/* Header */}
        <div className="border-b border-neutral-200 px-5 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-[16px] font-semibold text-neutral-900">Import Property</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Dump everything — we will sort it out
          </p>
        </div>

        {/* Phase list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {PHASES.map((phase) => {
              const isActive = state.currentPhase === phase.id && state.reviewingCategory === null;
              const isCompleted = state.completedPhases.includes(phase.id);
              const isClickable = canNavigateToPhase(phase.id);
              const PhaseIcon = phase.icon;

              return (
                <li key={phase.id}>
                  <button
                    onClick={() => isClickable && goToPhase(phase.id)}
                    disabled={!isClickable}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : isCompleted
                          ? 'text-neutral-700 hover:bg-neutral-50'
                          : isClickable
                            ? 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                            : 'cursor-not-allowed text-neutral-300'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-primary-500 text-white'
                          : isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <PhaseIcon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{phase.label}</p>
                    </div>
                    {isActive && <ChevronRight className="text-primary-400 h-4 w-4 shrink-0" />}
                  </button>

                  {/* Dynamic sub-items under "Review Data" */}
                  {phase.id === 2 &&
                    detectedCategories.length > 0 &&
                    (state.currentPhase === 2 || state.completedPhases.includes(2)) && (
                      <ul className="mt-1 ml-4 space-y-0.5">
                        {detectedCategories.map((entityType) => {
                          const config = ENTITY_SIDEBAR_CONFIG[entityType];
                          const SubIcon = config?.icon ?? Building2;
                          const isSubActive =
                            state.currentPhase === 2 && state.reviewingCategory === entityType;
                          const isImported = entityType in state.importedCategories;

                          return (
                            <li key={entityType}>
                              <button
                                onClick={() => {
                                  goToPhase(2);
                                  handleReviewCategory(entityType);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                                  isSubActive
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : isImported
                                      ? 'text-green-700 hover:bg-green-50'
                                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                                }`}
                              >
                                {isImported ? (
                                  <Check className="h-3 w-3 shrink-0 text-green-500" />
                                ) : (
                                  <SubIcon className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate">{config?.label ?? entityType}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Property info */}
        {state.propertyName && (
          <div className="border-t border-neutral-200 px-5 py-3">
            <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
              Property
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-neutral-700">
              {state.propertyName}
            </p>
          </div>
        )}
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          {/* Resume banner */}
          {showResumeBanner && savedState && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-amber-800">Resume previous import?</p>
                <p className="mt-0.5 text-[13px] text-amber-700">
                  You have an unfinished import for &ldquo;{savedState.propertyName}&rdquo;.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={handleResume}>
                    Resume Import
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleStartFresh}>
                    Start Fresh
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Phase 0: Property Details */}
          {state.currentPhase === 0 && (
            <StepPropertyDetails onPropertyCreated={handlePropertyCreated} />
          )}

          {/* Phase 1: Upload & Process */}
          {state.currentPhase === 1 && state.propertyId && (
            <PhaseDataUpload
              propertyId={state.propertyId}
              onProcessingComplete={handleProcessingComplete}
              onBack={() => goToPhase(0)}
            />
          )}

          {/* Phase 2: Review */}
          {state.currentPhase === 2 && state.propertyId && state.processedResults && (
            <>
              {state.reviewingCategory === null ? (
                <PhaseReviewDashboard
                  processedResults={state.processedResults}
                  propertyId={state.propertyId}
                  importedCategories={state.importedCategories}
                  onReviewCategory={handleReviewCategory}
                  onActivate={handleGoToActivate}
                  onBack={() => goToPhase(1)}
                />
              ) : (
                (() => {
                  // Find the file data for the reviewing category
                  const fileData = state.processedResults!.files.find(
                    (f) => f.detectedEntityType === state.reviewingCategory,
                  );
                  if (!fileData) return null;

                  return (
                    <PhaseCategoryReview
                      entityType={state.reviewingCategory}
                      fileData={fileData}
                      propertyId={state.propertyId!}
                      onImportComplete={handleCategoryImportComplete}
                      onBack={handleBackToOverview}
                    />
                  );
                })()
              )}
            </>
          )}

          {/* Phase 3: Activate */}
          {state.currentPhase === 3 && state.propertyId && (
            <PhaseActivate
              propertyId={state.propertyId}
              propertyName={state.propertyName ?? 'Property'}
              importedCategories={state.importedCategories}
              allDetectedCategories={
                state.processedResults
                  ? [...new Set(state.processedResults.files.map((f) => f.detectedEntityType))]
                  : []
              }
              onBack={() => goToPhase(2)}
              onComplete={handleWizardComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
