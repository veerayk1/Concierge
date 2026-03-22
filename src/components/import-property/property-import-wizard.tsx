'use client';

/**
 * Property Import Wizard — 8-Step Full-Page Wizard
 *
 * Guides admins through importing an entire property ecosystem:
 * 1. Property Details (required)
 * 2. Buildings & Units (required)
 * 3. Residents (optional)
 * 4. Amenities (optional)
 * 5. Access & Security (optional)
 * 6. Staff & Roles (optional)
 * 7. Historical Data (optional)
 * 8. Review & Activate (required)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  DoorOpen,
  Users,
  TreePalm,
  Shield,
  UserCog,
  Archive,
  Rocket,
  Check,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { StepPropertyDetails } from './steps/step-property-details';
import { StepBuildingsUnits } from './steps/step-buildings-units';
import { StepResidents } from './steps/step-residents';
import { StepAmenities } from './steps/step-amenities';
import { StepAccessSecurity } from './steps/step-access-security';
import { StepStaffRoles } from './steps/step-staff-roles';
import { StepHistoricalData } from './steps/step-historical-data';
import { StepConfiguration } from './steps/step-configuration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardState {
  currentStep: number;
  propertyId: string | null;
  propertyName: string | null;
  completedSteps: number[];
  skippedSteps: number[];
  stepData: {
    units?: { created: number };
    residents?: { created: number; linked: number };
    amenities?: { created: number };
    fobs?: { created: number };
    buzzerCodes?: { created: number };
    parkingPermits?: { created: number };
    staff?: { created: number };
    packages?: { created: number };
    maintenanceRequests?: { created: number };
    events?: { created: number };
  };
}

interface StepConfig {
  id: number;
  label: string;
  icon: React.ElementType;
  required: boolean;
}

const STEPS: StepConfig[] = [
  { id: 0, label: 'Property Details', icon: Building2, required: true },
  { id: 1, label: 'Buildings & Units', icon: DoorOpen, required: true },
  { id: 2, label: 'Residents', icon: Users, required: false },
  { id: 3, label: 'Amenities', icon: TreePalm, required: false },
  { id: 4, label: 'Access & Security', icon: Shield, required: false },
  { id: 5, label: 'Staff & Roles', icon: UserCog, required: false },
  { id: 6, label: 'Historical Data', icon: Archive, required: false },
  { id: 7, label: 'Review & Activate', icon: Rocket, required: true },
];

const STORAGE_KEY = 'concierge_property_import_wizard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSavedState(): WizardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Basic validation
    if (parsed && typeof parsed.currentStep === 'number' && parsed.propertyId) {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PropertyImportWizard() {
  const router = useRouter();

  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [savedState, setSavedState] = useState<WizardState | null>(null);
  const initialized = useRef(false);

  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    propertyId: null,
    propertyName: null,
    completedSteps: [],
    skippedSteps: [],
    stepData: {},
  });

  // Check localStorage on mount for saved state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = loadSavedState();
    if (saved) {
      setSavedState(saved);
      setShowResumeBanner(true);
    }
  }, []);

  // Save state to localStorage on every change (after property is created)
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

  const goToStep = useCallback((step: number) => {
    setState((s) => {
      // If navigating to a previously skipped step via sidebar click, un-skip it
      const newSkipped = s.skippedSteps.filter((sk) => sk !== step);
      return { ...s, currentStep: step, skippedSteps: newSkipped };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.max(s.currentStep - 1, 0),
    }));
  }, []);

  const completeStep = useCallback((step: number) => {
    setState((s) => ({
      ...s,
      completedSteps: s.completedSteps.includes(step)
        ? s.completedSteps
        : [...s.completedSteps, step],
      skippedSteps: s.skippedSteps.filter((sk) => sk !== step),
    }));
  }, []);

  const skipStep = useCallback((step: number) => {
    setState((s) => ({
      ...s,
      skippedSteps: s.skippedSteps.includes(step) ? s.skippedSteps : [...s.skippedSteps, step],
      currentStep: Math.min(step + 1, STEPS.length - 1),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.min(s.currentStep + 1, STEPS.length - 1),
    }));
  }, []);

  // -----------------------------------------------------------------------
  // Step callbacks
  // -----------------------------------------------------------------------

  const handlePropertyCreated = useCallback((propertyId: string, propertyName: string) => {
    setState((s) => ({
      ...s,
      propertyId,
      propertyName,
      completedSteps: s.completedSteps.includes(0) ? s.completedSteps : [...s.completedSteps, 0],
      currentStep: 1,
    }));
  }, []);

  const handleUnitsComplete = useCallback(
    (created: number) => {
      setState((s) => ({
        ...s,
        stepData: { ...s.stepData, units: { created } },
      }));
      completeStep(1);
    },
    [completeStep],
  );

  const handleStepDataUpdate = useCallback(
    (
      stepIndex: number,
      dataKey: keyof WizardState['stepData'],
      result: { created: number; skipped: number; errors: number },
    ) => {
      setState((s) => ({
        ...s,
        stepData: {
          ...s.stepData,
          [dataKey]: { created: result.created, linked: 0 },
        },
        completedSteps: s.completedSteps.includes(stepIndex)
          ? s.completedSteps
          : [...s.completedSteps, stepIndex],
      }));
    },
    [],
  );

  const handleWizardComplete = useCallback(() => {
    clearSavedState();
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const canNavigateToStep = (stepId: number): boolean => {
    // Can always go back to completed or current steps
    if (stepId <= state.currentStep) return true;
    // Step 0 must be completed before anything else
    if (stepId > 0 && !state.completedSteps.includes(0)) return false;
    // Step 1 must be completed (or current) for steps > 1
    if (stepId > 1 && !state.completedSteps.includes(1) && state.currentStep < 1) return false;
    // Allow navigating to any non-skipped step after prerequisites are met
    return true;
  };

  return (
    <div className="flex h-screen w-full bg-neutral-50">
      {/* Left sidebar navigation */}
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
            Set up a new property with all its data
          </p>
        </div>

        {/* Step list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {STEPS.map((step) => {
              const isActive = state.currentStep === step.id;
              const isCompleted = state.completedSteps.includes(step.id);
              const isSkipped = state.skippedSteps.includes(step.id);
              const isClickable = canNavigateToStep(step.id);
              const StepIcon = step.icon;

              return (
                <li key={step.id}>
                  <button
                    onClick={() => isClickable && goToStep(step.id)}
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
                            : isSkipped
                              ? 'bg-neutral-100 text-neutral-400'
                              : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{step.label}</p>
                      {isSkipped && <p className="text-[11px] text-neutral-400">Skipped</p>}
                    </div>
                    {isActive && <ChevronRight className="text-primary-400 h-4 w-4 shrink-0" />}
                  </button>
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
                  You have an unfinished import for &ldquo;{savedState.propertyName}&rdquo; (Step{' '}
                  {savedState.currentStep + 1} of 8).
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

          {state.currentStep === 0 && (
            <StepPropertyDetails onPropertyCreated={handlePropertyCreated} />
          )}

          {state.currentStep === 1 && state.propertyId && (
            <StepBuildingsUnits
              propertyId={state.propertyId}
              onComplete={handleUnitsComplete}
              onNext={nextStep}
              onBack={goBack}
            />
          )}

          {state.currentStep === 2 && state.propertyId && (
            <StepResidents
              propertyId={state.propertyId}
              onImportComplete={(result) => handleStepDataUpdate(2, 'residents', result)}
              onSkip={() => skipStep(2)}
              onNext={() => {
                completeStep(2);
                nextStep();
              }}
              onBack={goBack}
            />
          )}

          {state.currentStep === 3 && state.propertyId && (
            <StepAmenities
              propertyId={state.propertyId}
              onImportComplete={(result) => handleStepDataUpdate(3, 'amenities', result)}
              onSkip={() => skipStep(3)}
              onNext={() => {
                completeStep(3);
                nextStep();
              }}
              onBack={goBack}
            />
          )}

          {state.currentStep === 4 && state.propertyId && (
            <StepAccessSecurity
              propertyId={state.propertyId}
              onFobsImported={(result) => handleStepDataUpdate(4, 'fobs', result)}
              onBuzzerCodesImported={(result) => handleStepDataUpdate(4, 'buzzerCodes', result)}
              onParkingPermitsImported={(result) =>
                handleStepDataUpdate(4, 'parkingPermits', result)
              }
              onSkip={() => skipStep(4)}
              onNext={() => {
                completeStep(4);
                nextStep();
              }}
              onBack={goBack}
            />
          )}

          {state.currentStep === 5 && state.propertyId && (
            <StepStaffRoles
              propertyId={state.propertyId}
              onImportComplete={(result) => handleStepDataUpdate(5, 'staff', result)}
              onSkip={() => skipStep(5)}
              onNext={() => {
                completeStep(5);
                nextStep();
              }}
              onBack={goBack}
            />
          )}

          {state.currentStep === 6 && state.propertyId && (
            <StepHistoricalData
              propertyId={state.propertyId}
              onPackagesImported={(result) => handleStepDataUpdate(6, 'packages', result)}
              onMaintenanceImported={(result) =>
                handleStepDataUpdate(6, 'maintenanceRequests', result)
              }
              onEventsImported={(result) => handleStepDataUpdate(6, 'events', result)}
              onSkip={() => skipStep(6)}
              onNext={() => {
                completeStep(6);
                nextStep();
              }}
              onBack={goBack}
            />
          )}

          {state.currentStep === 7 && state.propertyId && (
            <StepConfiguration
              propertyId={state.propertyId}
              propertyName={state.propertyName ?? ''}
              stepData={state.stepData}
              completedSteps={state.completedSteps}
              skippedSteps={state.skippedSteps}
              onBack={goBack}
              onComplete={handleWizardComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
