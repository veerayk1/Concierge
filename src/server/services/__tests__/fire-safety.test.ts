/**
 * Fire Safety Event Template Tests
 *
 * Validates the fire safety template schema, field validation,
 * checklist logic, and edge cases for the unified event model integration.
 */

import { describe, expect, it } from 'vitest';
import {
  areAllChecklistsComplete,
  createDefaultFireSafetyFields,
  ELEVATOR_RESPONSE_CHECKLIST,
  getChecklistProgress,
  getFireSafetyTemplate,
  PREPARE_FD_ARRIVAL_CHECKLIST,
  RESET_DEVICES_TYPES,
  validateFireSafetyFields,
  type FireSafetyCustomFields,
} from '../fire-safety';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validFields(): FireSafetyCustomFields {
  return createDefaultFireSafetyFields('2026-03-19T02:30:00Z', 'Floor 12 East Wing', 'Zone 3A');
}

function fullyCompleteFields(): FireSafetyCustomFields {
  const fields = validFields();
  fields.fireDeptCallTime = '2026-03-19T02:31:00Z';
  fields.firstAnnouncementTime = '2026-03-19T02:32:00Z';
  fields.secondAnnouncementTime = '2026-03-19T02:37:00Z';
  fields.thirdAnnouncementTime = '2026-03-19T02:42:00Z';
  fields.fireDeptArrivalTime = '2026-03-19T02:40:00Z';
  fields.allClearTime = '2026-03-19T03:15:00Z';
  fields.fireDeptDepartureTime = '2026-03-19T03:30:00Z';
  fields.prepareFdArrival = fields.prepareFdArrival.map((i) => ({ ...i, checked: true }));
  fields.elevatorResponse = fields.elevatorResponse.map((i) => ({ ...i, checked: true }));
  fields.resetDevices = fields.resetDevices.map((d) => ({ ...d, checked: true }));
  return fields;
}

// ---------------------------------------------------------------------------
// Template structure
// ---------------------------------------------------------------------------

describe('Fire Safety — Template Structure', () => {
  it('returns a valid JSON Schema object', () => {
    const template = getFireSafetyTemplate();
    expect(template).toBeDefined();
    expect(template['type']).toBe('object');
    expect(template['required']).toBeDefined();
    expect(template['properties']).toBeDefined();
  });

  it('has all required fields listed', () => {
    const template = getFireSafetyTemplate();
    const required = template['required'] as string[];
    expect(required).toContain('alarmTime');
    expect(required).toContain('alarmLocation');
    expect(required).toContain('alarmZone');
    expect(required).toContain('prepareFdArrival');
    expect(required).toContain('elevatorResponse');
    expect(required).toContain('resetDevices');
  });

  it('defines all 10 time-related properties', () => {
    const props = getFireSafetyTemplate()['properties'] as Record<string, unknown>;
    const timeFields = [
      'alarmTime',
      'fireDeptCallTime',
      'firstAnnouncementTime',
      'secondAnnouncementTime',
      'thirdAnnouncementTime',
      'fireDeptArrivalTime',
      'allClearTime',
      'fireDeptDepartureTime',
    ];
    for (const field of timeFields) {
      expect(props[field]).toBeDefined();
    }
  });

  it('defines alarmLocation and alarmZone as string properties', () => {
    const props = getFireSafetyTemplate()['properties'] as Record<string, Record<string, unknown>>;
    expect(props['alarmLocation']!['type']).toBe('string');
    expect(props['alarmZone']!['type']).toBe('string');
  });

  it('defines three checklist array properties', () => {
    const props = getFireSafetyTemplate()['properties'] as Record<string, Record<string, unknown>>;
    expect(props['prepareFdArrival']!['type']).toBe('array');
    expect(props['elevatorResponse']!['type']).toBe('array');
    expect(props['resetDevices']!['type']).toBe('array');
  });
});

// ---------------------------------------------------------------------------
// Checklist definitions
// ---------------------------------------------------------------------------

