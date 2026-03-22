'use client';

/**
 * Processing Progress — Real-Time File Analysis Feedback
 *
 * Shows overall progress bar, current activity text, and per-file
 * status cards while files are being parsed, classified, and validated.
 */

import {
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileProgress {
  fileName: string;
  fileType: string;
  status: 'pending' | 'parsing' | 'classifying' | 'validating' | 'done' | 'error';
  progress: number;
  detectedType?: string;
  confidence?: number;
  validRows?: number;
  warningRows?: number;
  errorRows?: number;
  errorMessage?: string;
}

interface ProcessingProgressProps {
  files: FileProgress[];
  overallProgress: number;
  currentActivity: string;
  isComplete: boolean;
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function getStatusIcon(status: FileProgress['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-neutral-300" />;
    case 'parsing':
    case 'classifying':
    case 'validating':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'done':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
}

function getStatusText(file: FileProgress): string {
  switch (file.status) {
    case 'pending':
      return 'Waiting...';
    case 'parsing':
      return 'Parsing...';
    case 'classifying':
      return 'Classifying data...';
    case 'validating':
      return 'Validating rows...';
    case 'done': {
      const parts: string[] = [];
      if (file.detectedType) {
        parts.push(`Categorized as ${ENTITY_LABELS[file.detectedType] ?? file.detectedType}`);
        if (file.confidence) parts[0] += ` (${file.confidence}%)`;
      }
      if (file.validRows !== undefined) {
        const summary = [`${file.validRows} valid`];
        if (file.warningRows) summary.push(`${file.warningRows} warnings`);
        if (file.errorRows) summary.push(`${file.errorRows} errors`);
        parts.push(`Validated: ${summary.join(', ')}`);
      }
      return parts.join(' — ') || 'Complete';
    }
    case 'error':
      return file.errorMessage || 'Processing failed';
  }
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'csv':
    case 'xlsx':
    case 'xls':
      return FileSpreadsheet;
    case 'pdf':
      return FileText;
    default:
      return FileIcon;
  }
}

function getFormatBadge(fileType: string): { label: string; classes: string } {
  switch (fileType) {
    case 'csv':
      return { label: 'CSV', classes: 'bg-green-50 text-green-700 border-green-200' };
    case 'xlsx':
    case 'xls':
      return { label: 'Excel', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'pdf':
      return { label: 'PDF', classes: 'bg-red-50 text-red-700 border-red-200' };
    case 'docx':
      return { label: 'Word', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    default:
      return {
        label: fileType.toUpperCase(),
        classes: 'bg-neutral-50 text-neutral-700 border-neutral-200',
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProcessingProgress({
  files,
  overallProgress,
  currentActivity,
  isComplete,
  onComplete,
}: ProcessingProgressProps) {
  const doneCount = files.filter((f) => f.status === 'done' || f.status === 'error').length;

  return (
    <div className="space-y-5">
      {/* Overall progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-neutral-800">
            {isComplete ? 'Processing Complete!' : 'Processing Files...'}
          </p>
          <span className="text-[13px] font-medium text-neutral-500">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {!isComplete && <p className="mt-2 text-[13px] text-neutral-500">{currentActivity}</p>}
      </div>

      {/* File count */}
      <p className="text-[13px] font-medium text-neutral-600">
        {doneCount} of {files.length} files processed
      </p>

      {/* Per-file status cards */}
      <div className="space-y-2">
        {files.map((file, index) => {
          const Icon = getFileIcon(file.fileType);
          const badge = getFormatBadge(file.fileType);

          return (
            <div
              key={`${file.fileName}-${index}`}
              className={`rounded-xl border px-4 py-3 transition-colors ${
                file.status === 'error'
                  ? 'border-red-200 bg-red-50/50'
                  : file.status === 'done'
                    ? 'border-green-200 bg-green-50/30'
                    : file.status === 'pending'
                      ? 'border-neutral-100 bg-neutral-50/50'
                      : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(file.status)}
                <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-neutral-800">
                      {file.fileName}
                    </p>
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0 text-[10px] font-semibold uppercase ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-neutral-500">{getStatusText(file)}</p>
                </div>
              </div>

              {/* Mini progress bar for active files */}
              {(file.status === 'parsing' ||
                file.status === 'classifying' ||
                file.status === 'validating') && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      {!isComplete && (
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-blue-400" />
          <p className="text-[13px] text-blue-600">
            Processing happens in your browser — your data never leaves your device during analysis.
          </p>
        </div>
      )}

      {/* Continue button */}
      {isComplete && onComplete && (
        <Button onClick={onComplete} fullWidth size="lg">
          Continue to Review
        </Button>
      )}
    </div>
  );
}
