'use client';

/**
 * Step 2: Map Columns
 * Shows auto-mapped columns and allows manual override.
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, X, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import type { ParsedFile } from '@/lib/import/file-parser';
import { type ColumnMapping, type EntityType, getTargetFields } from '@/lib/import/column-mapper';
import { validateImportData, type ValidationResult } from '@/lib/import/validator';

interface StepMappingProps {
  parsedFile: ParsedFile;
  entityType: EntityType;
  initialMappings: ColumnMapping[];
  propertyId: string;
  onConfirm: (mappings: ColumnMapping[], validation: ValidationResult) => void;
}

export function StepMapping({
  parsedFile,
  entityType,
  initialMappings,
  onConfirm,
}: StepMappingProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const targetFields = useMemo(() => getTargetFields(entityType), [entityType]);

  // Track which target fields are already mapped
  const usedTargets = useMemo(
    () =>
      new Set(mappings.filter((m) => m.targetField && !m.isCustomField).map((m) => m.targetField!)),
    [mappings],
  );

  const handleMappingChange = useCallback((sourceHeader: string, targetField: string | null) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.sourceHeader !== sourceHeader) return m;
        if (targetField === '__skip__') {
          return { ...m, targetField: null, isCustomField: false, confidence: 0 };
        }
        if (targetField === '__custom__') {
          return { ...m, targetField: null, isCustomField: true, confidence: 0 };
        }
        return {
          ...m,
          targetField,
          isCustomField: false,
          confidence: 100,
        };
      }),
    );
  }, []);

  // Check if required fields are mapped
  const requiredFields = targetFields.filter((f) => f.required);
  const unmappedRequired = requiredFields.filter((f) => !usedTargets.has(f.key));
  const canContinue = unmappedRequired.length === 0;

  // Sample data for preview
  const sampleRows = parsedFile.rows.slice(0, 3);

  const handleConfirm = useCallback(() => {
    const result = validateImportData(parsedFile.rows, mappings, entityType);
    onConfirm(mappings, result);
  }, [parsedFile.rows, mappings, entityType, onConfirm]);

  // Stats
  const autoMapped = mappings.filter((m) => m.targetField && !m.isCustomField);
  const customFields = mappings.filter((m) => m.isCustomField);
  const skipped = mappings.filter((m) => !m.targetField && !m.isCustomField);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-6">
        <Stat
          icon={<Check className="h-4 w-4 text-green-600" />}
          label="Mapped"
          value={autoMapped.length}
          color="green"
        />
        <Stat
          icon={<Sparkles className="h-4 w-4 text-blue-600" />}
          label="Custom Fields"
          value={customFields.length}
          color="blue"
        />
        <Stat
          icon={<X className="h-4 w-4 text-neutral-400" />}
          label="Skipped"
          value={skipped.length}
          color="neutral"
        />
      </div>

      {/* Required fields warning */}
      {unmappedRequired.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            Required field{unmappedRequired.length > 1 ? 's' : ''} not mapped:{' '}
            <strong>{unmappedRequired.map((f) => f.label).join(', ')}</strong>
          </p>
        </div>
      )}

      {/* Mapping Table */}
      <div className="rounded-lg border border-neutral-200">
        {/* Header */}
        <div className="grid grid-cols-[1fr_32px_1fr_100px_1fr] items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
          <span className="text-xs font-medium text-neutral-500">Your Column</span>
          <span />
          <span className="text-xs font-medium text-neutral-500">Maps To</span>
          <span className="text-xs font-medium text-neutral-500">Match</span>
          <span className="text-xs font-medium text-neutral-500">Preview</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-100">
          {mappings.map((mapping) => (
            <div
              key={mapping.sourceHeader}
              className="grid grid-cols-[1fr_32px_1fr_100px_1fr] items-center gap-2 px-4 py-2.5"
            >
              {/* Source column name */}
              <span className="truncate text-sm font-medium text-neutral-800">
                {mapping.sourceHeader}
              </span>

              {/* Arrow */}
              <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />

              {/* Target field dropdown */}
              <select
                value={mapping.isCustomField ? '__custom__' : (mapping.targetField ?? '__skip__')}
                onChange={(e) => handleMappingChange(mapping.sourceHeader, e.target.value)}
                className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              >
                <option value="__skip__">— Skip this column —</option>
                <option value="__custom__">Custom Field</option>
                <optgroup label="Standard Fields">
                  {targetFields.map((field) => (
                    <option
                      key={field.key}
                      value={field.key}
                      disabled={usedTargets.has(field.key) && mapping.targetField !== field.key}
                    >
                      {field.label}
                      {field.required ? ' *' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Confidence */}
              <div>
                {mapping.targetField && !mapping.isCustomField ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      mapping.confidence >= 90
                        ? 'bg-green-100 text-green-700'
                        : mapping.confidence >= 60
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {mapping.confidence >= 90 ? <Check className="h-3 w-3" /> : null}
                    {mapping.confidence}%
                  </span>
                ) : mapping.isCustomField ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <Sparkles className="h-3 w-3" />
                    Custom
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </div>

              {/* Preview values */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {sampleRows.map((row, i) => (
                  <span
                    key={i}
                    className="truncate text-xs text-neutral-500"
                    title={row[mapping.sourceHeader]}
                  >
                    {row[mapping.sourceHeader] || '—'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continue */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {autoMapped.length} of {mappings.length} columns mapped
          {customFields.length > 0 && ` · ${customFields.length} saved as custom fields`}
        </p>
        <Button onClick={handleConfirm} disabled={!canContinue}>
          Review Data
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const bgClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    neutral: 'bg-neutral-50 border-neutral-200',
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${bgClasses[color] ?? bgClasses.neutral}`}
    >
      {icon}
      <div>
        <p className="text-lg font-semibold text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
