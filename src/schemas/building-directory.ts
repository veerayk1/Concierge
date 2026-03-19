import { z } from 'zod';

/**
 * Building Directory schemas — staff, vendors, and emergency contacts
 *
 * The building directory is a centralized registry of everyone associated
 * with a property: staff, vendors, and emergency contacts (fire dept, police, utilities).
 */

// ---------------------------------------------------------------------------
// Entry Types
// ---------------------------------------------------------------------------

export const DIRECTORY_ENTRY_TYPES = ['staff', 'vendor'] as const;
export type DirectoryEntryType = (typeof DIRECTORY_ENTRY_TYPES)[number];

export const STAFF_ROLES = [
  'property_manager',
  'concierge',
  'security',
  'maintenance',
  'superintendent',
  'administrator',
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const VENDOR_SPECIALTIES = [
  'plumbing',
  'electrical',
  'hvac',
  'elevator',
  'cleaning',
  'landscaping',
  'pest_control',
  'fire_safety',
  'locksmith',
  'general_contractor',
] as const;
export type VendorSpecialty = (typeof VENDOR_SPECIALTIES)[number];

export const EMERGENCY_CONTACT_TYPES = [
  'fire_department',
  'police',
  'ambulance',
  'utility_gas',
  'utility_electric',
  'utility_water',
  'property_manager_emergency',
  'security_emergency',
] as const;
export type EmergencyContactType = (typeof EMERGENCY_CONTACT_TYPES)[number];

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const directorySearchSchema = z.object({
  propertyId: z.string().uuid(),
  query: z.string().max(200).optional(),
  type: z.enum(DIRECTORY_ENTRY_TYPES).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  department: z.string().max(100).optional(),
});

export type DirectorySearchInput = z.infer<typeof directorySearchSchema>;

export const createStaffProfileSchema = z.object({
  propertyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(STAFF_ROLES),
  department: z.string().min(1).max(100),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(200),
  bio: z.string().max(2000).optional().or(z.literal('')),
  photoUrl: z.string().max(500).optional().or(z.literal('')),
  scheduleNotes: z.string().max(1000).optional().or(z.literal('')),
});

export type CreateStaffProfileInput = z.infer<typeof createStaffProfileSchema>;

export const createEmergencyContactSchema = z.object({
  propertyId: z.string().uuid(),
  contactType: z.enum(EMERGENCY_CONTACT_TYPES),
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  altPhone: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
