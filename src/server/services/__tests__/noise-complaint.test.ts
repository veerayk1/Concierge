/**
 * Noise Complaint Event Template Tests
 *
 * Validates the noise complaint template schema, field validation,
 * complaint type definitions, severity calculation, and edge cases.
 */

import { describe, expect, it } from 'vitest';
import {
  createDefaultNoiseComplaintFields,
  getComplaintSeverity,
  getNoiseComplaintTemplate,
  isAfterHoursComplaint,
  NOISE_COMPLAINT_TYPES,
  validateNoiseComplaintFields,
  VOLUME_DEGREES,
  type NoiseComplaintCustomFields,
} from '../noise-complaint';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validFields(): NoiseComplaintCustomFields {
  return createDefaultNoiseComplaintFields({
    complaintTypes: ['Loud Music'],
    complainantFloor: '5',
    complainantUnit: '502',
    suspectFloor: '6',
    suspectUnit: '601',
    duration: 30,
    volumeDegree: 'loud',
    timeOfOccurrence: '2026-03-19T01:30:00Z',
    counselingProvided: false,
  });
}

// ---------------------------------------------------------------------------
// Template structure
// ---------------------------------------------------------------------------

describe('Noise Complaint — Template Structure', () => {
  it('returns a valid JSON Schema object', () => {
    const template = getNoiseComplaintTemplate();
    expect(template['type']).toBe('object');
    expect(template['required']).toBeDefined();
    expect(template['properties']).toBeDefined();
  });

  it('has all required fields listed', () => {
    const required = getNoiseComplaintTemplate()['required'] as string[];
    expect(required).toContain('complaintTypes');
    expect(required).toContain('complainantFloor');
    expect(required).toContain('complainantUnit');
    expect(required).toContain('suspectFloor');
    expect(required).toContain('suspectUnit');
    expect(required).toContain('duration');
    expect(required).toContain('volumeDegree');
    expect(required).toContain('timeOfOccurrence');
    expect(required).toContain('counselingProvided');
  });

  it('defines complaintTypes as an array with enum values', () => {
    const props = getNoiseComplaintTemplate()['properties'] as Record<
      string,
      Record<string, unknown>
    >;
    expect(props['complaintTypes']!['type']).toBe('array');
    const items = props['complaintTypes']!['items'] as Record<string, unknown>;
    expect(items['enum']).toBeDefined();
    expect((items['enum'] as string[]).length).toBe(14);
  });

  it('defines volumeDegree with 4 enum values', () => {
    const props = getNoiseComplaintTemplate()['properties'] as Record<
      string,
      Record<string, unknown>
    >;
    const volumeEnum = props['volumeDegree']!['enum'] as string[];
    expect(volumeEnum).toEqual(['low', 'moderate', 'loud', 'extreme']);
  });

  it('includes counselingNotes as an optional property', () => {
    const template = getNoiseComplaintTemplate();
    const required = template['required'] as string[];
    const props = template['properties'] as Record<string, unknown>;
    expect(props['counselingNotes']).toBeDefined();
    expect(required).not.toContain('counselingNotes');
  });
});

// ---------------------------------------------------------------------------
// Complaint types
// ---------------------------------------------------------------------------

describe('Noise Complaint — Complaint Types', () => {
  it('has exactly 14 complaint types', () => {
    expect(NOISE_COMPLAINT_TYPES).toHaveLength(14);
  });

  it('contains all expected complaint types', () => {
    const expected = [
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
    ];
    for (const type of expected) {
      expect(NOISE_COMPLAINT_TYPES).toContain(type);
    }
  });

  it('ends with "Other" as the catch-all type', () => {
    expect(NOISE_COMPLAINT_TYPES[NOISE_COMPLAINT_TYPES.length - 1]).toBe('Other');
  });
});

// ---------------------------------------------------------------------------
// Volume degrees
// ---------------------------------------------------------------------------

describe('Noise Complaint — Volume Degrees', () => {
  it('has exactly 4 volume degrees', () => {
    expect(VOLUME_DEGREES).toHaveLength(4);
  });

  it('orders from low to extreme', () => {
    expect(VOLUME_DEGREES).toEqual(['low', 'moderate', 'loud', 'extreme']);
  });
});

// ---------------------------------------------------------------------------
// Validation — valid data
// ---------------------------------------------------------------------------

