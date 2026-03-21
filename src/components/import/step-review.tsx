'use client';

/**
 * Step 3: Review & Validate
 * Shows validation results, duplicate strategy, and import button.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileBarChart,
  Download,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { ValidationResult } from '@/lib/import/validator';
import { generateErrorReport } from '@/lib/import/validator';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';

interface StepReviewProps {
  validationResult: ValidationResult;
  mappings: ColumnMapping[];
  entityType: EntityType;
  propertyId: string;
  duplicateStrategy: 'skip' | 'overwrite' | 'merge';
  onDuplicateStrategyChange: (s: 'skip' | 'overwrite' | 'merge') => void;
  onImport: () => void;
  onBack: () => void;
}

type FilterTab = 'all' | 'valid' | 'warning' | 'error';

export function StepReview({
  validationResult,
  entityType,
  duplicateStrategy,
  onDuplicateStrategyChange,
  onImport,
  onBack,
}: StepReviewProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const filteredRows = useMemo(() => {
    if (filterTab === 'all') return validationResult.rows;
    return validationResult.rows.filter((r) => r.status === filterTab);
  }, [validationResult.rows, filterTab]);

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDownloadErrors = () => {
    const csv = generateErrorReport(validationResult);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const entityLabel = entityType === 'units' ? 'Units' : 'Residents';
  const canImport = validationResult.validRows + validationResult.warningRows > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard
          icon={<FileBarChart className="h-5 w-5 text-neutral-500" />}
          label="Total Rows"
          value={validationResult.totalRows}
          color="neutral"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Valid"
          value={validationResult.validRows}
          color="green"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          label="Warnings"
          value={validationResult.warningRows}
          color="amber"
        />
        <SummaryCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          label="Errors"
          value={validationResult.errorRows}
          color="red"
        />
      </div>

      {/* Duplicate Strategy */}
      <div className="rounded-lg border border-neutral-200 p-4">
        <p className="mb-2 text-sm font-medium text-neutral-800">
          When a {entityType === 'units' ? 'unit number' : 'email'} already exists:
        </p>
        <div className="flex gap-3">
          {(['skip', 'overwrite', 'merge'] as const).map((strategy) => (
            <label
              key={strategy}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                duplicateStrategy === strategy
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name="duplicateStrategy"
                value={strategy}
                checked={duplicateStrategy === strategy}
                onChange={() => onDuplicateStrategyChange(strategy)}
                className="sr-only"
              />
              <span className="font-medium capitalize">{strategy}</span>
              <span className="text-xs text-neutral-500">
                {strategy === 'skip' && '(keep existing)'}
                {strategy === 'overwrite' && '(replace all fields)'}
                {strategy === 'merge' && '(update non-empty only)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200">
        {(
          [
            { key: 'all', label: 'All', count: validationResult.totalRows },
            { key: 'valid', label: 'Valid', count: validationResult.validRows },
            {
              key: 'warning',
              label: 'Warnings',
              count: validationResult.warningRows,
            },
            { key: 'error', label: 'Errors', count: validationResult.errorRows },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              filterTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {tab.label} <span className="text-xs text-neutral-400">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="max-h-96 overflow-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-50">
            <tr>
              <th className="w-10 px-3 py-2 text-left text-xs font-medium text-neutral-500">#</th>
              <th className="w-20 px-3 py-2 text-left text-xs font-medium text-neutral-500">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                Data Preview
              </th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredRows.slice(0, 200).map((row) => (
              <tr
                key={row.index}
                className={`cursor-pointer transition-colors hover:bg-neutral-50 ${
                  row.issues.length > 0 ? '' : ''
                }`}
                onClick={() => row.issues.length > 0 && toggleRow(row.index)}
              >
                <td className="px-3 py-2 text-xs text-neutral-400">{row.index + 1}</td>
                <td className="px-3 py-2">
                  {row.status === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {row.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {row.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                </td>
                <td className="px-3 py-2">
                  <span className="text-xs text-neutral-700">
                    {Object.entries(row.data)
                      .slice(0, 4)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </span>
                  {/* Expanded issues */}
                  {expandedRows.has(row.index) && row.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {row.issues.map((issue, i) => (
                        <div
                          key={i}
                          className={`rounded px-2 py-1 text-xs ${
                            issue.severity === 'error'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <strong>{issue.column}:</strong> {issue.message}
                          {issue.value && (
                            <span className="ml-1 text-neutral-500">({issue.value})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {row.issues.length > 0 &&
                    (expandedRows.has(row.index) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length > 200 && (
          <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-center text-xs text-neutral-500">
            Showing first 200 of {filteredRows.length} rows
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Back to Mapping
          </Button>
          {validationResult.errorRows > 0 && (
            <Button variant="secondary" onClick={handleDownloadErrors}>
              <Download className="mr-1.5 h-4 w-4" />
              Error Report
            </Button>
          )}
        </div>
        <Button onClick={onImport} disabled={!canImport}>
          Import {(validationResult.validRows + validationResult.warningRows).toLocaleString()}{' '}
          {entityLabel}
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
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
  const borderColors: Record<string, string> = {
    neutral: 'border-neutral-200',
    green: 'border-green-200',
    amber: 'border-amber-200',
    red: 'border-red-200',
  };

  return (
    <div className={`rounded-lg border p-3 ${borderColors[color] ?? borderColors.neutral}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value.toLocaleString()}</p>
    </div>
  );
}
