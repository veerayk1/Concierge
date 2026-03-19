/**
 * Event Type Templates Service
 *
 * Provides default event type templates for new properties, covering
 * security, package, and building event categories. These templates
 * leverage the unified event model with configurable custom fields
 * (JSONB) so properties can be seeded with sensible defaults.
 *
 * Addresses GAP-ANALYSIS item 3.3 (Authorized Entry), 3.4 (Security Patrol),
 * and consolidates all default event types into a single seedable service.
 */

import { getFireSafetyTemplate } from './fire-safety';
import { getNoiseComplaintTemplate } from './noise-complaint';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventTypeCategory = 'security' | 'package' | 'building';

export type EventTypePriority = 'low' | 'medium' | 'high' | 'critical';

export interface EventTypeTemplate {
  name: string;
  slug: string;
  category: EventTypeCategory;
  icon: string;
  color: string;
  defaultPriority: EventTypePriority;
  description: string;
  customFieldsSchema: Record<string, unknown> | null;
}

export interface SeedResult {
  created: number;
  skipped: number;
  templates: string[];
}

// ---------------------------------------------------------------------------
// Security Event Type Templates
// ---------------------------------------------------------------------------

const SECURITY_TEMPLATES: EventTypeTemplate[] = [
  {
    name: 'General Security',
    slug: 'general-security',
    category: 'security',
    icon: 'shield',
    color: '#3B82F6', // Blue
    defaultPriority: 'medium',
    description: 'General security events and observations',
    customFieldsSchema: null,
  },
  {
    name: 'Fire Safety',
    slug: 'fire-safety',
    category: 'security',
    icon: 'flame',
    color: '#EF4444', // Red
    defaultPriority: 'critical',
    description:
      'Fire alarm events with timeline tracking, FD arrival prep, elevator response, and device reset checklists',
    customFieldsSchema: getFireSafetyTemplate(),
  },
  {
    name: 'Noise Complaint',
    slug: 'noise-complaint',
    category: 'security',
    icon: 'volume-x',
    color: '#F59E0B', // Amber
    defaultPriority: 'medium',
    description:
      'Noise complaint events with complaint categorization, investigation details, and counseling tracking',
    customFieldsSchema: getNoiseComplaintTemplate(),
  },
  {
    name: 'Authorized Entry',
    slug: 'authorized-entry',
    category: 'security',
    icon: 'key-round',
    color: '#8B5CF6', // Purple
    defaultPriority: 'medium',
    description:
      'Logs when staff enter a unit with permission. Critical for audit trails and liability tracking.',
    customFieldsSchema: {
      type: 'object',
      required: ['unitNumber', 'authorizedBy', 'entryReason', 'entryTime'],
      properties: {
        unitNumber: {
          type: 'string',
          minLength: 1,
          description: 'Unit number being entered',
        },
        authorizedBy: {
          type: 'string',
          minLength: 1,
          description:
            'Name of the person who authorized the entry (resident, manager, or emergency)',
        },
        authorizationType: {
          type: 'string',
          enum: [
            'resident_present',
            'written_consent',
            'management_order',
            'emergency',
            'standing_permission',
          ],
          description: 'How the entry was authorized',
        },
        entryReason: {
          type: 'string',
          minLength: 1,
          description: 'Reason for entering the unit',
        },
        entryTime: {
          type: 'string',
          format: 'date-time',
          description: 'Time of entry',
        },
        exitTime: {
          type: 'string',
          format: 'date-time',
          description: 'Time of exit (filled when staff leaves)',
        },
        staffMembers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Names of all staff members who entered',
        },
        workPerformed: {
          type: 'string',
          description: 'Description of work or inspection performed inside the unit',
        },
        residentNotified: {
          type: 'boolean',
          description: 'Whether the resident was notified about the entry',
        },
      },
    },
  },
  {
    name: 'Security Patrol',
    slug: 'security-patrol',
    category: 'security',
    icon: 'footprints',
    color: '#06B6D4', // Cyan
    defaultPriority: 'low',
    description: 'Patrol round tracking for security guards doing building walkthroughs',
    customFieldsSchema: {
      type: 'object',
      required: ['patrolRoute', 'startTime'],
      properties: {
        patrolRoute: {
          type: 'string',
          minLength: 1,
          description: 'Name or identifier of the patrol route taken',
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'Time the patrol started',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'Time the patrol ended',
        },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              checkedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['ok', 'issue_found', 'skipped'] },
              notes: { type: 'string' },
            },
            required: ['location', 'checkedAt', 'status'],
          },
          description: 'Checkpoint records from the patrol round',
        },
        issuesFound: {
          type: 'number',
          minimum: 0,
          description: 'Number of issues found during the patrol',
        },
        weatherConditions: {
          type: 'string',
          description: 'Weather conditions if patrol included exterior areas',
        },
      },
    },
  },
  {
    name: 'Parking Violation',
    slug: 'parking-violation',
    category: 'security',
    icon: 'car',
    color: '#DC2626', // Red-600
    defaultPriority: 'medium',
    description: 'Parking violation incidents with vehicle identification and enforcement tracking',
    customFieldsSchema: null,
  },
];

