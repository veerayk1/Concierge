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

export type EntityType =
  | 'units'
  | 'residents'
  | 'properties'
  | 'amenities'
  | 'fobs'
  | 'buzzer_codes'
  | 'parking_permits'
  | 'staff'
  | 'packages'
  | 'maintenance_requests'
  | 'events';

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
      'building_code',
      'building code',
      'bldg code',
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
      'area_sqft',
      'area sqft',
      'total sqft',
      'unit area',
      'living area',
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
    key: 'bedrooms',
    label: 'Bedrooms',
    required: false,
    aliases: [
      'beds',
      'bedrooms',
      'bed',
      'bedroom',
      'br',
      'num beds',
      'number of bedrooms',
      'no of beds',
      '# beds',
      'bed count',
      'bedroom count',
    ],
  },
  {
    key: 'bathrooms',
    label: 'Bathrooms',
    required: false,
    aliases: [
      'baths',
      'bathrooms',
      'bath',
      'bathroom',
      'ba',
      'num baths',
      'number of bathrooms',
      'no of baths',
      '# baths',
      'bath count',
      'bathroom count',
      'washrooms',
    ],
  },
  {
    key: 'rentAmount',
    label: 'Rent Amount',
    required: false,
    aliases: [
      'rent',
      'rent amount',
      'monthly rent',
      'rent price',
      'rent cost',
      'rent_amount',
      'rental amount',
      'rental price',
      'monthly fee',
      'lease amount',
      'maintenance fee',
      'condo fee',
      'monthly payment',
    ],
  },
  {
    key: 'securityDeposit',
    label: 'Security Deposit',
    required: false,
    aliases: [
      'deposit',
      'security deposit',
      'sec deposit',
      'sec_deposit',
      'damage deposit',
      'refundable deposit',
      'key deposit',
      'move in deposit',
    ],
  },
  {
    key: 'petFee',
    label: 'Pet Fee',
    required: false,
    aliases: [
      'pet fee',
      'pet_fee',
      'pet deposit',
      'pet rent',
      'animal fee',
      'pet charge',
      'pet monthly',
      'pet surcharge',
    ],
  },
  {
    key: 'leaseStart',
    label: 'Lease Start',
    required: false,
    aliases: [
      'lease start',
      'lease from',
      'lease_from',
      'lease start date',
      'tenancy start',
      'contract start',
      'move in',
      'move in date',
      'move_in',
      'checkin',
      'check in',
      'checkin date',
      'checkin_date',
      'check in date',
      'occupancy start',
      'start date',
    ],
  },
  {
    key: 'leaseEnd',
    label: 'Lease End',
    required: false,
    aliases: [
      'lease end',
      'lease to',
      'lease_to',
      'lease end date',
      'tenancy end',
      'contract end',
      'move out',
      'move out date',
      'move_out',
      'checkout',
      'check out',
      'checkout date',
      'checkout_date',
      'check out date',
      'lease expiry',
      'end date',
      'expiry',
    ],
  },
  {
    key: 'zone',
    label: 'Zone / Area',
    required: false,
    aliases: [
      'zone',
      'area',
      'section',
      'wing',
      'zone name',
      'building zone',
      'district',
      'region',
      'sector',
    ],
  },
  {
    key: 'parkingType',
    label: 'Parking Type',
    required: false,
    aliases: [
      'parking type',
      'parking_type',
      'parking category',
      'parking kind',
      'spot type',
      'garage type',
      'parking tier',
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
      'special notes',
      'front desk notes',
      'instructions',
      'unit notes',
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

export const AMENITY_FIELDS: FieldDefinition[] = [
  {
    key: 'name',
    label: 'Amenity Name',
    required: true,
    aliases: [
      'name',
      'amenity',
      'amenity name',
      'space',
      'space name',
      'facility',
      'facility name',
      'room',
      'room name',
      'area',
      'area name',
    ],
  },
  {
    key: 'group',
    label: 'Group / Category',
    required: false,
    aliases: ['group', 'category', 'type', 'amenity group', 'amenity type', 'classification'],
  },
  {
    key: 'description',
    label: 'Description',
    required: false,
    aliases: ['description', 'details', 'notes', 'info', 'about'],
  },
  {
    key: 'capacity',
    label: 'Capacity',
    required: false,
    aliases: ['capacity', 'max capacity', 'max occupancy', 'seats', 'max people', 'limit'],
  },
  {
    key: 'operatingHours',
    label: 'Operating Hours',
    required: false,
    aliases: ['hours', 'operating hours', 'open hours', 'availability', 'schedule', 'time'],
  },
  {
    key: 'fee',
    label: 'Booking Fee',
    required: false,
    aliases: ['fee', 'price', 'cost', 'rate', 'booking fee', 'rental fee', 'charge'],
  },
  {
    key: 'bookingStyle',
    label: 'Booking Style',
    required: false,
    aliases: ['booking style', 'booking type', 'reservation type', 'approval', 'booking mode'],
  },
];

export const FOB_FIELDS: FieldDefinition[] = [
  {
    key: 'serialNumber',
    label: 'Serial Number',
    required: true,
    aliases: [
      'serial',
      'serial number',
      'serial #',
      'serial no',
      'fob number',
      'fob #',
      'fob serial',
      'key number',
      'key #',
      'key serial',
      'tag number',
      'tag #',
      'card number',
      'card #',
      'access card',
      'id number',
    ],
  },
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: true,
    aliases: ['unit', 'unit #', 'unit number', 'suite', 'apt', 'apartment', 'room'],
  },
  {
    key: 'fobType',
    label: 'FOB Type',
    required: false,
    aliases: ['type', 'fob type', 'key type', 'card type', 'access type', 'device type'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    aliases: ['status', 'state', 'active', 'condition'],
  },
  {
    key: 'issuedDate',
    label: 'Issued Date',
    required: false,
    aliases: [
      'issued',
      'issued date',
      'date issued',
      'activation date',
      'start date',
      'assigned date',
    ],
  },
  {
    key: 'issuedToName',
    label: 'Issued To',
    required: false,
    aliases: ['issued to', 'assigned to', 'holder', 'owner', 'resident', 'name', 'person'],
  },
  {
    key: 'notes',
    label: 'Notes',
    required: false,
    aliases: ['notes', 'comments', 'remarks', 'description'],
  },
];

export const BUZZER_CODE_FIELDS: FieldDefinition[] = [
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: true,
    aliases: ['unit', 'unit #', 'unit number', 'suite', 'apt', 'apartment', 'room', 'door'],
  },
  {
    key: 'code',
    label: 'Buzzer Code',
    required: true,
    aliases: [
      'code',
      'buzzer',
      'buzzer code',
      'intercom',
      'intercom code',
      'dial code',
      'entry code',
      'access code',
      'phone code',
      'buzzer #',
    ],
  },
  {
    key: 'comments',
    label: 'Comments',
    required: false,
    aliases: ['comments', 'notes', 'remarks', 'description', 'instructions'],
  },
];

export const PARKING_PERMIT_FIELDS: FieldDefinition[] = [
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: true,
    aliases: ['unit', 'unit #', 'unit number', 'suite', 'apt', 'apartment'],
  },
  {
    key: 'licensePlate',
    label: 'License Plate',
    required: true,
    aliases: [
      'plate',
      'license plate',
      'licence plate',
      'plate number',
      'plate #',
      'license',
      'licence',
      'registration',
      'vehicle plate',
      'tag',
    ],
  },
  {
    key: 'vehicleMake',
    label: 'Vehicle Make',
    required: false,
    aliases: ['make', 'vehicle make', 'car make', 'manufacturer', 'brand'],
  },
  {
    key: 'vehicleModel',
    label: 'Vehicle Model',
    required: false,
    aliases: ['model', 'vehicle model', 'car model'],
  },
  {
    key: 'vehicleColor',
    label: 'Vehicle Color',
    required: false,
    aliases: ['color', 'colour', 'vehicle color', 'car color'],
  },
  {
    key: 'permitType',
    label: 'Permit Type',
    required: false,
    aliases: ['type', 'permit type', 'parking type', 'pass type', 'category'],
  },
  {
    key: 'spotNumber',
    label: 'Spot Number',
    required: false,
    aliases: ['spot', 'spot #', 'spot number', 'parking spot', 'stall', 'stall #', 'bay'],
  },
  {
    key: 'validFrom',
    label: 'Valid From',
    required: false,
    aliases: ['from', 'valid from', 'start', 'start date', 'effective date'],
  },
  {
    key: 'validTo',
    label: 'Valid To',
    required: false,
    aliases: ['to', 'valid to', 'end', 'end date', 'expiry', 'expiry date', 'expires'],
  },
];

