/**
 * Concierge — Shared Zod Validation Schemas
 *
 * Reusable schemas imported by both API routes and frontend forms.
 * Single source of truth for validation rules (Security Rulebook C.1.2).
 *
 * @module schemas/common
 */

import { z } from 'zod';

import { FIELD_LENGTHS, PAGINATION } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Primitive Schemas
// ---------------------------------------------------------------------------

/** UUID v4 string. */
export const uuidSchema = z.string().uuid('Must be a valid UUID').describe('UUID v4 identifier');

/** Email address. Max 254 chars per RFC 5321. */
export const emailSchema = z
  .string()
  .email('Must be a valid email address')
  .max(FIELD_LENGTHS.email, `Email must be at most ${FIELD_LENGTHS.email} characters`)
  .transform((val) => val.toLowerCase().trim())
  .describe('Email address');

/**
 * International phone number.
 * Accepts formats like: +1234567890, +1-234-567-8901, +44 20 7946 0958
 */
export const phoneSchema = z
  .string()
  .min(7, 'Phone number is too short')
  .max(FIELD_LENGTHS.phone, `Phone number must be at most ${FIELD_LENGTHS.phone} characters`)
  .regex(
    /^\+?[1-9]\d{0,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}$/,
    'Must be a valid phone number (e.g. +1-234-567-8901)',
  )
  .describe('International phone number');

/** Postal code (Canadian or US format). */
export const postalCodeSchema = z
  .string()
  .min(3, 'Postal code is too short')
  .max(
    FIELD_LENGTHS.postalCode,
    `Postal code must be at most ${FIELD_LENGTHS.postalCode} characters`,
  )
  .regex(
    // eslint-disable-next-line security/detect-unsafe-regex
    /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$|^\d{5}(-\d{4})?$/,
    'Must be a valid postal code (e.g. M5V 2T6 or 90210)',
  )
  .describe('Postal code');

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Pagination query parameters. */
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Page must be a whole number')
    .min(PAGINATION.minPage, `Page must be at least ${PAGINATION.minPage}`)
    .default(PAGINATION.minPage),
  pageSize: z
    .number()
    .int('Page size must be a whole number')
    .min(1, 'Page size must be at least 1')
    .max(PAGINATION.maxPageSize, `Page size cannot exceed ${PAGINATION.maxPageSize}`)
    .default(PAGINATION.defaultPageSize),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Coerced pagination schema for query string parsing.
 * Query params arrive as strings, so we coerce to numbers.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(PAGINATION.minPage).default(PAGINATION.minPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---------------------------------------------------------------------------
// Date Range
// ---------------------------------------------------------------------------

/** ISO 8601 datetime range filter. */
export const dateRangeSchema = z
  .object({
    from: z.string().datetime('Must be a valid ISO 8601 datetime'),
    to: z.string().datetime('Must be a valid ISO 8601 datetime'),
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: '"from" date must be before or equal to "to" date',
  });

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Global search query. */
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(
      FIELD_LENGTHS.shortText,
      `Search query must be at most ${FIELD_LENGTHS.shortText} characters`,
    )
    .trim(),
});

export type SearchInput = z.infer<typeof searchSchema>;

// ---------------------------------------------------------------------------
// Common Field Schemas
// ---------------------------------------------------------------------------

/** Short name field (e.g. first name, last name). */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(FIELD_LENGTHS.name, `Name must be at most ${FIELD_LENGTHS.name} characters`)
  .trim();

/** Long description field (e.g. maintenance request description). */
export const descriptionSchema = z
  .string()
  .max(
    FIELD_LENGTHS.description,
    `Description must be at most ${FIELD_LENGTHS.description} characters`,
  )
  .trim();

/** Comment / note field. */
export const commentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(FIELD_LENGTHS.comment, `Comment must be at most ${FIELD_LENGTHS.comment} characters`)
  .trim();

/** Unit number field. */
export const unitNumberSchema = z
  .string()
  .min(1, 'Unit number is required')
  .max(
    FIELD_LENGTHS.unitNumber,
    `Unit number must be at most ${FIELD_LENGTHS.unitNumber} characters`,
  )
  .trim();

// ---------------------------------------------------------------------------
// ID Params (common route params)
// ---------------------------------------------------------------------------

/** Single UUID path parameter. */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/** Property-scoped UUID path parameters. */
export const propertyIdParamSchema = z.object({
  propertyId: uuidSchema,
});

/** Resource within a property. */
export const propertyResourceParamSchema = z.object({
  propertyId: uuidSchema,
  id: uuidSchema,
});
