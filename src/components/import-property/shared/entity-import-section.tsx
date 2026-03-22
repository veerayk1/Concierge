'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
  RotateCcw,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDropzone } from '@/components/import/file-dropzone';
import { parseFile } from '@/lib/import/file-parser';
import type { ParsedFile } from '@/lib/import/file-parser';
import { autoMapColumns, getTargetFields } from '@/lib/import/column-mapper';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';
import { validateImportData } from '@/lib/import/validator';
import type { ValidationResult } from '@/lib/import/validator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EntityImportSectionProps {
  entityType: EntityType;
  propertyId: string;
  title: string;
  description: string;
  onImportComplete?: (result: { created: number; skipped: number; errors: number }) => void;
  existingData?: { unitNumbers?: Set<string> };
}

type Phase = 'upload' | 'mapping' | 'importing' | 'done';

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// API endpoint map — includes all bulk endpoints
// ---------------------------------------------------------------------------

const IMPORT_ENDPOINTS: Partial<Record<EntityType, { url: string; bodyKey: string | null }>> = {
  units: { url: '/api/v1/units/bulk', bodyKey: 'units' },
  residents: { url: '/api/v1/users', bodyKey: null }, // one-at-a-time
  properties: { url: '/api/v1/properties', bodyKey: null },
  amenities: { url: '/api/v1/amenities/bulk', bodyKey: 'amenities' },
  fobs: { url: '/api/v1/keys/bulk', bodyKey: 'fobs' },
  buzzer_codes: { url: '/api/v1/buzzer-codes/bulk', bodyKey: 'codes' },
  parking_permits: { url: '/api/v1/parking/bulk', bodyKey: 'permits' },
  staff: { url: '/api/v1/staff/bulk', bodyKey: 'staff' },
};

// ---------------------------------------------------------------------------
// Template download labels
// ---------------------------------------------------------------------------