describe('Fire Safety — Checklist Definitions', () => {
  it('prepareFdArrival has exactly 6 items', () => {
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toHaveLength(6);
  });

  it('prepareFdArrival contains all expected items', () => {
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toContain('Announce fire alarm');
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toContain('Call fire department');
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toContain('Check fire panel');
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toContain('Direct residents to exits');
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toContain('Meet fire dept at entrance');
    expect(PREPARE_FD_ARRIVAL_CHECKLIST).toContain('Provide building keys');
  });

  it('elevatorResponse has exactly 4 items', () => {
    expect(ELEVATOR_RESPONSE_CHECKLIST).toHaveLength(4);
  });

  it('elevatorResponse contains all expected items', () => {
    expect(ELEVATOR_RESPONSE_CHECKLIST).toContain('Recall elevators to lobby');
    expect(ELEVATOR_RESPONSE_CHECKLIST).toContain('Hold elevators on ground');
    expect(ELEVATOR_RESPONSE_CHECKLIST).toContain('Verify no one trapped');
    expect(ELEVATOR_RESPONSE_CHECKLIST).toContain('Post out of service signs');
  });

  it('resetDevices has exactly 7 device types', () => {
    expect(RESET_DEVICES_TYPES).toHaveLength(7);
  });

  it('resetDevices contains all expected device types', () => {
    expect(RESET_DEVICES_TYPES).toContain('Pull Station');
    expect(RESET_DEVICES_TYPES).toContain('Smoke Detector');
    expect(RESET_DEVICES_TYPES).toContain('Heat Detector');
    expect(RESET_DEVICES_TYPES).toContain('Sprinkler Head');
    expect(RESET_DEVICES_TYPES).toContain('Fire Panel');
    expect(RESET_DEVICES_TYPES).toContain('Mag Locks');
    expect(RESET_DEVICES_TYPES).toContain('Elevators');
  });
});

// ---------------------------------------------------------------------------
// Default fields factory
// ---------------------------------------------------------------------------

describe('Fire Safety — Default Fields Factory', () => {
  it('creates fields with all checklists unchecked', () => {
    const fields = validFields();
    expect(fields.prepareFdArrival.every((i) => !i.checked)).toBe(true);
    expect(fields.elevatorResponse.every((i) => !i.checked)).toBe(true);
    expect(fields.resetDevices.every((d) => !d.checked)).toBe(true);
  });

  it('populates prepareFdArrival labels from the constant', () => {
    const fields = validFields();
    const labels = fields.prepareFdArrival.map((i) => i.label);
    expect(labels).toEqual([...PREPARE_FD_ARRIVAL_CHECKLIST]);
  });

  it('populates elevatorResponse labels from the constant', () => {
    const fields = validFields();
    const labels = fields.elevatorResponse.map((i) => i.label);
    expect(labels).toEqual([...ELEVATOR_RESPONSE_CHECKLIST]);
  });

  it('populates resetDevices device names from the constant', () => {
    const fields = validFields();
    const devices = fields.resetDevices.map((d) => d.device);
    expect(devices).toEqual([...RESET_DEVICES_TYPES]);
  });
});

// ---------------------------------------------------------------------------
// Validation — valid data
// ---------------------------------------------------------------------------

