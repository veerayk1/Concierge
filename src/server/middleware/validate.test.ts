/**
 * Concierge — Validation Middleware Tests
 *
 * Tests for request body, query param, and route param validation
 * using Zod schemas. Per Security Rulebook C.1.
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { validateBody, validateQuery, validateParams } from '@/server/middleware/validate';
import { ValidationError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createJsonRequest(body: unknown, url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createGetRequest(searchParams: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/test');
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url, { method: 'GET' });
}

// ---------------------------------------------------------------------------
// Test schemas
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(0, 'Age must be non-negative'),
  email: z.string().email('Invalid email').optional(),
});

const querySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be numeric'),
  search: z.string().optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid('Must be a valid UUID'),
});

// ---------------------------------------------------------------------------
// validateBody
// ---------------------------------------------------------------------------

describe('validateBody', () => {
  it('passes valid body through and returns typed data', async () => {
    const req = createJsonRequest({ name: 'Alice', age: 30 });
    const result = await validateBody(req, bodySchema);

    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('strips unknown fields from the body', async () => {
    const req = createJsonRequest({ name: 'Bob', age: 25, malicious: 'payload' });
    const result = await validateBody(req, bodySchema);

    expect(result).not.toHaveProperty('malicious');
    expect(result).toEqual({ name: 'Bob', age: 25 });
  });

  it('throws ValidationError for missing required field', async () => {
    const req = createJsonRequest({ age: 30 }); // missing name

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError with field-level errors', async () => {
    const req = createJsonRequest({ name: '', age: -1 });

    try {
      await validateBody(req, bodySchema);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const err = e as ValidationError;
      expect(err.fields.length).toBeGreaterThan(0);
      expect(err.fields.some((f) => f.field === 'name')).toBe(true);
    }
  });

  it('throws ValidationError for wrong type', async () => {
    const req = createJsonRequest({ name: 'Alice', age: 'not-a-number' });

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{{{',
    });

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });

  it('passes optional fields correctly', async () => {
    const req = createJsonRequest({ name: 'Alice', age: 30, email: 'alice@test.com' });
    const result = await validateBody(req, bodySchema);

    expect(result.email).toBe('alice@test.com');
  });

  it('throws ValidationError for invalid optional field format', async () => {
    const req = createJsonRequest({ name: 'Alice', age: 30, email: 'not-email' });

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// validateQuery
// ---------------------------------------------------------------------------

describe('validateQuery', () => {
  it('passes valid query params through', async () => {
    const req = createGetRequest({ page: '1', search: 'hello' });
    const result = await validateQuery(req, querySchema);

    expect(result).toEqual({ page: '1', search: 'hello' });
  });

  it('throws ValidationError for invalid query params', async () => {
    const req = createGetRequest({ page: 'abc' }); // not numeric

    await expect(validateQuery(req, querySchema)).rejects.toThrow(ValidationError);
  });

  it('handles missing optional query params', async () => {
    const req = createGetRequest({ page: '1' }); // search is optional

    const result = await validateQuery(req, querySchema);
    expect(result.page).toBe('1');
    expect(result.search).toBeUndefined();
  });

  it('throws ValidationError for missing required query param', async () => {
    const req = createGetRequest({}); // page is required

    await expect(validateQuery(req, querySchema)).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// validateParams
// ---------------------------------------------------------------------------

describe('validateParams', () => {
  it('passes valid route params through', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const result = await validateParams(params, paramsSchema);

    expect(result.id).toBe(params.id);
  });

  it('throws ValidationError for invalid UUID param', async () => {
    const params = { id: 'not-a-uuid' };

    await expect(validateParams(params, paramsSchema)).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for missing param', async () => {
    const params = {};

    await expect(validateParams(params as any, paramsSchema)).rejects.toThrow(ValidationError);
  });

  it('includes field name in error details', async () => {
    const params = { id: 'invalid' };

    try {
      await validateParams(params, paramsSchema);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const err = e as ValidationError;
      expect(err.fields.some((f) => f.field === 'id')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('validation edge cases', () => {
  it('handles empty object body', async () => {
    const req = createJsonRequest({});

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });

  it('handles null body', async () => {
    const req = createJsonRequest(null);

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });

  it('handles array body when object expected', async () => {
    const req = createJsonRequest([{ name: 'Alice', age: 30 }]);

    await expect(validateBody(req, bodySchema)).rejects.toThrow(ValidationError);
  });

  it('validates nested objects correctly', async () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1),
        settings: z.object({
          theme: z.enum(['light', 'dark']),
        }),
      }),
    });

    const req = createJsonRequest({
      user: { name: 'Alice', settings: { theme: 'light' } },
    });

    const result = await validateBody(req, nestedSchema);
    expect(result.user.settings.theme).toBe('light');
  });

  it('reports nested field errors with dot notation', async () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1),
      }),
    });

    const req = createJsonRequest({ user: { name: '' } });

    try {
      await validateBody(req, nestedSchema);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const err = e as ValidationError;
      expect(err.fields.some((f) => f.field.includes('name'))).toBe(true);
    }
  });
});