export const STAFF_FIELDS: FieldDefinition[] = [
  {
    key: 'firstName',
    label: 'First Name',
    required: true,
    aliases: ['first name', 'fname', 'given name', 'first', 'firstname'],
  },
  {
    key: 'lastName',
    label: 'Last Name',
    required: true,
    aliases: ['last name', 'lname', 'surname', 'family name', 'last', 'lastname'],
  },
  {
    key: 'fullName',
    label: 'Full Name',
    required: false,
    aliases: ['name', 'full name', 'fullname', 'staff name', 'employee name'],
  },
  {
    key: 'email',
    label: 'Email',
    required: true,
    aliases: ['email', 'email address', 'e-mail', 'mail', 'work email'],
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    aliases: ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'work phone'],
  },
  {
    key: 'role',
    label: 'Role',
    required: true,
    aliases: [
      'role',
      'position',
      'title',
      'job title',
      'job role',
      'designation',
      'staff role',
      'employee role',
      'department',
    ],
  },
];

export const PACKAGE_HISTORY_FIELDS: FieldDefinition[] = [
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: true,
    aliases: ['unit', 'unit #', 'unit number', 'suite', 'apt', 'apartment'],
  },
  {
    key: 'recipientName',
    label: 'Recipient',
    required: false,
    aliases: ['recipient', 'name', 'resident', 'for', 'delivered to', 'addressee'],
  },
  {
    key: 'courier',
    label: 'Courier',
    required: false,
    aliases: ['courier', 'carrier', 'shipper', 'delivery company', 'service', 'shipped by'],
  },
  {
    key: 'trackingNumber',
    label: 'Tracking Number',
    required: false,
    aliases: ['tracking', 'tracking #', 'tracking number', 'tracking no', 'barcode'],
  },
  {
    key: 'receivedDate',
    label: 'Received Date',
    required: false,
    aliases: [
      'received',
      'received date',
      'intake date',
      'arrived',
      'arrival date',
      'date received',
    ],
  },
  {
    key: 'releasedDate',
    label: 'Released Date',
    required: false,
    aliases: ['released', 'released date', 'pickup date', 'collected', 'date released'],
  },
  {
    key: 'storageLocation',
    label: 'Storage Location',
    required: false,
    aliases: ['storage', 'location', 'shelf', 'spot', 'storage spot', 'stored at'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    aliases: ['status', 'state', 'package status'],
  },
  {
    key: 'notes',
    label: 'Notes',
    required: false,
    aliases: ['notes', 'comments', 'description', 'remarks'],
  },
];

