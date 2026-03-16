/**
 * Concierge — Application Error Classes
 *
 * Structured error hierarchy for consistent API error responses.
 * All errors extend `AppError` which carries an HTTP status code,
 * a machine-readable error code, and an operational flag.
 *
 * The `toErrorResponse` function converts any thrown value into a
 * safe JSON payload suitable for API responses (no stack traces in
 * production, no internal details leaked).
 */

import type { ApiError, FieldError } from '@/types';

// ---------------------------------------------------------------------------
// Base Error
// ---------------------------------------------------------------------------

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  /**
   * Operational errors are expected (bad input, auth failure, etc.).
   * Non-operational errors indicate bugs and should trigger alerts.
   */
  readonly isOperational: boolean;

  constructor(message: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Concrete Errors
// ---------------------------------------------------------------------------

export class AuthError extends AppError {
  readonly statusCode = 401 as const;
  readonly code = 'AUTH_ERROR' as const;

  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403 as const;
  readonly code = 'FORBIDDEN' as const;

  constructor(message = 'Insufficient permissions') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404 as const;
  readonly code = 'NOT_FOUND' as const;

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400 as const;
  readonly code = 'VALIDATION_ERROR' as const;
  readonly fields: FieldError[];

  constructor(message = 'Validation failed', fields: FieldError[] = []) {
    super(message);
    this.fields = fields;
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429 as const;
  readonly code = 'RATE_LIMIT_EXCEEDED' as const;

  /** Seconds until the client can retry. */
  readonly retryAfter: number;

  constructor(retryAfter = 60, message = 'Too many requests') {
    super(message);
    this.retryAfter = retryAfter;
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409 as const;
  readonly code = 'CONFLICT' as const;

  constructor(message = 'Resource conflict') {
    super(message);
  }
}

export class InternalError extends AppError {
  readonly statusCode = 500 as const;
  readonly code = 'INTERNAL_ERROR' as const;

  constructor(message = 'Internal server error') {
    super(message, /* isOperational */ false);
  }
}

// ---------------------------------------------------------------------------
// Error → Response Converter
// ---------------------------------------------------------------------------

/**
 * Converts any thrown value into a safe API error response.
 *
 * - `AppError` subclasses are mapped directly.
 * - Native `Error` instances get a 500 status with a generic message.
 * - Unknown values get a 500 status with no details.
 *
 * Stack traces are NEVER included — the requestId is sufficient for
 * correlating errors in server logs.
 */
export function toErrorResponse(
  error: unknown,
  requestId: string,
): { body: ApiError; status: number } {
  if (error instanceof AppError) {
    const body: ApiError = {
      error: error.code,
      message: error.message,
      code: error.code,
      requestId,
    };

    if (error instanceof ValidationError && error.fields.length > 0) {
      body.fields = error.fields;
    }

    return { body, status: error.statusCode };
  }

  // Unexpected errors — never leak internals
  const isNativeError = error instanceof Error;

  return {
    body: {
      error: 'INTERNAL_ERROR',
      message: isNativeError ? 'An unexpected error occurred' : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      requestId,
    },
    status: 500,
  };
}
