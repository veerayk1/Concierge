/**
 * Model Relationship Tests
 *
 * Validates that Prisma schema relationships are correctly defined:
 *   - Event belongs to Property and EventType
 *   - Package belongs to Property and Unit
 *   - MaintenanceRequest belongs to Property, Unit, and Category
 *   - Booking belongs to Amenity and Unit
 *   - User belongs to multiple Properties via UserProperty
 *   - All cascade deletes are intentional
 *
 * Reads the schema file directly and parses model definitions
 * to verify foreign key relationships, required vs optional fields,
 * and referential integrity constraints.
 *
 * @module test/database/model-relationships
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

function getModel(models: ParsedModel[], name: string): ParsedModel {
  const model = models.find((m) => m.name === name);
  if (!model) throw new Error(`Model "${name}" not found in schema`);
  return model;
}

/** Check if a model has a required foreign key field (no ?) */
function hasRequiredFK(model: ParsedModel, fieldName: string): boolean {
  return model.lines.some(
    (l) => l.startsWith(fieldName) && l.includes('@db.Uuid') && !l.includes('?'),
  );
}

/** Check if a model has an optional foreign key field (has ?) */
function hasOptionalFK(model: ParsedModel, fieldName: string): boolean {
  return model.lines.some(
    (l) => l.startsWith(fieldName) && l.includes('?') && l.includes('@db.Uuid'),
  );
}

/** Check if a model has a @relation pointing to a target model */
function hasRelation(model: ParsedModel, targetModel: string): boolean {
  return model.body.includes(`@relation(`) && model.body.includes(targetModel);
}