describe('Noise Complaint — Validation Accepts Valid Data', () => {
  it('accepts valid noise complaint fields', () => {
    const result = validateNoiseComplaintFields(validFields());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts multiple complaint types', () => {
    const fields = validFields();
    fields.complaintTypes = ['Loud Music', 'Party', 'Arguing/Yelling'];
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(true);
  });

  it('accepts all volume degree values', () => {
    for (const degree of VOLUME_DEGREES) {
      const fields = validFields();
      fields.volumeDegree = degree;
      const result = validateNoiseComplaintFields(fields);
      expect(result.valid).toBe(true);
    }
  });

  it('accepts fields with counselingProvided true and notes', () => {
    const fields = validFields();
    fields.counselingProvided = true;
    fields.counselingNotes = 'Resident agreed to lower volume after 11 PM';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation — invalid data
// ---------------------------------------------------------------------------

describe('Noise Complaint — Validation Rejects Invalid Data', () => {
  it('rejects null', () => {
    const result = validateNoiseComplaintFields(null);
    expect(result.valid).toBe(false);
  });

  it('rejects empty complaintTypes array', () => {
    const fields = validFields();
    fields.complaintTypes = [] as never;
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('complaintTypes'))).toBe(true);
  });

  it('rejects invalid complaint type value', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['complaintTypes'] = ['InvalidType'];
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid complaint type'))).toBe(true);
  });

  it('rejects invalid volumeDegree', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['volumeDegree'] = 'deafening';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('volumeDegree'))).toBe(true);
  });

  it('rejects missing complainantUnit', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    delete fields['complainantUnit'];
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('complainantUnit'))).toBe(true);
  });

  it('rejects negative duration', () => {
    const fields = validFields();
    fields.duration = -10;
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('duration'))).toBe(true);
  });

  it('rejects zero duration', () => {
    const fields = validFields();
    fields.duration = 0;
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid timeOfOccurrence', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['timeOfOccurrence'] = 'yesterday';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('timeOfOccurrence'))).toBe(true);
  });

  it('rejects missing counselingProvided', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    delete fields['counselingProvided'];
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('counselingProvided'))).toBe(true);
  });

  it('rejects non-string counselingNotes', () => {
    const fields = validFields() as unknown as Record<string, unknown>;
    fields['counselingNotes'] = 12345;
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('counselingNotes'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Investigation fields
// ---------------------------------------------------------------------------

describe('Noise Complaint — Investigation Fields', () => {
  it('records complainant and suspect on different floors', () => {
    const fields = validFields();
    fields.complainantFloor = '3';
    fields.complainantUnit = '302';
    fields.suspectFloor = '4';
    fields.suspectUnit = '402';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(true);
  });

  it('rejects empty suspectFloor', () => {
    const fields = validFields();
    fields.suspectFloor = '';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('suspectFloor'))).toBe(true);
  });

  it('rejects empty suspectUnit', () => {
    const fields = validFields();
    fields.suspectUnit = '';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Counseling tracking
// ---------------------------------------------------------------------------

describe('Noise Complaint — Counseling Tracking', () => {
  it('allows counselingProvided=false with no notes', () => {
    const fields = validFields();
    fields.counselingProvided = false;
    fields.counselingNotes = undefined;
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(true);
  });

  it('allows counselingProvided=true with notes', () => {
    const fields = validFields();
    fields.counselingProvided = true;
    fields.counselingNotes = 'Verbal warning issued. Resident cooperative.';
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(true);
  });

  it('allows counselingProvided=true without notes (notes optional)', () => {
    const fields = validFields();
    fields.counselingProvided = true;
    const result = validateNoiseComplaintFields(fields);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// After-hours detection
// ---------------------------------------------------------------------------

describe('Noise Complaint — After Hours Detection', () => {
  it('detects 11 PM as after hours', () => {
    expect(isAfterHoursComplaint('2026-03-19T23:00:00')).toBe(true);
  });

  it('detects 2 AM as after hours', () => {
    expect(isAfterHoursComplaint('2026-03-19T02:00:00')).toBe(true);
  });

  it('detects 10 AM as not after hours', () => {
    expect(isAfterHoursComplaint('2026-03-19T10:00:00')).toBe(false);
  });

  it('detects 7 AM as not after hours (boundary)', () => {
    expect(isAfterHoursComplaint('2026-03-19T07:00:00')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Severity calculation
// ---------------------------------------------------------------------------

describe('Noise Complaint — Severity Calculation', () => {
  it('returns critical for extreme volume after hours', () => {
    const fields = validFields();
    fields.volumeDegree = 'extreme';
    fields.timeOfOccurrence = '2026-03-19T23:30:00';
    expect(getComplaintSeverity(fields)).toBe('critical');
  });

  it('returns high for extreme volume during day', () => {
    const fields = validFields();
    fields.volumeDegree = 'extreme';
    fields.timeOfOccurrence = '2026-03-19T14:00:00';
    expect(getComplaintSeverity(fields)).toBe('high');
  });

  it('returns high for loud volume after hours', () => {
    const fields = validFields();
    fields.volumeDegree = 'loud';
    fields.timeOfOccurrence = '2026-03-19T23:30:00';
    expect(getComplaintSeverity(fields)).toBe('high');
  });

  it('returns medium for loud volume during day', () => {
    const fields = validFields();
    fields.volumeDegree = 'loud';
    fields.timeOfOccurrence = '2026-03-19T14:00:00';
    expect(getComplaintSeverity(fields)).toBe('medium');
  });

  it('returns low for low volume during day', () => {
    const fields = validFields();
    fields.volumeDegree = 'low';
    fields.duration = 10;
    fields.timeOfOccurrence = '2026-03-19T14:00:00';
    fields.counselingProvided = false;
    expect(getComplaintSeverity(fields)).toBe('low');
  });

  it('returns medium for duration over 60 minutes', () => {
    const fields = validFields();
    fields.volumeDegree = 'moderate';
    fields.duration = 90;
    fields.timeOfOccurrence = '2026-03-19T14:00:00';
    expect(getComplaintSeverity(fields)).toBe('medium');
  });
});
