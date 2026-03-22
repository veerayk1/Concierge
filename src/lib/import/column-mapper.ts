/**
 * Fuzzy Column Mapping Engine
 *
 * Intelligently maps arbitrary spreadsheet column headers to known
 * Concierge fields using exact alias matching + Fuse.js fuzzy search.
 * Unknown columns are offered as custom fields with auto-detected types.
 */

import Fuse from 'fuse.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType = 'units' | 'residents' | 'properties';

export interface ColumnMapping {
  sourceHeader: string;
  targetField: string | null;
  confidence: number; // 0-100
  isCustomField: boolean;
  suggestedFieldType?: 'text' | 'number' | 'date' | 'email' | 'phone' | 'boolean';
}

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

// ---------------------------------------------------------------------------
// Field Definitions with Aliases
// ---------------------------------------------------------------------------

export const UNIT_FIELDS: FieldDefinition[] = [
  {
    key: 'number',
    label: 'Unit Number',
    required: true,
    aliases: [
      'unit',
      'unit #',
      'unit no',
      'unit number',
      'unit no.',
      'unit num',
      'suite',
      'suite #',
      'suite no',
      'suite number',
      'apt',
      'apt #',
      'apt no',
      'apartment',
      'apartment number',
      'apartment #',
      'door',
      'door #',
      'door number',
      'room',
      'room #',
      'room number',
      'unit/suite',
      'unit id',
      'id',
    ],
  },
  {
    key: 'floor',
    label: 'Floor',
    required: false,
    aliases: ['floor', 'level', 'storey', 'story', 'flr', 'floor #', 'floor number', 'floor level'],
  },
  {
    key: 'building',
    label: 'Building',
    required: false,
    aliases: [
      'building',
      'building name',
      'tower',
      'block',
      'phase',
      'wing',
      'building #',
      'bldg',
      'bldg name',
      'tower name',
      'structure',
    ],
  },
  {
    key: 'unitType',
    label: 'Unit Type',
    required: false,
    aliases: [
      'type',
      'unit type',
      'apt type',
      'apartment type',
      'category',
      'property type',
      'dwelling type',
      'suite type',
      'room type',
    ],
  },
  {
    key: 'squareFootage',
    label: 'Square Footage',
    required: false,
    aliases: [
      'sqft',
      'sq ft',
      'square feet',
      'square footage',
      'area',
      'size',
      'sq. ft.',
      'square ft',
      'sq. ft',
      'total area',
      'floor area',
      'unit size',
      'apt size',
      'square meters',
      'sq m',
      'sqm',
    ],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    aliases: [
      'status',
      'unit status',
      'occupancy',
      'occupancy status',
      'occupied',
      'vacant',
      'availability',
    ],
  },
  {
    key: 'enterPhoneCode',
    label: 'Buzzer / Entry Code',
    required: false,
    aliases: [
      'buzzer',
      'buzzer code',
      'intercom',
      'intercom code',
      'phone code',
      'entry code',
      'entry phone',
      'door code',
      'access code',
      'dial code',
      'buzzer #',
      'intercom #',
      'enter phone code',
    ],
  },
  {
    key: 'parkingSpot',
    label: 'Parking Spot',
    required: false,
    aliases: [
      'parking',
      'parking spot',
      'parking space',
      'parking #',
      'parking no',
      'p-spot',
      'garage spot',
      'garage #',
      'parking stall',
      'parking bay',
      'parking number',
      'assigned parking',
    ],
  },
  {
    key: 'locker',
    label: 'Locker',
    required: false,
    aliases: [
      'locker',
      'locker #',
      'locker number',
      'locker no',
      'storage',
      'storage unit',
      'storage locker',
      'storage #',
      'storage space',
      'storage number',
    ],
  },
  {
    key: 'keyTag',
    label: 'Key / FOB Tag',
    required: false,
    aliases: [
      'key',
      'key tag',
      'key fob',
      'fob',
      'fob #',
      'key #',
      'key number',
      'fob number',
      'fob serial',
      'key serial',
      'access key',
      'key code',
      'fob tag',
    ],
  },
  {
    key: 'comments',
    label: 'Comments / Notes',
    required: false,
    aliases: [
      'comments',
      'notes',
      'remarks',
      'description',
      'memo',
      'comment',
      'note',
      'remark',
      'special instructions',
      'additional info',
      'other',
      'misc',
      'miscellaneous',
    ],
  },
];

