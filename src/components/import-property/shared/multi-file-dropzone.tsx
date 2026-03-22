'use client';

/**
 * Multi-File Dropzone — "Dump Everything" Upload Zone
 *
 * Accepts multiple files of any supported format (CSV, Excel, PDF, Word).
 * Files queue up in a list below the dropzone. Users can remove files
 * before clicking "Start Processing" to begin analysis.
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, File as FileIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAcceptString } from '@/lib/import/file-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MultiFileDropzoneProps {
  onStartProcessing: (files: File[]) => void;
  isProcessing?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function getFormatBadgeStyle(ext: string): { bg: string; text: string; label: string } {
  switch (ext) {
    case 'csv':
      return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'CSV' };
    case 'xlsx':
    case 'xls':
      return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Excel' };
    case 'pdf':
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'PDF' };
    case 'docx':
      return { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Word' };
    default:
      return {
        bg: 'bg-neutral-50 border-neutral-200',
        text: 'text-neutral-700',
        label: ext.toUpperCase(),
      };
  }
}

function getFileIcon(ext: string) {
  switch (ext) {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MultiFileDropzone({ onStartProcessing, isProcessing }: MultiFileDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setFiles((prev) => {
      // Deduplicate by name + size
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const unique = fileArray.filter((f) => !existing.has(`${f.name}:${f.size}`));
      return [...prev, ...unique];
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [addFiles],
  );

  const handleStartProcessing = useCallback(() => {
    if (files.length > 0) {
      onStartProcessing(files);
    }
  }, [files, onStartProcessing]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-blue-300 hover:bg-blue-50/50'
        } px-6 py-12`}
      >
        <Upload className="mb-4 h-12 w-12 text-neutral-400" />
        <p className="mb-1 text-[16px] font-semibold text-neutral-800">
          Drop all your property data here
        </p>
        <p className="mb-5 text-[14px] text-neutral-500">
          CSVs, Excel files, PDFs, Word documents — everything you have
        </p>
        <div className="flex items-center gap-3">
          <FormatBadge icon={FileSpreadsheet} label="CSV" color="green" />
          <FormatBadge icon={FileSpreadsheet} label="Excel" color="blue" />
          <FormatBadge icon={FileText} label="PDF" color="red" />
          <FormatBadge icon={FileIcon} label="Word" color="indigo" />
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          Click to browse or drag and drop multiple files at once
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptString()}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-neutral-600">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {files.map((file, index) => {
              const ext = getFileExtension(file.name);
              const badge = getFormatBadgeStyle(ext);
              const Icon = getFileIcon(ext);

              return (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Icon className="h-5 w-5 shrink-0 text-neutral-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-neutral-800">{file.name}</p>
                    <p className="text-[12px] text-neutral-400">{formatFileSize(file.size)}</p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start Processing button */}
      <Button
        onClick={handleStartProcessing}
        disabled={files.length === 0 || isProcessing}
        loading={isProcessing}
        fullWidth
        size="lg"
      >
        {isProcessing ? (
          'Processing...'
        ) : (
          <>
            Start Processing{' '}
            {files.length > 0 ? `${files.length} File${files.length !== 1 ? 's' : ''}` : ''}
          </>
        )}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormatBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof FileIcon;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${colorClasses[color] ?? colorClasses.blue}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
