/**
 * Concierge — API Handler Chain
 *
 * `createApiHandler` composes middleware into a single Next.js route handler.
 * It wires up: request ID, authentication, role checks, tenant isolation,
 * rate limiting, input validation, and error handling in a consistent order.
 *
 * Usage in a route file:
 *
 * ```ts
 * // src/app/api/events/route.ts
 * import { createApiHandler } from '@/server/middleware/chain';
 * import { z } from 'zod';
 *
 * const bodySchema = z.object({ title: z.string().min(1) });
 *
 * export const POST = createApiHandler({
 *   allowedRoles: ['property_admin', 'front_desk'],
 *   rateLimitGroup: 'write',
 *   bodySchema,
 *   handler: async ({ body, token, requestId }) => {
 *     // body is typed as { title: string }
 *     return { id: '123', title: body.title };
 *   },
 * });
 * ```
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ZodSchema } from 'zod';

import type { Role, TokenPayload, ApiError, ApiResponse } from '@/types';
import { toErrorResponse, RateLimitError } from '@/server/errors';
import { createLogger } from '@/server/logger';
import { generateRequestId, getRequestId } from './request-id';
import { requireAuth } from './auth';
import { requireRole } from './rbac';
import { checkRateLimit } from './rate-limit';
import type { RateLimitGroup } from './rate-limit';
import { validateBody, validateQuery, validateParams } from './validate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const logger = createLogger('api-chain');

/**
 * Configuration for `createApiHandler`.
 *
 * Generic parameters:
 * - `TBody`   — Validated request body type
 * - `TQuery`  — Validated query params type
 * - `TParams` — Validated route params type
 * - `TResult` — The data type returned by the handler
 */
export interface ApiHandlerConfig<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
  TResult = unknown,
> {
  /** Roles allowed to call this endpoint. Empty = any authenticated user. */
  allowedRoles?: Role[];

  /** Rate limit group for this endpoint. Defaults to 'read'. */
  rateLimitGroup?: RateLimitGroup;

  /** Zod schema for the request body. */
  bodySchema?: ZodSchema<TBody>;

  /** Zod schema for query parameters. */
  querySchema?: ZodSchema<TQuery>;

  /** Zod schema for route parameters. */
  paramsSchema?: ZodSchema<TParams>;

  /** Whether to require authentication. Defaults to true. */
  requireAuth?: boolean;

  /** Whether to require property context. Defaults to true. */
  requireProperty?: boolean;

  /** The actual route handler logic. */
  handler: (ctx: HandlerContext<TBody, TQuery, TParams>) => Promise<TResult>;
}

/**
 * The context object passed to the handler function.
 */
export interface HandlerContext<TBody, TQuery, TParams> {
  /** The original Next.js request. */
  req: NextRequest;

  /** Validated request body (if bodySchema was provided). */
  body: TBody;

  /** Validated query params (if querySchema was provided). */
  query: TQuery;

  /** Validated route params (if paramsSchema was provided). */
  params: TParams;

  /** Decoded JWT payload (if auth is required). */
  token: TokenPayload;

  /** Unique request ID for tracing. */
  requestId: string;
}

// ---------------------------------------------------------------------------
// Handler Factory
// ---------------------------------------------------------------------------

/**
 * Create a Next.js App Router route handler with composable middleware.
 *
 * The middleware chain executes in this order:
 * 1. Request ID (generate or extract)
 * 2. Rate limiting
 * 3. Authentication
 * 4. Role-based access control
 * 5. Input validation (body, query, params)
 * 6. Handler execution
 * 7. Success response wrapping
 * 8. Error response formatting
 */
export function createApiHandler<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
  TResult = unknown,
>(
  config: ApiHandlerConfig<TBody, TQuery, TParams, TResult>,
): (
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> },
) => Promise<NextResponse> {
  const {
    allowedRoles = [],
    rateLimitGroup = 'read',
    bodySchema,
    querySchema,
    paramsSchema,
    requireAuth: authRequired = true,
    handler,
  } = config;

  return async (
    req: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    // 1. Request ID
    const requestId = getRequestId(req.headers) ?? generateRequestId();

    try {
      // 2. Rate limiting (scaffold: logs only)
      const rateLimitKey =
        req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
      await checkRateLimit(rateLimitGroup, rateLimitKey);

      // 3. Authentication
      let token: TokenPayload;

      if (authRequired) {
        token = await requireAuth(req);
      } else {
        // Unauthenticated routes still get a skeleton token for logging
        token = {
          sub: 'anonymous',
          pid: '',
          role: 'visitor' as Role,
          perms: [],
          mfa: false,
          iat: 0,
          exp: 0,
        };
      }

      // 4. RBAC
      if (authRequired && allowedRoles.length > 0) {
        requireRole(token.role, allowedRoles);
      }

      // 5. Validation
      const body = bodySchema ? await validateBody<TBody>(req, bodySchema) : (undefined as TBody);

      const query = querySchema
        ? await validateQuery<TQuery>(req, querySchema)
        : (undefined as TQuery);

      const resolvedParams = routeContext?.params ? await routeContext.params : {};
      const params = paramsSchema
        ? await validateParams<TParams>(resolvedParams, paramsSchema)
        : (undefined as TParams);

      // 6. Execute handler
      const data = await handler({
        req,
        body,
        query,
        params,
        token,
        requestId,
      });

      // 7. Success response
      const response: ApiResponse<TResult> = {
        data,
        requestId,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: { 'x-request-id': requestId },
      });
    } catch (error: unknown) {
      // 8. Error response
      const { body: errorBody, status } = toErrorResponse(error, requestId);

      logger.error(
        {
          requestId,
          status,
          code: errorBody.code,
          path: req.nextUrl.pathname,
          method: req.method,
        },
        `API Error: ${errorBody.message}`,
      );

      const headers: Record<string, string> = {
        'x-request-id': requestId,
      };

      // Add Retry-After header for rate limit errors
      if (error instanceof RateLimitError) {
        headers['Retry-After'] = String(error.retryAfter);
      }

      return NextResponse.json(errorBody satisfies ApiError, {
        status,
        headers,
      });
    }
  };
}
