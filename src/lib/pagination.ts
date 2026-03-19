/**
 * Concierge — Pagination Utility
 *
 * Shared helpers for parsing pagination params from URL search params
 * and building standardised pagination metadata for API responses.
 *
 * Used by every listing API route to ensure consistent behaviour:
 * - Default page=1, limit=25
 * - Maximum limit=100 (abuse prevention)
 * - Minimum limit=1, page=1
 *
 * @module lib/pagination
 */

import { PAGINATION } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedPagination {
  /** Current page number (1-indexed, minimum 1) */
  page: number;
  /** Items per page (1..100, default 25) */
  limit: number;
  /** Database offset: (page - 1) * limit */
  skip: number;
}

export interface PaginationMetaInput {
  /** Total number of matching items in the database */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
}

export interface PaginationMetaOutput {
  /** Total number of matching items */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

// ---------------------------------------------------------------------------
// parsePagination
// ---------------------------------------------------------------------------

/**
 * Extracts and validates `page` and `limit` from URL search params.
 *
 * - Defaults: page=1, limit=25
 * - Limit is clamped to [1, 100]
 * - Page is clamped to minimum 1
 * - Non-numeric values fall back to defaults
 *
 * @param searchParams - URLSearchParams from the request URL
 * @returns Validated pagination values with computed `skip` offset
 */
export function parsePagination(searchParams: URLSearchParams): ParsedPagination {
  const rawPage = searchParams.get('page');
  const rawLimit = searchParams.get('limit');

  let page = rawPage ? parseInt(rawPage, 10) : PAGINATION.minPage;
  let limit = rawLimit ? parseInt(rawLimit, 10) : PAGINATION.defaultPageSize;

  // Handle NaN from non-numeric input
  if (Number.isNaN(page)) page = PAGINATION.minPage;
  if (Number.isNaN(limit)) limit = PAGINATION.defaultPageSize;

  // Clamp values
  page = Math.max(PAGINATION.minPage, page);
  limit = Math.max(1, Math.min(PAGINATION.maxPageSize, limit));

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// ---------------------------------------------------------------------------
// buildPaginationMeta
// ---------------------------------------------------------------------------

/**
 * Builds standardised pagination metadata for API responses.
 *
 * @param input - Total count, current page, and limit
 * @returns Pagination metadata including totalPages, hasNext, hasPrev
 */
export function buildPaginationMeta(input: PaginationMetaInput): PaginationMetaOutput {
  const { total, page, limit } = input;

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  };
}
