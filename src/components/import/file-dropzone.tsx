'use client';

/**
 * Drag-and-Drop File Upload Zone
 * Supports CSV, Excel, PDF, Word files
 */

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getAcceptString } from '@/lib/import/file-parser';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function FileDropzone({ onFileSelected, isLoading, error }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : error
              ? 'border-red-300 bg-red-50'
              : 'border-neutral-300 bg-neutral-50 hover:border-blue-300 hover:bg-blue-50/50'
        } px-6 py-16`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-neutral-700">Parsing your file...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium text-red-700">{error}</p>
            <p className="text-xs text-red-500">Click or drag another file to try again</p>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="mb-1 text-sm font-medium text-neutral-700">
              Drag and drop your file here
            </p>
            <p className="mb-4 text-xs text-neutral-500">or click to browse files</p>
            <div className="flex items-center gap-4">
              <FormatBadge icon={FileSpreadsheet} label="CSV" color="green" />
              <FormatBadge icon={FileSpreadsheet} label="Excel" color="blue" />
              <FormatBadge icon={FileText} label="PDF" color="red" />
              <FormatBadge icon={FileIcon} label="Word" color="indigo" />
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              No file size limit — large files will be processed in the background
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptString()}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

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
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${colorClasses[color] ?? colorClasses.blue}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
