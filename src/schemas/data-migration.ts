import { z } from 'zod';

/**
 * Data Migration schemas — per PRD 27 Data Migration
 */

// ---------------------------------------------------------------------------
// Job Types & Statuses
// ---------------------------------------------------------------------------

export const MIGRATION_JOB_TYPES = ['import', 'export', 'migration', 'dsar'] as const;
export type MigrationJobType = (typeof MIGRATION_JOB_TYPES)[number];

export const MIGRATION_JOB_STATUSES = [
  'pending',
  'validating',
  'processing',
  'completed',
  'failed',
] as const;
export type MigrationJobStatus = (typeof MIGRATION_JOB_STATUSES)[number];

export const IMPORT_DATA_TYPES = [
  'units',
  'residents',
  'packages',
  'maintenance',
  'fobs',
  'emergency_contacts',
] as const;
export type ImportDataType = (typeof IMPORT_DATA_TYPES)[number];

export const EXPORT_MODULES = [
  'units',
  'residents',
  'packages',
  'maintenance',
  'amenities',
  'events',
  'security',
  'announcements',
  'all',
] as const;
export type ExportModule = (typeof EXPORT_MODULES)[number];

export const EXPORT_FORMATS = ['csv', 'xlsx', 'json', 'pdf'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

// ---------------------------------------------------------------------------
// Import Job Schema
// ---------------------------------------------------------------------------

export const createImportJobSchema = z.object({
  type: z.literal('import'),
  dataType: z.enum(IMPORT_DATA_TYPES),
  fileName: z.string().min(1, 'File name is required').max(255),
  fileFormat: z.enum(['csv', 'xlsx']),
  mappings: z.record(z.string()).optional(),
});

export type CreateImportJobInput = z.infer<typeof createImportJobSchema>;

// ---------------------------------------------------------------------------
// Export Job Schema
// ---------------------------------------------------------------------------

export const createExportJobSchema = z.object({
  type: z.literal('export'),
  modules: z.array(z.enum(EXPORT_MODULES)).min(1, 'At least one module is required'),
  format: z.enum(EXPORT_FORMATS).default('csv'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type CreateExportJobInput = z.infer<typeof createExportJobSchema>;

// ---------------------------------------------------------------------------
// Migration Job Schema (from competitor platform)
// ---------------------------------------------------------------------------

export const createMigrationJobSchema = z.object({
  type: z.literal('migration'),
  sourcePlatform: z.string().min(1, 'Source platform is required').max(100),
  fileName: z.string().min(1, 'File name is required').max(255),
  mappings: z.record(z.string()).optional(),
});

export type CreateMigrationJobInput = z.infer<typeof createMigrationJobSchema>;

// ---------------------------------------------------------------------------
// DSAR (Data Subject Access Request) Job Schema
// ---------------------------------------------------------------------------

export const createDsarJobSchema = z.object({
  type: z.literal('dsar'),
  userId: z.string().uuid('Valid user ID is required'),
  requestReason: z.string().min(1).max(500).optional(),
});

export type CreateDsarJobInput = z.infer<typeof createDsarJobSchema>;

// ---------------------------------------------------------------------------
// Union Schema — accepts any job type
// ---------------------------------------------------------------------------

export const createMigrationJobUnionSchema = z.discriminatedUnion('type', [
  createImportJobSchema,
  createExportJobSchema,
  createMigrationJobSchema,
  createDsarJobSchema,
]);

export type CreateMigrationJobUnionInput = z.infer<typeof createMigrationJobUnionSchema>;