export const MAINTENANCE_HISTORY_FIELDS: FieldDefinition[] = [
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: true,
    aliases: ['unit', 'unit #', 'unit number', 'suite', 'apt', 'apartment'],
  },
  {
    key: 'description',
    label: 'Description',
    required: true,
    aliases: ['description', 'issue', 'problem', 'details', 'request', 'work description'],
  },
  {
    key: 'category',
    label: 'Category',
    required: false,
    aliases: ['category', 'type', 'trade', 'department', 'service type', 'work type'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    aliases: ['status', 'state', 'request status', 'work order status'],
  },
  {
    key: 'priority',
    label: 'Priority',
    required: false,
    aliases: ['priority', 'urgency', 'severity', 'importance'],
  },
  {
    key: 'createdDate',
    label: 'Created Date',
    required: false,
    aliases: ['created', 'created date', 'reported', 'reported date', 'date', 'opened'],
  },
  {
    key: 'closedDate',
    label: 'Closed Date',
    required: false,
    aliases: ['closed', 'closed date', 'completed', 'completed date', 'resolved', 'resolved date'],
  },
  {
    key: 'assignedTo',
    label: 'Assigned To',
    required: false,
    aliases: ['assigned', 'assigned to', 'technician', 'worker', 'contractor', 'vendor'],
  },
];

export const EVENT_HISTORY_FIELDS: FieldDefinition[] = [
  {
    key: 'unitNumber',
    label: 'Unit Number',
    required: false,
    aliases: ['unit', 'unit #', 'unit number', 'suite', 'apt', 'apartment'],
  },
  {
    key: 'eventType',
    label: 'Event Type',
    required: true,
    aliases: ['type', 'event type', 'log type', 'category', 'incident type', 'entry type'],
  },
  {
    key: 'description',
    label: 'Description',
    required: true,
    aliases: ['description', 'details', 'notes', 'summary', 'entry', 'log entry', 'comments'],
  },
  {
    key: 'date',
    label: 'Date',
    required: false,
    aliases: ['date', 'event date', 'occurred', 'when', 'timestamp', 'date/time'],
  },
  {
    key: 'createdBy',
    label: 'Created By',
    required: false,
    aliases: ['created by', 'logged by', 'reported by', 'author', 'staff', 'officer', 'guard'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    aliases: ['status', 'state', 'resolution'],
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
  const fields = getTargetFields(entityType);

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
    threshold: 0.25,
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

    if (bestMatch && bestMatch.score !== undefined && bestMatch.score < 0.3) {
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

const FIELD_MAP: Record<EntityType, FieldDefinition[]> = {
  units: UNIT_FIELDS,
  residents: RESIDENT_FIELDS,
  properties: PROPERTY_FIELDS,
  amenities: AMENITY_FIELDS,
  fobs: FOB_FIELDS,
  buzzer_codes: BUZZER_CODE_FIELDS,
  parking_permits: PARKING_PERMIT_FIELDS,
  staff: STAFF_FIELDS,
  packages: PACKAGE_HISTORY_FIELDS,
  maintenance_requests: MAINTENANCE_HISTORY_FIELDS,
  events: EVENT_HISTORY_FIELDS,
};

export function getTargetFields(entityType: EntityType): FieldDefinition[] {
  return FIELD_MAP[entityType] ?? UNIT_FIELDS;
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
