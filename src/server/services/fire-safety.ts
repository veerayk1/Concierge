/**
 * Fire Safety Event Template Service
 *
 * Provides the JSON Schema template and validation for fire safety events
 * that leverage the unified event model's customFields (JSONB) system.
 *
 * Fire safety events track alarm response timelines, checklists for
 * fire department arrival preparation, elevator response, and device resets.
 */

// ---------------------------------------------------------------------------
// Checklist definitions
// ---------------------------------------------------------------------------

export const PREPARE_FD_ARRIVAL_CHECKLIST = [
  'Announce fire alarm',
  'Call fire department',
  'Check fire panel',
  'Direct residents to exits',
  'Meet fire dept at entrance',
  'Provide building keys',
] as const;

export const ELEVATOR_RESPONSE_CHECKLIST = [
  'Recall elevators to lobby',
  'Hold elevators on ground',
  'Verify no one trapped',
  'Post out of service signs',
] as const;

export const RESET_DEVICES_TYPES = [
  'Pull Station',
  'Smoke Detector',
  'Heat Detector',
  'Sprinkler Head',
  'Fire Panel',
  'Mag Locks',
  'Elevators',
] as const;

// ---------------------------------------------------------------------------
// TypeScript types for the custom fields
// ---------------------------------------------------------------------------

export interface FireSafetyChecklistItem {
  label: string;
  checked: boolean;
}

export interface ResetDeviceItem {
  device: string;
  checked: boolean;
}

export interface FireSafetyCustomFields {
  alarmTime: string;
  alarmLocation: string;
  alarmZone: string;
  fireDeptCallTime?: string;
  firstAnnouncementTime?: string;
  secondAnnouncementTime?: string;
  thirdAnnouncementTime?: string;
  fireDeptArrivalTime?: string;
  allClearTime?: string;
  fireDeptDepartureTime?: string;
  prepareFdArrival: FireSafetyChecklistItem[];
  elevatorResponse: FireSafetyChecklistItem[];
  resetDevices: ResetDeviceItem[];
}

// ---------------------------------------------------------------------------
// JSON Schema for EventType.customFieldsSchema
// ---------------------------------------------------------------------------

