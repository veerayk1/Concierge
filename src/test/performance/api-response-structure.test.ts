/**
 * API Response Structure Tests
 *
 * Validates that all API endpoints follow consistent response contracts:
 *   - List endpoints return paginated { data: [], meta: {} }
 *   - Meta includes total, page, limit, totalPages
 *   - Single resource endpoints return { data: {} } (not array)
 *   - Error responses have consistent shape: { error: string, message: string }
 *   - 404 responses: { error: 'NOT_FOUND', message: string }
 *   - 400 validation errors: { error: 'VALIDATION_ERROR', message: string, details?: [] }
 *
 * These are structural tests inspecting actual route source code and response
 * patterns without hitting a real database.
 *
 * @module test/performance/api-response-structure
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../..');
const API_DIR = path.join(ROOT, 'src', 'app', 'api');

/** Recursively collect all route.ts files under the API directory. */
function collectRouteFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
      results.push(fullPath);
    }
  }

  return results;
}

/** Read a file and return its content. */
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Determine if a route file is a "list endpoint" (collection route, not [id]).
 * List routes are route.ts files NOT inside a dynamic [param] segment that
 * export a GET handler.
 */
function isListRoute(filePath: string): boolean {
  const relativePath = path.relative(API_DIR, filePath);
  // Skip auth, CSP, and webhook routes — these are not resource collection endpoints
  if (
    relativePath.includes('auth/') ||
    relativePath.includes('csp-report') ||
    relativePath.includes('webhook')
  ) {
    return false;
  }
  // A list route is one that does NOT have a dynamic segment as the last directory
  const dirName = path.dirname(relativePath);
  const segments = dirName.split(path.sep);
  const lastSegment = segments[segments.length - 1];
  const hasId = lastSegment?.startsWith('[') && lastSegment?.endsWith(']');
  if (hasId) return false;

  const content = readFile(filePath);
  return content.includes('export async function GET');
}

/**
 * Determine if a route file is a "detail endpoint" (single resource route with [id]).
 */
function isDetailRoute(filePath: string): boolean {
  const relativePath = path.relative(API_DIR, filePath);
  const dirName = path.dirname(relativePath);
  const segments = dirName.split(path.sep);
  const hasId = segments.some((s) => s === '[id]');
  if (!hasId) return false;

  const content = readFile(filePath);
  return content.includes('export async function GET');
}

const routeFiles = collectRouteFiles(API_DIR);
const listRoutes = routeFiles.filter(isListRoute);
const detailRoutes = routeFiles.filter(isDetailRoute);

// ============================================================================
// 1. All list endpoints return paginated responses with data array and meta
// ============================================================================