/** Check if a model has a relation array field */
function hasRelationArray(model: ParsedModel, fieldType: string): boolean {
  return model.lines.some((l) => l.includes(`${fieldType}[]`));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Model Relationships — Prisma Schema Integrity', () => {
  let models: ParsedModel[];

  beforeAll(() => {
    models = parseModels();
  });

  // -----------------------------------------------------------------------
  // 1. Event belongs to Property and EventType
  // -----------------------------------------------------------------------
  describe('Event relationships', () => {
    it('Event has required propertyId FK', () => {
      const event = getModel(models, 'Event');
      expect(hasRequiredFK(event, 'propertyId')).toBe(true);
    });

    it('Event has required eventTypeId FK', () => {
      const event = getModel(models, 'Event');
      expect(hasRequiredFK(event, 'eventTypeId')).toBe(true);
    });

    it('Event has optional unitId FK (events may not be unit-specific)', () => {
      const event = getModel(models, 'Event');
      expect(hasOptionalFK(event, 'unitId')).toBe(true);
    });

    it('Event has @relation to Property', () => {
      const event = getModel(models, 'Event');
      expect(event.body).toContain('property  Property');
      expect(event.body).toContain('fields: [propertyId]');
    });

    it('Event has @relation to EventType', () => {
      const event = getModel(models, 'Event');
      expect(event.body).toContain('eventType EventType');
      expect(event.body).toContain('fields: [eventTypeId]');
    });

    it('Event has @relation to Unit (optional)', () => {
      const event = getModel(models, 'Event');
      expect(event.body).toMatch(/unit\s+Unit\?/);
      expect(event.body).toContain('fields: [unitId]');
    });

    it('EventType belongs to EventGroup and Property', () => {
      const eventType = getModel(models, 'EventType');
      expect(hasRequiredFK(eventType, 'propertyId')).toBe(true);
      expect(hasRequiredFK(eventType, 'eventGroupId')).toBe(true);
      expect(eventType.body).toContain('fields: [propertyId]');
      expect(eventType.body).toContain('fields: [eventGroupId]');
    });

    it('EventGroup belongs to Property', () => {
      const eventGroup = getModel(models, 'EventGroup');
      expect(hasRequiredFK(eventGroup, 'propertyId')).toBe(true);
    });

    it('Property has events[] relation', () => {
      const property = getModel(models, 'Property');
      expect(hasRelationArray(property, 'Event')).toBe(true);
    });

    it('Property has eventTypes[] relation', () => {
      const property = getModel(models, 'Property');
      expect(hasRelationArray(property, 'EventType')).toBe(true);
    });

    it('Property has eventGroups[] relation', () => {
      const property = getModel(models, 'Property');
      expect(hasRelationArray(property, 'EventGroup')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Package belongs to Property and Unit
  // -----------------------------------------------------------------------
  describe('Package relationships', () => {
    it('Package has required propertyId FK', () => {
      const pkg = getModel(models, 'Package');
      expect(hasRequiredFK(pkg, 'propertyId')).toBe(true);
    });

    it('Package has required unitId FK', () => {
      const pkg = getModel(models, 'Package');
      expect(hasRequiredFK(pkg, 'unitId')).toBe(true);
    });

    it('Package has @relation to Property', () => {
      const pkg = getModel(models, 'Package');
      expect(pkg.body).toContain('property       Property');
      expect(pkg.body).toContain('fields: [propertyId]');
    });

    it('Package has @relation to Unit', () => {
      const pkg = getModel(models, 'Package');
      expect(pkg.body).toContain('unit           Unit');
      expect(pkg.body).toContain('fields: [unitId]');
    });

    it('Package has optional courierId FK', () => {
      const pkg = getModel(models, 'Package');
      expect(hasOptionalFK(pkg, 'courierId')).toBe(true);
    });

    it('Package has @relation to CourierType (optional)', () => {
      const pkg = getModel(models, 'Package');
      expect(pkg.body).toMatch(/courier\s+CourierType\?/);
    });

    it('Package has required createdById FK', () => {
      const pkg = getModel(models, 'Package');
      expect(hasRequiredFK(pkg, 'createdById')).toBe(true);
    });

    it('Package has optional releasedById FK', () => {
      const pkg = getModel(models, 'Package');
      expect(hasOptionalFK(pkg, 'releasedById')).toBe(true);
    });

    it('Package has child relations (photos, signatures, history)', () => {
      const pkg = getModel(models, 'Package');
      expect(hasRelationArray(pkg, 'PackagePhoto')).toBe(true);
      expect(hasRelationArray(pkg, 'PackageSignature')).toBe(true);
      expect(hasRelationArray(pkg, 'PackageHistory')).toBe(true);
    });

    it('Property has packages[] relation', () => {
      const property = getModel(models, 'Property');
      expect(hasRelationArray(property, 'Package')).toBe(true);
    });

    it('Unit has packages[] relation', () => {
      const unit = getModel(models, 'Unit');
      expect(hasRelationArray(unit, 'Package')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 3. MaintenanceRequest belongs to Property, Unit, and Category
  // -----------------------------------------------------------------------
  describe('MaintenanceRequest relationships', () => {
    it('MaintenanceRequest has required propertyId FK', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasRequiredFK(mr, 'propertyId')).toBe(true);
    });

    it('MaintenanceRequest has optional unitId FK (common area requests)', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasOptionalFK(mr, 'unitId')).toBe(true);
    });

    it('MaintenanceRequest has required categoryId FK', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasRequiredFK(mr, 'categoryId')).toBe(true);
    });

    it('MaintenanceRequest has required residentId FK', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasRequiredFK(mr, 'residentId')).toBe(true);
    });

    it('MaintenanceRequest has @relation to Property', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(mr.body).toContain('property      Property');
    });

    it('MaintenanceRequest has @relation to Unit (optional)', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(mr.body).toMatch(/unit\s+Unit\?/);
    });

    it('MaintenanceRequest has @relation to MaintenanceCategory', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(mr.body).toContain('category      MaintenanceCategory');
      expect(mr.body).toContain('fields: [categoryId]');
    });

    it('MaintenanceRequest has optional vendor assignment', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasOptionalFK(mr, 'assignedVendorId')).toBe(true);
      expect(mr.body).toMatch(/vendor\s+Vendor\?/);
    });

    it('MaintenanceRequest has optional equipment linkage', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasOptionalFK(mr, 'equipmentId')).toBe(true);
      expect(mr.body).toMatch(/equipment\s+Equipment\?/);
    });

    it('MaintenanceRequest has child relations (comments, status changes, attachments)', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(hasRelationArray(mr, 'MaintenanceComment')).toBe(true);
      expect(hasRelationArray(mr, 'MaintenanceStatusChange')).toBe(true);
      expect(hasRelationArray(mr, 'Attachment')).toBe(true);
    });

    it('Property has maintenanceRequests[] relation', () => {
      const property = getModel(models, 'Property');
      expect(hasRelationArray(property, 'MaintenanceRequest')).toBe(true);
    });

    it('Unit has maintenanceRequests[] relation', () => {
      const unit = getModel(models, 'Unit');
      expect(hasRelationArray(unit, 'MaintenanceRequest')).toBe(true);
    });

    it('MaintenanceCategory has maintenanceRequests[] back-relation', () => {
      const cat = getModel(models, 'MaintenanceCategory');
      expect(hasRelationArray(cat, 'MaintenanceRequest')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Booking belongs to Amenity and Unit
  // -----------------------------------------------------------------------
  describe('Booking relationships', () => {
    it('Booking has required propertyId FK', () => {
      const booking = getModel(models, 'Booking');
      expect(hasRequiredFK(booking, 'propertyId')).toBe(true);
    });

    it('Booking has required amenityId FK', () => {
      const booking = getModel(models, 'Booking');
      expect(hasRequiredFK(booking, 'amenityId')).toBe(true);
    });

    it('Booking has required unitId FK', () => {
      const booking = getModel(models, 'Booking');
      expect(hasRequiredFK(booking, 'unitId')).toBe(true);
    });

    it('Booking has required residentId FK', () => {
      const booking = getModel(models, 'Booking');
      expect(hasRequiredFK(booking, 'residentId')).toBe(true);
    });

    it('Booking has @relation to Property', () => {
      const booking = getModel(models, 'Booking');
      expect(booking.body).toContain('property      Property');
    });

    it('Booking has @relation to Amenity', () => {
      const booking = getModel(models, 'Booking');
      expect(booking.body).toContain('amenity       Amenity');
      expect(booking.body).toContain('fields: [amenityId]');
    });

    it('Booking has @relation to Unit', () => {
      const booking = getModel(models, 'Booking');
      expect(booking.body).toContain('unit          Unit');
      expect(booking.body).toContain('fields: [unitId]');
    });

    it('Booking has optional amenityOptionId FK', () => {
      const booking = getModel(models, 'Booking');
      expect(hasOptionalFK(booking, 'amenityOptionId')).toBe(true);
    });

    it('Booking has audit trail relation', () => {
      const booking = getModel(models, 'Booking');
      expect(hasRelationArray(booking, 'BookingAuditEntry')).toBe(true);
    });

    it('Amenity has bookings[] relation', () => {
      const amenity = getModel(models, 'Amenity');
      expect(hasRelationArray(amenity, 'Booking')).toBe(true);
    });

    it('Unit has bookings[] relation', () => {
      const unit = getModel(models, 'Unit');
      expect(hasRelationArray(unit, 'Booking')).toBe(true);
    });

    it('Amenity belongs to AmenityGroup', () => {
      const amenity = getModel(models, 'Amenity');
      expect(hasRequiredFK(amenity, 'groupId')).toBe(true);
      expect(amenity.body).toContain('group           AmenityGroup');
    });

    it('Amenity belongs to Property', () => {
      const amenity = getModel(models, 'Amenity');
      expect(hasRequiredFK(amenity, 'propertyId')).toBe(true);
      expect(amenity.body).toContain('property        Property');
    });
  });

  // -----------------------------------------------------------------------
  // 5. User belongs to multiple Properties via UserProperty
  // -----------------------------------------------------------------------
  describe('User-Property many-to-many via UserProperty', () => {
    it('UserProperty has required userId FK', () => {
      const up = getModel(models, 'UserProperty');
      expect(hasRequiredFK(up, 'userId')).toBe(true);
    });

    it('UserProperty has required propertyId FK', () => {
      const up = getModel(models, 'UserProperty');
      expect(hasRequiredFK(up, 'propertyId')).toBe(true);
    });

    it('UserProperty has required roleId FK', () => {
      const up = getModel(models, 'UserProperty');
      expect(hasRequiredFK(up, 'roleId')).toBe(true);
    });

    it('UserProperty has @@unique([userId, propertyId]) constraint', () => {
      const up = getModel(models, 'UserProperty');
      expect(up.body).toContain('@@unique([userId, propertyId])');
    });

    it('UserProperty has @relation to User', () => {
      const up = getModel(models, 'UserProperty');
      expect(up.body).toContain('user     User');
      expect(up.body).toContain('fields: [userId]');
    });

    it('UserProperty has @relation to Property', () => {
      const up = getModel(models, 'UserProperty');
      expect(up.body).toContain('property Property');
      expect(up.body).toContain('fields: [propertyId]');
    });

    it('UserProperty has @relation to Role', () => {
      const up = getModel(models, 'UserProperty');
      expect(up.body).toContain('role     Role');
      expect(up.body).toContain('fields: [roleId]');
    });

    it('User has userProperties[] relation (multi-property support)', () => {
      const user = getModel(models, 'User');
      expect(hasRelationArray(user, 'UserProperty')).toBe(true);
    });

    it('Property has userProperties[] relation', () => {
      const property = getModel(models, 'Property');
      expect(hasRelationArray(property, 'UserProperty')).toBe(true);
    });

    it('Role has userProperties[] back-relation', () => {
      const role = getModel(models, 'Role');
      expect(hasRelationArray(role, 'UserProperty')).toBe(true);
    });

    it('Role is scoped to Property (has propertyId FK)', () => {
      const role = getModel(models, 'Role');
      expect(hasRequiredFK(role, 'propertyId')).toBe(true);
    });

    it('Role has @@unique([propertyId, slug]) for per-property uniqueness', () => {
      const role = getModel(models, 'Role');
      expect(role.body).toContain('@@unique([propertyId, slug])');
    });
  });

  // -----------------------------------------------------------------------
  // 6. All cascade deletes are intentional
  // -----------------------------------------------------------------------
  describe('Cascade delete audit', () => {
    it('only a small number of relations use onDelete: Cascade', () => {
      const cascadeCount = (schemaContent.match(/onDelete:\s*Cascade/g) || []).length;
      // There should be very few cascade deletes
      expect(cascadeCount).toBeLessThan(15);
    });

    it('cascade deletes are only on expendable child records', () => {
      const ALLOWED_CASCADE_TARGETS = new Set([
        // Photo albums -> photos (album deletion removes photos)
        'AlbumPhoto',
        // Inspections -> items (inspection deletion removes items)
        'InspectionItem',
        // Board meetings -> agenda items, votes, minutes
        'AgendaItem',
        'BoardVote',
        'MeetingMinutes',
        // Purchase orders -> items, attachments
        'PurchaseOrderItem',
        'PurchaseOrderAttachment',
      ]);

      const modelsWithCascade: string[] = [];
      const models = parseModels();

      for (const model of models) {
        if (model.body.includes('onDelete: Cascade')) {
          modelsWithCascade.push(model.name);
        }
      }

      for (const modelName of modelsWithCascade) {
        expect(
          ALLOWED_CASCADE_TARGETS.has(modelName),
          `Model "${modelName}" uses onDelete: Cascade but is not in the allowed list`,
        ).toBe(true);
      }
    });

    it('no cascade delete on User model relations', () => {
      const user = getModel(models, 'User');
      expect(user.body).not.toContain('onDelete: Cascade');
    });

    it('no cascade delete on Property model relations', () => {
      const property = getModel(models, 'Property');
      expect(property.body).not.toContain('onDelete: Cascade');
    });

    it('no cascade delete on Unit model relations', () => {
      const unit = getModel(models, 'Unit');
      expect(unit.body).not.toContain('onDelete: Cascade');
    });

    it('no cascade delete on Package model relations', () => {
      const pkg = getModel(models, 'Package');
      expect(pkg.body).not.toContain('onDelete: Cascade');
    });

    it('no cascade delete on MaintenanceRequest model relations', () => {
      const mr = getModel(models, 'MaintenanceRequest');
      expect(mr.body).not.toContain('onDelete: Cascade');
    });

    it('no cascade delete on Booking model relations', () => {
      const booking = getModel(models, 'Booking');
      expect(booking.body).not.toContain('onDelete: Cascade');
    });

    it('no cascade delete on Announcement model relations', () => {
      const ann = getModel(models, 'Announcement');
      expect(ann.body).not.toContain('onDelete: Cascade');
    });
  });

  // -----------------------------------------------------------------------
  // 7. Additional relationship integrity checks
  // -----------------------------------------------------------------------
  describe('Additional relationship integrity', () => {
    it('VisitorEntry belongs to Property and Unit', () => {
      const visitor = getModel(models, 'VisitorEntry');
      expect(hasRequiredFK(visitor, 'propertyId')).toBe(true);
      expect(hasRequiredFK(visitor, 'unitId')).toBe(true);
      expect(visitor.body).toContain('property             Property');
      expect(visitor.body).toContain('unit                 Unit');
    });

    it('SecurityShift belongs to Property', () => {
      const shift = getModel(models, 'SecurityShift');
      expect(hasRequiredFK(shift, 'propertyId')).toBe(true);
    });

    it('ShiftLogEntry belongs to SecurityShift', () => {
      const entry = getModel(models, 'ShiftLogEntry');
      expect(hasRequiredFK(entry, 'shiftId')).toBe(true);
    });

    it('IncidentReport belongs to Property', () => {
      const incident = getModel(models, 'IncidentReport');
      expect(hasRequiredFK(incident, 'propertyId')).toBe(true);
    });

    it('ParkingViolation belongs to Property', () => {
      const violation = getModel(models, 'ParkingViolation');
      expect(hasRequiredFK(violation, 'propertyId')).toBe(true);
    });

    it('Course belongs to Property (Training/LMS)', () => {
      const course = getModel(models, 'Course');
      expect(hasRequiredFK(course, 'propertyId')).toBe(true);
    });

    it('ClassifiedAd belongs to Property (Community)', () => {
      const ad = getModel(models, 'ClassifiedAd');
      expect(hasRequiredFK(ad, 'propertyId')).toBe(true);
    });

    it('Property self-references for multi-property hierarchy', () => {
      const property = getModel(models, 'Property');
      expect(hasOptionalFK(property, 'parentPropertyId')).toBe(true);
      expect(property.body).toContain('@relation("PropertyParent"');
    });

    it('Unit belongs to Property (required) and Building (optional)', () => {
      const unit = getModel(models, 'Unit');
      expect(hasRequiredFK(unit, 'propertyId')).toBe(true);
      expect(hasOptionalFK(unit, 'buildingId')).toBe(true);
    });

    it('Unit has @@unique([propertyId, number]) for per-property uniqueness', () => {
      const unit = getModel(models, 'Unit');
      expect(unit.body).toContain('@@unique([propertyId, number])');
    });

    it('Announcement belongs to Property', () => {
      const ann = getModel(models, 'Announcement');
      expect(hasRequiredFK(ann, 'propertyId')).toBe(true);
    });

    it('all tenant-scoped models reference Property', () => {
      const TENANT_SCOPED_MODELS = [
        'Event',
        'EventGroup',
        'EventType',
        'Unit',
        'Package',
        'MaintenanceRequest',
        'MaintenanceCategory',
        'Booking',
        'Amenity',
        // AmenityGroup has optional propertyId (null = system default), excluded intentionally
        'Announcement',
        'VisitorEntry',
        'IncidentReport',
        'SecurityShift',
        'ParkingArea',
        'ParkingPermit',
        'ParkingViolation',
        'Course',
        'ClassifiedAd',
        'CommunityEvent',
        'Survey',
      ];

      const missing: string[] = [];

      for (const modelName of TENANT_SCOPED_MODELS) {
        const model = getModel(models, modelName);
        if (!hasRequiredFK(model, 'propertyId')) {
          missing.push(modelName);
        }
      }

      expect(
        missing,
        `Tenant-scoped models missing required propertyId FK: ${missing.join(', ')}`,
      ).toEqual([]);
    });
  });
});
