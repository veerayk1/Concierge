/**
 * Upload API Route Tests — Presigned URL generation
 *
 * Tests:
 * 1. Returns presigned URL for valid image upload
 * 2. Returns presigned URL for valid document upload
 * 3. Rejects disallowed file types with 400
 * 4. Requires authentication
 * 5. Validates module parameter
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup — everything must be inline in the factory (hoisted)
// ---------------------------------------------------------------------------

vi.mock('@/server/storage', () => {
  const ALLOWED: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  const BLOCKED = new Set(['exe', 'sh', 'bat', 'js', 'cmd', 'com', 'msi', 'vbs', 'ps1']);

  class FileValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'FileValidationError';
    }
  }

  return {
    generatePresignedUploadUrl: vi.fn(),
    validateFileType: (contentType: string, fileName?: string) => {
      const ext = ALLOWED[contentType];
      if (!ext) {
        throw new FileValidationError(`File type "${contentType}" is not allowed.`);
      }
      if (fileName) {
        const parts = fileName.split('.');
        const fileExt = parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : '';
        if (BLOCKED.has(fileExt)) {
          throw new FileValidationError(`File extension ".${fileExt}" is not allowed.`);
        }
      }
      return ext;
    },
    FileValidationError,
    UPLOAD_MODULES: ['maintenance', 'packages', 'incidents', 'library'],
  };
});

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn(),
}));

import { POST } from '../route';
import { generatePresignedUploadUrl } from '@/server/storage';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

const authenticatedUser = {
  user: {
    userId: 'user-123',
    propertyId: PROPERTY_ID,
    role: 'front_desk',
    permissions: ['*'],
    mfaVerified: false,
  },
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(guardRoute).mockResolvedValue(authenticatedUser as never);
  vi.mocked(generatePresignedUploadUrl).mockResolvedValue({
    url: 'https://s3.amazonaws.com/test-bucket/signed-url',
    key: `${PROPERTY_ID}/maintenance/2026-03/abc.jpg`,
    fields: { 'Content-Type': 'image/jpeg' },
  });
});

// ---------------------------------------------------------------------------
// 1. Returns presigned URL for valid image upload
// ---------------------------------------------------------------------------

describe('POST /api/v1/upload — Image Upload', () => {
  it('returns presigned URL for valid image upload', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { url: string; key: string; fields: Record<string, string> };
    }>(res);

    expect(body.data.url).toBeDefined();
    expect(body.data.key).toBeDefined();
    expect(body.data.fields).toBeDefined();
  });

  it('passes propertyId and module to storage service', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'photo.png',
      contentType: 'image/png',
    });

    await POST(req);

    expect(generatePresignedUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'image/png',
        propertyId: PROPERTY_ID,
        module: 'maintenance',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Returns presigned URL for valid document upload
// ---------------------------------------------------------------------------

describe('POST /api/v1/upload — Document Upload', () => {
  it('returns presigned URL for valid PDF upload', async () => {
    vi.mocked(generatePresignedUploadUrl).mockResolvedValue({
      url: 'https://s3.amazonaws.com/test-bucket/signed-url',
      key: `${PROPERTY_ID}/library/2026-03/doc.pdf`,
      fields: { 'Content-Type': 'application/pdf' },
    });

    const req = createPostRequest('/api/v1/upload', {
      module: 'library',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { key: string } }>(res);
    expect(body.data.key).toContain('.pdf');
  });

  it('returns presigned URL for valid DOCX upload', async () => {
    vi.mocked(generatePresignedUploadUrl).mockResolvedValue({
      url: 'https://s3.amazonaws.com/test-bucket/signed-url',
      key: `${PROPERTY_ID}/maintenance/2026-03/doc.docx`,
      fields: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'notes.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 3. Rejects disallowed file types with 400
// ---------------------------------------------------------------------------

describe('POST /api/v1/upload — Disallowed File Types', () => {
  it('rejects .exe files with 400', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'malware.exe',
      contentType: 'application/x-msdownload',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('not allowed');
  });

  it('rejects .sh files with 400', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'script.sh',
      contentType: 'application/x-sh',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects text/html with 400', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'page.html',
      contentType: 'text/html',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 4. Requires authentication
// ---------------------------------------------------------------------------

describe('POST /api/v1/upload — Authentication', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(guardRoute).mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 },
      ),
    } as never);

    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('UNAUTHORIZED');
  });

  it('returns 403 when user lacks permission', async () => {
    vi.mocked(guardRoute).mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions.' },
        { status: 403 },
      ),
    } as never);

    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 5. Validates module parameter
// ---------------------------------------------------------------------------

describe('POST /api/v1/upload — Module Validation', () => {
  it('rejects invalid module with 400', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'invalid_module',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('invalid_module');
  });

  it('accepts maintenance module', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts packages module', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'packages',
      fileName: 'label.png',
      contentType: 'image/png',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts incidents module', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'incidents',
      fileName: 'evidence.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts library module', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'library',
      fileName: 'manual.pdf',
      contentType: 'application/pdf',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('rejects missing module', async () => {
    const req = createPostRequest('/api/v1/upload', {
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing fileName', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      contentType: 'image/jpeg',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing contentType', async () => {
    const req = createPostRequest('/api/v1/upload', {
      module: 'maintenance',
      fileName: 'photo.jpg',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