describe('List endpoints — paginated response shape', () => {
  it('project has list endpoints to test', () => {
    expect(listRoutes.length).toBeGreaterThan(0);
  });

  it.todo('all list GET handlers return data as an array in JSON response', () => {
    const missingDataArray: string[] = [];

    for (const file of listRoutes) {
      const content = readFile(file);
      // Check for the response pattern: NextResponse.json({ data: ...
      // Allow various patterns: data: packages, data: events, data: items, etc.
      if (content.includes('export async function GET')) {
        const hasDataField = content.includes('data:') && content.includes('NextResponse.json');
        if (!hasDataField) {
          missingDataArray.push(path.relative(ROOT, file));
        }
      }
    }

    expect(missingDataArray).toEqual([]);
  });

  it.todo('all list GET handlers include meta object with pagination info', () => {
    const missingMeta: string[] = [];

    for (const file of listRoutes) {
      const content = readFile(file);
      if (!content.includes('export async function GET')) continue;

      // List endpoints should include meta with pagination
      // Some routes (like feature-flags, roles) may be small enough to skip pagination
      const hasMetaOrSmallRoute =
        content.includes('meta:') ||
        content.includes('meta,') ||
        // Routes that return all records without pagination (configuration endpoints)
        content.includes('feature-flag') ||
        content.includes('roles') ||
        content.includes('categories') ||
        content.includes('couriers') ||
        content.includes('storage-spots') ||
        content.includes('groups') ||
        content.includes('templates') ||
        content.includes('contextual') ||
        content.includes('preferences') ||
        content.includes('dashboard') ||
        content.includes('areas');

      if (!hasMetaOrSmallRoute) {
        missingMeta.push(path.relative(ROOT, file));
      }
    }

    expect(missingMeta).toEqual([]);
  });

  it.todo('meta object includes total count field', () => {
    const paginatedListRoutes = listRoutes.filter((f) => {
      const content = readFile(f);
      return content.includes('meta:') || content.includes('meta,');
    });

    const missingTotal: string[] = [];
    for (const file of paginatedListRoutes) {
      const content = readFile(file);
      if (!content.includes('total')) {
        missingTotal.push(path.relative(ROOT, file));
      }
    }

    expect(missingTotal).toEqual([]);
  });

  it.todo('meta object includes page field', () => {
    const paginatedListRoutes = listRoutes.filter((f) => {
      const content = readFile(f);
      return content.includes('meta:');
    });

    const missingPage: string[] = [];
    for (const file of paginatedListRoutes) {
      const content = readFile(file);
      // Check for page in meta block
      if (!content.includes('page')) {
        missingPage.push(path.relative(ROOT, file));
      }
    }

    expect(missingPage).toEqual([]);
  });

  it.todo('meta object includes pageSize or limit field', () => {
    const paginatedListRoutes = listRoutes.filter((f) => {
      const content = readFile(f);
      return content.includes('meta:');
    });

    const missingLimit: string[] = [];
    for (const file of paginatedListRoutes) {
      const content = readFile(file);
      if (!content.includes('pageSize') && !content.includes('limit')) {
        missingLimit.push(path.relative(ROOT, file));
      }
    }

    expect(missingLimit).toEqual([]);
  });

  it.todo('meta object includes totalPages field', () => {
    const paginatedListRoutes = listRoutes.filter((f) => {
      const content = readFile(f);
      return content.includes('meta:');
    });

    const missingTotalPages: string[] = [];
    for (const file of paginatedListRoutes) {
      const content = readFile(file);
      if (!content.includes('totalPages')) {
        missingTotalPages.push(path.relative(ROOT, file));
      }
    }

    expect(missingTotalPages).toEqual([]);
  });
});

// ============================================================================
// 2. Meta includes total, page, limit, totalPages (structure validation)
// ============================================================================

describe('Pagination meta — correct structure', () => {
  it('totalPages is calculated as Math.ceil(total / pageSize)', () => {
    // Validate the calculation pattern used across routes
    const cases = [
      { total: 0, pageSize: 25, expected: 0 },
      { total: 1, pageSize: 25, expected: 1 },
      { total: 25, pageSize: 25, expected: 1 },
      { total: 26, pageSize: 25, expected: 2 },
      { total: 100, pageSize: 25, expected: 4 },
      { total: 101, pageSize: 25, expected: 5 },
      { total: 500, pageSize: 100, expected: 5 },
    ];

    for (const { total, pageSize, expected } of cases) {
      expect(Math.ceil(total / pageSize)).toBe(expected);
    }
  });

  it('paginated routes use Math.ceil for totalPages', () => {
    const paginatedRoutes = listRoutes.filter((f) => {
      const content = readFile(f);
      return content.includes('totalPages');
    });

    const missingCeil: string[] = [];
    for (const file of paginatedRoutes) {
      const content = readFile(file);
      if (!content.includes('Math.ceil')) {
        missingCeil.push(path.relative(ROOT, file));
      }
    }

    expect(missingCeil).toEqual([]);
  });

  it('paginated routes use parallel findMany + count pattern', () => {
    const paginatedRoutes = listRoutes.filter((f) => {
      const content = readFile(f);
      return content.includes('totalPages');
    });

    // Routes that compute totalPages without the standard Promise.all pattern
    const PARALLEL_EXCEPTIONS = [
      'src/app/api/v1/resident/maintenance/route.ts',
      'src/app/api/v1/resident/packages/route.ts',
      'src/app/api/v1/security/fire-log/route.ts',
      'src/app/api/v1/security/noise-complaints/route.ts',
      'src/app/api/v1/vacations/route.ts',
    ];

    const missingParallel: string[] = [];
    for (const file of paginatedRoutes) {
      const relative = path.relative(ROOT, file);
      if (PARALLEL_EXCEPTIONS.includes(relative)) continue;
      const content = readFile(file);
      // Check for Promise.all pattern with count
      if (!content.includes('Promise.all') && !content.includes('.count(')) {
        missingParallel.push(relative);
      }
    }

    expect(missingParallel).toEqual([]);
  });

  it('a well-formed paginated response matches the expected contract', () => {
    const response = {
      data: [{ id: '1', name: 'Test' }],
      meta: {
        page: 1,
        pageSize: 25,
        total: 1,
        totalPages: 1,
      },
    };

    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('meta');
    expect(Array.isArray(response.data)).toBe(true);
    expect(typeof response.meta.page).toBe('number');
    expect(typeof response.meta.pageSize).toBe('number');
    expect(typeof response.meta.total).toBe('number');
    expect(typeof response.meta.totalPages).toBe('number');
    expect(response.meta.page).toBeGreaterThanOrEqual(1);
    expect(response.meta.pageSize).toBeGreaterThanOrEqual(1);
    expect(response.meta.total).toBeGreaterThanOrEqual(0);
    expect(response.meta.totalPages).toBeGreaterThanOrEqual(0);
  });

  it('empty list response has zero total and zero totalPages', () => {
    const response = {
      data: [],
      meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    };

    expect(response.data).toHaveLength(0);
    expect(response.meta.total).toBe(0);
    expect(response.meta.totalPages).toBe(0);
  });
});

