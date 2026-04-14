'use client';

/**
 * Step 3: Field Mapping
 *
 * Tabbed interface -- one tab per file. Each tab shows a mapping table:
 * Source column -> Target field dropdown -> Confidence dot -> Sample values.
 * Uses autoMapColumns() from column-mapper.ts.
 */

import { useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  autoMapColumns,
  getTargetFields,
  type ColumnMapping,
  type EntityType,
} from '@/lib/import/column-mapper';
import { ENTITY_TYPE_CONFIG, type UploadedFile } from './migration-wizard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepFieldMappingProps {
  uploadedFiles: UploadedFile[];
  fieldMappings: Map<number, ColumnMapping[]>;
  setFieldMappings: React.Dispatch<React.SetStateAction<Map<number, ColumnMapping[]>>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return '#10B981'; // green
  if (confidence >= 70) return '#F59E0B'; // yellow
  if (confidence >= 50) return '#F97316'; // orange
  if (confidence > 0) return '#EF4444'; // red
  return '#94a3b8'; // gray - unmapped
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'Exact match';
  if (confidence >= 70) return 'Likely match';
  if (confidence >= 50) return 'Possible match';
  if (confidence > 0) return 'Needs review';
  return 'Unmapped';
}

const UNMAPPED_VALUE = '__unmapped__';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepFieldMapping({
  uploadedFiles,
  fieldMappings,
  setFieldMappings,
}: StepFieldMappingProps) {
  // Auto-map columns on mount if not already mapped
  useEffect(() => {
    const newMappings = new Map(fieldMappings);
    let changed = false;

    uploadedFiles.forEach((uf, index) => {
      if (!newMappings.has(index)) {
        const entityType = uf.entityTypeOverride ?? uf.classification.entityType;
        const mappings = autoMapColumns(uf.parsed.headers, entityType, uf.parsed.rows.slice(0, 10));
        newMappings.set(index, mappings);
        changed = true;
      }
    });

    if (changed) {
      setFieldMappings(newMappings);
    }
  }, [uploadedFiles, fieldMappings, setFieldMappings]);

  const handleMappingChange = (
    fileIndex: number,
    mappingIndex: number,
    targetField: string | null,
  ) => {
    setFieldMappings((prev) => {
      const next = new Map(prev);
      const fileMappings = [...(next.get(fileIndex) ?? [])];
      if (fileMappings[mappingIndex]) {
        fileMappings[mappingIndex] = {
          ...fileMappings[mappingIndex],
          targetField,
          confidence: targetField ? 100 : 0,
        };
      }
      next.set(fileIndex, fileMappings);
      return next;
    });
  };

  if (uploadedFiles.length === 0) {
    return (
      <div className="py-12 text-center text-[14px] text-neutral-500">
        No files uploaded. Go back and upload files first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Map Fields</h2>
        <p className="mt-1 text-[14px] text-neutral-500">
          Review and adjust the field mappings for each file. We auto-mapped columns based on header
          names and sample data.
        </p>
      </div>

      <Tabs defaultValue="file-0">
        <TabsList>
          {uploadedFiles.map((uf, index) => {
            const effectiveType = uf.entityTypeOverride ?? uf.classification.entityType;
            const config = ENTITY_TYPE_CONFIG[effectiveType];
            return (
              <TabsTrigger key={`file-${index}`} value={`file-${index}`}>
                <span className="mr-1.5">{uf.file.name}</span>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: config?.color ?? '#94a3b8' }}
                />
              </TabsTrigger>
            );
          })}
        </TabsList>

        {uploadedFiles.map((uf, fileIndex) => {
          const entityType = uf.entityTypeOverride ?? uf.classification.entityType;
          const mappings = fieldMappings.get(fileIndex) ?? [];
          const targetFields = getTargetFields(entityType);
          const sampleRows = uf.parsed.rows.slice(0, 3);

          return (
            <TabsContent key={`file-${fileIndex}`} value={`file-${fileIndex}`}>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-3 font-medium text-neutral-600">Your Column</th>
                        <th className="px-4 py-3 font-medium text-neutral-600" />
                        <th className="px-4 py-3 font-medium text-neutral-600">Concierge Field</th>
                        <th className="px-4 py-3 font-medium text-neutral-600">Confidence</th>
                        <th className="px-4 py-3 font-medium text-neutral-600">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((mapping, mIdx) => {
                        const samples = sampleRows
                          .map((r) => r[mapping.sourceHeader] ?? '')
                          .filter(Boolean)
                          .slice(0, 3);
                        const color = confidenceColor(mapping.confidence);

                        return (
                          <tr
                            key={mapping.sourceHeader}
                            className="border-b border-neutral-100 last:border-0"
                          >
                            {/* Source Column */}
                            <td className="px-4 py-3">
                              <span className="font-medium text-neutral-900">
                                {mapping.sourceHeader}
                              </span>
                            </td>

                            {/* Arrow */}
                            <td className="px-2 py-3 text-neutral-300">&rarr;</td>

                            {/* Target Field Dropdown */}
                            <td className="px-4 py-3">
                              <Select
                                value={mapping.targetField ?? UNMAPPED_VALUE}
                                onValueChange={(val) =>
                                  handleMappingChange(
                                    fileIndex,
                                    mIdx,
                                    val === UNMAPPED_VALUE ? null : val,
                                  )
                                }
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="-- Select --" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={UNMAPPED_VALUE}>-- Skip --</SelectItem>
                                  {targetFields.map((tf) => (
                                    <SelectItem key={tf.key} value={tf.key}>
                                      {tf.label}
                                      {tf.required ? ' *' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Confidence */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-[12px] text-neutral-500">
                                  {mapping.targetField
                                    ? `${Math.round(mapping.confidence)}%`
                                    : '--'}
                                </span>
                              </div>
                            </td>

                            {/* Sample Values */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {samples.length > 0 ? (
                                  samples.map((s, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="max-w-[120px] truncate rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600"
                                    >
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-neutral-400">No data</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Transform Rules */}
              <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-[12px] font-medium text-blue-800">Auto-detected transforms</p>
                <ul className="mt-1.5 space-y-1 text-[12px] text-blue-700">
                  <li>Date columns will be parsed using auto-detected format from sample data</li>
                  <li>Phone numbers will be normalized to E.164 format</li>
                  <li>Email addresses will be lowercased and trimmed</li>
                </ul>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