describe('Fire Safety — Validation Accepts Valid Data', () => {
  it('accepts minimal valid fire safety fields', () => {
    const result = validateFireSafetyFields(validFields());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts fully populated fire safety fields', () => {
    const result = validateFireSafetyFields(fullyCompleteFields());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts fields with some optional times present', () => {
    const fields = validFields();
    fields.fireDeptCallTime = '2026-03-19T02:31:00Z';
    fields.allClearTime = '2026-03-19T03:00:00Z';
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation — invalid data
// ---------------------------------------------------------------------------

describe('Fire Safety — Validation Rejects Invalid Data', () => {
  it('rejects null', () => {
    const result = validateFireSafetyFields(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('customFields must be a non-null object');
  });

  it('rejects an array', () => {
    const result = validateFireSafetyFields([]);
    expect(result.valid).toBe(false);
  });

  it('rejects a non-object primitive', () => {
    const result = validateFireSafetyFields('string');
    expect(result.valid).toBe(false);
  });

  it('rejects missing alarmTime', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    delete fields['alarmTime'];
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('alarmTime'))).toBe(true);
  });

  it('rejects empty alarmLocation', () => {
    const fields = validFields();
    fields.alarmLocation = '';
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('alarmLocation'))).toBe(true);
  });

  it('rejects empty alarmZone', () => {
    const fields = validFields();
    fields.alarmZone = '';
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('alarmZone'))).toBe(true);
  });

  it('rejects invalid alarmTime format', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['alarmTime'] = 'not-a-date';
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('alarmTime') && e.includes('ISO 8601'))).toBe(true);
  });

  it('rejects invalid optional time field', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['fireDeptCallTime'] = 'invalid';
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('fireDeptCallTime'))).toBe(true);
  });

  it('rejects missing prepareFdArrival', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    delete fields['prepareFdArrival'];
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('prepareFdArrival'))).toBe(true);
  });

  it('rejects prepareFdArrival item without label', () => {
    const fields = validFields();
    (fields.prepareFdArrival as unknown as Record<string, unknown>[])[0] = {
      checked: true,
    } as never;
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
  });

  it('rejects resetDevices item without device field', () => {
    const fields = validFields();
    (fields.resetDevices as unknown as Record<string, unknown>[])[0] = { checked: false } as never;
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
  });

  it('rejects elevatorResponse as non-array', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['elevatorResponse'] = 'not-array';
    const result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('elevatorResponse'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Checklist completion detection
// ---------------------------------------------------------------------------

describe('Fire Safety — Checklist Completion', () => {
  it('reports all incomplete when nothing is checked', () => {
    const fields = validFields();
    expect(areAllChecklistsComplete(fields)).toBe(false);
  });

  it('reports all complete when every item is checked', () => {
    const fields = fullyCompleteFields();
    expect(areAllChecklistsComplete(fields)).toBe(true);
  });

  it('reports incomplete when only prepareFdArrival is complete', () => {
    const fields = validFields();
    fields.prepareFdArrival = fields.prepareFdArrival.map((i) => ({ ...i, checked: true }));
    expect(areAllChecklistsComplete(fields)).toBe(false);
  });

  it('reports incomplete when one resetDevices item is unchecked', () => {
    const fields = fullyCompleteFields();
    fields.resetDevices[0]!.checked = false;
    expect(areAllChecklistsComplete(fields)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Checklist progress
// ---------------------------------------------------------------------------

describe('Fire Safety — Checklist Progress', () => {
  it('returns 0 completed for fresh fields', () => {
    const progress = getChecklistProgress(validFields());
    expect(progress.prepareFdArrival.completed).toBe(0);
    expect(progress.prepareFdArrival.total).toBe(6);
    expect(progress.elevatorResponse.completed).toBe(0);
    expect(progress.elevatorResponse.total).toBe(4);
    expect(progress.resetDevices.completed).toBe(0);
    expect(progress.resetDevices.total).toBe(7);
  });

  it('tracks partial completion correctly', () => {
    const fields = validFields();
    fields.prepareFdArrival[0]!.checked = true;
    fields.prepareFdArrival[1]!.checked = true;
    fields.elevatorResponse[0]!.checked = true;
    const progress = getChecklistProgress(fields);
    expect(progress.prepareFdArrival.completed).toBe(2);
    expect(progress.elevatorResponse.completed).toBe(1);
    expect(progress.resetDevices.completed).toBe(0);
  });

  it('returns full completion for fully checked fields', () => {
    const progress = getChecklistProgress(fullyCompleteFields());
    expect(progress.prepareFdArrival.completed).toBe(progress.prepareFdArrival.total);
    expect(progress.elevatorResponse.completed).toBe(progress.elevatorResponse.total);
    expect(progress.resetDevices.completed).toBe(progress.resetDevices.total);
  });
});

// ---------------------------------------------------------------------------
// Full lifecycle
// ---------------------------------------------------------------------------

describe('Fire Safety — Full Event Lifecycle', () => {
  it('create → validate → complete checklists → verify', () => {
    // Step 1: Create event with default fields
    const fields = createDefaultFireSafetyFields(
      '2026-03-19T02:30:00Z',
      'Lobby Smoke Detector',
      'Zone 1B',
    );

    // Step 2: Validate initial fields
    let result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(true);

    // Step 3: Concierge starts checking off items
    fields.fireDeptCallTime = '2026-03-19T02:31:00Z';
    fields.prepareFdArrival[0]!.checked = true; // Announce fire alarm
    fields.prepareFdArrival[1]!.checked = true; // Call fire department
    expect(areAllChecklistsComplete(fields)).toBe(false);

    // Step 4: Complete all checklists
    fields.prepareFdArrival.forEach((i) => {
      i.checked = true;
    });
    fields.elevatorResponse.forEach((i) => {
      i.checked = true;
    });
    fields.resetDevices.forEach((d) => {
      d.checked = true;
    });
    fields.firstAnnouncementTime = '2026-03-19T02:32:00Z';
    fields.fireDeptArrivalTime = '2026-03-19T02:40:00Z';
    fields.allClearTime = '2026-03-19T03:15:00Z';
    fields.fireDeptDepartureTime = '2026-03-19T03:30:00Z';

    // Step 5: Re-validate and confirm completion
    result = validateFireSafetyFields(fields);
    expect(result.valid).toBe(true);
    expect(areAllChecklistsComplete(fields)).toBe(true);
  });
});