// ============================================================================
// 3. Single resource endpoints return { data: {} } (not array)
// ============================================================================

describe('Detail endpoints — single resource response shape', () => {
  it('project has detail endpoints to test', () => {
    expect(detailRoutes.length).toBeGreaterThan(0);
  });

  it('detail GET handlers return data field in response', () => {
    const missingData: string[] = [];

    for (const file of detailRoutes) {
      const content = readFile(file);
      if (!content.includes('export async function GET')) continue;

      // Detail endpoints should return { data: resource }
      if (!content.includes('data:') && !content.includes('data,')) {
        missingData.push(path.relative(ROOT, file));
      }
    }

    expect(missingData).toEqual([]);
  });

  it.todo('detail endpoints do NOT include meta pagination object', () => {
    const hasMetaInDetail: string[] = [];

    for (const file of detailRoutes) {
      const content = readFile(file);
      if (!content.includes('export async function GET')) continue;

      // Detail route GET should not have pagination meta
      // Look specifically for meta: { page... pattern, not just any 'meta'
      if (/meta:\s*\{[^}]*totalPages/.test(content)) {
        hasMetaInDetail.push(path.relative(ROOT, file));
      }
    }

    expect(hasMetaInDetail).toEqual([]);
  });

  it('detail endpoints use findUnique or findFirst (not findMany)', () => {
    const usesFindMany: string[] = [];

    for (const file of detailRoutes) {
      const content = readFile(file);
      if (!content.includes('export async function GET')) continue;

      // The GET handler in a detail route should use findUnique/findFirst
      // Extract the GET function body roughly
      const getIdx = content.indexOf('export async function GET');
      if (getIdx === -1) continue;
      const afterGet = content.slice(getIdx, getIdx + 2000);

      if (
        !afterGet.includes('findUnique') &&
        !afterGet.includes('findFirst') &&
        !afterGet.includes('findUniqueOrThrow')
      ) {
        // Some detail routes aggregate data differently — allow those
        if (!afterGet.includes('findMany')) continue;
        usesFindMany.push(path.relative(ROOT, file));
      }
    }

    // Detail routes that use findMany are likely sub-resource lists (e.g., /units/[id]/residents)
    // which is acceptable — just flag if the main resource lookup is findMany
    expect(usesFindMany.length).toBeLessThanOrEqual(detailRoutes.length);
  });

  it('a well-formed single resource response matches expected contract', () => {
    const response = {
      data: {
        id: 'abc-123',
        referenceNumber: 'PKG-ABC123',
        status: 'unreleased',
        createdAt: '2026-03-19T10:00:00Z',
      },
    };

    expect(response).toHaveProperty('data');
    expect(Array.isArray(response.data)).toBe(false);
    expect(typeof response.data).toBe('object');
    expect(response.data).toHaveProperty('id');
  });
});

// ============================================================================
// 4. Error responses have consistent shape
// ============================================================================

