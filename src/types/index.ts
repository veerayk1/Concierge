/**
 * Concierge — Shared Type Definitions
 *
 * Core types used across the entire application.
 * Keep this file focused on foundational types only.
 *
 * @module types
 */

// ---------------------------------------------------------------------------
// Roles (12 roles per PRD 02)
// ---------------------------------------------------------------------------

/**
 * All roles in the Concierge system.
 * Ordered roughly by privilege level (highest to lowest).
 */
export type Role =
  | 'super_admin'
  | 'property_admin'
  | 'property_manager'
  | 'front_desk'
  | 'security_guard'
  | 'maintenance_staff'
  | 'board_member'
  | 'resident_owner'
  | 'resident_tenant'
  | 'family_member'
  | 'offsite_owner'
  | 'visitor';

/**
 * Numeric privilege hierarchy. Higher number = higher privilege.
 * Used for vertical access control checks (Security Rulebook B.3.2).
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  property_admin: 90,
  property_manager: 80,
  front_desk: 70,
  security_guard: 70,
  maintenance_staff: 60,
  board_member: 50,
  resident_owner: 40,
  resident_tenant: 30,
  family_member: 20,
  offsite_owner: 15,
  visitor: 10,
} as const;

/** Convenience set for quick admin role lookups. */
export const ADMIN_ROLES: ReadonlySet<Role> = new Set<Role>(['super_admin', 'property_admin']);

/** Convenience set for quick staff role lookups. */
export const STAFF_ROLES: ReadonlySet<Role> = new Set<Role>([
  'property_manager',
  'front_desk',
  'security_guard',
  'maintenance_staff',
]);

/** Convenience set for quick resident role lookups. */
export const RESIDENT_ROLES: ReadonlySet<Role> = new Set<Role>([
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
]);

// ---------------------------------------------------------------------------
// PII Classification (Security Rulebook D.3)
// ---------------------------------------------------------------------------

/**
 * PII classification tiers per Security Rulebook Section D.3.
 *
 * - critical: Government IDs, financial data (AES-256-GCM per-property KMS)
 * - sensitive: Contact info, DOB, emergency contacts (DB-level encryption)
 * - standard: Names, unit numbers, roles (no additional encryption)
 */
export type PiiTier = 'critical' | 'sensitive' | 'standard';

// ---------------------------------------------------------------------------
// Auth / JWT
// ---------------------------------------------------------------------------

/**
 * Decoded JWT payload that lives in the Authorization header.
 *
 * Follows Security Rulebook A.1 — minimum claims, no PII in tokens.
 */
export interface TokenPayload {
  /** User ID (UUID) */
  sub: string;
  /** Property ID (UUID) */
  pid: string;
  /** Active role for this session */
  role: Role;
  /** Fine-grained permission strings (e.g. "event:create") */
  perms: string[];
  /** Whether MFA was completed for this session */
  mfa: boolean;
  /** Issued-at (epoch seconds) */
  iat: number;
  /** Expiration (epoch seconds) */
  exp: number;
}

// ---------------------------------------------------------------------------
// Event Statuses (Unified Event Model)
// ---------------------------------------------------------------------------

/** Generic event status for the unified event model. */
export type EventStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Maintenance request lifecycle status. */
export type MaintenanceStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'resolved'
  | 'closed';

/** Package tracking lifecycle status. */
export type PackageStatus = 'received' | 'notified' | 'released' | 'returned';

/** Amenity booking lifecycle status. */
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

/** Announcement publishing status. */
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

/** Notification delivery channel. */
export type NotificationChannel = 'email' | 'sms' | 'push' | 'voice';

/** Priority level for events, maintenance requests, etc. */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

/** Pagination metadata returned with list endpoints. */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of matching items */
  total: number;
  /** Total number of pages */
  totalPages: number;
}

/** Standard success response wrapper. */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  requestId: string;
}

/** Individual field-level validation error. */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/** Standard error response wrapper. */
export interface ApiError {
  error: string;
  message: string;
  code: string;
  requestId: string;
  fields?: FieldError[];
}

// ---------------------------------------------------------------------------
// Pagination & Filtering Params
// ---------------------------------------------------------------------------

/** Common pagination parameters for list endpoints. */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Common date range filter. */
export interface DateRangeParams {
  from?: string;
  to?: string;
}

/** Common search parameters. */
export interface SearchParams extends PaginationParams {
  query?: string;
}

// ---------------------------------------------------------------------------
// Core Entity Types (pre-Prisma)
// ---------------------------------------------------------------------------

/** Base fields shared across all entities. */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** User entity (basic type used before Prisma generates its own). */
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  propertyId: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
}

/** Property entity. */
export interface Property extends BaseEntity {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  unitCount: number;
  isActive: boolean;
}

/** Unit entity. */
export interface Unit extends BaseEntity {
  propertyId: string;
  number: string;
  floor: number;
  building: string | null;
  customFields: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/** Makes selected keys of T optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Extracts the data type from an ApiResponse. */
export type ExtractData<T> = T extends ApiResponse<infer U> ? U : never;

/** Branded type helper for nominal typing (e.g., UUID, Email). */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** Branded UUID string type. */
export type UUID = Brand<string, 'UUID'>;

/** Branded Email string type. */
export type Email = Brand<string, 'Email'>;
