/**
 * File Classification Engine
 *
 * Determines which entity type a file's data belongs to by running
 * autoMapColumns against ALL 11 entity types and scoring the results.
 * A file about units will match Unit fields at 80%+ while matching
 * Resident fields at 20%.
 */

import {
  autoMapColumns,
  getTargetFields,
  type EntityType,
  type ColumnMapping,
} from './column-mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassificationResult {
  entityType: EntityType;
  confidence: number;
  mappings: ColumnMapping[];
  scores: Array<{ entityType: EntityType; score: number }>;
}

export interface ProcessedFileResult {
  fileName: string;
  fileType: string;
  totalRows: number;
  classification: ClassificationResult;
  headers: string[];
}

// All entity types to classify against
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

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Classify a file's data by scoring it against all entity types.
 * Returns the best match with confidence and mappings.
 */
export function classifyFile(
  headers: string[],
  sampleRows?: Record<string, string>[],
): ClassificationResult {
  const scores: Array<{
    entityType: EntityType;
    score: number;
    mappings: ColumnMapping[];
  }> = [];

  for (const entityType of ALL_ENTITY_TYPES) {
    const mappings = autoMapColumns(headers, entityType, sampleRows);
    const score = scoreEntityType(mappings, entityType);
    scores.push({ entityType, score, mappings });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0]!;

  return {
    entityType: best.entityType,
    confidence: Math.round(best.score),
    mappings: best.mappings,
    scores: scores.map((s) => ({ entityType: s.entityType, score: Math.round(s.score) })),
  };
}

/**
 * Score how well a set of column mappings match an entity type.
 *
 * Scoring formula:
 * - 40% weight: required field coverage (what % of required fields are mapped)
 * - 60% weight: average confidence of mapped (non-custom) columns
 *
 * A file with all required fields mapped at high confidence scores near 100.
 * A file with no required fields mapped scores 0.
 */
function scoreEntityType(mappings: ColumnMapping[], entityType: EntityType): number {
  const fields = getTargetFields(entityType);
  const requiredFields = fields.filter((f) => f.required);

  // Count required fields that got mapped with confidence > 40
  const requiredMatched = requiredFields.filter((rf) =>
    mappings.some((m) => m.targetField === rf.key && !m.isCustomField && m.confidence > 40),
  ).length;

  // If no required fields matched, this entity type is unlikely
  if (requiredMatched === 0 && requiredFields.length > 0) return 0;

  // Average confidence of all mapped (non-custom) columns
  const mapped = mappings.filter((m) => m.targetField !== null && !m.isCustomField);
  if (mapped.length === 0) return 0;

  const avgConfidence = mapped.reduce((sum, m) => sum + m.confidence, 0) / mapped.length;

  // Required field coverage (0-1)
  const requiredCoverage = requiredFields.length > 0 ? requiredMatched / requiredFields.length : 1; // No required fields = full coverage

  // Bonus for total number of mapped columns (encourages broader matches)
  const mappedRatio = mapped.length / Math.max(mappings.length, 1);
  const mappedBonus = mappedRatio * 10;

  const raw = avgConfidence * 0.6 + requiredCoverage * 100 * 0.4 + mappedBonus;
  return Math.min(raw, 100);
}

/**
 * Classify multiple files and merge results by entity type.
 * If two files both classify as "units", they appear under the same category.
 */
export function classifyMultipleFiles(
  files: Array<{
    fileName: string;
    fileType: string;
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
  }>,
): {
  files: ProcessedFileResult[];
  categories: Map<
    EntityType,
    {
      files: string[];
      totalRows: number;
      confidence: number;
    }
  >;
} {
  const results: ProcessedFileResult[] = [];
  const categories = new Map<
    EntityType,
    { files: string[]; totalRows: number; confidence: number }
  >();

  for (const file of files) {
    const classification = classifyFile(file.headers, file.rows.slice(0, 50));

    results.push({
      fileName: file.fileName,
      fileType: file.fileType,
      totalRows: file.totalRows,
      classification,
      headers: file.headers,
    });

    // Accumulate into categories
    const existing = categories.get(classification.entityType);
    if (existing) {
      existing.files.push(file.fileName);
      existing.totalRows += file.totalRows;
      // Average the confidence
      existing.confidence = Math.round(
        (existing.confidence * (existing.files.length - 1) + classification.confidence) /
          existing.files.length,
      );
    } else {
      categories.set(classification.entityType, {
        files: [file.fileName],
        totalRows: file.totalRows,
        confidence: classification.confidence,
      });
    }
  }

  return { files: results, categories };
}
