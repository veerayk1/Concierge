'use client';

/**
 * Phase: Review Dashboard — Category Overview Grid
 *
 * After processing, shows all detected data categories as cards.
 * Users can click into each category to review mappings, fix issues,
 * and trigger imports one category at a time.
 */

import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '../shared/category-card';
import type { EntityType } from '@/lib/import/column-mapper';
import type { ProcessedResults } from './phase-data-upload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseReviewDashboardProps {
  processedResults: ProcessedResults;
  propertyId: string;
  importedCategories: Record<string, { created: number; skipped: number; errors: number }>;
  onReviewCategory: (entityType: EntityType) => void;
  onActivate: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// All entity types we check for
// ---------------------------------------------------------------------------

const ALL_ENTITY_TYPES: EntityType[] = [
  'units',
  'residents',
  'amenities',
  'fobs',
  'buzzer_codes',
  'parking_permits',
  'staff',
  'packages',
  'maintenance_requests',
  'events',
];

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
  maintenance_requests: 'Maintenance',
  events: 'Events',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhaseReviewDashboard({
  processedResults,
  propertyId,
  importedCategories,
  onReviewCategory,
  onActivate,
  onBack,
}: PhaseReviewDashboardProps) {
  // Group processed files by detected entity type
  const categoriesMap = new Map<
    EntityType,
    {
      sourceFiles: string[];
      totalRows: number;
      validRows: number;
      warningRows: number;
      errorRows: number;
      confidence: number;
    }
  >();

  for (const file of processedResults.files) {
    const existing = categoriesMap.get(file.detectedEntityType);
    if (existing) {
      existing.sourceFiles.push(file.fileName);
      existing.totalRows += file.totalRows;
      existing.validRows += file.validationResult.validRows;
      existing.warningRows += file.validationResult.warningRows;
      existing.errorRows += file.validationResult.errorRows;
      // Average confidence
      existing.confidence = Math.round(
        (existing.confidence * (existing.sourceFiles.length - 1) + file.confidence) /
          existing.sourceFiles.length,
      );
    } else {
      categoriesMap.set(file.detectedEntityType, {
        sourceFiles: [file.fileName],
        totalRows: file.totalRows,
        validRows: file.validationResult.validRows,
        warningRows: file.validationResult.warningRows,
        errorRows: file.validationResult.errorRows,
        confidence: file.confidence,
      });
    }
  }

  const detectedCategories = Array.from(categoriesMap.entries());
  const totalFiles = processedResults.files.length;
  const totalCategories = detectedCategories.length;
  const hasUnitsImported = 'units' in importedCategories;
  const importedCount = Object.keys(importedCategories).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Review Your Data</h2>
            <p className="text-sm text-neutral-500">
              We analyzed {totalFiles} file{totalFiles !== 1 ? 's' : ''} and found data for{' '}
              {totalCategories} categor{totalCategories !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        </div>
      </div>

      {/* Category cards grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {detectedCategories.map(([entityType, data]) => {
          const imported = importedCategories[entityType];
          const status = imported
            ? 'imported'
            : data.errorRows > 0
              ? 'errors'
              : data.warningRows > 0
                ? 'needs_review'
                : 'ready';

          return (
            <CategoryCard
              key={entityType}
              entityType={entityType}
              sourceFiles={data.sourceFiles}
              confidence={data.confidence}
              totalRows={data.totalRows}
              validRows={data.validRows}
              warningRows={data.warningRows}
              errorRows={data.errorRows}
              status={status}
              onReview={() => onReviewCategory(entityType)}
            />
          );
        })}
      </div>

      {/* Import progress summary */}
      {importedCount > 0 && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-[14px] font-medium text-green-800">
            {importedCount} of {totalCategories} categories imported
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-green-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: `${Math.round((importedCount / totalCategories) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Activate button */}
      <Button
        onClick={onActivate}
        disabled={!hasUnitsImported && importedCount === 0}
        fullWidth
        size="lg"
      >
        {importedCount === 0 ? 'Import at least one category to continue' : 'Continue to Activate'}
      </Button>

      {!hasUnitsImported && importedCount === 0 && (
        <p className="mt-2 text-center text-[13px] text-neutral-400">
          Import at least Units to activate your property
        </p>
      )}
    </div>
  );
}
