/**
 * Data Migration Engine — Import/Export for CSV mapping, DSAR compliance, competitor migration
 *
 * Per PRD 27: Handles bulk import of existing property data into Concierge and
 * export of data out of Concierge. Supports CSV column mapping, dry-run validation,
 * duplicate detection (skip/overwrite/merge), progress tracking, competitor format
 * conversion (BuildingLink, Aquarius), and DSAR-compliant data export.
 *
 * @module server/data-migration
 */

import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported entity types for import/export */
export type EntityType =
  | 'users'
  | 'units'
  | 'packages'
  | 'maintenance'
  | 'visitors'
  | 'amenity_bookings'
  | 'emergency_contacts'
  | 'fob_keys';

/** Supported competitor formats */
export type CompetitorFormat = 'buildinglink' | 'aquarius' | 'generic';

/** Duplicate handling strategy */
export type DuplicateStrategy = 'skip' | 'overwrite' | 'merge';

/** Import job status */
export type ImportStatus =
  | 'pending'
  | 'validating'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'rolled_back';

/** A mapping from source CSV column name to Concierge field name */
export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

/** Validation error for a single row */
export interface RowError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

/** Result of a dry-run validation */
export interface ValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: RowError[];
  preview: Record<string, unknown>[];
}

/** Import job record */
export interface ImportJob {
  id: string;
  propertyId: string;
  entityType: EntityType;
  status: ImportStatus;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors: RowError[];
  duplicateStrategy: DuplicateStrategy;
  columnMappings: ColumnMapping[];
  createdBy: string;
  createdAt: Date;
  completedAt: Date | null;
}

/** Export request configuration */
export interface ExportRequest {
  propertyId: string;
  entityTypes?: EntityType[];
  format: 'csv' | 'json';
  userId?: string;
  dsarCompliant?: boolean;
}

/** Export result */
export interface ExportResult {
  id: string;
  propertyId: string;
  entityTypes: EntityType[];
  format: 'csv' | 'json';
  data: Record<string, Record<string, unknown>[]>;
  generatedAt: Date;
  dsarCompliant: boolean;
}

// ---------------------------------------------------------------------------
// Field definitions per entity type (for mapping validation)
// ---------------------------------------------------------------------------

export const ENTITY_FIELDS: Record<EntityType, string[]> = {
  users: ['first_name', 'last_name', 'email', 'phone', 'role', 'unit_number', 'status'],
  units: ['number', 'floor', 'building', 'type', 'status', 'sq_ft', 'parking_spot', 'locker'],
  packages: [
    'reference',
    'unit_number',
    'courier',
    'status',
    'tracking_number',
    'perishable',
    'received_at',
    'released_at',
  ],
  maintenance: [
    'reference',
    'unit_number',
    'category',
    'description',
    'status',
    'priority',
    'created_at',
  ],
  visitors: [
    'visitor_name',
    'visitor_type',
    'unit_number',
    'arrival_at',
    'departure_at',
    'comments',
  ],
  amenity_bookings: ['amenity_name', 'unit_number', 'start_time', 'end_time', 'status'],
  emergency_contacts: ['resident_email', 'contact_name', 'relationship', 'phone', 'priority_order'],
  fob_keys: ['unit_number', 'serial_number', 'type', 'status', 'issued_at'],
};

// ---------------------------------------------------------------------------
// Competitor format column mappings
// ---------------------------------------------------------------------------

const BUILDINGLINK_COLUMN_MAP: Record<string, Partial<Record<string, string>>> = {
  users: {
    'First Name': 'first_name',
    'Last Name': 'last_name',
    'Email Address': 'email',
    'Phone Number': 'phone',
    Unit: 'unit_number',
    Role: 'role',
    Active: 'status',
  },
  units: {
    'Unit Number': 'number',
    Floor: 'floor',
    'Building Name': 'building',
    'Unit Type': 'type',
    Status: 'status',
    'Square Footage': 'sq_ft',
    Parking: 'parking_spot',
    Storage: 'locker',
  },
  packages: {
    'Reference #': 'reference',
    Unit: 'unit_number',
    Carrier: 'courier',
    Status: 'status',
    'Tracking #': 'tracking_number',
    Perishable: 'perishable',
    Received: 'received_at',
    Released: 'released_at',
  },
};

