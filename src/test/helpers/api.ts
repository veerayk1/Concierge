/**
 * Concierge — API Test Helper
 *
 * Utilities for creating NextRequest objects and parsing NextResponse
 * for testing API route handlers directly (without HTTP server).
 *
 * @module test/helpers/api
 */

import { NextRequest } from 'next/server';
import type { ApiResponse, ApiError } from '@/types';
import { API_VERSIONING } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Request Builder
// ---------------------------------------------------------------------------

export interface CreateTestRequestOptions {
  /** HTTP method (default: 'GET') */
  method?: string;
  /** Request body — will be JSON.stringify'd */
  body?: unknown;
  /** Additional headers to merge */
  headers?: Record<string, string>;
  /** URL search params */
  searchParams?: Record<string, string>;
}

/**
 * Creates a NextRequest suitable for testing Next.js App Router API routes.
 *
 * @param path - Route path (e.g., '/api/v1/events' or just '/events')
 * @param options - Request configuration
 * @returns NextRequest instance
 *
 * @example
 * ```ts
 * const req = createTestRequest('/api/v1/events', {
 *   method: 'POST',
 *   body: { title: 'Package arrived', eventTypeId: '...' },
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 * const response = await POST(req);
 * ```
 */
export function createTestRequest(
  path: string,
  options: CreateTestRequestOptions = {},
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  // Normalize path: ensure it starts with /api/v1 if not already
  const normalizedPath = path.startsWith('/api')
    ? path
    : `${API_VERSIONING.prefix}${path.startsWith('/') ? path : `/${path}`}`;

  // Build URL with search params
  const url = new URL(normalizedPath, 'http://localhost:3000');
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...headers,
  };

  // Build init
  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Attach body for non-GET requests
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

// ---------------------------------------------------------------------------
// Response Parser
// ---------------------------------------------------------------------------

/**
 * Extracts and parses JSON from a Response (NextResponse or standard Response).
 *
 * @param response - The Response object from a route handler
 * @returns Parsed JSON body
 *
 * @example
 * ```ts
 * const response = await GET(req);
 * const body = await parseResponse<ApiResponse<Event[]>>(response);
 * expect(body.data).toHaveLength(5);
 * ```
 */
export async function parseResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Failed to parse response as JSON.\n` +
        `Status: ${response.status}\n` +
        `Body: ${text.slice(0, 500)}`,
    );
  }
}

/**
 * Parses a successful API response and extracts the data payload.
 * Asserts that the response status is 2xx.
 */
export async function parseSuccessResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status < 200 || response.status >= 300) {
    const errorBody = await response.text();
    throw new Error(
      `Expected 2xx response, got ${response.status}.\n` + `Body: ${errorBody.slice(0, 500)}`,
    );
  }

  return parseResponse<ApiResponse<T>>(response);
}

/**
 * Parses an error API response and extracts the error payload.
 * Asserts that the response status is 4xx or 5xx.
 */
export async function parseErrorResponse(response: Response): Promise<ApiError> {
  if (response.status < 400) {
    const body = await response.text();
    throw new Error(
      `Expected 4xx/5xx error response, got ${response.status}.\n` + `Body: ${body.slice(0, 500)}`,
    );
  }

  return parseResponse<ApiError>(response);
}

// ---------------------------------------------------------------------------
// Convenience Request Creators
// ---------------------------------------------------------------------------

/**
 * Creates a GET request with optional auth and query params.
 */
export function createGetRequest(
  path: string,
  options: {
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  return createTestRequest(path, { method: 'GET', ...options });
}

/**
 * Creates a POST request with a JSON body.
 */
export function createPostRequest(
  path: string,
  body: unknown,
  options: {
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  return createTestRequest(path, { method: 'POST', body, ...options });
}

/**
 * Creates a PUT request with a JSON body.
 */
export function createPutRequest(
  path: string,
  body: unknown,
  options: {
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  return createTestRequest(path, { method: 'PUT', body, ...options });
}

/**
 * Creates a PATCH request with a JSON body.
 */
export function createPatchRequest(
  path: string,
  body: unknown,
  options: {
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  return createTestRequest(path, { method: 'PATCH', body, ...options });
}

/**
 * Creates a DELETE request.
 */
export function createDeleteRequest(
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): NextRequest {
  return createTestRequest(path, { method: 'DELETE', ...options });
}

// ---------------------------------------------------------------------------
// Assertion Helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that a response has a specific status code and returns the parsed body.
 */
export async function expectStatus<T = unknown>(
  response: Response,
  expectedStatus: number,
): Promise<T> {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}.\n` +
        `Body: ${body.slice(0, 500)}`,
    );
  }

  return parseResponse<T>(response);
}

/**
 * Asserts that an error response contains a specific error code.
 */
export async function expectErrorCode(response: Response, expectedCode: string): Promise<ApiError> {
  const error = await parseErrorResponse(response);

  if (error.code !== expectedCode) {
    throw new Error(
      `Expected error code "${expectedCode}", got "${error.code}".\n` + `Message: ${error.message}`,
    );
  }

  return error;
}
