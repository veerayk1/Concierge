'use client';

/**
 * Step 6: Import Progress
 *
 * Dependency-ordered import with per-file progress bars,
 * live counters, elapsed/estimated time, and completion summary.
 */

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Clock, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ColumnMapping } from '@/lib/import/column-mapper';
import {
  DEPENDENCY_ORDER,
  ENTITY_TYPE_CONFIG,
  type UploadedFile,
  type FileImportProgress,
} from './migration-wizard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepImportProgressProps {
  uploadedFiles: UploadedFile[];
  fieldMappings: Map<number, ColumnMapping[]>;
  conflictResolutions: Map<string, 'skip' | 'overwrite' | 'merge'>;
  importProgress: Map<number, FileImportProgress>;
  setImportProgress: React.Dispatch<React.SetStateAction<Map<number, FileImportProgress>>>;
  importStarted: boolean;
  setImportStarted: React.Dispatch<React.SetStateAction<boolean>>;
  importComplete: boolean;
  setImportComplete: React.Dispatch<React.SetStateAction<boolean>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepImportProgress({
  uploadedFiles,
  fieldMappings,
  conflictResolutions,
  importProgress,
  setImportProgress,
  importStarted,
  setImportStarted,
  importComplete,
  setImportComplete,
}: StepImportProgressProps) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sort files by dependency order
  const sortedEntries = useMemo(() => {
    return uploadedFiles
      .map((uf, idx) => ({
        uf,
        index: idx,
        entityType: uf.entityTypeOverride ?? uf.classification.entityType,
      }))
      .sort(
        (a, b) => (DEPENDENCY_ORDER[a.entityType] ?? 99) - (DEPENDENCY_ORDER[b.entityType] ?? 99),
      );
  }, [uploadedFiles]);

  // Start import simulation on mount
  useEffect(() => {
    if (importStarted || uploadedFiles.length === 0) return;

    setImportStarted(true);

    // Initialize progress
    const initial = new Map<number, FileImportProgress>();
    uploadedFiles.forEach((uf, index) => {
      initial.set(index, {
        status: 'waiting',
        processedRows: 0,
        totalRows: uf.parsed.totalRows,
        errors: [],
      });
    });
    setImportProgress(initial);

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    // Simulate import process file by file in dependency order
    const sorted = [...uploadedFiles]
      .map((uf, idx) => ({
        idx,
        entityType: uf.entityTypeOverride ?? uf.classification.entityType,
        totalRows: uf.parsed.totalRows,
      }))
      .sort(
        (a, b) => (DEPENDENCY_ORDER[a.entityType] ?? 99) - (DEPENDENCY_ORDER[b.entityType] ?? 99),
      );

    let delay = 0;

    sorted.forEach((entry) => {
      const { idx, totalRows } = entry;

      // Start importing this file after delay
      delay += 300;
      setTimeout(() => {
        setImportProgress((prev) => {
          const next = new Map(prev);
          const current = next.get(idx);
          if (current) {
            next.set(idx, { ...current, status: 'importing' });
          }
          return next;
        });
      }, delay);

      // Simulate row-by-row progress in chunks
      const chunkSize = Math.max(1, Math.ceil(totalRows / 10));
      for (let processed = chunkSize; processed <= totalRows; processed += chunkSize) {
        const rows = Math.min(processed, totalRows);
        delay += 200 + Math.random() * 100;
        setTimeout(() => {
          setImportProgress((prev) => {
            const next = new Map(prev);
            const current = next.get(idx);
            if (current) {
              next.set(idx, { ...current, processedRows: rows });
            }
            return next;
          });
        }, delay);
      }

      // Mark complete
      delay += 200;
      setTimeout(() => {
        setImportProgress((prev) => {
          const next = new Map(prev);
          const current = next.get(idx);
          if (current) {
            next.set(idx, {
              ...current,
              status: 'complete',
              processedRows: totalRows,
            });
          }
          return next;
        });
      }, delay);
    });

    // Mark all complete
    delay += 500;
    setTimeout(() => {
      setImportComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [importStarted, uploadedFiles, setImportProgress, setImportStarted, setImportComplete]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    let totalRows = 0;
    let processedRows = 0;

    importProgress.forEach((p) => {
      totalRows += p.totalRows;
      processedRows += p.processedRows;
    });

    const pct = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;
    return { totalRows, processedRows, pct };
  }, [importProgress]);

  // Estimate remaining time
  const estimatedRemaining = useMemo(() => {
    if (overallProgress.pct <= 0 || elapsedSeconds <= 0) return '--';
    if (importComplete) return '0s';
    const rate = overallProgress.processedRows / elapsedSeconds;
    const remaining = overallProgress.totalRows - overallProgress.processedRows;
    if (rate <= 0) return '--';
    return formatElapsed(Math.ceil(remaining / rate));
  }, [overallProgress, elapsedSeconds, importComplete]);

  // Completion summary
  const summary = useMemo(() => {
    if (!importComplete) return null;
    const results: Array<{ entityType: string; label: string; rows: number; status: string }> = [];
    sortedEntries.forEach(({ uf, index, entityType }) => {
      const progress = importProgress.get(index);
      const config = ENTITY_TYPE_CONFIG[entityType];
      results.push({
        entityType,
        label: config?.label ?? entityType,
        rows: progress?.processedRows ?? 0,
        status: progress?.status ?? 'complete',
      });
    });
    return results;
  }, [importComplete, sortedEntries, importProgress]);

  // ---------------------------------------------------------------------------
  // Render: Import Complete
  // ---------------------------------------------------------------------------

  if (importComplete && summary) {
    const totalImported = summary.reduce((sum, s) => sum + s.rows, 0);

    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-[20px] font-bold text-neutral-900">Migration Complete</h2>
            <p className="text-[15px] text-neutral-500">
              {totalImported.toLocaleString()} records imported successfully in{' '}
              {formatElapsed(elapsedSeconds)}.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-md space-y-2">
            {summary.map((s) => {
              const config = ENTITY_TYPE_CONFIG[s.entityType];
              return (
                <div key={s.entityType} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-[14px] text-neutral-700">{s.label}</span>
                  </div>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {s.rows.toLocaleString()} rows
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push('/data-migration')}>
              View Migration Report
            </Button>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: In Progress
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Importing Your Data</h2>
        <p className="mt-1 text-[14px] text-neutral-500">
          Files are being imported in dependency order. Please do not close this page.
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-neutral-700">Overall Progress</span>
            <span className="text-[14px] font-semibold text-neutral-900">
              {overallProgress.pct}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${overallProgress.pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[12px] text-neutral-500">
            <span>
              {overallProgress.processedRows.toLocaleString()} /{' '}
              {overallProgress.totalRows.toLocaleString()} records
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Elapsed: {formatElapsed(elapsedSeconds)}
              </span>
              <span>Est. remaining: {estimatedRemaining}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Per-file Progress */}
      <div className="space-y-2">
        {sortedEntries.map(({ uf, index, entityType }) => {
          const progress = importProgress.get(index);
          const config = ENTITY_TYPE_CONFIG[entityType];
          const totalRows = progress?.totalRows ?? uf.parsed.totalRows;
          const processedRows = progress?.processedRows ?? 0;
          const pct = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;
          const status = progress?.status ?? 'waiting';

          return (
            <div
              key={`prog-${index}`}
              className="flex items-center gap-4 rounded-lg border border-neutral-200 px-4 py-3"
            >
              {/* Status Icon */}
              <div className="shrink-0">
                {status === 'waiting' && (
                  <div className="h-5 w-5 rounded-full border-2 border-neutral-200" />
                )}
                {status === 'importing' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                )}
                {status === 'complete' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
              </div>

              {/* Entity label */}
              <div
                className="shrink-0 rounded px-2 py-0.5 text-[12px] font-medium"
                style={{
                  backgroundColor: `${config?.color ?? '#94a3b8'}15`,
                  color: config?.color ?? '#64748b',
                }}
              >
                {config?.label ?? entityType}
              </div>

              {/* Progress bar */}
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status === 'complete'
                        ? 'bg-green-500'
                        : status === 'failed'
                          ? 'bg-red-500'
                          : status === 'importing'
                            ? 'bg-blue-500'
                            : 'bg-neutral-200'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Counter */}
              <span className="shrink-0 text-[12px] text-neutral-500">
                {processedRows.toLocaleString()} / {totalRows.toLocaleString()}
              </span>

              {/* Percentage */}
              <span className="w-10 shrink-0 text-right text-[12px] font-medium text-neutral-700">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