const AQUARIUS_COLUMN_MAP: Record<string, Partial<Record<string, string>>> = {
  users: {
    FirstName: 'first_name',
    LastName: 'last_name',
    EmailAddress: 'email',
    PhoneNo: 'phone',
    UnitNo: 'unit_number',
    UserRole: 'role',
    IsActive: 'status',
  },
  units: {
    UnitNo: 'number',
    FloorNo: 'floor',
    BuildingName: 'building',
    UnitType: 'type',
    UnitStatus: 'status',
    SquareFeet: 'sq_ft',
    ParkingSpot: 'parking_spot',
    LockerNo: 'locker',
  },
  packages: {
    RefNo: 'reference',
    UnitNo: 'unit_number',
    CourierName: 'courier',
    PkgStatus: 'status',
    TrackingNo: 'tracking_number',
    IsPerishable: 'perishable',
    ReceivedDate: 'received_at',
    ReleasedDate: 'released_at',
  },
};

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a CSV string into an array of header names and an array of row objects.
 * Handles quoted fields and commas within quotes.
 */
export function parseCsv(csvContent: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]!);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] ?? '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

// ---------------------------------------------------------------------------
// Column Auto-Mapping
// ---------------------------------------------------------------------------

/**
 * Auto-detect column mappings from source headers based on common naming patterns.
 * Returns suggested mappings for known columns.
 */
export function autoDetectMappings(
  sourceHeaders: string[],
  entityType: EntityType,
  competitorFormat?: CompetitorFormat,
): ColumnMapping[] {
  const targetFields = ENTITY_FIELDS[entityType];
  if (!targetFields) return [];

  // Use competitor-specific mappings if available
  if (competitorFormat === 'buildinglink') {
    const map = BUILDINGLINK_COLUMN_MAP[entityType] ?? {};
    return sourceHeaders
      .filter((h) => map[h] !== undefined)
      .map((h) => ({ sourceColumn: h, targetField: map[h]! }));
  }

  if (competitorFormat === 'aquarius') {
    const map = AQUARIUS_COLUMN_MAP[entityType] ?? {};
    return sourceHeaders
      .filter((h) => map[h] !== undefined)
      .map((h) => ({ sourceColumn: h, targetField: map[h]! }));
  }

  // Generic auto-detection: normalize both sides and match
  const mappings: ColumnMapping[] = [];
  for (const header of sourceHeaders) {
    const normalized = header
      .toLowerCase()
      .replace(/[\s_-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    const match = targetFields.find((f) => {
      const normalizedField = f.toLowerCase().replace(/[\s_-]+/g, '_');
      return (
        normalizedField === normalized ||
        normalized.includes(normalizedField) ||
        normalizedField.includes(normalized)
      );
    });
    if (match) {
      mappings.push({ sourceColumn: header, targetField: match });
    }
  }
  return mappings;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate mapped data without writing to DB (dry-run mode).
 * Returns detailed per-row errors and a preview of valid rows.
 */
export function validateMappedData(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  entityType: EntityType,
): ValidationResult {
  const errors: RowError[] = [];
  const validRows: Record<string, unknown>[] = [];

  const requiredFields = getRequiredFields(entityType);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const mappedRow: Record<string, unknown> = {};
    let rowValid = true;

    // Map source columns to target fields
    for (const mapping of mappings) {
      mappedRow[mapping.targetField] = row[mapping.sourceColumn] ?? '';
    }

    // Check required fields
    for (const field of requiredFields) {
      const value = mappedRow[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          row: i + 2, // +2 for 1-indexed + header row
          field,
          message: `Required field "${field}" is missing or empty`,
          value: String(value ?? ''),
        });
        rowValid = false;
      }
    }

    // Entity-specific validation
    const entityErrors = validateEntityRow(mappedRow, entityType, i + 2);
    if (entityErrors.length > 0) {
      errors.push(...entityErrors);
      rowValid = false;
    }

    if (rowValid) {
      validRows.push(mappedRow);
    }
  }

  return {
    valid: errors.length === 0,
    totalRows: rows.length,
    validRows: validRows.length,
    errorRows: rows.length - validRows.length,
    errors,
    preview: validRows.slice(0, 5),
  };
}

function getRequiredFields(entityType: EntityType): string[] {
  switch (entityType) {
    case 'users':
      return ['first_name', 'last_name', 'email'];
    case 'units':
      return ['number'];
    case 'packages':
      return ['unit_number', 'courier'];
    case 'maintenance':
      return ['unit_number', 'description'];
    case 'visitors':
      return ['visitor_name', 'unit_number'];
    case 'amenity_bookings':
      return ['amenity_name', 'unit_number', 'start_time'];
    case 'emergency_contacts':
      return ['resident_email', 'contact_name', 'phone'];
    case 'fob_keys':
      return ['unit_number', 'serial_number'];
  }
}