export function getFireSafetyTemplate(): Record<string, unknown> {
  return {
    type: 'object',
    required: [
      'alarmTime',
      'alarmLocation',
      'alarmZone',
      'prepareFdArrival',
      'elevatorResponse',
      'resetDevices',
    ],
    properties: {
      alarmTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time the fire alarm was triggered',
      },
      alarmLocation: {
        type: 'string',
        minLength: 1,
        description: 'Location where the alarm was triggered (e.g., "Floor 12 East Wing")',
      },
      alarmZone: {
        type: 'string',
        minLength: 1,
        description: 'Fire panel zone identifier (e.g., "Zone 3A")',
      },
      fireDeptCallTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time fire department was called',
      },
      firstAnnouncementTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time of first building announcement',
      },
      secondAnnouncementTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time of second building announcement',
      },
      thirdAnnouncementTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time of third building announcement',
      },
      fireDeptArrivalTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time fire department arrived on scene',
      },
      allClearTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time all-clear was issued',
      },
      fireDeptDepartureTime: {
        type: 'string',
        format: 'date-time',
        description: 'Time fire department left the premises',
      },
      prepareFdArrival: {
        type: 'array',
        items: {
          type: 'object',
          required: ['label', 'checked'],
          properties: {
            label: { type: 'string' },
            checked: { type: 'boolean' },
          },
        },
        description: 'Checklist for preparing for fire department arrival',
      },
      elevatorResponse: {
        type: 'array',
        items: {
          type: 'object',
          required: ['label', 'checked'],
          properties: {
            label: { type: 'string' },
            checked: { type: 'boolean' },
          },
        },
        description: 'Elevator response checklist',
      },
      resetDevices: {
        type: 'array',
        items: {
          type: 'object',
          required: ['device', 'checked'],
          properties: {
            device: { type: 'string' },
            checked: { type: 'boolean' },
          },
        },
        description: 'Devices to reset after the incident',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Factory: create default custom fields with unchecked checklists
// ---------------------------------------------------------------------------

export function createDefaultFireSafetyFields(
  alarmTime: string,
  alarmLocation: string,
  alarmZone: string,
): FireSafetyCustomFields {
  return {
    alarmTime,
    alarmLocation,
    alarmZone,
    prepareFdArrival: PREPARE_FD_ARRIVAL_CHECKLIST.map((label) => ({ label, checked: false })),
    elevatorResponse: ELEVATOR_RESPONSE_CHECKLIST.map((label) => ({ label, checked: false })),
    resetDevices: RESET_DEVICES_TYPES.map((device) => ({ device, checked: false })),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFireSafetyFields(customFields: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof customFields !== 'object' || customFields === null || Array.isArray(customFields)) {
    return { valid: false, errors: ['customFields must be a non-null object'] };
  }

  const fields = customFields as Record<string, unknown>;

  // Required string fields
  const requiredStrings = ['alarmTime', 'alarmLocation', 'alarmZone'] as const;
  for (const key of requiredStrings) {
    if (typeof fields[key] !== 'string' || (fields[key] as string).length === 0) {
      errors.push(`${key} is required and must be a non-empty string`);
    }
  }

  // Validate alarmTime is a valid ISO date-time
  if (typeof fields['alarmTime'] === 'string' && isNaN(Date.parse(fields['alarmTime']))) {
    errors.push('alarmTime must be a valid ISO 8601 date-time string');
  }

  // Optional time fields — if present, must be valid ISO date-times
  const optionalTimeFields = [
    'fireDeptCallTime',
    'firstAnnouncementTime',
    'secondAnnouncementTime',
    'thirdAnnouncementTime',
    'fireDeptArrivalTime',
    'allClearTime',
    'fireDeptDepartureTime',
  ] as const;
  for (const key of optionalTimeFields) {
    if (fields[key] !== undefined && fields[key] !== null) {
      if (typeof fields[key] !== 'string' || isNaN(Date.parse(fields[key] as string))) {
        errors.push(`${key} must be a valid ISO 8601 date-time string`);
      }
    }
  }

  // Validate checklists
  if (!Array.isArray(fields['prepareFdArrival'])) {
    errors.push('prepareFdArrival must be an array');
  } else {
    for (let i = 0; i < (fields['prepareFdArrival'] as unknown[]).length; i++) {
      const item = (fields['prepareFdArrival'] as Record<string, unknown>[])[i];
      if (!item || typeof item['label'] !== 'string' || typeof item['checked'] !== 'boolean') {
        errors.push(`prepareFdArrival[${i}] must have a string "label" and boolean "checked"`);
      }
    }
  }

  if (!Array.isArray(fields['elevatorResponse'])) {
    errors.push('elevatorResponse must be an array');
  } else {
    for (let i = 0; i < (fields['elevatorResponse'] as unknown[]).length; i++) {
      const item = (fields['elevatorResponse'] as Record<string, unknown>[])[i];
      if (!item || typeof item['label'] !== 'string' || typeof item['checked'] !== 'boolean') {
        errors.push(`elevatorResponse[${i}] must have a string "label" and boolean "checked"`);
      }
    }
  }

  if (!Array.isArray(fields['resetDevices'])) {
    errors.push('resetDevices must be an array');
  } else {
    for (let i = 0; i < (fields['resetDevices'] as unknown[]).length; i++) {
      const item = (fields['resetDevices'] as Record<string, unknown>[])[i];
      if (!item || typeof item['device'] !== 'string' || typeof item['checked'] !== 'boolean') {
        errors.push(`resetDevices[${i}] must have a string "device" and boolean "checked"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Helpers: checklist completion detection
// ---------------------------------------------------------------------------

export function areAllChecklistsComplete(fields: FireSafetyCustomFields): boolean {
  const allPrepare = fields.prepareFdArrival.every((item) => item.checked);
  const allElevator = fields.elevatorResponse.every((item) => item.checked);
  const allReset = fields.resetDevices.every((item) => item.checked);
  return allPrepare && allElevator && allReset;
}

export function getChecklistProgress(fields: FireSafetyCustomFields): {
  prepareFdArrival: { completed: number; total: number };
  elevatorResponse: { completed: number; total: number };
  resetDevices: { completed: number; total: number };
} {
  return {
    prepareFdArrival: {
      completed: fields.prepareFdArrival.filter((i) => i.checked).length,
      total: fields.prepareFdArrival.length,
    },
    elevatorResponse: {
      completed: fields.elevatorResponse.filter((i) => i.checked).length,
      total: fields.elevatorResponse.length,
    },
    resetDevices: {
      completed: fields.resetDevices.filter((i) => i.checked).length,
      total: fields.resetDevices.length,
    },
  };
}