const ENTITY_LABELS: Record<EntityType, string> = {
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
// Component
// ---------------------------------------------------------------------------

export function EntityImportSection({
  entityType,
  propertyId,
  title,
  description,
  onImportComplete,
  existingData,
}: EntityImportSectionProps) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const targetFields = getTargetFields(entityType);
  const endpoint = IMPORT_ENDPOINTS[entityType];

  // -----------------------------------------------------------------------
  // Parse file and auto-map
  // -----------------------------------------------------------------------

  const handleFileSelected = useCallback(
    async (file: File) => {
      setParseError(null);
      setIsParsing(true);
      try {
        const parsed = await parseFile(file);
        setParsedFile(parsed);

        const autoMappings = autoMapColumns(parsed.headers, entityType, parsed.rows);
        setMappings(autoMappings);

        const validationResult = validateImportData(
          parsed.rows,
          autoMappings,
          entityType,
          existingData?.unitNumbers,
        );
        setValidation(validationResult);

        setPhase('mapping');
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse file');
      } finally {
        setIsParsing(false);
      }
    },
    [entityType, existingData],
  );

  // -----------------------------------------------------------------------
  // Build mapped data from validated rows for bulk endpoints
  // -----------------------------------------------------------------------

  const buildBulkPayload = useCallback(
    (validRows: Array<{ mappedData: Record<string, string> }>) => {
      // Helper to safely parse integers — returns undefined for NaN/invalid
      const safeInt = (val: string | undefined): number | undefined => {
        if (!val) return undefined;
        const cleaned = val.replace(/[,\s$]/g, '').trim();
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? undefined : num;
      };
      // Helper to safely parse floats
      const safeFloat = (val: string | undefined): number | undefined => {
        if (!val) return undefined;
        const cleaned = val.replace(/[,\s$]/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? undefined : num;
      };
      // Helper: only include non-empty strings
      const safeStr = (val: string | undefined): string | undefined => {
        const trimmed = val?.trim();
        return trimmed && trimmed.length > 0 ? trimmed : undefined;
      };

      switch (entityType) {
        case 'units':
          return validRows.map((row) => ({
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
          }));

        case 'amenities':
          return validRows.map((row) => ({
            name: row.mappedData.name,
            description: row.mappedData.description || undefined,
            capacity: row.mappedData.capacity ? parseInt(row.mappedData.capacity, 10) : undefined,
            fee: row.mappedData.fee ? parseFloat(row.mappedData.fee) : undefined,
            bookingStyle: row.mappedData.bookingStyle || undefined,
            group: row.mappedData.group || undefined,
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
          }));

        case 'buzzer_codes':
          return validRows.map((row) => ({
            unitNumber: row.mappedData.unitNumber,
            code: row.mappedData.code,
            comments: row.mappedData.comments || undefined,
          }));

        case 'parking_permits':
          return validRows.map((row) => ({
            unitNumber: row.mappedData.unitNumber,
            licensePlate: row.mappedData.licensePlate,
            vehicleMake: row.mappedData.vehicleMake || undefined,
            vehicleModel: row.mappedData.vehicleModel || undefined,
            vehicleYear: row.mappedData.vehicleYear
              ? parseInt(row.mappedData.vehicleYear, 10)
              : undefined,
            vehicleColor: row.mappedData.vehicleColor || undefined,
            provinceState: row.mappedData.provinceState || undefined,
            spotNumber: row.mappedData.spotNumber || undefined,
            notes: row.mappedData.notes || undefined,
          }));

        case 'staff':
          return validRows.map((row) => ({
            firstName: row.mappedData.firstName || row.mappedData.fullName?.split(' ')[0] || '',
            lastName:
              row.mappedData.lastName ||
              row.mappedData.fullName?.split(' ').slice(1).join(' ') ||
              '',
            email: row.mappedData.email,
            phone: row.mappedData.phone || undefined,
            role: row.mappedData.role || undefined,
          }));

        default:
          return validRows.map((row) => row.mappedData);
      }
    },
    [entityType],
  );

  // -----------------------------------------------------------------------
  // Execute import
  // -----------------------------------------------------------------------

  const handleImport = useCallback(async () => {
    if (!validation || !parsedFile) return;

    if (!endpoint) {
      setImportError('Import endpoint coming soon for this entity type.');
      return;
    }

    setPhase('importing');
    setImportProgress(0);
    setImportError(null);

    const token = localStorage.getItem('auth_token');
    const demoRole = localStorage.getItem('demo_role');
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
        // Bulk endpoint — send all records at once
        const payload = buildBulkPayload(validRows);
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
          // Build detailed error message including field-level validation errors
          let errorMsg = err.message || 'Import failed';
          if (err.fields) {
            const fieldErrors = Object.entries(err.fields)
              .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMsg += ` — ${fieldErrors}`;
          }
          if (err.error) {
            errorMsg = `[${err.error}] ${errorMsg}`;
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
        // Single property
        const row = validRows[0];
        if (row) {
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: row.mappedData.name,
              address: row.mappedData.address,
              city: row.mappedData.city,
              province: row.mappedData.province,
              country: row.mappedData.country || 'CA',
              postalCode: row.mappedData.postalCode || undefined,
              unitCount: row.mappedData.unitCount
                ? parseInt(row.mappedData.unitCount, 10)
                : undefined,
              timezone: row.mappedData.timezone || 'America/Toronto',
              propertyCode: row.mappedData.propertyCode || undefined,
            }),
          });

          if (response.ok) {
            created = 1;
          } else {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create property');
          }
        }
        setImportProgress(100);
      }

      const finalResult: ImportResult = {
        created,
        skipped,
        errors: errors + (validation.errorRows ?? 0),
      };
      setImportResult(finalResult);
      setPhase('done');
      onImportComplete?.(finalResult);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setPhase('mapping');
    }
  }, [
    validation,
    parsedFile,
    entityType,
    propertyId,
    endpoint,
    buildBulkPayload,
    onImportComplete,
  ]);

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  const handleReset = useCallback(() => {
    setPhase('upload');
    setParsedFile(null);
    setMappings([]);
    setValidation(null);
    setParseError(null);
    setImportResult(null);
    setImportError(null);
    setImportProgress(0);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <Card padding="md" className="border-neutral-200">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-[14px] font-semibold text-neutral-900">{title}</h4>
          <p className="text-[13px] text-neutral-500">{description}</p>
        </div>
        {phase !== 'upload' && phase !== 'importing' && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Phase: Upload */}
      {phase === 'upload' && (
        <div>
          {/* Template download link */}
          <div className="mb-3 flex items-center gap-2">
            <a
              href={`/api/v1/import-templates?type=${entityType}`}
              download={`${entityType}-template.csv`}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download {ENTITY_LABELS[entityType]} Template
            </a>
          </div>

          <FileDropzone
            onFileSelected={handleFileSelected}
            isLoading={isParsing}
            error={parseError}
          />
        </div>
      )}

      {/* Phase: Mapping preview + import button */}
      {phase === 'mapping' && parsedFile && validation && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
            <FileSpreadsheet className="h-4 w-4 text-neutral-500" />
            <span className="text-sm text-neutral-700">{parsedFile.fileName}</span>
            <span className="text-xs text-neutral-400">{parsedFile.totalRows} rows</span>
          </div>

          {/* Validation summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-neutral-700">{validation.validRows} valid</span>
            </div>
            {validation.warningRows > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-neutral-700">{validation.warningRows} warnings</span>
              </div>
            )}
            {validation.errorRows > 0 && (
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-neutral-700">{validation.errorRows} errors</span>
              </div>
            )}
          </div>

          {/* Column mapping preview */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-3 py-2">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Column Mapping
              </p>
            </div>
            <div className="max-h-48 divide-y divide-neutral-100 overflow-y-auto">
              {mappings.map((mapping) => (
                <div key={mapping.sourceHeader} className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">
                    {mapping.sourceHeader}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  {mapping.targetField ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                        {targetFields.find((f) => f.key === mapping.targetField)?.label ??
                          mapping.targetField}
                      </span>
                      <ConfidenceBadge confidence={mapping.confidence} />
                    </>
                  ) : (
                    <span className="flex-1 text-sm text-neutral-400 italic">
                      Unmapped (custom field)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Import error */}
          {importError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-1 text-sm font-medium text-red-800">Import Failed</p>
              <p className="text-xs break-all whitespace-pre-wrap text-red-700">{importError}</p>
              <p className="mt-2 text-xs text-red-500">
                Try resetting and re-uploading the file after fixing the data.
              </p>
            </div>
          )}

          {/* Import button */}
          <Button onClick={handleImport} disabled={validation.validRows === 0} fullWidth>
            Import {validation.validRows} Records
          </Button>
        </div>
      )}

      {/* Phase: Importing */}
      {phase === 'importing' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="text-sm font-medium text-neutral-700">Importing records...</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">{importProgress}% complete</p>
        </div>
      )}

      {/* Phase: Done */}
      {phase === 'done' && importResult && (
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-lg font-semibold text-green-800">
              {importResult.created} records imported
            </p>
            {importResult.skipped > 0 && (
              <p className="text-sm text-green-600">{importResult.skipped} skipped</p>
            )}
            {importResult.errors > 0 && (
              <p className="text-sm text-amber-600">{importResult.errors} had errors</p>
            )}
          </div>
          <Button variant="secondary" onClick={handleReset} fullWidth>
            Import Another File
          </Button>
        </div>
      )}
    </Card>
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
