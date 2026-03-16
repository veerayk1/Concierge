/**
 * Concierge — Request Validation Middleware
 *
 * Uses Zod schemas to validate and type-narrow request bodies, query
 * parameters, and route params. Throws `ValidationError` on failure
 * with field-level error details.
 *
 * All validators strip unknown fields (Zod `.strip()`) to prevent
 * mass-assignment attacks.
 */

import type { NextRequest } from 'next/server';
import type { ZodSchema, ZodError } from 'zod';

import { ValidationError } from '@/server/errors';
import type { FieldError } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a ZodError into an array of field-level errors for the API response.
 */
function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

// ---------------------------------------------------------------------------
// Body Validation
// ---------------------------------------------------------------------------

/**
 * Parse and validate the JSON body of a request against a Zod schema.
 *
 * - Returns the validated & typed data on success.
 * - Throws `ValidationError` with field-level details on failure.
 * - Strips unknown fields to prevent mass-assignment.
 *
 * @throws {ValidationError} If the body fails schema validation.
 */
export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch {
    throw new ValidationError('Invalid JSON body', [
      { field: 'body', message: 'Request body must be valid JSON', code: 'invalid_type' },
    ]);
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    throw new ValidationError('Request body validation failed', zodToFieldErrors(result.error));
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Query Validation
// ---------------------------------------------------------------------------

/**
 * Parse and validate URL search params against a Zod schema.
 *
 * Query parameters are extracted from `req.nextUrl.searchParams` and
 * converted to a plain object before validation.
 *
 * @throws {ValidationError} If query params fail schema validation.
 */
export async function validateQuery<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const params: Record<string, string> = {};

  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError('Query parameter validation failed', zodToFieldErrors(result.error));
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Route Params Validation
// ---------------------------------------------------------------------------

/**
 * Validate dynamic route parameters (e.g. `[id]`, `[slug]`) against a Zod schema.
 *
 * @param params - The params object from the route handler.
 * @param schema - A Zod schema describing expected params.
 *
 * @throws {ValidationError} If route params fail schema validation.
 */
export async function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>,
): Promise<T> {
  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError('Route parameter validation failed', zodToFieldErrors(result.error));
  }

  return result.data;
}
