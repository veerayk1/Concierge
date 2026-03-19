/**
 * Noise Complaint Event Template Service
 *
 * Provides the JSON Schema template and validation for noise complaint events
 * that leverage the unified event model's customFields (JSONB) system.
 *
 * Noise complaints track the type of noise, complainant/suspect units,
 * investigation details, and optional counseling records.
 */

// ---------------------------------------------------------------------------
// Complaint type definitions
// ---------------------------------------------------------------------------

export const NOISE_COMPLAINT_TYPES = [
  'Loud Music',
  'TV/Stereo',
  'Party',
  'Construction/Renovation',
  'Pet Noise',
  'Arguing/Yelling',
  'Stomping/Walking',
  'Furniture Moving',
  'Door Slamming',
  'Musical Instrument',
  'Washing Machine/Dryer',
  'Vacuum Cleaner',
  'Children Playing',
  'Other',
] as const;

export type NoiseComplaintType = (typeof NOISE_COMPLAINT_TYPES)[number];

export const VOLUME_DEGREES = ['low', 'moderate', 'loud', 'extreme'] as const;
export type VolumeDegree = (typeof VOLUME_DEGREES)[number];

// ---------------------------------------------------------------------------
// TypeScript types for the custom fields
// ---------------------------------------------------------------------------

export interface NoiseComplaintCustomFields {
  complaintTypes: NoiseComplaintType[];
  complainantFloor: string;
  complainantUnit: string;
  suspectFloor: string;
  suspectUnit: string;
  duration: number; // minutes
  volumeDegree: VolumeDegree;
  timeOfOccurrence: string; // ISO 8601 date-time
  counselingProvided: boolean;
  counselingNotes?: string;
}

// ---------------------------------------------------------------------------
// JSON Schema for EventType.customFieldsSchema
// ---------------------------------------------------------------------------

export function getNoiseComplaintTemplate(): Record<string, unknown> {
  return {
    type: 'object',
    required: [
      'complaintTypes',
      'complainantFloor',
      'complainantUnit',
      'suspectFloor',
      'suspectUnit',
      'duration',
      'volumeDegree',
      'timeOfOccurrence',
      'counselingProvided',
    ],
    properties: {
      complaintTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: [...NOISE_COMPLAINT_TYPES],
        },
        minItems: 1,
        description: 'Types of noise reported (one or more)',
      },
      complainantFloor: {
        type: 'string',
        minLength: 1,
        description: 'Floor of the complainant',
      },
      complainantUnit: {
        type: 'string',
        minLength: 1,
        description: 'Unit number of the complainant',
      },
      suspectFloor: {
        type: 'string',
        minLength: 1,
        description: 'Floor of the suspected noise source',
      },
      suspectUnit: {
        type: 'string',
        minLength: 1,
        description: 'Unit number of the suspected noise source',
      },
      duration: {
        type: 'number',
        minimum: 1,
        description: 'Duration of the noise in minutes',
      },
      volumeDegree: {
        type: 'string',
        enum: [...VOLUME_DEGREES],
        description: 'Perceived loudness level',
      },
      timeOfOccurrence: {
        type: 'string',
        format: 'date-time',
        description: 'When the noise was first observed',
      },
      counselingProvided: {
        type: 'boolean',
        description: 'Whether counseling was provided to the suspect',
      },
      counselingNotes: {
        type: 'string',
        description: 'Notes from the counseling session (optional)',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Factory: create default custom fields
// ---------------------------------------------------------------------------

export function createDefaultNoiseComplaintFields(
  overrides: Partial<NoiseComplaintCustomFields> & {
    complainantFloor: string;
    complainantUnit: string;
    suspectFloor: string;
    suspectUnit: string;
    timeOfOccurrence: string;
  },
): NoiseComplaintCustomFields {
  return {
    complaintTypes: overrides.complaintTypes ?? ['Other'],
    duration: overrides.duration ?? 0,
    volumeDegree: overrides.volumeDegree ?? 'moderate',
    counselingProvided: overrides.counselingProvided ?? false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNoiseComplaintFields(customFields: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof customFields !== 'object' || customFields === null || Array.isArray(customFields)) {
    return { valid: false, errors: ['customFields must be a non-null object'] };
  }

  const fields = customFields as Record<string, unknown>;

  // complaintTypes — required array with at least one valid value
  if (!Array.isArray(fields['complaintTypes'])) {
    errors.push('complaintTypes is required and must be an array');
  } else {
    if ((fields['complaintTypes'] as unknown[]).length === 0) {
      errors.push('complaintTypes must have at least one item');
    }
    for (const ct of fields['complaintTypes'] as unknown[]) {
      if (typeof ct !== 'string' || !(NOISE_COMPLAINT_TYPES as readonly string[]).includes(ct)) {
        errors.push(`Invalid complaint type: ${String(ct)}`);
      }
    }
  }

  // Required string fields
  const requiredStrings = [
    'complainantFloor',
    'complainantUnit',
    'suspectFloor',
    'suspectUnit',
  ] as const;
  for (const key of requiredStrings) {
    if (typeof fields[key] !== 'string' || (fields[key] as string).length === 0) {
      errors.push(`${key} is required and must be a non-empty string`);
    }
  }

  // duration — required, positive number
  if (typeof fields['duration'] !== 'number' || fields['duration'] <= 0) {
    errors.push('duration is required and must be a positive number (minutes)');
  }

  // volumeDegree — required, must be one of the allowed values
  if (
    typeof fields['volumeDegree'] !== 'string' ||
    !(VOLUME_DEGREES as readonly string[]).includes(fields['volumeDegree'])
  ) {
    errors.push(`volumeDegree must be one of: ${VOLUME_DEGREES.join(', ')}`);
  }

  // timeOfOccurrence — required, valid ISO date-time
  if (
    typeof fields['timeOfOccurrence'] !== 'string' ||
    (fields['timeOfOccurrence'] as string).length === 0
  ) {
    errors.push('timeOfOccurrence is required and must be a non-empty string');
  } else if (isNaN(Date.parse(fields['timeOfOccurrence'] as string))) {
    errors.push('timeOfOccurrence must be a valid ISO 8601 date-time string');
  }

  // counselingProvided — required boolean
  if (typeof fields['counselingProvided'] !== 'boolean') {
    errors.push('counselingProvided is required and must be a boolean');
  }

  // counselingNotes — optional, but if counselingProvided is true, notes should ideally be present
  if (fields['counselingNotes'] !== undefined && fields['counselingNotes'] !== null) {
    if (typeof fields['counselingNotes'] !== 'string') {
      errors.push('counselingNotes must be a string if provided');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isAfterHoursComplaint(timeOfOccurrence: string): boolean {
  const date = new Date(timeOfOccurrence);
  const hour = date.getHours();
  // After hours: 11 PM (23:00) to 7 AM (07:00)
  return hour >= 23 || hour < 7;
}

export function getComplaintSeverity(
  fields: NoiseComplaintCustomFields,
): 'low' | 'medium' | 'high' | 'critical' {
  const { volumeDegree, duration, counselingProvided } = fields;
  const afterHours = isAfterHoursComplaint(fields.timeOfOccurrence);

  if (volumeDegree === 'extreme' && afterHours) return 'critical';
  if (volumeDegree === 'extreme' || (volumeDegree === 'loud' && afterHours)) return 'high';
  if (
    volumeDegree === 'loud' ||
    duration > 60 ||
    (counselingProvided && volumeDegree === 'moderate')
  )
    return 'medium';
  return 'low';
}