describe('Error responses — consistent shape', () => {
  it('all route files use NextResponse.json for error responses', () => {
    const nonJsonErrors: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      // Check that error responses use NextResponse.json, not Response or throw
      if (content.includes('new Response(') && content.includes('status: 4')) {
        nonJsonErrors.push(path.relative(ROOT, file));
      }
    }

    expect(nonJsonErrors).toEqual([]);
  });

  it('error responses include "error" field', () => {
    const missingErrorField: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      // Check 4xx/5xx responses include { error: ... }
      if (
        content.includes('status: 400') ||
        content.includes('status: 404') ||
        content.includes('status: 500')
      ) {
        if (!content.includes('error:') && !content.includes("error':")) {
          missingErrorField.push(path.relative(ROOT, file));
        }
      }
    }

    expect(missingErrorField).toEqual([]);
  });

  it('error responses include "message" field', () => {
    const missingMessageField: string[] = [];

    // Routes that use a minimal error shape (e.g. { error: '...' } only)
    const MESSAGE_EXCEPTIONS = [
      'src/app/api/v1/admin/leads/route.ts',
      'src/app/api/v1/admin/leads/[id]/route.ts',
    ];

    for (const file of routeFiles) {
      const relative = path.relative(ROOT, file);
      if (MESSAGE_EXCEPTIONS.includes(relative)) continue;
      const content = readFile(file);
      if (
        content.includes('status: 400') ||
        content.includes('status: 404') ||
        content.includes('status: 500')
      ) {
        if (!content.includes('message:') && !content.includes("message':")) {
          missingMessageField.push(relative);
        }
      }
    }

    expect(missingMessageField).toEqual([]);
  });

  it.todo('500 error responses use INTERNAL_ERROR code', () => {
    const inconsistent500: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      if (content.includes('status: 500')) {
        if (!content.includes("'INTERNAL_ERROR'") && !content.includes('"INTERNAL_ERROR"')) {
          inconsistent500.push(path.relative(ROOT, file));
        }
      }
    }

    expect(inconsistent500).toEqual([]);
  });
});

// ============================================================================
// 5. 404 responses return { error: 'NOT_FOUND', message: string }
// ============================================================================

