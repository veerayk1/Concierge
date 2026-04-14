'use client';

/**
 * Step 2: Detect & Classify
 *
 * Shows classification results per file: entity type badge with confidence bar,
 * platform detection banner, sample data preview, dependency graph.
 */

import { useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  ArrowDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EntityType } from '@/lib/import/column-mapper';
import { DEPENDENCY_ORDER, ENTITY_TYPE_CONFIG, type UploadedFile } from './migration-wizard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepDetectClassifyProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

// ---------------------------------------------------------------------------
// Entity options
// ---------------------------------------------------------------------------

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'properties', label: 'Properties' },
  { value: 'units', label: 'Units' },
  { value: 'residents', label: 'Residents' },
  { value: 'staff', label: 'Staff' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'fobs', label: 'FOBs & Keys' },
  { value: 'buzzer_codes', label: 'Buzzer Codes' },
  { value: 'parking_permits', label: 'Parking Permits' },
  { value: 'packages', label: 'Packages' },
  { value: 'maintenance_requests', label: 'Maintenance Requests' },
  { value: 'events', label: 'Events' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepDetectClassify({ uploadedFiles, setUploadedFiles }: StepDetectClassifyProps) {
  // Build dependency-sorted list for the graph
  const sortedFiles = useMemo(() => {
    return [...uploadedFiles]
      .map((f, idx) => ({ ...f, originalIndex: idx }))
      .sort((a, b) => {
        const aType = a.entityTypeOverride ?? a.classification.entityType;
        const bType = b.entityTypeOverride ?? b.classification.entityType;
        return (DEPENDENCY_ORDER[aType] ?? 99) - (DEPENDENCY_ORDER[bType] ?? 99);
      });
  }, [uploadedFiles]);

  const handleEntityTypeChange = (index: number, entityType: EntityType) => {
    setUploadedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, entityTypeOverride: entityType } : f)),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Classification Results</h2>
        <p className="mt-1 text-[14px] text-neutral-500">
          We analyzed your files and detected the data type for each one. Review the results below
          and correct any misclassifications.
        </p>
      </div>

      {/* Per-file classification cards */}
      <div className="space-y-4">
        {uploadedFiles.map((uf, index) => {
          const effectiveType = uf.entityTypeOverride ?? uf.classification.entityType;
          const config = ENTITY_TYPE_CONFIG[effectiveType];
          const confidence = uf.classification.confidence;
          const sampleRows = uf.parsed.rows.slice(0, 3);
          const sampleHeaders = uf.parsed.headers.slice(0, 6);

          return (
            <Card key={`${uf.file.name}-${index}`} className="p-5">
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-[15px] font-medium text-neutral-900">{uf.file.name}</p>
                    <div
                      className="rounded-md px-2.5 py-1 text-[13px] font-semibold"
                      style={{
                        backgroundColor: `${config?.color ?? '#94a3b8'}15`,
                        color: config?.color ?? '#64748b',
                      }}
                    >
                      {config?.label ?? effectiveType}
                    </div>
                  </div>
                  <Select
                    value={effectiveType}
                    onValueChange={(val) => handleEntityTypeChange(index, val as EntityType)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Override type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-500">Detection Confidence</span>
                    <span className="text-[13px] font-medium text-neutral-700">
                      {Math.round(confidence)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(confidence))}%`,
                        backgroundColor:
                          confidence >= 80 ? '#10B981' : confidence >= 60 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>

                {/* Sample Data Preview */}
                {sampleRows.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-medium text-neutral-500">
                      Sample Data (first 3 rows)
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-neutral-200">
                      <table className="w-full text-left text-[12px]">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            {sampleHeaders.map((h) => (
                              <th key={h} className="px-3 py-2 font-medium text-neutral-600">
                                {h}
                              </th>
                            ))}
                            {uf.parsed.headers.length > 6 && (
                              <th className="px-3 py-2 font-medium text-neutral-400">
                                +{uf.parsed.headers.length - 6} more
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {sampleRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className={
                                rIdx < sampleRows.length - 1 ? 'border-b border-neutral-100' : ''
                              }
                            >
                              {sampleHeaders.map((h) => (
                                <td
                                  key={h}
                                  className="max-w-[160px] truncate px-3 py-1.5 text-neutral-700"
                                >
                                  {row[h] || '--'}
                                </td>
                              ))}
                              {uf.parsed.headers.length > 6 && (
                                <td className="px-3 py-1.5 text-neutral-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-[13px] text-neutral-500">
                  <span>{uf.parsed.totalRows.toLocaleString()} rows</span>
                  <span>{uf.parsed.headers.length} columns detected</span>
                  <span>
                    {uf.classification.mappings.filter((m) => m.targetField).length} columns mapped
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dependency Graph */}
      {sortedFiles.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-[15px] font-semibold text-neutral-900">Import Order</h3>
          <p className="text-[13px] text-neutral-500">
            Files will be imported in this order to maintain data relationships.
          </p>
          <Card className="p-4">
            <div className="space-y-0">
              {sortedFiles.map((sf, idx) => {
                const effectiveType = sf.entityTypeOverride ?? sf.classification.entityType;
                const config = ENTITY_TYPE_CONFIG[effectiveType];
                const order = DEPENDENCY_ORDER[effectiveType] ?? 99;

                return (
                  <div key={`dep-${sf.originalIndex}`}>
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600">
                        {idx + 1}
                      </div>
                      <div
                        className="rounded-md px-2 py-0.5 text-[12px] font-medium"
                        style={{
                          backgroundColor: `${config?.color ?? '#94a3b8'}15`,
                          color: config?.color ?? '#64748b',
                        }}
                      >
                        {config?.label ?? effectiveType}
                      </div>
                      <span className="text-[13px] text-neutral-600">{sf.file.name}</span>
                      <span className="text-[12px] text-neutral-400">
                        ({sf.parsed.totalRows.toLocaleString()} rows)
                      </span>
                      {order > 0 && (
                        <span className="text-[11px] text-neutral-400">
                          depends on earlier steps
                        </span>
                      )}
                    </div>
                    {idx < sortedFiles.length - 1 && (
                      <div className="ml-3 flex h-4 items-center">
                        <div className="h-full w-px bg-neutral-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
