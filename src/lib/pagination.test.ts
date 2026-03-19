/**
 * Concierge — Pagination Utility Tests
 *
 * Tests for parsePagination and buildPaginationMeta helpers.
 * These utilities are used across all listing APIs to ensure
 * consistent pagination behaviour and abuse prevention.
 *
 * @module lib/pagination.test
 */

import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginationMeta } from './pagination';

// ---------------------------------------------------------------------------
// parsePagination
// ---------------------------------------------------------------------------

describe('parsePagination', () => {
  it('extracts page and limit from query params', () => {
    const params = new URLSearchParams({ page: '3', limit: '20' });
    const result = parsePagination(params);

    expect(result.page).toBe(3);
    expect(result.limit).toBe(20);
  });

  it('defaults to page=1, limit=25 when params are missing', () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('caps limit at 100 to prevent abuse', () => {
    const params = new URLSearchParams({ limit: '500' });
    const result = parsePagination(params);

    expect(result.limit).toBe(100);
  });

  it('enforces minimum limit of 1', () => {
    const params = new URLSearchParams({ limit: '0' });
    const result = parsePagination(params);

    expect(result.limit).toBe(1);
  });

  it('enforces minimum limit of 1 for negative values', () => {
    const params = new URLSearchParams({ limit: '-5' });
    const result = parsePagination(params);

    expect(result.limit).toBe(1);
  });

  it('enforces minimum page of 1', () => {
    const params = new URLSearchParams({ page: '0' });
    const result = parsePagination(params);

    expect(result.page).toBe(1);
  });

  it('enforces minimum page of 1 for negative values', () => {
    const params = new URLSearchParams({ page: '-3' });
    const result = parsePagination(params);

    expect(result.page).toBe(1);
  });

  it('handles non-numeric values by using defaults', () => {
    const params = new URLSearchParams({ page: 'abc', limit: 'xyz' });
    const result = parsePagination(params);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('returns correct skip value for database offset', () => {
    const params = new URLSearchParams({ page: '3', limit: '10' });
    const result = parsePagination(params);

    // Page 3, 10 per page => skip 20
    expect(result.skip).toBe(20);
  });

  it('returns skip=0 for page 1', () => {
    const params = new URLSearchParams({ page: '1', limit: '25' });
    const result = parsePagination(params);

    expect(result.skip).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildPaginationMeta
// ---------------------------------------------------------------------------

describe('buildPaginationMeta', () => {
  it('returns total, page, limit, totalPages, hasNext, hasPrev', () => {
    const meta = buildPaginationMeta({ total: 100, page: 2, limit: 25 });

    expect(meta).toEqual({
      total: 100,
      page: 2,
      limit: 25,
      totalPages: 4,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('calculates totalPages using ceil division', () => {
    // 27 items / 10 per page = 3 pages (ceil(2.7))
    const meta = buildPaginationMeta({ total: 27, page: 1, limit: 10 });

    expect(meta.totalPages).toBe(3);
  });

  it('returns totalPages=1 when total fits in one page', () => {
    const meta = buildPaginationMeta({ total: 5, page: 1, limit: 25 });

    expect(meta.totalPages).toBe(1);
  });

  it('returns totalPages=0 when total is 0', () => {
    const meta = buildPaginationMeta({ total: 0, page: 1, limit: 25 });

    expect(meta.totalPages).toBe(0);
  });

  it('hasNext is false on the last page', () => {
    const meta = buildPaginationMeta({ total: 50, page: 2, limit: 25 });

    expect(meta.hasNext).toBe(false);
  });

  it('hasNext is true when not on the last page', () => {
    const meta = buildPaginationMeta({ total: 51, page: 2, limit: 25 });

    expect(meta.hasNext).toBe(true);
  });

  it('hasPrev is false on the first page', () => {
    const meta = buildPaginationMeta({ total: 100, page: 1, limit: 25 });

    expect(meta.hasPrev).toBe(false);
  });

  it('hasPrev is true when not on the first page', () => {
    const meta = buildPaginationMeta({ total: 100, page: 2, limit: 25 });

    expect(meta.hasPrev).toBe(true);
  });

  it('handles edge case: page beyond total pages', () => {
    const meta = buildPaginationMeta({ total: 10, page: 5, limit: 25 });

    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });
});