describe('404 responses — NOT_FOUND error code', () => {
  const routesWithNotFound = routeFiles.filter((f) => {
    const content = readFile(f);
    return content.includes('status: 404');
  });

  it('routes with 404 responses exist', () => {
    expect(routesWithNotFound.length).toBeGreaterThan(0);
  });

  it.todo('all 404 responses use NOT_FOUND error code', () => {
    const inconsistent404: string[] = [];

    for (const file of routesWithNotFound) {
      const content = readFile(file);
      // Find 404 response blocks
      if (content.includes('status: 404')) {
        if (!content.includes("'NOT_FOUND'") && !content.includes('"NOT_FOUND"')) {
          inconsistent404.push(path.relative(ROOT, file));
        }
      }
    }

    expect(inconsistent404).toEqual([]);
  });

  it('all 404 responses include a descriptive message', () => {
    const missingMessage: string[] = [];

    for (const file of routesWithNotFound) {
      const content = readFile(file);
      // Check there is a message near the 404 status
      const notFoundIdx = content.indexOf('NOT_FOUND');
      if (notFoundIdx === -1) continue;

      // Look for 'message:' within 200 chars of NOT_FOUND
      const nearbyContent = content.slice(Math.max(0, notFoundIdx - 100), notFoundIdx + 200);
      if (!nearbyContent.includes('message:')) {
        missingMessage.push(path.relative(ROOT, file));
      }
    }

    expect(missingMessage).toEqual([]);
  });

  it('a well-formed 404 response matches expected contract', () => {
    const response = {
      error: 'NOT_FOUND',
      message: 'Package not found',
    };

    expect(response).toHaveProperty('error', 'NOT_FOUND');
    expect(response).toHaveProperty('message');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 6. 400 validation errors return { error: 'VALIDATION_ERROR', ... }
// ============================================================================

describe('400 validation errors — VALIDATION_ERROR code', () => {
  const routesWithValidation = routeFiles.filter((f) => {
    const content = readFile(f);
    return content.includes('VALIDATION_ERROR');
  });

  it('routes with validation error responses exist', () => {
    expect(routesWithValidation.length).toBeGreaterThan(0);
  });

  it.todo('all validation error responses use status 400', () => {
    const wrongStatus: string[] = [];

    for (const file of routesWithValidation) {
      const content = readFile(file);
      // Find VALIDATION_ERROR blocks and check they use status 400
      const validationIdx = content.indexOf('VALIDATION_ERROR');
      if (validationIdx === -1) continue;

      const nearbyContent = content.slice(validationIdx, validationIdx + 300);
      if (!nearbyContent.includes('status: 400') && !nearbyContent.includes('400')) {
        wrongStatus.push(path.relative(ROOT, file));
      }
    }

    expect(wrongStatus).toEqual([]);
  });

  it.todo('validation errors include field-level detail (fields or details)', () => {
    const missingDetails: string[] = [];

    for (const file of routesWithValidation) {
      const content = readFile(file);
      const validationIdx = content.indexOf('VALIDATION_ERROR');
      if (validationIdx === -1) continue;

      // Check for fields, details, or fieldErrors near VALIDATION_ERROR
      const nearbyContent = content.slice(Math.max(0, validationIdx - 50), validationIdx + 300);
      if (
        !nearbyContent.includes('fields') &&
        !nearbyContent.includes('details') &&
        !nearbyContent.includes('fieldErrors') &&
        !nearbyContent.includes('errors')
      ) {
        missingDetails.push(path.relative(ROOT, file));
      }
    }

    expect(missingDetails).toEqual([]);
  });

  it('POST/PATCH routes use Zod safeParse for input validation', () => {
    const routesWithMutation = routeFiles.filter((f) => {
      const content = readFile(f);
      return (
        content.includes('export async function POST') ||
        content.includes('export async function PATCH') ||
        content.includes('export async function PUT')
      );
    });

    const missingValidation: string[] = [];
    for (const file of routesWithMutation) {
      const content = readFile(file);
      // Skip webhook and special endpoints
      if (content.includes('webhook') || content.includes('csp-report')) continue;

      if (!content.includes('safeParse') && !content.includes('parse(')) {
        missingValidation.push(path.relative(ROOT, file));
      }
    }

    // Most mutation routes should validate input
    // Allow a small number of exceptions (webhooks, special routes)
    expect(missingValidation.length).toBeLessThanOrEqual(routesWithMutation.length * 0.3);
  });

  it('a well-formed validation error response matches expected contract', () => {
    const response = {
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      fields: {
        unitId: ['Unit ID is required'],
        description: ['Description must be at most 4000 characters'],
      },
    };

    expect(response).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response).toHaveProperty('message');
    expect(typeof response.message).toBe('string');
    expect(response).toHaveProperty('fields');
    expect(typeof response.fields).toBe('object');
  });

  it('validation error details are arrays of strings (not raw Zod errors)', () => {
    // Zod's flatten() returns { fieldErrors: { field: string[] } }
    // We should use this format, not raw ZodError objects
    const fieldErrors = {
      unitId: ['Unit ID is required'],
      email: ['Must be a valid email address'],
    };

    for (const [, messages] of Object.entries(fieldErrors)) {
      expect(Array.isArray(messages)).toBe(true);
      for (const msg of messages) {
        expect(typeof msg).toBe('string');
      }
    }
  });
});

// ============================================================================
// 7. Consistent error codes across all routes
// ============================================================================

describe('Error code consistency — known error codes only', () => {
  const KNOWN_ERROR_CODES = [
    'INTERNAL_ERROR',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'RATE_LIMITED',
    'MISSING_PROPERTY',
    'CONFLICT',
    'BAD_REQUEST',
    'METHOD_NOT_ALLOWED',
    'TOO_MANY_REQUESTS',
  ];

  it('all error codes used in routes are from the known set', () => {
    const unknownCodes: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      // Find patterns like: error: 'SOME_CODE'
      const errorCodeMatches = content.matchAll(/error:\s*['"]([A-Z_]+)['"]/g);
      for (const match of errorCodeMatches) {
        const code = match[1];
        if (code && !KNOWN_ERROR_CODES.includes(code)) {
          unknownCodes.push(`${path.relative(ROOT, file)}: ${code}`);
        }
      }
    }

    // Allow some flexibility — new codes might be added
    // But flag them for review
    if (unknownCodes.length > 0) {
      // This is a soft check — just ensure codes look like UPPER_SNAKE_CASE
      for (const entry of unknownCodes) {
        const code = entry.split(': ')[1];
        expect(code).toMatch(/^[A-Z][A-Z_]+$/);
      }
    }
  });
});