// ---------------------------------------------------------------------------
// Package Event Type Templates
// ---------------------------------------------------------------------------

const PACKAGE_TEMPLATES: EventTypeTemplate[] = [
  {
    name: 'Package Received',
    slug: 'package-received',
    category: 'package',
    icon: 'package',
    color: '#10B981', // Green
    defaultPriority: 'low',
    description: 'Incoming package logged at the front desk',
    customFieldsSchema: null,
  },
  {
    name: 'Package Released',
    slug: 'package-released',
    category: 'package',
    icon: 'package-check',
    color: '#6B7280', // Gray
    defaultPriority: 'low',
    description: 'Package picked up by or delivered to resident',
    customFieldsSchema: null,
  },
  {
    name: 'Perishable Alert',
    slug: 'perishable-alert',
    category: 'package',
    icon: 'thermometer-snowflake',
    color: '#F97316', // Orange
    defaultPriority: 'high',
    description: 'Perishable package requiring urgent pickup notification and escalation',
    customFieldsSchema: null,
  },
];

// ---------------------------------------------------------------------------
// Building Event Type Templates
// ---------------------------------------------------------------------------

const BUILDING_TEMPLATES: EventTypeTemplate[] = [
  {
    name: 'Cleaning Log',
    slug: 'cleaning-log',
    category: 'building',
    icon: 'sparkles',
    color: '#14B8A6', // Teal
    defaultPriority: 'low',
    description: 'Cleaning activity records for common areas and facilities',
    customFieldsSchema: null,
  },
  {
    name: 'Maintenance Alert',
    slug: 'maintenance-alert',
    category: 'building',
    icon: 'wrench',
    color: '#EAB308', // Yellow
    defaultPriority: 'medium',
    description: 'Building maintenance alerts and system notifications',
    customFieldsSchema: null,
  },
  {
    name: 'Building System Alert',
    slug: 'building-system-alert',
    category: 'building',
    icon: 'alert-triangle',
    color: '#EF4444', // Red
    defaultPriority: 'high',
    description:
      'Critical building system alerts (HVAC, plumbing, electrical, elevator malfunction)',
    customFieldsSchema: null,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all default event type templates grouped by category.
 */
export function getDefaultEventTypes(): EventTypeTemplate[] {
  return [...SECURITY_TEMPLATES, ...PACKAGE_TEMPLATES, ...BUILDING_TEMPLATES];
}

/**
 * Returns templates filtered by category.
 */
export function getEventTypesByCategory(category: EventTypeCategory): EventTypeTemplate[] {
  return getDefaultEventTypes().filter((t) => t.category === category);
}

/**
 * Returns a single template by slug, or undefined if not found.
 */
export function getEventTypeBySlug(slug: string): EventTypeTemplate | undefined {
  return getDefaultEventTypes().find((t) => t.slug === slug);
}

/**
 * Seeds all default event types for a property.
 *
 * This is designed to be idempotent — it checks for existing event types
 * by slug and skips any that already exist for the property.
 *
 * @param propertyId - The property to seed event types for
 * @param existingSlugs - Slugs of event types that already exist for this property
 * @returns SeedResult with counts of created and skipped templates
 */
export function seedEventTypesForProperty(
  propertyId: string,
  existingSlugs: string[] = [],
): SeedResult {
  if (!propertyId || propertyId.trim().length === 0) {
    throw new Error('propertyId is required');
  }

  const templates = getDefaultEventTypes();
  const existingSet = new Set(existingSlugs);
  const created: string[] = [];
  let skipped = 0;

  for (const template of templates) {
    if (existingSet.has(template.slug)) {
      skipped++;
      continue;
    }
    // In a real implementation, this would call the database layer.
    // For now, we track what would be created.
    created.push(template.slug);
  }

  return {
    created: created.length,
    skipped,
    templates: created,
  };
}

/**
 * Returns all unique categories used by the templates.
 */
export function getEventTypeCategories(): EventTypeCategory[] {
  const categories = new Set(getDefaultEventTypes().map((t) => t.category));
  return [...categories];
}
