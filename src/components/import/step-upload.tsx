'use client';

/**
 * Step 1: Upload File
 * Accepts any supported file, parses it, and auto-maps columns.
 */

import { useState, useCallback } from 'react';
import { FileDropzone } from './file-dropzone';
import { parseFile, type ParsedFile } from '@/lib/import/file-parser';
import { autoMapColumns, type ColumnMapping, type EntityType } from '@/lib/import/column-mapper';
import { Button } from '@/components/ui/button';
import { Download, FileCheck2, AlertTriangle, ChevronRight } from 'lucide-react';

interface StepUploadProps {
  entityType: EntityType;
  propertyId: string;
  onFileParsed: (parsedFile: ParsedFile, mappings: ColumnMapping[]) => void;
}

export function StepUpload({ entityType, propertyId, onFileParsed }: StepUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setParsedFile(null);

      try {
        const parsed = await parseFile(file);

        if (parsed.totalRows === 0) {
          setError('The file appears to be empty. Please check your file and try again.');
          setIsLoading(false);
          return;
        }

        // Auto-map columns
        const autoMappings = autoMapColumns(parsed.headers, entityType, parsed.rows.slice(0, 50));

        setParsedFile(parsed);
        setMappings(autoMappings);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
        setIsLoading(false);
      }
    },
    [entityType],
  );

  const handleDownloadTemplate = useCallback(() => {
    window.open(`/api/v1/import-templates?type=${entityType}&propertyId=${propertyId}`, '_blank');
  }, [entityType, propertyId]);

  const handleContinue = useCallback(() => {
    if (parsedFile && mappings.length > 0) {
      onFileParsed(parsedFile, mappings);
    }
  }, [parsedFile, mappings, onFileParsed]);

  const entityLabel = entityType === 'units' ? 'units' : 'residents';
  const autoMappedCount = mappings.filter((m) => m.targetField && !m.isCustomField).length;
  const customFieldCount = mappings.filter((m) => m.isCustomField).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header with template download */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-neutral-900">Upload your {entityLabel} file</h3>
          <p className="text-sm text-neutral-500">We support CSV, Excel, PDF, and Word documents</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download Template
        </Button>
      </div>

      {/* Dropzone */}
      <FileDropzone onFileSelected={handleFileSelected} isLoading={isLoading} error={error} />

      {/* Parse Result */}
      {parsedFile && (
        <div className="space-y-4">
          {/* Success Card */}
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <FileCheck2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">File parsed successfully</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-green-700">
                <span>{parsedFile.fileName}</span>
                <span>{parsedFile.totalRows.toLocaleString()} rows</span>
                <span>{parsedFile.headers.length} columns</span>
                <span className="uppercase">{parsedFile.fileType}</span>
              </div>
              {autoMappedCount > 0 && (
                <p className="mt-2 text-xs text-green-600">
                  {autoMappedCount} of {parsedFile.headers.length} columns auto-mapped
                  {customFieldCount > 0 && ` · ${customFieldCount} will become custom fields`}
                </p>
              )}
            </div>
          </div>

          {/* Parse Warnings */}
          {parsedFile.parseWarnings && parsedFile.parseWarnings.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                {parsedFile.parseWarnings.map((warning, i) => (
                  <p key={i} className="text-sm text-amber-800">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Raw Preview for PDF/Word */}
          {parsedFile.rawPreview && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="mb-2 text-xs font-medium text-neutral-600">Extracted Text Preview</p>
              <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap text-neutral-700">
                {parsedFile.rawPreview}
              </pre>
            </div>
          )}

          {/* Large file warning */}
          {parsedFile.totalRows > 5000 && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                Large file detected ({parsedFile.totalRows.toLocaleString()} rows). Import will
                process in the background — you can navigate away and we&apos;ll notify you when
                it&apos;s done.
              </p>
            </div>
          )}

          {/* Continue Button */}
          <div className="flex justify-end">
            <Button onClick={handleContinue}>
              Map Columns
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
