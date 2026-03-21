'use client';

/**
 * Step 4: Import Progress & Results
 * Executes the import and shows real-time progress.
 */

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  Loader2,
  ArrowRight,
  RefreshCw,
  Download,
} from 'lucide-react';
import type { ValidationResult } from '@/lib/import/validator';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';
import { generateErrorReport } from '@/lib/import/validator';

interface StepProgressProps {
  validationResult: ValidationResult;
  mappings: ColumnMapping[];
  entityType: EntityType;
  propertyId: string;
  duplicateStrategy: 'skip' | 'overwrite' | 'merge';
  importResult: {
    created: number;
    skipped: number;
    errors: Array<{ index: number; number?: string; message: string }>;
  } | null;
  onComplete: (result: StepProgressProps['importResult']) => void;
  onViewResults: () => void;
  onImportMore: () => void;
}

export function StepProgress({
  validationResult,
  mappings,
  entityType,
  propertyId,
  duplicateStrategy,
  importResult,
  onComplete,
  onViewResults,
  onImportMore,
}: StepProgressProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing import...');
  const importStarted = useRef(false);

  useEffect(() => {
    if (importResult || importStarted.current) return;
    importStarted.current = true;

    executeImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function executeImport() {
    const importableRows = validationResult.rows.filter((r) => r.status !== 'error');

    if (importableRows.length === 0) {
      onComplete({ created: 0, skipped: 0, errors: [] });
      return;
    }

    // Build the mapped data
    const fieldMap = new Map<string, string>();
    for (const m of mappings) {
      if (m.targetField && !m.isCustomField) {
        fieldMap.set(m.sourceHeader, m.targetField);
      }
    }
    const customFieldMappings = mappings.filter((m) => m.isCustomField);

    setStatusMessage('Mapping data...');
    setProgress(10);

    if (entityType === 'units') {
      await importUnits(importableRows, fieldMap, customFieldMappings);
    } else {
      await importResidents(importableRows, fieldMap, customFieldMappings);
    }
  }

  async function importUnits(
    rows: ValidationResult['rows'],
    fieldMap: Map<string, string>,
    customFieldMappings: ColumnMapping[],
  ) {
    const units = rows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [source, target] of fieldMap) {
        mapped[target] = row.data[source] ?? '';
      }

      // Collect custom fields
      const customFields: Record<string, string> = {};
      for (const m of customFieldMappings) {
        const val = row.data[m.sourceHeader]?.trim();
        if (val) customFields[m.sourceHeader] = val;
      }

      const floor = mapped.floor ? parseInt(mapped.floor, 10) : null;
      const sqft = mapped.squareFootage
        ? parseFloat(mapped.squareFootage.replace(/[,\s]/g, ''))
        : null;

      return {
        number: mapped.number?.trim() || '',
        floor: floor && !isNaN(floor) ? floor : null,
        unitType: mapped.unitType?.trim() || 'residential',
        squareFootage: sqft && !isNaN(sqft) ? sqft : null,
        enterPhoneCode: mapped.enterPhoneCode?.trim() || null,
        parkingSpot: mapped.parkingSpot?.trim() || null,
        locker: mapped.locker?.trim() || null,
        keyTag: mapped.keyTag?.trim() || null,
        comments: mapped.comments?.trim() || null,
        customFields: Object.keys(customFields).length > 0 ? customFields : null,
      };
    });

    setStatusMessage(`Importing ${units.length} units...`);
    setProgress(30);

    // Batch in chunks of 500
    const chunkSize = 500;
    let totalCreated = 0;
    let totalSkipped = 0;
    const allErrors: Array<{ index: number; number?: string; message: string }> = [];

    for (let i = 0; i < units.length; i += chunkSize) {
      const chunk = units.slice(i, i + chunkSize);
      const pct = 30 + Math.round(((i + chunk.length) / units.length) * 60);
      setProgress(pct);
      setStatusMessage(
        `Importing ${Math.min(i + chunkSize, units.length)} of ${units.length} units...`,
      );

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/v1/units/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(localStorage.getItem('demo_role') && {
              'x-demo-role': localStorage.getItem('demo_role')!,
            }),
          },
          body: JSON.stringify({
            propertyId,
            units: chunk,
            skipDuplicates: duplicateStrategy === 'skip',
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          allErrors.push({
            index: i,
            message: err.message || `Batch failed (${response.status})`,
          });
          continue;
        }

        const result = await response.json();
        totalCreated += result.data.created;
        totalSkipped += result.data.skipped;
        if (result.data.errors) {
          allErrors.push(
            ...result.data.errors.map((e: { index: number; number: string; message: string }) => ({
              ...e,
              index: e.index + i,
            })),
          );
        }
      } catch (err) {
        allErrors.push({
          index: i,
          message: err instanceof Error ? err.message : 'Network error',
        });
      }
    }

    setProgress(100);
    setStatusMessage('Import complete!');
    onComplete({
      created: totalCreated,
      skipped: totalSkipped,
      errors: allErrors,
    });
  }

  async function importResidents(
    rows: ValidationResult['rows'],
    fieldMap: Map<string, string>,
    customFieldMappings: ColumnMapping[],
  ) {
    setStatusMessage(`Importing ${rows.length} residents...`);
    setProgress(30);

    let totalCreated = 0;
    let totalSkipped = 0;
    const allErrors: Array<{ index: number; message: string }> = [];

    // Import residents one by one (they need individual user creation)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const mapped: Record<string, string> = {};
      for (const [source, target] of fieldMap) {
        mapped[target] = row.data[source] ?? '';
      }

      const pct = 30 + Math.round(((i + 1) / rows.length) * 60);
      setProgress(pct);
      if (i % 10 === 0) {
        setStatusMessage(`Importing ${i + 1} of ${rows.length} residents...`);
      }

      // Handle fullName → firstName + lastName split
      let firstName = mapped.firstName?.trim() || '';
      let lastName = mapped.lastName?.trim() || '';
      if (!firstName && mapped.fullName) {
        const parts = mapped.fullName.trim().split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      if (!firstName) {
        allErrors.push({ index: i, message: 'No name found' });
        continue;
      }

      const email =
        mapped.email?.trim() ||
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}@placeholder.local`;

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/v1/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(localStorage.getItem('demo_role') && {
              'x-demo-role': localStorage.getItem('demo_role')!,
            }),
          },
          body: JSON.stringify({
            propertyId,
            firstName,
            lastName,
            email,
            phone: mapped.phone?.trim() || '',
            roleId: 'resident_owner', // Default role, will be refined
            sendWelcomeEmail: false,
          }),
        });

        if (response.status === 409) {
          if (duplicateStrategy === 'skip') {
            totalSkipped++;
          }
          continue;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          allErrors.push({
            index: i,
            message: err.message || `Failed (${response.status})`,
          });
          continue;
        }

        totalCreated++;
      } catch (err) {
        allErrors.push({
          index: i,
          message: err instanceof Error ? err.message : 'Network error',
        });
      }
    }

    setProgress(100);
    setStatusMessage('Import complete!');
    onComplete({
      created: totalCreated,
      skipped: totalSkipped,
      errors: allErrors,
    });
  }

  const isComplete = importResult !== null;
  const entityLabel = entityType === 'units' ? 'Units' : 'Residents';

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      {/* Progress / Results */}
      {!isComplete ? (
        <div className="space-y-6 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <div>
            <p className="text-lg font-medium text-neutral-900">{statusMessage}</p>
            <p className="mt-1 text-sm text-neutral-500">Please don&apos;t close this window</p>
          </div>
          <div className="mx-auto max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">{progress}%</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <h3 className="mt-3 text-xl font-semibold text-neutral-900">Import Complete</h3>
          </div>

          {/* Results */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
              <p className="text-2xl font-bold text-green-800">{importResult.created}</p>
              <p className="text-xs text-green-600">Created</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <SkipForward className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-2xl font-bold text-amber-800">{importResult.skipped}</p>
              <p className="text-xs text-amber-600">Skipped</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <XCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
              <p className="text-2xl font-bold text-red-800">{importResult.errors.length}</p>
              <p className="text-xs text-red-600">Errors</p>
            </div>
          </div>

          {/* Error details */}
          {importResult.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-medium text-red-800">
                {importResult.errors.length} row(s) failed:
              </p>
              <div className="max-h-32 space-y-1 overflow-auto">
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-xs text-red-700">
                    Row {err.index + 1}: {err.message}
                  </p>
                ))}
                {importResult.errors.length > 10 && (
                  <p className="text-xs text-red-500">
                    ...and {importResult.errors.length - 10} more
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const csv = generateErrorReport(validationResult);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `import-errors-${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download Error Report
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={onImportMore}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Import More
            </Button>
            <Button onClick={onViewResults}>
              View {entityLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
