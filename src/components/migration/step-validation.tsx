'use client';

/**
 * Step 4: Validation Dashboard
 *
 * Unified dashboard showing validation results across all files.
 * Summary cards (Total, Valid, Warnings, Errors) + accordion per file
 * with individual issues. Uses validateImportData() from validator.ts.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateImportData, generateErrorReport } from '@/lib/import/validator';
import type { ValidationResult } from '@/lib/import/validator';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';
import { ENTITY_TYPE_CONFIG, type UploadedFile } from './migration-wizard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepValidationProps {
  uploadedFiles: UploadedFile[];
  fieldMappings: Map<number, ColumnMapping[]>;
  validationResults: Map<number, ValidationResult>;
  setValidationResults: React.Dispatch<React.SetStateAction<Map<number, ValidationResult>>>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepValidation({
  uploadedFiles,
  fieldMappings,
  validationResults,
  setValidationResults,
}: StepValidationProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  // Run validation on mount if results are empty
  useEffect(() => {
    if (validationResults.size > 0) return;

    const results = new Map<number, ValidationResult>();

    uploadedFiles.forEach((uf, index) => {
      const entityType = uf.entityTypeOverride ?? uf.classification.entityType;
      const mappings = fieldMappings.get(index) ?? uf.classification.mappings;
      const result = validateImportData(uf.parsed.rows, mappings, entityType);
      results.set(index, result);
    });

    setValidationResults(results);
  }, [uploadedFiles, fieldMappings, validationResults.size, setValidationResults]);

  // Aggregate totals
  const totals = useMemo(() => {
    let total = 0;
    let valid = 0;
    let warnings = 0;
    let errors = 0;

    validationResults.forEach((result) => {
      total += result.totalRows;
      valid += result.validRows;
      warnings += result.warningRows;
      errors += result.errorRows;
    });

    return { total, valid, warnings, errors };
  }, [validationResults]);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleDownloadReport = useCallback(() => {
    const reports: string[] = [];

    uploadedFiles.forEach((uf, index) => {
      const result = validationResults.get(index);
      if (result) {
        reports.push(`=== ${uf.file.name} ===\n${generateErrorReport(result)}`);
      }
    });

    const blob = new Blob([reports.join('\n\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'migration-validation-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [uploadedFiles, validationResults]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Validation Results</h2>
        <p className="mt-1 text-[14px] text-neutral-500">
          We validated all records across your files. Review and resolve any issues before
          importing.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Total Records" value={totals.total} color="#64748B" bgColor="#F8FAFC" />
        <SummaryCard label="Valid" value={totals.valid} color="#10B981" bgColor="#ECFDF5" />
        <SummaryCard label="Warnings" value={totals.warnings} color="#F59E0B" bgColor="#FFFBEB" />
        <SummaryCard label="Errors" value={totals.errors} color="#EF4444" bgColor="#FEF2F2" />
      </div>

      {/* Per-file Accordion */}
      <div className="space-y-3">
        {uploadedFiles.map((uf, index) => {
          const result = validationResults.get(index);
          if (!result) return null;

          const entityType = uf.entityTypeOverride ?? uf.classification.entityType;
          const config = ENTITY_TYPE_CONFIG[entityType];
          const isExpanded = expandedFiles.has(index);
          const issueRows = result.rows.filter((r) => r.issues.length > 0);

          return (
            <Card key={`val-${index}`} className="overflow-hidden">
              {/* Accordion Header */}
              <button
                onClick={() => toggleExpanded(index)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
                <FileSpreadsheet className="h-4 w-4 text-neutral-400" />
                <span className="text-[14px] font-medium text-neutral-900">{uf.file.name}</span>
                <div
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${config?.color ?? '#94a3b8'}15`,
                    color: config?.color ?? '#64748b',
                  }}
                >
                  {config?.label ?? entityType}
                </div>
                <span className="ml-auto flex items-center gap-3 text-[12px]">
                  <span className="text-neutral-500">{result.totalRows} rows</span>
                  {result.validRows > 0 && (
                    <span className="text-green-600">{result.validRows} valid</span>
                  )}
                  {result.warningRows > 0 && (
                    <span className="text-yellow-600">{result.warningRows} warnings</span>
                  )}
                  {result.errorRows > 0 && (
                    <span className="text-red-600">{result.errorRows} errors</span>
                  )}
                </span>
              </button>

              {/* Expanded Issues */}
              {isExpanded && issueRows.length > 0 && (
                <div className="border-t border-neutral-200 px-4 py-3">
                  <div className="space-y-2">
                    {issueRows.slice(0, 20).map((row) =>
                      row.issues.map((issue, iIdx) => (
                        <div
                          key={`${row.index}-${iIdx}`}
                          className="flex items-start gap-2 rounded-md bg-neutral-50 px-3 py-2"
                        >
                          {issue.severity === 'error' ? (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
                          )}
                          <div className="flex-1 text-[12px]">
                            <span className="font-medium text-neutral-700">
                              Row {row.index + 1}
                            </span>
                            {issue.column && (
                              <span className="text-neutral-400"> / {issue.column}</span>
                            )}
                            <span className="text-neutral-500"> -- {issue.message}</span>
                            {issue.value && (
                              <span className="ml-1 rounded bg-neutral-200 px-1 py-0.5 text-[11px] text-neutral-600">
                                {issue.value}
                              </span>
                            )}
                          </div>
                        </div>
                      )),
                    )}
                    {issueRows.length > 20 && (
                      <p className="text-[12px] text-neutral-400">
                        + {issueRows.length - 20} more issues
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* No Issues */}
              {isExpanded && issueRows.length === 0 && (
                <div className="border-t border-neutral-200 px-4 py-4">
                  <div className="flex items-center gap-2 text-[13px] text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    All rows passed validation
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Download Error Report */}
      {totals.errors > 0 || totals.warnings > 0 ? (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleDownloadReport}>
            <Download className="mr-1.5 h-4 w-4" />
            Download Error Report
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-4" style={{ backgroundColor: bgColor }}>
      <p className="text-[12px] font-medium" style={{ color }}>
        {label}
      </p>
      <p className="mt-1 text-[24px] font-bold" style={{ color }}>
        {value.toLocaleString()}
      </p>
    </Card>
  );
}
