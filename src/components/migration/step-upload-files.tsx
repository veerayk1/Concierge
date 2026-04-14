'use client';

/**
 * Step 1: Upload Files
 *
 * Multi-file drag-drop zone. For each dropped file, auto-parses and classifies.
 * Displays file cards with entity type badges, confidence, row counts.
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Trash2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseFile } from '@/lib/import/file-parser';
import { classifyFile } from '@/lib/import/file-classifier';
import { getAcceptString } from '@/lib/import/file-parser';
import type { EntityType } from '@/lib/import/column-mapper';
import { ENTITY_TYPE_CONFIG, type UploadedFile } from './migration-wizard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepUploadFilesProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

export function StepUploadFiles({ uploadedFiles, setUploadedFiles }: StepUploadFilesProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsProcessing(true);
      setError(null);

      const newFiles: UploadedFile[] = [];

      for (const file of Array.from(files)) {
        try {
          const parsed = await parseFile(file);
          const classification = classifyFile(parsed.headers, parsed.rows.slice(0, 5));
          newFiles.push({ file, parsed, classification });
        } catch (err) {
          setError(
            `Failed to parse "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }

      if (newFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
      setIsProcessing(false);
    },
    [setUploadedFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [processFiles],
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [setUploadedFiles],
  );

  const handleEntityTypeChange = useCallback(
    (index: number, entityType: EntityType) => {
      setUploadedFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, entityTypeOverride: entityType } : f)),
      );
    },
    [setUploadedFiles],
  );

  const totalRows = uploadedFiles.reduce((sum, f) => sum + f.parsed.totalRows, 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Upload Your Data Files</h2>
        <p className="mt-1 text-[14px] text-neutral-500">
          Drag and drop CSV or Excel files exported from any property management platform. We will
          auto-detect the data type and map the columns.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-blue-300 hover:bg-blue-50/50'
        } px-6 py-16`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-[14px] font-medium text-neutral-700">Processing files...</p>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="mb-1 text-[14px] font-medium text-neutral-700">
              Drop your files here, or click to browse
            </p>
            <p className="mb-4 text-[13px] text-neutral-500">
              Supports CSV, XLSX, XLS -- upload multiple files at once
            </p>
            <div className="flex items-center gap-3">
              <FormatBadge label="CSV" />
              <FormatBadge label="XLSX" />
              <FormatBadge label="XLS" />
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptString()}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* File Cards */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((uf, index) => {
            const effectiveType = uf.entityTypeOverride ?? uf.classification.entityType;
            const config = ENTITY_TYPE_CONFIG[effectiveType];

            return (
              <Card key={`${uf.file.name}-${index}`} className="p-4">
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <FileSpreadsheet className="h-5 w-5 text-neutral-500" />
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-medium text-neutral-900">
                        {uf.file.name}
                      </p>
                      <span className="shrink-0 text-[12px] text-neutral-400">
                        {formatFileSize(uf.file.size)}
                      </span>
                    </div>
                    <p className="text-[13px] text-neutral-500">
                      {uf.parsed.totalRows.toLocaleString()} rows &middot;{' '}
                      {uf.parsed.headers.length} columns
                    </p>
                  </div>

                  {/* Entity Type Badge */}
                  <div
                    className="shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium"
                    style={{
                      backgroundColor: `${config?.color ?? '#94a3b8'}15`,
                      color: config?.color ?? '#64748b',
                    }}
                  >
                    {config?.label ?? effectiveType}
                    <span className="ml-1.5 opacity-70">
                      {Math.round(uf.classification.confidence)}%
                    </span>
                  </div>

                  {/* Override Dropdown */}
                  <Select
                    value={effectiveType}
                    onValueChange={(val) => handleEntityTypeChange(index, val as EntityType)}
                  >
                    <SelectTrigger className="w-[160px] shrink-0">
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

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="shrink-0 text-neutral-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* Summary */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <p className="text-[14px] font-medium text-neutral-700">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''},{' '}
              {totalRows.toLocaleString()} rows total
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => setUploadedFiles([])}
            >
              Remove all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormatBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1">
      <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-500" />
      <span className="text-[12px] font-medium text-neutral-600">{label}</span>
    </div>
  );
}
