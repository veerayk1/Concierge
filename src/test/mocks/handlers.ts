/**
 * Concierge — MSW Request Handlers
 *
 * Mock Service Worker handlers for external service dependencies.
 * Used in unit/integration tests to avoid hitting real services.
 *
 * Covered services:
 * - Resend (email delivery)
 * - AWS S3 (file upload/download)
 *
 * @module test/mocks/handlers
 */

import { http, HttpResponse } from 'msw';

// ---------------------------------------------------------------------------
// Resend (Email) Handlers
// ---------------------------------------------------------------------------

const resendHandlers = [
  /**
   * POST /emails — Send a single email.
   * Returns a mock email ID on success.
   */
  http.post('https://api.resend.com/emails', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    // Validate required fields
    if (!body['to'] || !body['subject']) {
      return HttpResponse.json(
        {
          statusCode: 422,
          name: 'validation_error',
          message: 'Missing required fields: to, subject',
        },
        { status: 422 },
      );
    }

    // Simulate rate limiting if special header is present
    if (request.headers.get('X-Test-Rate-Limit') === 'true') {
      return HttpResponse.json(
        {
          statusCode: 429,
          name: 'rate_limit_exceeded',
          message: 'Too many requests',
        },
        { status: 429 },
      );
    }

    return HttpResponse.json(
      {
        id: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      { status: 200 },
    );
  }),

  /**
   * POST /emails/batch — Send batch emails.
   */
  http.post('https://api.resend.com/emails/batch', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>[];

    const results = body.map((_, index) => ({
      id: `mock-batch-email-${Date.now()}-${index}`,
    }));

    return HttpResponse.json({ data: results }, { status: 200 });
  }),

  /**
   * GET /emails/:id — Get email status.
   */
  http.get('https://api.resend.com/emails/:id', ({ params }) => {
    return HttpResponse.json(
      {
        id: params['id'],
        object: 'email',
        to: ['test@example.com'],
        from: 'noreply@concierge.app',
        subject: 'Test Email',
        created_at: new Date().toISOString(),
        last_event: 'delivered',
      },
      { status: 200 },
    );
  }),
];

// ---------------------------------------------------------------------------
// AWS S3 Handlers
// ---------------------------------------------------------------------------

/** In-memory storage for mock S3 objects */
const mockS3Storage = new Map<string, { body: ArrayBuffer; contentType: string }>();

const s3Handlers = [
  /**
   * PUT — S3 object upload (presigned URL pattern).
   * Matches any S3-like URL pattern.
   */
  http.put(/https:\/\/.*\.s3\..*\.amazonaws\.com\/.*/, async ({ request }) => {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading /
    const contentType = request.headers.get('Content-Type') ?? 'application/octet-stream';
    const body = await request.arrayBuffer();

    mockS3Storage.set(key, { body, contentType });

    return new HttpResponse(null, {
      status: 200,
      headers: {
        ETag: `"mock-etag-${Date.now()}"`,
        'x-amz-request-id': `mock-request-${Date.now()}`,
      },
    });
  }),

  /**
   * GET — S3 object download (presigned URL pattern).
   */
  http.get(/https:\/\/.*\.s3\..*\.amazonaws\.com\/.*/, ({ request }) => {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    const stored = mockS3Storage.get(key);
    if (!stored) {
      return HttpResponse.xml(
        `<?xml version="1.0" encoding="UTF-8"?>
           <Error>
             <Code>NoSuchKey</Code>
             <Message>The specified key does not exist.</Message>
             <Key>${key}</Key>
           </Error>`,
        { status: 404 },
      );
    }

    return new HttpResponse(stored.body, {
      status: 200,
      headers: {
        'Content-Type': stored.contentType,
        'Content-Length': stored.body.byteLength.toString(),
        ETag: `"mock-etag-${key}"`,
      },
    });
  }),

  /**
   * DELETE — S3 object deletion.
   */
  http.delete(/https:\/\/.*\.s3\..*\.amazonaws\.com\/.*/, ({ request }) => {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    mockS3Storage.delete(key);

    return new HttpResponse(null, { status: 204 });
  }),

  /**
   * HEAD — S3 object metadata check.
   */
  http.head(/https:\/\/.*\.s3\..*\.amazonaws\.com\/.*/, ({ request }) => {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    const stored = mockS3Storage.get(key);
    if (!stored) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Content-Type': stored.contentType,
        'Content-Length': stored.body.byteLength.toString(),
        ETag: `"mock-etag-${key}"`,
      },
    });
  }),
];

// ---------------------------------------------------------------------------
// Utility: Reset mock state
// ---------------------------------------------------------------------------

/**
 * Clears all in-memory mock storage (S3 objects, etc.).
 * Call in afterEach() to ensure test isolation.
 */
export function resetMockStorage(): void {
  mockS3Storage.clear();
}

/**
 * Returns the current contents of mock S3 storage.
 * Useful for asserting that files were uploaded correctly.
 */
export function getMockS3Storage(): Map<string, { body: ArrayBuffer; contentType: string }> {
  return mockS3Storage;
}

// ---------------------------------------------------------------------------
// Combined Handlers Export
// ---------------------------------------------------------------------------

/**
 * All MSW handlers for use with setupServer() or setupWorker().
 *
 * @example
 * ```ts
 * import { setupServer } from 'msw/node';
 * import { handlers } from '@/test/mocks/handlers';
 *
 * const server = setupServer(...handlers);
 *
 * beforeAll(() => server.listen());
 * afterEach(() => { server.resetHandlers(); resetMockStorage(); });
 * afterAll(() => server.close());
 * ```
 */
export const handlers = [...resendHandlers, ...s3Handlers];
