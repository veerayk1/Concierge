'use client';

/**
 * Step 5: Conflict Resolution
 *
 * Side-by-side comparison of existing vs importing records.
 * Highlights differing fields. Radio buttons: Skip / Overwrite / Merge.
 * Batch "Apply to all" action. Shows green message if no conflicts.
 */

import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ConflictItem } from './migration-wizard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepConflictResolutionProps {
  conflicts: ConflictItem[];
  setConflicts: React.Dispatch<React.SetStateAction<ConflictItem[]>>;
  conflictResolutions: Map<string, 'skip' | 'overwrite' | 'merge'>;
  setConflictResolutions: React.Dispatch<
    React.SetStateAction<Map<string, 'skip' | 'overwrite' | 'merge'>>
  >;
}

type Resolution = 'skip' | 'overwrite' | 'merge';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepConflictResolution({
  conflicts,
  conflictResolutions,
  setConflictResolutions,
}: StepConflictResolutionProps) {
  const handleResolutionChange = (key: string, resolution: Resolution) => {
    setConflictResolutions((prev) => {
      const next = new Map(prev);
      next.set(key, resolution);
      return next;
    });
  };

  const handleApplyToAll = (resolution: Resolution) => {
    setConflictResolutions((prev) => {
      const next = new Map(prev);
      conflicts.forEach((c) => {
        next.set(c.key, resolution);
      });
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // No Conflicts
  // ---------------------------------------------------------------------------

  if (conflicts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-[18px] font-semibold text-neutral-900">Conflict Resolution</h2>
          <p className="mt-1 text-[14px] text-neutral-500">
            We checked your import data against existing records in the system.
          </p>
        </div>

        <Card className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-[16px] font-semibold text-neutral-900">No Conflicts Found</h3>
            <p className="max-w-md text-[14px] text-neutral-500">
              None of the records in your import files match existing data. All records will be
              imported as new entries.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Conflicts Present
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Conflict Resolution</h2>
        <p className="mt-1 text-[14px] text-neutral-500">
          We found {conflicts.length} record{conflicts.length !== 1 ? 's' : ''} that already exist
          in the system. Choose how to handle each conflict.
        </p>
      </div>

      {/* Batch Actions */}
      <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-4 py-3">
        <span className="text-[13px] font-medium text-neutral-600">Apply to all conflicts:</span>
        <Button variant="secondary" size="sm" onClick={() => handleApplyToAll('skip')}>
          Skip All
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleApplyToAll('overwrite')}>
          Overwrite All
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleApplyToAll('merge')}>
          Merge All
        </Button>
      </div>

      {/* Conflict Cards */}
      <div className="space-y-4">
        {conflicts.map((conflict) => {
          const currentResolution = conflictResolutions.get(conflict.key);

          // Get all field keys from both sides
          const allFields = Array.from(
            new Set([...Object.keys(conflict.existing), ...Object.keys(conflict.importing)]),
          );

          return (
            <Card key={conflict.key} className="overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-[14px] font-medium text-neutral-900">Conflict: {conflict.key}</p>
                <p className="text-[12px] text-neutral-500">
                  {conflict.entityType} record already exists
                </p>
              </div>

              <div className="p-4">
                {/* Side-by-side Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Existing */}
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="mb-3 text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                      Existing
                    </p>
                    <div className="space-y-1.5">
                      {allFields.map((field) => {
                        const isDiffering = conflict.differingFields.includes(field);
                        const value = conflict.existing[field];
                        return (
                          <div
                            key={field}
                            className={`flex items-center justify-between rounded px-2 py-1 text-[12px] ${
                              isDiffering ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <span className="text-neutral-500">{field}</span>
                            <span className="font-medium text-neutral-700">
                              {value != null ? String(value) : '--'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Importing */}
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="mb-3 text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                      Importing
                    </p>
                    <div className="space-y-1.5">
                      {allFields.map((field) => {
                        const isDiffering = conflict.differingFields.includes(field);
                        const value = conflict.importing[field];
                        return (
                          <div
                            key={field}
                            className={`flex items-center justify-between rounded px-2 py-1 text-[12px] ${
                              isDiffering ? 'bg-yellow-50' : ''
                            }`}
                          >
                            <span className="text-neutral-500">{field}</span>
                            <span className="font-medium text-neutral-700">
                              {value != null ? String(value) : '--'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Resolution Options */}
                <div className="mt-4 flex items-center gap-6">
                  <RadioOption
                    name={conflict.key}
                    value="skip"
                    label="Skip (keep existing)"
                    checked={currentResolution === 'skip'}
                    onChange={() => handleResolutionChange(conflict.key, 'skip')}
                  />
                  <RadioOption
                    name={conflict.key}
                    value="overwrite"
                    label="Overwrite (use imported)"
                    checked={currentResolution === 'overwrite'}
                    onChange={() => handleResolutionChange(conflict.key, 'overwrite')}
                  />
                  <RadioOption
                    name={conflict.key}
                    value="merge"
                    label="Merge (fill blanks from import)"
                    checked={currentResolution === 'merge'}
                    onChange={() => handleResolutionChange(conflict.key, 'merge')}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function RadioOption({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-blue-600"
      />
      {label}
    </label>
  );
}
