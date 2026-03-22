'use client';

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StepHeaderProps {
  stepNumber: number;
  title: string;
  description: string;
  required?: boolean;
  completed?: boolean;
}

export function StepHeader({
  stepNumber,
  title,
  description,
  required,
  completed,
}: StepHeaderProps) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          completed ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'
        }`}
      >
        {completed ? <Check className="h-5 w-5" /> : stepNumber}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {required ? (
            <Badge variant="error" size="sm">
              Required
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Optional
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
