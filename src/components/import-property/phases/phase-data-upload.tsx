'use client';

/**
 * Phase: Data Upload — Multi-File Processing Orchestrator
 *
 * Phase 1 of the "Dump Everything" wizard. Handles:
 * 1. Multi-file dropzone for collecting files
 * 2. Client-side parsing via parseFile()
 * 3. Classification via classifyFile()
 * 4. Validation via validateImportData()
 * 5. Real-time progress updates via ProcessingProgress
 */

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MultiFileDropzone } from '../shared/multi-file-dropzone';
import { ProcessingProgress, type FileProgress } from '../shared/processing-progress';
import { parseFile } from '@/lib/import/file-parser';
import { classifyFile } from '@/lib/import/file-classifier';
import { validateImportData } from '@/lib/import/validator';
import type { ColumnMapping, EntityType } from '@/lib/import/column-mapper';
import type { ValidationResult } from '@/lib/import/validator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessedFileData {
  fileName: string;
  fileType: string;
  totalRows: number;
  headers: string[];
  rows: Record<string, string>[];
  detectedEntityType: EntityType;
  confidence: number;
  mappings: ColumnMapping[];
  validationResult: ValidationResult;
}

export interface ProcessedResults {
  files: ProcessedFileData[];
}

interface PhaseDataUploadProps {
  propertyId: string;
  onProcessingComplete: (results: ProcessedResults) => void;
  onBack: () => void;
}

type Phase = 'upload' | 'processing' | 'complete';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhaseDataUpload({
  propertyId,
  onProcessingComplete,
  onBack,
}: PhaseDataUploadProps) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState('');
  const [processedResults, setProcessedResults] = useState<ProcessedResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // -----------------------------------------------------------------------
  // Processing
  // -----------------------------------------------------------------------

  const handleStartProcessing = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setPhase('processing');

    // Initialize file progress
    const initialProgress: FileProgress[] = files.map((f) => ({
      fileName: f.name,
      fileType: f.name.split('.').pop()?.toLowerCase() ?? 'unknown',
      status: 'pending',
      progress: 0,
    }));
    setFileProgress(initialProgress);

    const results: ProcessedFileData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const fileName = file.name;

      // Update status: parsing
      setCurrentActivity(`Parsing ${fileName}...`);
      setFileProgress((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'parsing', progress: 20 } : f)),
      );
      // Allow React to re-render
      await new Promise((r) => setTimeout(r, 10));

      try {
        // Parse
        const parsed = await parseFile(file);

        // Update status: classifying
        setCurrentActivity(`Classifying ${fileName}...`);
        setFileProgress((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'classifying', progress: 50 } : f)),
        );
        await new Promise((r) => setTimeout(r, 10));

        // Classify
        const classification = classifyFile(parsed.headers, parsed.rows.slice(0, 50));

        // Update status: validating
        setCurrentActivity(`Validating ${fileName}...`);
        setFileProgress((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'validating',
                  progress: 75,
                  detectedType: classification.entityType,
                  confidence: classification.confidence,
                }
              : f,
          ),
        );
        await new Promise((r) => setTimeout(r, 10));

        // Validate
        const validationResult = validateImportData(
          parsed.rows,
          classification.mappings,
          classification.entityType,
        );

        // Store result
        results.push({
          fileName: parsed.fileName,
          fileType: parsed.fileType,
          totalRows: parsed.totalRows,
          headers: parsed.headers,
          rows: parsed.rows,
          detectedEntityType: classification.entityType,
          confidence: classification.confidence,
          mappings: classification.mappings,
          validationResult,
        });

        // Update status: done
        setFileProgress((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'done',
                  progress: 100,
                  detectedType: classification.entityType,
                  confidence: classification.confidence,
                  validRows: validationResult.validRows,
                  warningRows: validationResult.warningRows,
                  errorRows: validationResult.errorRows,
                }
              : f,
          ),
        );
      } catch (err) {
        // Update status: error
        setFileProgress((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'error',
                  progress: 100,
                  errorMessage: err instanceof Error ? err.message : 'Failed to process file',
                }
              : f,
          ),
        );
      }

      // Update overall progress
      setOverallProgress(Math.round(((i + 1) / files.length) * 100));
      await new Promise((r) => setTimeout(r, 10));
    }

    const finalResults: ProcessedResults = { files: results };
    setProcessedResults(finalResults);
    setCurrentActivity('');
    setPhase('complete');
    setIsProcessing(false);
  }, []);

  const handleComplete = useCallback(() => {
    if (processedResults) {
      onProcessingComplete(processedResults);
    }
  }, [processedResults, onProcessingComplete]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-lg font-semibold text-neutral-900">Upload Your Data</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Drop all your property files at once. We will analyze, categorize, and validate everything
          automatically.
        </p>
      </div>

      {/* Content */}
      {phase === 'upload' && (
        <MultiFileDropzone onStartProcessing={handleStartProcessing} isProcessing={isProcessing} />
      )}

      {(phase === 'processing' || phase === 'complete') && (
        <ProcessingProgress
          files={fileProgress}
          overallProgress={overallProgress}
          currentActivity={currentActivity}
          isComplete={phase === 'complete'}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