export const RESIDENT_FIELDS: FieldDefinition[] = [
  {
    key: 'firstName',
    label: 'First Name',
    required: true,
    aliases: [
      'first name',
      'fname',
      'given name',
      'first',
      'forename',
      'first_name',
      'firstname',
      'givenname',
      'given_name',
      'prenom',
      'prénom',
    ],
  },
  {
    key: 'lastName',
    label: 'Last Name',
    required: true,
    aliases: [
      'last name',
      'lname',
      'surname',
      'family name',
      'last',
      'last_name',
      'lastname',
      'familyname',
      'family_name',
      'nom',
      'nom de famille',
    ],
  },
  {
    key: 'fullName',
    label: 'Full Name',
    required: false,
    aliases: [
      'name',
      'full name',
      'fullname',
      'full_name',
      'resident name',
      'tenant name',
      'owner name',
      'occupant name',
      'resident',
      'occupant',
      'tenant',
      'owner',
    ],
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    aliases: [
      'email',
      'email address',
      'e-mail',
      'mail',
      'contact email',
      'email_address',
      'emailaddress',
      'primary email',
      'courriel',
    ],
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    aliases: [
      'phone',
      'phone number',
      'telephone',
      'mobile',
      'cell',
      'cell phone',
      'contact phone',
      'tel',
      'phone #',
      'mobile #',
      'cell #',
      'home phone',
      'work phone',
      'primary phone',
      'phone_number',
      'phonenumber',
      'téléphone',
    ],
  },
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: false,
    aliases: [
      'unit',
      'unit #',
      'unit no',
      'unit number',
      'suite',
      'suite #',
      'apt',
      'apt #',
      'apartment',
      'apartment number',
      'room',
      'room #',
      'unit_number',
      'unitnumber',
      'suite_number',
    ],
  },
  {
    key: 'residentType',
    label: 'Resident Type',
    required: false,
    aliases: [
      'type',
      'resident type',
      'occupant type',
      'role',
      'tenant/owner',
      'owner/tenant',
      'tenant or owner',
      'resident_type',
      'residenttype',
      'occupant role',
      'ownership',
      'tenure',
    ],
  },
  {
    key: 'moveInDate',
    label: 'Move-in Date',
    required: false,
    aliases: [
      'move in',
      'move-in',
      'move in date',
      'move-in date',
      'start date',
      'occupancy date',
      'lease start',
      'from',
      'move_in_date',
      'moveindate',
      'entry date',
      'date of entry',
      'occupancy start',
      'tenancy start',
    ],
  },
  {
    key: 'moveOutDate',
    label: 'Move-out Date',
    required: false,
    aliases: [
      'move out',
      'move-out',
      'move out date',
      'move-out date',
      'end date',
      'lease end',
      'to',
      'departure date',
      'move_out_date',
      'moveoutdate',
      'tenancy end',
    ],
  },
];

export const PROPERTY_FIELDS: FieldDefinition[] = [
  {
    key: 'name',
    label: 'Property Name',
    required: true,
    aliases: [
      'name',
      'property name',
      'property',
      'building name',
      'building',
      'condo name',
      'condo',
      'complex',
      'complex name',
      'community',
      'community name',
      'development',
      'project name',
    ],
  },
  {
    key: 'address',
    label: 'Address',
    required: true,
    aliases: [
      'address',
      'street address',
      'street',
      'location',
      'addr',
      'address line 1',
      'address1',
      'mailing address',
      'property address',
    ],
  },
  {
    key: 'city',
    label: 'City',
    required: true,
    aliases: ['city', 'town', 'municipality', 'city/town', 'locale'],
  },
  {
    key: 'province',
    label: 'Province / State',
    required: true,
    aliases: [
      'province',
      'state',
      'prov',
      'region',
      'province/state',
      'state/province',
      'territory',
    ],
  },
  {
    key: 'country',
    label: 'Country',
    required: false,
    aliases: ['country', 'country code', 'nation', 'country name'],
  },
  {
    key: 'postalCode',
    label: 'Postal / Zip Code',
    required: false,
    aliases: [
      'postal code',
      'zip',
      'zip code',
      'postcode',
      'post code',
      'postal',
      'zip/postal',
      'postal/zip',
    ],
  },
  {
    key: 'unitCount',
    label: 'Unit Count',
    required: false,
    aliases: [
      'units',
      'unit count',
      'total units',
      '# of units',
      'number of units',
      'num units',
      'suites',
      'total suites',
      'apartments',
    ],
  },
  {
    key: 'timezone',
    label: 'Timezone',
    required: false,
    aliases: ['timezone', 'time zone', 'tz', 'time_zone'],
  },
  {
    key: 'type',
    label: 'Property Type',
    required: false,
    aliases: ['type', 'property type', 'building type', 'category', 'classification', 'class'],
  },
  {
    key: 'propertyCode',
    label: 'Property Code',
    required: false,
    aliases: [
      'code',
      'property code',
      'building code',
      'short code',
      'id code',
      'identifier',
      'ref',
      'reference',
    ],
  },
];

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[_\-./\\]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Auto-Map Columns
// ---------------------------------------------------------------------------

