'use client';

/**
 * Phase: Category Review — Column Mapping + Data Preview + Import
 *
 * Detailed review of a single detected category. Shows:
 * - Column mapping table with confidence and dropdown overrides
 * - Data preview table with first 10 rows
 * - Validation issues per row (expandable)
 * - AI suggestions for low-confidence mappings
 * - Import execution via existing bulk APIs
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AISuggestionCard } from '../shared/ai-suggestion';
import { generateSuggestions, type AISuggestion } from '@/lib/import/ai-suggestions';
import { getTargetFields, autoMapColumns } from '@/lib/import/column-mapper';
import { validateImportData } from '@/lib/import/validator';
import type { EntityType, ColumnMapping } from '@/lib/import/column-mapper';
import type { ProcessedFileData } from './phase-data-upload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseCategoryReviewProps {
  entityType: EntityType;
  fileData: ProcessedFileData;
  propertyId: string;
  onImportComplete: (result: { created: number; skipped: number; errors: number }) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// API endpoint map (same as entity-import-section.tsx)
// ---------------------------------------------------------------------------

const IMPORT_ENDPOINTS: Partial<Record<EntityType, { url: string; bodyKey: string | null }>> = {
  units: { url: '/api/v1/units/bulk', bodyKey: 'units' },
  residents: { url: '/api/v1/users', bodyKey: null },
  properties: { url: '/api/v1/properties', bodyKey: null },
  amenities: { url: '/api/v1/amenities/bulk', bodyKey: 'amenities' },
  fobs: { url: '/api/v1/keys/bulk', bodyKey: 'fobs' },
  buzzer_codes: { url: '/api/v1/buzzer-codes/bulk', bodyKey: 'codes' },
  parking_permits: { url: '/api/v1/parking/bulk', bodyKey: 'permits' },
  staff: { url: '/api/v1/staff/bulk', bodyKey: 'staff' },
};

const ENTITY_LABELS: Record<string, string> = {
  units: 'Units',
  residents: 'Residents',
  properties: 'Properties',
  amenities: 'Amenities',
  fobs: 'FOBs / Keys',
  buzzer_codes: 'Buzzer Codes',
  parking_permits: 'Parking Permits',
  staff: 'Staff',
  packages: 'Packages',
  maintenance_requests: 'Maintenance Requests',
  events: 'Events',
};

// ---------------------------------------------------------------------------
// Helpers (from entity-import-section.tsx)
// ---------------------------------------------------------------------------

const safeInt = (val: string | undefined): number | undefined => {
  if (!val) return undefined;
  const cleaned = val.replace(/[,\s$]/g, '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
};

const safeFloat = (val: string | undefined): number | undefined => {
  if (!val) return undefined;
  const cleaned = val.replace(/[,\s$]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
};

const safeStr = (val: string | undefined): string | undefined => {
  const trimmed = val?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Extract custom fields from mappedData. The validator stores custom field
 * values with a `custom:` prefix (e.g. `custom:beds`, `custom:baths`).
 */
function extractCustomFields(
  mappedData: Record<string, string>,
): Record<string, string> | undefined {
  const customs: Record<string, string> = {};
  for (const [key, value] of Object.entries(mappedData)) {
    if (key.startsWith('custom:') && value?.trim()) {
      customs[key.replace('custom:', '')] = value.trim();
    }
  }
  return Object.keys(customs).length > 0 ? customs : undefined;
}

