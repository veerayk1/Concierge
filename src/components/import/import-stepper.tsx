'use client';

/**
 * Horizontal Step Indicator for the Import Wizard
 */

import { Check } from 'lucide-react';

interface ImportStepperProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

export function ImportStepper({ steps, currentStep, completedSteps }: ImportStepperProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isPast = index < currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted || isPast
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {isCompleted || isPast ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span
                className={`text-sm ${
                  isCurrent
                    ? 'font-medium text-neutral-900'
                    : isPast || isCompleted
                      ? 'text-neutral-600'
                      : 'text-neutral-400'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-px w-8 ${
                  isPast || isCompleted ? 'bg-green-300' : 'bg-neutral-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
