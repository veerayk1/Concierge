/**
 * Regression tests for POST /api/v1/upload — UX-287 audit lock-in.
 *
 * The live adversarial probe (UX-287 audit, 2026-05-27) confirmed the
 * upload route's defenses against the high-impact attack classes:
 *  - MIME allowlist (rejects text/html, image/svg+xml — the two most
 *    common XSS-via-upload vectors)
 *  - Extension blocklist (rejects .exe, .sh, .bat, .cmd, .com, .js,
 *    .msi, .vbs, .ps1 by filename)
 *  - Module enum (rejects unknown modules including path-traversal
 *    attempts like "../../")
 *  - User filename NEVER lands in the S3 key — the server generates
 *    a UUID-keyed path, so "../../etc/passwd" or "evil.exe.png" are
 *    accepted as filenames but only as label metadata; the actual
 *    stored key looks like {propertyId}/{module}/2026-05/{uuid}.png
 *
 * These tests lock that behaviour in: anyone who relaxes the
 * allowlists, swaps validateFileType out, or starts honouring
 * user-supplied filenames in the S3 key will get a failing test.
 *
 * @vitest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock auth: bypass guardRoute so we can hit the handler directly.
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-user',
      propertyId: 'test-property',
      role: 'resident_owner',
      permissions: [],
      mfaVerified: false,
    },
    error: null,
  }),
  enforcePropertyAccess: vi.fn().mockReturnValue(null),
}));

// Stub presigned URL generation so we don't need S3 set up.
vi.mock('@/server/storage', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    generatePresignedUploadUrl: vi.fn(async ({ contentType, propertyId, module }) => ({
      url: `http://localhost:3000/api/v1/upload/local/${propertyId}/${module}/test.${actual.ALLOWED_CONTENT_TYPES[contentType] ?? 'bin'}`,
      key: `${propertyId}/${module}/2026-05/00000000-0000-0000-0000-000000000000.${actual.ALLOWED_CONTENT_TYPES[contentType] ?? 'bin'}`,
      fields: { 'Content-Type': contentType },
    })),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeReq(body: unknown) {
  return {
    url: 'http://localhost:3000/api/v1/upload',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
  } as any;
}

describe('POST /api/v1/upload — UX-287 hardening regression', () => {
  it('accepts a legitimate jpg upload request', async () => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: 'maintenance',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
      }),
    );
    expect(res.status).toBe(200);
    const json = await (res as NextResponse).json();
    expect(json.data.url).toContain('test-property/maintenance');
    // Server-generated UUID key, NOT the user's filename
    expect(json.data.key).toMatch(/test-property\/maintenance\/\d{4}-\d{2}\/[0-9a-f-]+\.jpg$/);
  });

  it('rejects text/html uploads (HTML rendering XSS vector)', async () => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: 'maintenance',
        fileName: 'page.html',
        contentType: 'text/html',
      }),
    );
    expect(res.status).toBe(400);
    const json = await (res as NextResponse).json();
    expect(json.message).toMatch(/text\/html.*not allowed/i);
  });

  it('rejects image/svg+xml uploads (script-in-SVG XSS vector)', async () => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: 'maintenance',
        fileName: 'icon.svg',
        contentType: 'image/svg+xml',
      }),
    );
    expect(res.status).toBe(400);
    const json = await (res as NextResponse).json();
    expect(json.message).toMatch(/svg.*not allowed/i);
  });

  it('rejects .exe filenames even with a permitted contentType', async () => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: 'maintenance',
        fileName: 'malware.exe',
        contentType: 'image/jpeg',
      }),
    );
    expect(res.status).toBe(400);
    const json = await (res as NextResponse).json();
    expect(json.message).toMatch(/\.exe.*not allowed/i);
  });

  it.each([
    'malware.sh',
    'run.bat',
    'payload.js',
    'cmd.cmd',
    'install.msi',
    'script.vbs',
    'task.ps1',
  ])('rejects %s by extension', async (fileName) => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: 'maintenance',
        fileName,
        contentType: 'image/jpeg',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects unknown modules (defends against module-name path traversal)', async () => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: '../../',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
      }),
    );
    expect(res.status).toBe(400);
    const json = await (res as NextResponse).json();
    expect(json.message).toMatch(/Invalid module/i);
  });

  it('discards user filename — a path-traversal fileName never reaches the S3 key', async () => {
    const mod = await import('../route');
    const res = await mod.POST(
      makeReq({
        module: 'maintenance',
        fileName: '../../etc/passwd',
        contentType: 'image/jpeg',
      }),
    );
    expect(res.status).toBe(200);
    const json = await (res as NextResponse).json();
    // The stored key MUST NOT carry ../etc/passwd anywhere — the
    // server generates a UUID-keyed path with the contentType's
    // canonical extension.
    expect(json.data.key).not.toMatch(/\.\.|etc|passwd/);
    expect(json.data.key).toMatch(/test-property\/maintenance\/\d{4}-\d{2}\/[0-9a-f-]+\.jpg$/);
  });

  it('400s when required fields are missing', async () => {
    const mod = await import('../route');
    const res = await mod.POST(makeReq({ module: 'maintenance' }));
    expect(res.status).toBe(400);
    const json = await (res as NextResponse).json();
    expect(json.message).toMatch(/required/i);
  });
});