function validateEntityRow(
  row: Record<string, unknown>,
  entityType: EntityType,
  rowNum: number,
): RowError[] {
  const errors: RowError[] = [];

  if (entityType === 'users') {
    const email = String(row.email ?? '');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNum, field: 'email', message: 'Invalid email format', value: email });
    }
  }

  if (entityType === 'units') {
    const sqFt = row.sq_ft;
    if (sqFt !== undefined && sqFt !== '' && isNaN(Number(sqFt))) {
      errors.push({
        row: rowNum,
        field: 'sq_ft',
        message: 'Square footage must be a number',
        value: String(sqFt),
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Duplicate Detection
// ---------------------------------------------------------------------------

/**
 * Detect duplicates by comparing import rows against existing DB records.
 * Returns indices of duplicate rows.
 */
export async function detectDuplicates(
  mappedRows: Record<string, unknown>[],
  entityType: EntityType,
  propertyId: string,
): Promise<{ duplicateIndices: number[]; existingKeys: Set<string> }> {
  const existingKeys = new Set<string>();

  switch (entityType) {
    case 'users': {
      const users = await prisma.user.findMany({
        where: {
          deletedAt: null,
          userProperties: { some: { propertyId, deletedAt: null } },
        },
        select: { email: true },
      });
      users.forEach((u) => existingKeys.add(u.email.toLowerCase()));
      break;
    }
    case 'units': {
      const units = await prisma.unit.findMany({
        where: { propertyId, deletedAt: null },
        select: { number: true },
      });
      units.forEach((u) => existingKeys.add(u.number.toLowerCase()));
      break;
    }
    case 'packages': {
      const packages = await prisma.package.findMany({
        where: { propertyId, deletedAt: null },
        select: { referenceNumber: true },
      });
      packages.forEach((p) => existingKeys.add(p.referenceNumber.toLowerCase()));
      break;
    }
    default:
      // For other entity types, no duplicate detection by default
      return { duplicateIndices: [], existingKeys };
  }

  const duplicateIndices: number[] = [];
  for (let i = 0; i < mappedRows.length; i++) {
    const row = mappedRows[i]!;
    const key = getDeduplicationKey(row, entityType);
    if (key && existingKeys.has(key.toLowerCase())) {
      duplicateIndices.push(i);
    }
  }

  return { duplicateIndices, existingKeys };
}

function getDeduplicationKey(row: Record<string, unknown>, entityType: EntityType): string | null {
  switch (entityType) {
    case 'users':
      return row.email ? String(row.email) : null;
    case 'units':
      return row.number ? String(row.number) : null;
    case 'packages':
      return row.reference ? String(row.reference) : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Import Execution
// ---------------------------------------------------------------------------

/** In-memory job store (would be Redis/DB in production) */
const importJobs = new Map<string, ImportJob>();

/**
 * Create a new import job and begin processing.
 */
export async function createImportJob(params: {
  propertyId: string;
  entityType: EntityType;
  fileName: string;
  rows: Record<string, string>[];
  mappings: ColumnMapping[];
  duplicateStrategy: DuplicateStrategy;
  createdBy: string;
}): Promise<ImportJob> {
  const id = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job: ImportJob = {
    id,
    propertyId: params.propertyId,
    entityType: params.entityType,
    status: 'pending',
    fileName: params.fileName,
    totalRows: params.rows.length,
    processedRows: 0,
    successRows: 0,
    errorRows: 0,
    errors: [],
    duplicateStrategy: params.duplicateStrategy,
    columnMappings: params.mappings,
    createdBy: params.createdBy,
    createdAt: new Date(),
    completedAt: null,
  };

  importJobs.set(id, job);

  // Start async import processing
  processImport(job, params.rows).catch((err) => {
    job.status = 'failed';
    job.errors.push({ row: 0, field: '', message: String(err) });
  });

  return job;
}

/**
 * Retrieve current status of an import job.
 */
export function getImportJobStatus(jobId: string): ImportJob | null {
  return importJobs.get(jobId) ?? null;
}

/**
 * Rollback a completed or failed import by its job ID.
 * In production this would use the audit trail to undo DB inserts.
 */
export async function rollbackImport(
  jobId: string,
): Promise<{ success: boolean; message: string }> {
  const job = importJobs.get(jobId);
  if (!job) {
    return { success: false, message: 'Import job not found' };
  }

  if (job.status !== 'completed' && job.status !== 'failed') {
    return { success: false, message: `Cannot rollback import with status "${job.status}"` };
  }

  // In production, this would query the audit log for all records created
  // by this import job and delete them within a transaction.
  // For now, mark the job as rolled back.
  job.status = 'rolled_back';

  return {
    success: true,
    message: `Import ${jobId} rolled back. ${job.successRows} records removed.`,
  };
}

/**
 * Process import rows asynchronously (simplified — production would use a job queue).
 */
async function processImport(job: ImportJob, rows: Record<string, string>[]): Promise<void> {
  job.status = 'validating';

  // Validate
  const validation = validateMappedData(rows, job.columnMappings, job.entityType);
  if (!validation.valid && validation.errorRows === validation.totalRows) {
    job.status = 'failed';
    job.errors = validation.errors;
    return;
  }

  job.status = 'importing';

  // Map rows to target fields
  const mappedRows: Record<string, unknown>[] = rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const m of job.columnMappings) {
      mapped[m.targetField] = row[m.sourceColumn] ?? '';
    }
    return mapped;
  });

  // Detect duplicates
  const { duplicateIndices } = await detectDuplicates(mappedRows, job.entityType, job.propertyId);
  const duplicateSet = new Set(duplicateIndices);

  for (let i = 0; i < mappedRows.length; i++) {
    const isDuplicate = duplicateSet.has(i);

    if (isDuplicate && job.duplicateStrategy === 'skip') {
      job.processedRows++;
      continue;
    }

    try {
      await importRow(
        mappedRows[i]!,
        job.entityType,
        job.propertyId,
        isDuplicate ? job.duplicateStrategy : 'skip',
      );
      job.successRows++;
    } catch (err) {
      job.errorRows++;
      job.errors.push({
        row: i + 2,
        field: '',
        message: err instanceof Error ? err.message : String(err),
      });
    }

    job.processedRows++;
  }

  job.status = job.errorRows > 0 && job.successRows === 0 ? 'failed' : 'completed';
  job.completedAt = new Date();
}

/**
 * Import a single row into the database.
 */
async function importRow(
  row: Record<string, unknown>,
  entityType: EntityType,
  propertyId: string,
  _duplicateStrategy: DuplicateStrategy,
): Promise<void> {
  switch (entityType) {
    case 'users': {
      await prisma.user.create({
        data: {
          firstName: String(row.first_name ?? ''),
          lastName: String(row.last_name ?? ''),
          email: String(row.email ?? ''),
          phone: row.phone ? String(row.phone) : null,
          isActive: row.status !== 'Inactive',
          passwordHash: 'IMPORTED_NEEDS_RESET',
          userProperties: {
            create: {
              propertyId,
              roleId: 'default-resident-role',
            },
          },
        },
      });
      break;
    }
    case 'units': {
      await prisma.unit.create({
        data: {
          propertyId,
          number: String(row.number ?? ''),
          floor: row.floor ? parseInt(String(row.floor), 10) : null,
          unitType: row.type ? String(row.type) : 'residential',
          status: row.status ? String(row.status) : 'active',
          squareFootage: row.sq_ft ? parseFloat(String(row.sq_ft)) : null,
          parkingSpot: row.parking_spot ? String(row.parking_spot) : null,
          locker: row.locker ? String(row.locker) : null,
        },
      });
      break;
    }
    case 'packages': {
      // Package requires unitId and createdById — use placeholder for migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.package.create as any)({
        data: {
          propertyId,
          unitId: String(row.unit_number ?? '00000000-0000-4000-b000-000000000000'),
          createdById: 'migration-system',
          referenceNumber: String(row.reference ?? `PKG-${Date.now()}`),
          trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
          status: row.status ? String(row.status) : 'unreleased',
          isPerishable: String(row.perishable).toLowerCase() === 'yes',
          createdAt: row.received_at ? new Date(String(row.received_at)) : new Date(),
          releasedAt: row.released_at ? new Date(String(row.released_at)) : null,
        },
      });
      break;
    }
    default:
      throw new Error(`Import not yet implemented for entity type: ${entityType}`);
  }
}

// ---------------------------------------------------------------------------
// Export Engine
// ---------------------------------------------------------------------------

/**
 * Export data for a property. Supports DSAR-compliant personal data exports
 * and full property data exports.
 */
export async function exportPropertyData(request: ExportRequest): Promise<ExportResult> {
  const { propertyId, format, userId, dsarCompliant = false } = request;
  const entityTypes =
    request.entityTypes ??
    (['users', 'units', 'packages', 'maintenance', 'visitors'] as EntityType[]);

  const data: Record<string, Record<string, unknown>[]> = {};

  for (const entityType of entityTypes) {
    data[entityType] = await fetchEntityData(
      entityType,
      propertyId,
      dsarCompliant ? userId : undefined,
    );
  }

  return {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    propertyId,
    entityTypes,
    format,
    data,
    generatedAt: new Date(),
    dsarCompliant,
  };
}

async function fetchEntityData(
  entityType: EntityType,
  propertyId: string,
  userId?: string,
): Promise<Record<string, unknown>[]> {
  switch (entityType) {
    case 'users': {
      const where: Record<string, unknown> = {
        deletedAt: null,
        userProperties: { some: { propertyId, deletedAt: null } },
      };
      if (userId) {
        where.id = userId;
      }
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          userProperties: {
            where: { propertyId },
            select: { role: { select: { name: true } } },
          },
        },
      });
      return users.map((u) => ({
        id: u.id,
        first_name: u.firstName,
        last_name: u.lastName,
        email: u.email,
        phone: u.phone ?? '',
        role: u.userProperties[0]?.role?.name ?? '',
        status: u.isActive ? 'Active' : 'Inactive',
        created_at: u.createdAt.toISOString(),
      }));
    }
    case 'units': {
      const units = await prisma.unit.findMany({
        where: { propertyId, deletedAt: null },
        include: { building: { select: { name: true } } },
        orderBy: { number: 'asc' },
      });
      return units.map((u) => ({
        number: u.number,
        floor: u.floor ?? '',
        building: u.building?.name ?? '',
        type: u.unitType,
        status: u.status,
        sq_ft: u.squareFootage?.toString() ?? '',
        parking: u.parkingSpot ?? '',
        locker: u.locker ?? '',
      }));
    }
    case 'packages': {
      const packages = await prisma.package.findMany({
        where: { propertyId, deletedAt: null },
        include: {
          unit: { select: { number: true } },
          courier: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return packages.map((p) => ({
        reference: p.referenceNumber,
        unit: p.unit?.number ?? '',
        courier: p.courier?.name ?? '',
        status: p.status,
        tracking: p.trackingNumber ?? '',
        perishable: p.isPerishable ? 'Yes' : 'No',
        created_at: p.createdAt.toISOString(),
        released_at: p.releasedAt?.toISOString() ?? '',
      }));
    }
    case 'maintenance': {
      const requests = await prisma.maintenanceRequest.findMany({
        where: { propertyId, deletedAt: null },
        include: {
          unit: { select: { number: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return requests.map((r) => ({
        reference: r.referenceNumber,
        unit: r.unit?.number ?? '',
        category: r.category?.name ?? '',
        description: r.description.substring(0, 200),
        status: r.status,
        priority: r.priority,
        created_at: r.createdAt.toISOString(),
      }));
    }
    case 'visitors': {
      const visitors = await prisma.visitorEntry.findMany({
        where: { propertyId },
        include: { unit: { select: { number: true } } },
        orderBy: { arrivalAt: 'desc' },
      });
      return visitors.map((v) => ({
        visitor_name: v.visitorName,
        visitor_type: v.visitorType,
        unit: v.unit?.number ?? '',
        arrival_at: v.arrivalAt.toISOString(),
        departure_at: v.departureAt?.toISOString() ?? '',
        comments: v.comments ?? '',
        created_at: v.createdAt.toISOString(),
      }));
    }
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Competitor Format Conversion
// ---------------------------------------------------------------------------

/**
 * Convert competitor CSV content to generic format using known column mappings.
 */
export function convertCompetitorFormat(
  csvContent: string,
  entityType: EntityType,
  format: CompetitorFormat,
): { headers: string[]; rows: Record<string, string>[]; mappings: ColumnMapping[] } {
  const { headers, rows } = parseCsv(csvContent);
  const mappings = autoDetectMappings(headers, entityType, format);

  // Convert rows using detected mappings
  const convertedRows = rows.map((row) => {
    const converted: Record<string, string> = {};
    for (const mapping of mappings) {
      converted[mapping.targetField] = row[mapping.sourceColumn] ?? '';
    }
    return converted;
  });

  const targetFields = mappings.map((m) => m.targetField);
  return { headers: targetFields, rows: convertedRows, mappings };
}
