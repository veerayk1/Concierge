/**
 * Data Migration Import API — POST /api/v1/data-migration/import
 *
 * Per PRD 27: Accepts CSV file upload, column mappings, and import configuration.
 * Supports dry-run validation, duplicate detection, role assignment, and
 * competitor format conversion (BuildingLink, Aquarius).
 *
 * @module app/api/v1/data-migration/import/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { z } from 'zod';
import {
  parseCsv,
  autoDetectMappings,
  validateMappedData,
  createImportJob,
  convertCompetitorFormat,
  ENTITY_FIELDS,
} from '@/server/data-migration';
import type {
  EntityType,
  CompetitorFormat,
  DuplicateStrategy,
  ColumnMapping,
} from '@/server/data-migration';

const importSchema = z.object({
  propertyId: z.string().uuid(),
  entityType: z.string().min(1),
  csvContent: z.string().min(1),
  columnMappings: z
    .array(
      z.object({
        sourceColumn: z.string(),
        targetField: z.string(),
      }),
    )
    .optional(),
  dryRun: z.boolean().optional().default(false),
  duplicateStrategy: z.string().optional().default('skip'),
  competitorFormat: z.string().optional(),
  fileName: z.string().max(500).optional().default('import.csv'),
});

const VALID_ENTITY_TYPES: EntityType[] = [
  'users',
  'units',
  'packages',
  'maintenance',
  'visitors',
  'amenity_bookings',
  'emergency_contacts',
  'fob_keys',
];

const VALID_DUPLICATE_STRATEGIES: DuplicateStrategy[] = ['skip', 'overwrite', 'merge'];
const VALID_COMPETITOR_FORMATS: CompetitorFormat[] = ['buildinglink', 'aquarius', 'generic'];

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();

    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const {
      propertyId,
      entityType,
      csvContent,
      columnMappings,
      dryRun,
      duplicateStrategy,
      competitorFormat,
      fileName,
    } = parsed.data;

    if (!VALID_ENTITY_TYPES.includes(entityType as EntityType)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid entityType: ${entityType}. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (!VALID_DUPLICATE_STRATEGIES.includes(duplicateStrategy as DuplicateStrategy)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid duplicateStrategy: ${duplicateStrategy}. Must be one of: ${VALID_DUPLICATE_STRATEGIES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Parse CSV — competitor format conversion normalizes columns to Concierge fields
    const isCompetitorFormat =
      competitorFormat && VALID_COMPETITOR_FORMATS.includes(competitorFormat as CompetitorFormat);
    let headers: string[];
    let rows: Record<string, string>[];
    let competitorMappings: ColumnMapping[] | undefined;

    if (isCompetitorFormat) {
      const converted = convertCompetitorFormat(
        csvContent,
        entityType as EntityType,
        competitorFormat as CompetitorFormat,
      );
      headers = converted.headers;
      rows = converted.rows;
      // Converted rows already have target field keys, so create identity mappings
      competitorMappings = headers.map((h) => ({ sourceColumn: h, targetField: h }));
    } else {
      const parsed = parseCsv(csvContent);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'CSV file contains no data rows',
        },
        { status: 400 },
      );
    }

    // Determine column mappings: use provided, competitor-derived, or auto-detect
    const mappings: ColumnMapping[] =
      columnMappings ?? competitorMappings ?? autoDetectMappings(headers, entityType as EntityType);

    if (mappings.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'No column mappings could be determined. Provide explicit columnMappings.',
          availableFields: ENTITY_FIELDS[entityType as EntityType],
          sourceHeaders: headers,
        },
        { status: 400 },
      );
    }

    // Dry-run: validate only, do not write
    if (dryRun) {
      const validation = validateMappedData(rows, mappings, entityType as EntityType);
      return NextResponse.json({
        data: {
          ...validation,
          mappings,
          entityType,
        },
        message: 'Dry-run validation complete. No data was imported.',
      });
    }

    // Create and start import job
    const job = await createImportJob({
      propertyId,
      entityType: entityType as EntityType,
      fileName,
      rows,
      mappings,
      duplicateStrategy: duplicateStrategy as DuplicateStrategy,
      createdBy: auth.user.userId,
    });

    return NextResponse.json(
      {
        data: {
          importId: job.id,
          status: job.status,
          totalRows: job.totalRows,
          entityType: job.entityType,
          duplicateStrategy: job.duplicateStrategy,
          mappings: job.columnMappings,
        },
        message: 'Import job created. Track progress via GET /data-migration/import/:id/status',
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('POST /api/v1/data-migration/import error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Import failed' },
      { status: 500 },
    );
  }
}