function buildBulkPayload(
  entityType: EntityType,
  validRows: Array<{ mappedData: Record<string, string> }>,
) {
  switch (entityType) {
    case 'units':
      return validRows.map((row) => {
        // Collect extended fields (mapped but no dedicated DB column) into customFields
        const extendedFields: Record<string, string> = {};
        const extendedKeys = [
          'bedrooms',
          'bathrooms',
          'rentAmount',
          'securityDeposit',
          'petFee',
          'leaseStart',
          'leaseEnd',
          'zone',
          'parkingType',
        ];
        for (const key of extendedKeys) {
          const val = row.mappedData[key]?.trim();
          if (val) extendedFields[key] = val;
        }
        // Merge with any custom: prefixed fields
        const autoCustom = extractCustomFields(row.mappedData) || {};
        const allCustom = { ...extendedFields, ...autoCustom };

        return {
          number: row.mappedData.number?.trim() || '',
          floor: safeInt(row.mappedData.floor),
          building: safeStr(row.mappedData.building),
          unitType: safeStr(row.mappedData.unitType),
          squareFootage: safeFloat(row.mappedData.squareFootage),
          status: safeStr(row.mappedData.status),
          enterPhoneCode: safeStr(row.mappedData.enterPhoneCode),
          parkingSpot: safeStr(row.mappedData.parkingSpot),
          locker: safeStr(row.mappedData.locker),
          comments: safeStr(row.mappedData.comments),
          customFields: Object.keys(allCustom).length > 0 ? allCustom : undefined,
        };
      });

    case 'amenities':
      return validRows.map((row) => ({
        name: row.mappedData.name,
        description: row.mappedData.description || undefined,
        capacity: row.mappedData.capacity ? parseInt(row.mappedData.capacity, 10) : undefined,
        fee: row.mappedData.fee ? parseFloat(row.mappedData.fee) : undefined,
        bookingStyle: row.mappedData.bookingStyle || undefined,
        group: row.mappedData.group || undefined,
        customFields: extractCustomFields(row.mappedData),
      }));

    case 'fobs':
      return validRows.map((row) => ({
        serialNumber: row.mappedData.serialNumber,
        unitNumber: row.mappedData.unitNumber,
        fobType: row.mappedData.fobType || undefined,
        status: row.mappedData.status || undefined,
        issuedDate: row.mappedData.issuedDate || undefined,
        issuedToName: row.mappedData.issuedToName || undefined,
        notes: row.mappedData.notes || undefined,
        customFields: extractCustomFields(row.mappedData),
      }));

    case 'buzzer_codes':
      return validRows.map((row) => ({
        unitNumber: row.mappedData.unitNumber,
        code: row.mappedData.code,
        comments: row.mappedData.comments || undefined,
        customFields: extractCustomFields(row.mappedData),
      }));

    case 'parking_permits':
      return validRows.map((row) => ({
        unitNumber: row.mappedData.unitNumber,
        licensePlate: row.mappedData.licensePlate,
        vehicleMake: row.mappedData.vehicleMake || undefined,
        vehicleModel: row.mappedData.vehicleModel || undefined,
        vehicleColor: row.mappedData.vehicleColor || undefined,
        spotNumber: row.mappedData.spotNumber || undefined,
        customFields: extractCustomFields(row.mappedData),
      }));

    case 'staff':
      return validRows.map((row) => ({
        firstName: row.mappedData.firstName || row.mappedData.fullName?.split(' ')[0] || '',
        lastName:
          row.mappedData.lastName || row.mappedData.fullName?.split(' ').slice(1).join(' ') || '',
        email: row.mappedData.email,
        phone: row.mappedData.phone || undefined,
        role: row.mappedData.role || undefined,
        customFields: extractCustomFields(row.mappedData),
      }));

    default:
      return validRows.map((row) => ({
        ...row.mappedData,
        customFields: extractCustomFields(row.mappedData),
      }));
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhaseCategoryReview({
  entityType,
  fileData,
  propertyId,
  onImportComplete,
  onBack,
}: PhaseCategoryReviewProps) {
  const targetFields = getTargetFields(entityType);

  // Mutable mappings — user can change via dropdowns
  const [mappings, setMappings] = useState<ColumnMapping[]>(fileData.mappings);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  // Re-validate whenever mappings change
  const validation = useMemo(
    () => validateImportData(fileData.rows, mappings, entityType),
    [fileData.rows, mappings, entityType],
  );

  // Generate AI suggestions
  const suggestions = useMemo(
    () =>
      generateSuggestions(mappings, entityType, fileData.rows).filter(
        (s) => !dismissedSuggestions.has(s.id),
      ),
    [mappings, entityType, fileData.rows, dismissedSuggestions],
  );

  // -----------------------------------------------------------------------
  // Mapping changes
  // -----------------------------------------------------------------------

  const handleMappingChange = useCallback((sourceHeader: string, newTargetField: string) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.sourceHeader !== sourceHeader) return m;
        if (newTargetField === '__skip__') {
          return { ...m, targetField: null, confidence: 0, isCustomField: false };
        }
        if (newTargetField === '__custom__') {
          return { ...m, targetField: null, confidence: 0, isCustomField: true };
        }
        return { ...m, targetField: newTargetField, confidence: 80, isCustomField: false };
      }),
    );
  }, []);

  const handleApplySuggestion = useCallback(
    (suggestion: AISuggestion) => {
      if (suggestion.action) {
        handleMappingChange(suggestion.action.sourceHeader, suggestion.action.targetField);
      }
      setDismissedSuggestions((prev) => new Set([...prev, suggestion.id]));
    },
    [handleMappingChange],
  );

  const handleDismissSuggestion = useCallback((id: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, id]));
  }, []);

  // -----------------------------------------------------------------------
  // Import
  // -----------------------------------------------------------------------

  const handleImport = useCallback(async () => {
    const endpoint = IMPORT_ENDPOINTS[entityType];
    if (!endpoint) {
      setImportError('Import endpoint not available for this entity type yet.');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(demoRole && { 'x-demo-role': demoRole }),
    };

    const validRows = validation.rows.filter((r) => r.status !== 'error');

    try {
      let created = 0;
      let skipped = 0;
      let errors = 0;

      if (endpoint.bodyKey) {
        // Bulk endpoint
        const payload = buildBulkPayload(entityType, validRows);
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            propertyId,
            [endpoint.bodyKey]: payload,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          let errorMsg = err.message || 'Import failed';
          if (err.fields) {
            const fieldErrors = Object.entries(err.fields)
              .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMsg += ` — ${fieldErrors}`;
          }
          throw new Error(errorMsg);
        }

        const result = await response.json();
        created = result.data?.created ?? payload.length;
        skipped = result.data?.skipped ?? 0;
        errors = result.data?.errors?.length ?? 0;
        setImportProgress(100);
      } else if (entityType === 'residents') {
        // One-at-a-time for residents
        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i]!;
          const firstName =
            row.mappedData.firstName || row.mappedData.fullName?.split(' ')[0] || '';
          const lastName =
            row.mappedData.lastName || row.mappedData.fullName?.split(' ').slice(1).join(' ') || '';

          try {
            const response = await fetch(endpoint.url, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                firstName,
                lastName,
                email: row.mappedData.email || undefined,
                phone: row.mappedData.phone || undefined,
                unitNumber: row.mappedData.unitNumber || undefined,
                residentType: row.mappedData.residentType || 'resident',
                propertyId,
                role: 'RESIDENT',
                customFields: extractCustomFields(row.mappedData),
              }),
            });

            if (response.ok) {
              created++;
            } else {
              skipped++;
            }
          } catch {
            errors++;
          }

          setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
        }
      } else if (entityType === 'properties') {
        // One-at-a-time for properties
        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i]!;
          try {
            const response = await fetch(endpoint.url, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                name: row.mappedData.name?.trim() || '',
                address: row.mappedData.address?.trim() || '',
                city: row.mappedData.city?.trim() || '',
                province: row.mappedData.province?.trim() || '',
                country: row.mappedData.country?.trim() || 'CA',
                postalCode: row.mappedData.postalCode?.trim() || undefined,
                unitCount: row.mappedData.unitCount
                  ? parseInt(row.mappedData.unitCount, 10)
                  : undefined,
                timezone: row.mappedData.timezone?.trim() || 'America/Toronto',
                propertyCode: row.mappedData.propertyCode?.trim() || undefined,
              }),
            });

            if (response.ok) {
              created++;
            } else {
              const err = await response.json().catch(() => ({}));
              errors++;
              console.warn(`Property row ${i} failed:`, err.message);
            }
          } catch {
            errors++;
          }

          setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
        }
      }

      onImportComplete({
        created,
        skipped,
        errors: errors + validation.errorRows,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setIsImporting(false);
    }
  }, [entityType, propertyId, validation, onImportComplete]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const filteredPreviewRows = useMemo(() => {
    const filtered =
      previewFilter === 'all'
        ? validation.rows
        : validation.rows.filter((r) => r.status === previewFilter);
    return filtered.slice(0, 50); // Show up to 50 rows
  }, [validation.rows, previewFilter]);
  const previewRows = filteredPreviewRows;
  const mappedHeaders = mappings
    .filter((m) => m.targetField || m.isCustomField)
    .map((m) => {
      if (m.isCustomField && !m.targetField) {
        // Custom field — use source header as both key and label
        return {
          source: m.sourceHeader,
          target: `custom:${m.sourceHeader}`,
          label: `${m.sourceHeader} (custom)`,
        };
      }
      return {
        source: m.sourceHeader,
        target: m.targetField!,
        label: targetFields.find((f) => f.key === m.targetField)?.label ?? m.targetField!,
      };
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Overview
        </Button>
        <h2 className="text-lg font-semibold text-neutral-900">
          Review: {ENTITY_LABELS[entityType] ?? entityType}
        </h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Source: {fileData.fileName} — {fileData.totalRows} rows detected
        </p>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-[13px] font-medium text-neutral-600">Suggestions</p>
          {suggestions.map((s) => (
            <AISuggestionCard
              key={s.id}
              suggestion={s}
              onApply={s.action ? () => handleApplySuggestion(s) : undefined}
              onDismiss={() => handleDismissSuggestion(s.id)}
            />
          ))}
        </div>
      )}

      {/* Column Mapping Table */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="border-b border-neutral-100 px-4 py-3">
          <p className="text-[13px] font-semibold tracking-wide text-neutral-700 uppercase">
            Column Mapping
          </p>
        </div>
        <div className="max-h-[320px] divide-y divide-neutral-100 overflow-y-auto">
          {mappings.map((mapping) => (
            <div key={mapping.sourceHeader} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-700">
                {mapping.sourceHeader}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
              <select
                value={
                  mapping.targetField
                    ? mapping.targetField
                    : mapping.isCustomField
                      ? '__custom__'
                      : '__skip__'
                }
                onChange={(e) => handleMappingChange(mapping.sourceHeader, e.target.value)}
                className="h-8 min-w-[180px] rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-800"
              >
                <option value="__custom__">💾 Save as Custom Field</option>
                <option value="__skip__">⏭ Skip this column</option>
                {targetFields.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label} {field.required ? '(required)' : ''}
                  </option>
                ))}
              </select>
              <div className="w-14 shrink-0 text-right">
                {mapping.targetField && !mapping.isCustomField ? (
                  <ConfidenceBadge confidence={mapping.confidence} />
                ) : mapping.isCustomField ? (
                  <span className="text-xs font-medium text-blue-600">Custom</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Validation Summary — clickable filter tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        {[
          { key: 'all', label: 'All', count: validation.totalRows, icon: null, color: '' },
          {
            key: 'valid',
            label: 'Valid',
            count: validation.validRows,
            icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
            color: 'text-green-700',
          },
          {
            key: 'warning',
            label: 'Warnings',
            count: validation.warningRows,
            icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
            color: 'text-amber-700',
          },
          {
            key: 'error',
            label: 'Errors',
            count: validation.errorRows,
            icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
            color: 'text-red-700',
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPreviewFilter(tab.key as typeof previewFilter)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              previewFilter === tab.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`ml-0.5 ${previewFilter === tab.key ? tab.color : 'text-neutral-400'}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Data Preview Table */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <p className="text-[13px] font-semibold tracking-wide text-neutral-700 uppercase">
            Data Preview
          </p>
          <p className="text-xs text-neutral-400">
            {filteredPreviewRows.length} of {validation.totalRows} rows
            {previewFilter !== 'all' && ` · Showing ${previewFilter} only`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-3 py-2 text-left font-medium text-neutral-500">Status</th>
                {mappedHeaders.slice(0, 6).map((h) => (
                  <th key={h.target} className="px-3 py-2 text-left font-medium text-neutral-500">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => {
                const isExpanded = expandedRow === row.index;
                return (
                  <React.Fragment key={row.index}>
                    <tr
                      className={`border-b border-neutral-50 transition-colors ${
                        row.issues.length > 0 ? 'cursor-pointer hover:bg-neutral-50' : ''
                      } ${
                        row.status === 'error'
                          ? 'bg-red-50/40'
                          : row.status === 'warning'
                            ? 'bg-amber-50/30'
                            : ''
                      }`}
                      onClick={() =>
                        row.issues.length > 0 && setExpandedRow(isExpanded ? null : row.index)
                      }
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {row.status === 'valid' && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          )}
                          {row.status === 'warning' && (
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-amber-500" />
                              )}
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            </div>
                          )}
                          {row.status === 'error' && (
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-red-500" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-red-500" />
                              )}
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      {mappedHeaders.slice(0, 6).map((h) => (
                        <td
                          key={h.target}
                          className="max-w-[200px] truncate px-3 py-2 text-neutral-700"
                        >
                          {row.mappedData[h.target] || <span className="text-neutral-300">—</span>}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && row.issues.length > 0 && (
                      <tr>
                        <td colSpan={mappedHeaders.slice(0, 6).length + 1} className="px-4 py-3">
                          <div
                            className={`rounded-lg border p-3 ${
                              row.status === 'error'
                                ? 'border-red-200 bg-red-50'
                                : 'border-amber-200 bg-amber-50'
                            }`}
                          >
                            <p
                              className={`mb-2 text-xs font-semibold ${
                                row.status === 'error' ? 'text-red-800' : 'text-amber-800'
                              }`}
                            >
                              Row {row.index + 1} — {row.issues.length} issue
                              {row.issues.length > 1 ? 's' : ''} found:
                            </p>
                            <div className="space-y-1.5">
                              {row.issues.map((issue, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-[12px]">
                                  <span
                                    className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                                      issue.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'
                                    }`}
                                  />
                                  <div>
                                    <span
                                      className={`font-medium ${
                                        issue.severity === 'error'
                                          ? 'text-red-800'
                                          : 'text-amber-800'
                                      }`}
                                    >
                                      {issue.column}:
                                    </span>{' '}
                                    <span
                                      className={
                                        issue.severity === 'error'
                                          ? 'text-red-700'
                                          : 'text-amber-700'
                                      }
                                    >
                                      {issue.message}
                                    </span>
                                    {issue.value && (
                                      <span className="ml-1 rounded bg-white/50 px-1 py-0.5 font-mono text-[11px] text-neutral-600">
                                        &quot;{issue.value}&quot;
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Import error */}
      {importError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-medium text-red-800">Import Failed</p>
          <p className="text-xs break-all whitespace-pre-wrap text-red-700">{importError}</p>
        </div>
      )}

      {/* Import button or progress */}
      {isImporting ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white py-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-neutral-700">Importing records...</p>
          <div className="mx-auto h-2 w-3/4 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">{importProgress}% complete</p>
        </div>
      ) : (
        <Button onClick={handleImport} disabled={validation.validRows === 0} fullWidth size="lg">
          Import {validation.validRows.toLocaleString()} Records
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 90) {
    return (
      <Badge variant="success" size="sm">
        {confidence}%
      </Badge>
    );
  }
  if (confidence >= 60) {
    return (
      <Badge variant="warning" size="sm">
        {confidence}%
      </Badge>
    );
  }
  return (
    <Badge variant="error" size="sm">
      {confidence}%
    </Badge>
  );
}
