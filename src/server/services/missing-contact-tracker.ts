/**
 * Concierge — Missing Contact Tracker Service
 *
 * Detects missing contact information across staff, residents, and units.
 * Inspired by BuildingLink's proactive "3 employees, 19 occupants missing email"
 * data quality indicator — a high-priority gap identified during research.
 *
 * Features:
 * - Identify staff/residents missing email or phone
 * - Identify units with no emergency contacts on file
 * - Calculate overall contact completeness percentage
 * - Generate structured report data for dashboards and exports
 *
 * All queries are tenant-isolated by propertyId.
 *
 * @module server/services/missing-contact-tracker
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A person record with optional contact fields. */
export interface PersonRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  unitNumber?: string | null;
  propertyId: string;
}

/** A unit record with optional emergency contacts. */
export interface UnitRecord {
  id: string;
  unitNumber: string;
  propertyId: string;
  emergencyContacts: EmergencyContact[];
}

/** An emergency contact entry. */
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string | null;
}

/** Summary of missing contacts for a single category. */
export interface MissingContactCategory {
  count: number;
  total: number;
  items: MissingContactItem[];
}

/** A single person/unit missing contact info. */
export interface MissingContactItem {
  id: string;
  name: string;
  unitNumber?: string | null;
}

/** Full missing contacts result. */
export interface MissingContactsResult {
  employeesMissingEmail: MissingContactCategory;
  residentsMissingEmail: MissingContactCategory;
  residentsMissingPhone: MissingContactCategory;
  unitsMissingEmergencyContact: MissingContactCategory;
}

/** Contact completeness score. */
export interface CompletenessScore {
  percentage: number;
  totalChecks: number;
  passingChecks: number;
}

/** Category in the formatted report. */
export interface ReportCategory {
  label: string;
  severity: 'critical' | 'warning' | 'info';
  count: number;
  total: number;
  percentage: number;
  items: MissingContactItem[];
}

/** Formatted report data for display or export. */
export interface MissingContactReport {
  propertyId: string;
  generatedAt: Date;
  completeness: CompletenessScore;
  categories: ReportCategory[];
}

/** Data source interface — abstracts database access for testability. */
export interface ContactDataSource {
  getEmployees(propertyId: string): Promise<PersonRecord[]>;
  getResidents(propertyId: string): Promise<PersonRecord[]>;
  getUnits(propertyId: string): Promise<UnitRecord[]>;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Identify all missing contact information for a property.
 *
 * Checks:
 * 1. Employees without email addresses
 * 2. Residents without email addresses
 * 3. Residents without phone numbers
 * 4. Units with no emergency contacts on file
 *
 * @param propertyId - The property to check (tenant isolation)
 * @param dataSource - Data source for querying people and units
 * @returns Categorized missing contact information
 */
export async function getMissingContacts(
  propertyId: string,
  dataSource: ContactDataSource,
): Promise<MissingContactsResult> {
  const [employees, residents, units] = await Promise.all([
    dataSource.getEmployees(propertyId),
    dataSource.getResidents(propertyId),
    dataSource.getUnits(propertyId),
  ]);

  const employeesMissingEmail = findMissingField(employees, 'email');
  const residentsMissingEmail = findMissingField(residents, 'email');
  const residentsMissingPhone = findMissingField(residents, 'phone');
  const unitsMissing = findUnitsMissingEmergencyContacts(units);

  return {
    employeesMissingEmail,
    residentsMissingEmail,
    residentsMissingPhone,
    unitsMissingEmergencyContact: unitsMissing,
  };
}

/**
 * Calculate overall contact completeness for a property as a percentage.
 *
 * The score is the average of four category completion rates:
 * 1. Employee email completeness
 * 2. Resident email completeness
 * 3. Resident phone completeness
 * 4. Unit emergency contact completeness
 *
 * A property with zero people/units scores 100% (nothing is missing).
 *
 * @param propertyId - The property to check
 * @param dataSource - Data source for querying people and units
 * @returns Completeness percentage (0-100)
 */
export async function getContactCompleteness(
  propertyId: string,
  dataSource: ContactDataSource,
): Promise<CompletenessScore> {
  const result = await getMissingContacts(propertyId, dataSource);

  const categories = [
    result.employeesMissingEmail,
    result.residentsMissingEmail,
    result.residentsMissingPhone,
    result.unitsMissingEmergencyContact,
  ];

  let totalChecks = 0;
  let passingChecks = 0;

  for (const category of categories) {
    totalChecks += category.total;
    passingChecks += category.total - category.count;
  }

  // If there are no people or units at all, completeness is 100%
  const percentage = totalChecks === 0 ? 100 : Math.round((passingChecks / totalChecks) * 100);

  return { percentage, totalChecks, passingChecks };
}

/**
 * Generate a structured missing contact report for a property.
 *
 * The report includes completeness score and all four categories with
 * severity levels:
 * - critical: emergency contacts missing (safety risk)
 * - warning: email missing (communication gap)
 * - info: phone missing (secondary channel gap)
 *
 * @param propertyId - The property to report on
 * @param dataSource - Data source for querying people and units
 * @param now - Current time for the report timestamp (testability)
 * @returns Formatted report data
 */
export async function generateMissingContactReport(
  propertyId: string,
  dataSource: ContactDataSource,
  now: Date = new Date(),
): Promise<MissingContactReport> {
  const [missingContacts, completeness] = await Promise.all([
    getMissingContacts(propertyId, dataSource),
    getContactCompleteness(propertyId, dataSource),
  ]);

  const categories: ReportCategory[] = [
    buildReportCategory(
      'Units Missing Emergency Contact',
      'critical',
      missingContacts.unitsMissingEmergencyContact,
    ),
    buildReportCategory(
      'Employees Missing Email',
      'warning',
      missingContacts.employeesMissingEmail,
    ),
    buildReportCategory(
      'Residents Missing Email',
      'warning',
      missingContacts.residentsMissingEmail,
    ),
    buildReportCategory('Residents Missing Phone', 'info', missingContacts.residentsMissingPhone),
  ];

  return {
    propertyId,
    generatedAt: now,
    completeness,
    categories,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Find people missing a specific contact field (email or phone).
 */
function findMissingField(
  people: PersonRecord[],
  field: 'email' | 'phone',
): MissingContactCategory {
  const missing: MissingContactItem[] = [];

  for (const person of people) {
    const value = person[field];
    if (!value || value.trim() === '') {
      missing.push({
        id: person.id,
        name: `${person.firstName} ${person.lastName}`,
        unitNumber: person.unitNumber,
      });
    }
  }

  return {
    count: missing.length,
    total: people.length,
    items: missing,
  };
}

/**
 * Find units that have zero emergency contacts on file.
 */
function findUnitsMissingEmergencyContacts(units: UnitRecord[]): MissingContactCategory {
  const missing: MissingContactItem[] = [];

  for (const unit of units) {
    if (!unit.emergencyContacts || unit.emergencyContacts.length === 0) {
      missing.push({
        id: unit.id,
        name: `Unit ${unit.unitNumber}`,
      });
    }
  }

  return {
    count: missing.length,
    total: units.length,
    items: missing,
  };
}

/**
 * Build a report category from a missing contact category.
 */
function buildReportCategory(
  label: string,
  severity: 'critical' | 'warning' | 'info',
  category: MissingContactCategory,
): ReportCategory {
  const percentage =
    category.total === 0
      ? 100
      : Math.round(((category.total - category.count) / category.total) * 100);

  return {
    label,
    severity,
    count: category.count,
    total: category.total,
    percentage,
    items: category.items,
  };
}
