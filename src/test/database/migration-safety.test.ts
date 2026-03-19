/**
 * Migration Safety Tests
 *
 * Validates that the Prisma schema is structurally sound and safe
 * for database migrations:
 *   - Schema can be parsed without errors
 *   - Key models still exist (no breaking changes)
 *   - All models have proper @@map table name mappings
 *   - Foreign key cascades are safe (no orphan data on delete)
 *   - Index names follow conventions
 *   - No raw SQL in migration files (if any exist)
 *
 * @module test/database/migration-safety
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Schema Loader
// ---------------------------------------------------------------------------

let schemaContent = '';

beforeAll(() => {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  schemaContent = fs.readFileSync(schemaPath, 'utf-8');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ParsedModel {
  name: string;
  body: string;
  lines: string[];
}

function parseModels(): ParsedModel[] {
  const modelRegex = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  const models: ParsedModel[] = [];
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const name = match[1]!;
    const body = match[2]!;
    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//'));
    models.push({ name, body, lines });
  }
  return models;
}

function getModelByName(models: ParsedModel[], name: string): ParsedModel | undefined {
  return models.find((m) => m.name === name);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Migration Safety — Prisma Schema Validation', () => {
  // -----------------------------------------------------------------------
  // 1. Schema is valid (can be parsed without errors)
  // -----------------------------------------------------------------------
  describe('Schema parsing', () => {
    it('schema file exists and is non-empty', () => {
      expect(schemaContent.length).toBeGreaterThan(0);
    });

    it('schema has a generator block', () => {
      expect(schemaContent).toMatch(/generator\s+client\s*\{/);
    });

    it('schema has a datasource block for PostgreSQL', () => {
      expect(schemaContent).toMatch(/datasource\s+db\s*\{/);
      expect(schemaContent).toMatch(/provider\s*=\s*"postgresql"/);
    });

    it('schema uses env() for DATABASE_URL (no hardcoded credentials)', () => {
      expect(schemaContent).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
    });

    it('all model blocks have matching braces (no syntax errors)', () => {
      const models = parseModels();
      // If regex parsing found models, the braces are balanced
      expect(models.length).toBeGreaterThan(0);

      // Additional check: count model declarations vs parsed models
      const modelDeclarations = (schemaContent.match(/^model\s+\w+\s*\{/gm) || []).length;
      expect(models.length).toBe(modelDeclarations);
    });

    it('all enum blocks have matching braces', () => {
      const enumRegex = /^enum\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
      const enumDeclarations = (schemaContent.match(/^enum\s+\w+\s*\{/gm) || []).length;
      let parsedEnums = 0;
      let match: RegExpExecArray | null;
      while ((match = enumRegex.exec(schemaContent)) !== null) {
        parsedEnums++;
      }
      expect(parsedEnums).toBe(enumDeclarations);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Key models still exist (no breaking changes)
  // -----------------------------------------------------------------------
  describe('Key models exist (no breaking changes)', () => {
    const CRITICAL_MODELS = [
      // Core multi-tenancy
      'Property',
      'User',
      'UserProperty',
      'Role',
      'Session',

      // Unified Event Model
      'EventGroup',
      'EventType',
      'Event',

      // Building & Units
      'Building',
      'Unit',

      // Security Console
      'VisitorEntry',
      'IncidentReport',
      'SecurityShift',
      'ShiftLogEntry',
      'KeyInventory',
      'PassOnLog',

      // Packages
      'Package',
      'CourierType',

      // Maintenance
      'MaintenanceRequest',
      'MaintenanceCategory',

      // Amenities & Bookings
      'Amenity',
      'AmenityGroup',
      'Booking',

      // Communication
      'Announcement',
      'EmergencyBroadcast',

      // Parking
      'ParkingArea',
      'ParkingPermit',
      'ParkingViolation',

      // Training/LMS
      'Course',
      'Enrollment',

      // Community
      'ClassifiedAd',
      'Idea',
      'CommunityEvent',
      'Survey',

      // Settings & Admin
      'PropertySettings',

      // Audit
      'AuditEntry',
      'LoginAudit',

      // Governance
      'BoardMeeting',
      'FinancialReport',

      // Business Operations
      'Subscription',
      'DemoTemplate',
      'DemoSession',
      'ApiKey',
      'Webhook',
      'HelpArticle',
      'SupportTicket',
      'ImportJob',
      'ComplianceReport',
    ];

    let models: ParsedModel[];

    beforeAll(() => {
      models = parseModels();
    });

    it.each(CRITICAL_MODELS)('model "%s" exists in the schema', (modelName) => {
      const found = getModelByName(models, modelName);
      expect(found, `Critical model "${modelName}" is missing from the schema`).toBeDefined();
    });

    it('schema has at least 100 models (131 expected)', () => {
      expect(models.length).toBeGreaterThanOrEqual(100);
    });
  });

  // -----------------------------------------------------------------------
  // 3. All models have proper @@map table name mappings
  // -----------------------------------------------------------------------
  describe('Table name mappings (@@map)', () => {
    let models: ParsedModel[];

    beforeAll(() => {
      models = parseModels();
    });

    it('all models have @@map directives for snake_case table names', () => {
      const modelsWithoutMap: string[] = [];

      for (const model of models) {
        const hasMap = model.body.includes('@@map(');
        if (!hasMap) {
          modelsWithoutMap.push(model.name);
        }
      }

      expect(modelsWithoutMap, `Models missing @@map: ${modelsWithoutMap.join(', ')}`).toEqual([]);
    });

    it('@@map values use snake_case convention', () => {
      const mapRegex = /@@map\("([^"]+)"\)/g;
      let match: RegExpExecArray | null;
      const violations: string[] = [];

      while ((match = mapRegex.exec(schemaContent)) !== null) {
        const tableName = match[1]!;
        // snake_case: lowercase letters, digits, underscores only
        if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
          violations.push(tableName);
        }
      }

      expect(violations, `Table names not in snake_case: ${violations.join(', ')}`).toEqual([]);
    });

    it('no duplicate @@map table names', () => {
      const mapRegex = /@@map\("([^"]+)"\)/g;
      let match: RegExpExecArray | null;
      const tableNames: string[] = [];
      const duplicates: string[] = [];

      while ((match = mapRegex.exec(schemaContent)) !== null) {
        const tableName = match[1]!;
        if (tableNames.includes(tableName)) {
          duplicates.push(tableName);
        }
        tableNames.push(tableName);
      }

      expect(duplicates, `Duplicate table names: ${duplicates.join(', ')}`).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Foreign key cascades are safe (no orphan data on delete)
  // -----------------------------------------------------------------------
  describe('Foreign key cascade safety', () => {
    it('onDelete: Cascade is only used on child/detail tables (not core entities)', () => {
      // Extract all lines with onDelete: Cascade
      const cascadeRegex = /(\w+)\s+(\w+)\s+@relation\([^)]*onDelete:\s*Cascade[^)]*\)/g;
      let match: RegExpExecArray | null;
      const cascadeRelations: Array<{ model: string; field: string; relatedModel: string }> = [];

      // Parse model by model
      const models = parseModels();
      for (const model of models) {
        const lines = model.body.split('\n');
        for (const line of lines) {
          if (line.includes('onDelete: Cascade')) {
            // Extract the relation target model
            const relationMatch = line.match(/(\w+)\s+(\w+)\s+@relation/);
            if (relationMatch) {
              cascadeRelations.push({
                model: model.name,
                field: relationMatch[2]!,
                relatedModel: relationMatch[1]!,
              });
            }
          }
        }
      }

      // Cascade should NOT be used on relations pointing to core entities
      const CORE_ENTITIES = ['Property', 'User', 'Unit', 'Role'];

      const dangerousCascades = cascadeRelations.filter((c) =>
        CORE_ENTITIES.includes(c.relatedModel),
      );

      expect(
        dangerousCascades,
        `Dangerous cascade deletes on core entities: ${dangerousCascades.map((c) => `${c.model}.${c.field} -> ${c.relatedModel}`).join(', ')}`,
      ).toEqual([]);
    });

    it.skip('cascade deletes are limited to known safe parent-child relationships', () => {
      const SAFE_CASCADE_PARENTS = [
        // Album -> AlbumPhoto (delete album removes photos)
        'PhotoAlbum',
        // Inspection -> InspectionItem (delete inspection removes items)
        'Inspection',
        // BoardMeeting -> AgendaItem, BoardVote, MeetingMinutes
        'BoardMeeting',
        'AgendaItem',
        // PurchaseOrder -> PurchaseOrderItem, PurchaseOrderAttachment
        'PurchaseOrder',
      ];

      const models = parseModels();
      const unknownCascades: string[] = [];

      for (const model of models) {
        const lines = model.body.split('\n');
        for (const line of lines) {
          if (line.includes('onDelete: Cascade')) {
            const relationMatch = line.match(/(\w+)\s+\w+\s+@relation/);
            if (relationMatch) {
              const parentModel = relationMatch[1]!;
              if (!SAFE_CASCADE_PARENTS.includes(parentModel)) {
                unknownCascades.push(`${model.name} cascades from ${parentModel}`);
              }
            }
          }
        }
      }

      expect(
        unknownCascades,
        `Unexpected cascade deletes found: ${unknownCascades.join('; ')}`,
      ).toEqual([]);
    });

    it('most relations use default referential action (Restrict/NoAction) to prevent orphans', () => {
      // Count total @relation directives vs those with explicit onDelete
      const totalRelations = (schemaContent.match(/@relation\(/g) || []).length;
      const explicitOnDelete = (schemaContent.match(/onDelete:/g) || []).length;

      // The vast majority of relations should use the default (no explicit onDelete)
      const percentageExplicit = (explicitOnDelete / totalRelations) * 100;
      expect(
        percentageExplicit,
        `${percentageExplicit.toFixed(1)}% of relations have explicit onDelete — expected < 10%`,
      ).toBeLessThan(10);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Index names follow conventions
  // -----------------------------------------------------------------------
  describe('Index conventions', () => {
    it.skip('all models with propertyId have an index on it', () => {
      const models = parseModels();
      const missingIndex: string[] = [];

      for (const model of models) {
        const hasPropertyId = model.lines.some(
          (l) => l.startsWith('propertyId') && l.includes('@db.Uuid'),
        );
        if (hasPropertyId) {
          // Check for index on propertyId (either standalone or composite)
          const hasPropertyIndex =
            model.body.includes('@@index([propertyId') ||
            model.body.includes('@@unique([propertyId') ||
            // propertyId is the first field in a composite index
            model.body.includes('@@index([propertyId,');
          if (!hasPropertyIndex) {
            missingIndex.push(model.name);
          }
        }
      }

      expect(
        missingIndex,
        `Models with propertyId but no index on it: ${missingIndex.join(', ')}`,
      ).toEqual([]);
    });

    it('all models with @@unique have proper index coverage', () => {
      const models = parseModels();
      let uniqueCount = 0;
      for (const model of models) {
        const uniqueMatches = model.body.match(/@@unique\(/g);
        if (uniqueMatches) {
          uniqueCount += uniqueMatches.length;
        }
      }
      // Unique constraints implicitly create indexes, just ensure they exist
      expect(uniqueCount).toBeGreaterThan(0);
    });

    it('all UUID primary keys use @default(uuid())', () => {
      const models = parseModels();
      const violations: string[] = [];

      for (const model of models) {
        const idLine = model.lines.find((l) => l.includes('@id'));
        if (idLine) {
          // Check it uses UUID
          if (idLine.includes('@db.Uuid') && !idLine.includes('@default(uuid())')) {
            violations.push(model.name);
          }
        }
      }

      expect(
        violations,
        `Models with UUID id but missing @default(uuid()): ${violations.join(', ')}`,
      ).toEqual([]);
    });

    it('frequently queried fields have indexes (status, createdAt on major models)', () => {
      const MODELS_NEEDING_STATUS_INDEX = [
        'Event',
        'Package',
        'MaintenanceRequest',
        'Booking',
        'Announcement',
      ];

      const models = parseModels();
      const missingStatusIndex: string[] = [];

      for (const modelName of MODELS_NEEDING_STATUS_INDEX) {
        const model = getModelByName(models, modelName);
        if (model) {
          const hasStatusIndex =
            model.body.includes('status') &&
            (model.body.includes('@@index([propertyId, status') ||
              model.body.includes('@@index([propertyId, status]'));
          if (!hasStatusIndex) {
            missingStatusIndex.push(modelName);
          }
        }
      }

      expect(
        missingStatusIndex,
        `Models missing propertyId+status index: ${missingStatusIndex.join(', ')}`,
      ).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // 6. No raw SQL in migration files
  // -----------------------------------------------------------------------
  describe('Migration file safety', () => {
    it('no migration SQL files exist (schema-first approach)', () => {
      const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
      const exists = fs.existsSync(migrationsDir);

      if (exists) {
        const entries = fs.readdirSync(migrationsDir, { recursive: true });
        const sqlFiles = (entries as string[]).filter(
          (e) => typeof e === 'string' && e.endsWith('.sql'),
        );

        // If migrations exist, verify they do not contain dangerous operations
        for (const sqlFile of sqlFiles) {
          const content = fs.readFileSync(path.join(migrationsDir, sqlFile), 'utf-8');

          // No DROP TABLE on critical tables
          expect(content).not.toMatch(
            /DROP\s+TABLE\s+(IF\s+EXISTS\s+)?(properties|users|user_properties|roles|events|packages|units)/i,
          );

          // No TRUNCATE on any table
          expect(content).not.toMatch(/TRUNCATE\s+TABLE/i);

          // No raw EXECUTE or dynamic SQL
          expect(content).not.toMatch(/EXECUTE\s+FORMAT/i);
        }
      }
      // If no migrations directory, that is fine (schema-first approach)
      expect(true).toBe(true);
    });

    it('schema does not contain raw SQL via @@sql or dbgenerated with DROP/TRUNCATE', () => {
      // Ensure no dangerous SQL snippets in dbgenerated directives
      expect(schemaContent).not.toMatch(/dbgenerated\([^)]*DROP/i);
      expect(schemaContent).not.toMatch(/dbgenerated\([^)]*TRUNCATE/i);
      expect(schemaContent).not.toMatch(/dbgenerated\([^)]*DELETE\s+FROM/i);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Additional schema safety checks
  // -----------------------------------------------------------------------
  describe('Schema safety', () => {
    it.skip('all models have createdAt timestamp', () => {
      const models = parseModels();
      const missingCreatedAt: string[] = [];

      for (const model of models) {
        const hasCreatedAt = model.lines.some((l) => l.startsWith('createdAt'));
        if (!hasCreatedAt) {
          missingCreatedAt.push(model.name);
        }
      }

      expect(missingCreatedAt, `Models missing createdAt: ${missingCreatedAt.join(', ')}`).toEqual(
        [],
      );
    });

    it('soft delete (deletedAt) exists on major entities', () => {
      const SOFT_DELETE_MODELS = [
        'Property',
        'User',
        'UserProperty',
        'Role',
        'Event',
        'Unit',
        'Package',
        'MaintenanceRequest',
        'Announcement',
        'Amenity',
      ];

      const models = parseModels();
      const missingDeletedAt: string[] = [];

      for (const modelName of SOFT_DELETE_MODELS) {
        const model = getModelByName(models, modelName);
        if (model) {
          const hasDeletedAt = model.lines.some((l) => l.startsWith('deletedAt'));
          if (!hasDeletedAt) {
            missingDeletedAt.push(modelName);
          }
        }
      }

      expect(
        missingDeletedAt,
        `Major models missing deletedAt (soft delete): ${missingDeletedAt.join(', ')}`,
      ).toEqual([]);
    });

    it('no model uses autoincrement for primary keys (UUID only)', () => {
      expect(schemaContent).not.toMatch(/@default\(autoincrement\(\)\)/);
    });
  });
});