export function autoMapColumns(
  sourceHeaders: string[],
  entityType: EntityType,
  sampleRows?: Record<string, string>[],
): ColumnMapping[] {
  const fields =
    entityType === 'units'
      ? UNIT_FIELDS
      : entityType === 'properties'
        ? PROPERTY_FIELDS
        : RESIDENT_FIELDS;

  // Build flattened alias list for fuzzy search
  const aliasEntries = fields.flatMap((field) =>
    field.aliases.map((alias) => ({
      alias: normalize(alias),
      fieldKey: field.key,
      fieldLabel: field.label,
    })),
  );

  const fuse = new Fuse(aliasEntries, {
    keys: ['alias'],
    threshold: 0.3,
    includeScore: true,
  });

  const mappedFields = new Set<string>();
  const mappings: ColumnMapping[] = [];

  for (const header of sourceHeaders) {
    const normalizedHeader = normalize(header);

    // 1. Try exact match
    let matched = false;
    for (const field of fields) {
      if (mappedFields.has(field.key)) continue;
      const hasExactMatch = field.aliases.some((alias) => normalize(alias) === normalizedHeader);
      if (hasExactMatch) {
        mappings.push({
          sourceHeader: header,
          targetField: field.key,
          confidence: 100,
          isCustomField: false,
        });
        mappedFields.add(field.key);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 2. Try fuzzy match
    const fuseResults = fuse.search(normalizedHeader);
    const bestMatch = fuseResults.find((r) => !mappedFields.has(r.item.fieldKey));

    if (bestMatch && bestMatch.score !== undefined && bestMatch.score < 0.4) {
      const confidence = Math.round((1 - bestMatch.score) * 100);
      mappings.push({
        sourceHeader: header,
        targetField: bestMatch.item.fieldKey,
        confidence,
        isCustomField: false,
      });
      mappedFields.add(bestMatch.item.fieldKey);
      continue;
    }

    // 3. Unmapped → suggest as custom field
    const suggestedType = sampleRows ? inferFieldType(header, sampleRows) : 'text';

    mappings.push({
      sourceHeader: header,
      targetField: null,
      confidence: 0,
      isCustomField: true,
      suggestedFieldType: suggestedType,
    });
  }

  return mappings;
}

// ---------------------------------------------------------------------------
// Get Available Target Fields
// ---------------------------------------------------------------------------

export function getTargetFields(entityType: EntityType): FieldDefinition[] {
  return entityType === 'units'
    ? UNIT_FIELDS
    : entityType === 'properties'
      ? PROPERTY_FIELDS
      : RESIDENT_FIELDS;
}

// ---------------------------------------------------------------------------
// Field Type Inference for Custom Fields
// ---------------------------------------------------------------------------

function inferFieldType(
  header: string,
  rows: Record<string, string>[],
): 'text' | 'number' | 'date' | 'email' | 'phone' | 'boolean' {
  const values: string[] = rows
    .slice(0, 50)
    .map((r) => r[header])
    .filter((v): v is string => v !== undefined && v.trim().length > 0);

  if (values.length === 0) return 'text';

  // Check if all values are numbers
  const allNumbers = values.every((v) => !isNaN(Number(v.replace(/[,$]/g, ''))));
  if (allNumbers) return 'number';

  // Check if all values look like emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (values.every((v) => emailRegex.test(v))) return 'email';

  // Check if all values look like phone numbers
  const phoneRegex = /^[+\d\s().-]{7,20}$/;
  if (values.every((v) => phoneRegex.test(v))) return 'phone';

  // Check if all values look like dates
  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/, // YYYY-MM-DD
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/, // MM/DD/YYYY or DD/MM/YYYY
    /^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/, // Jan 1, 2025
  ];
  const allDates = values.every((v) => datePatterns.some((p) => p.test(v)));
  if (allDates) return 'date';

  // Check if all values are boolean-like
  const boolValues = new Set(['yes', 'no', 'true', 'false', 'y', 'n', '1', '0']);
  if (values.every((v) => boolValues.has(v.toLowerCase()))) return 'boolean';

  return 'text';
}
