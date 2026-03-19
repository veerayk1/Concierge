/**
 * Storage Service Tests — File upload presigned URL generation
 *
 * Tests cover:
 * 1. Presigned upload URL generation
 * 2. File type validation (allowlist + blocklist)
 * 3. File size enforcement (4MB images, 10MB documents)
 * 4. Unique key generation with property/module/date path structure
 * 5. Presigned download URL generation
 * 6. Dev mode fallback (no AWS_S3_BUCKET)
 * 7. File deletion
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock AWS SDK
// ---------------------------------------------------------------------------

const mockSend = vi.fn().mockResolvedValue({});
const mockGetSignedUrl = vi
  .fn()
  .mockResolvedValue('https://s3.amazonaws.com/test-bucket/signed-url');

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: vi.fn().mockImplementation((params) => ({ ...params, _type: 'PutObject' })),
  GetObjectCommand: vi.fn().mockImplementation((params) => ({ ...params, _type: 'GetObject' })),
  DeleteObjectCommand: vi
    .fn()
    .mockImplementation((params) => ({ ...params, _type: 'DeleteObject' })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
}));

import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteFile,
  validateFileType,
  validateFileSize,
  generateStorageKey,
  resetS3Client,
  FileValidationError,
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZES,
} from './storage';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  resetS3Client();
  process.env.AWS_S3_BUCKET = 'test-bucket';
  process.env.AWS_S3_REGION = 'ca-central-1';
  process.env.S3_ACCESS_KEY_ID = 'test-key';
  process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

// ---------------------------------------------------------------------------
// 1. generatePresignedUploadUrl — returns URL and fields
// ---------------------------------------------------------------------------

describe('generatePresignedUploadUrl', () => {
  it('returns a URL and fields object for a valid image upload', async () => {
    const result = await generatePresignedUploadUrl({
      contentType: 'image/jpeg',
      propertyId: 'prop-123',
      module: 'maintenance',
    });

    expect(result.url).toBe('https://s3.amazonaws.com/test-bucket/signed-url');
    expect(result.key).toContain('prop-123/maintenance/');
    expect(result.key).toMatch(/\.jpg$/);
    expect(result.fields).toBeDefined();
    expect(result.fields['Content-Type']).toBe('image/jpeg');
  });

  it('returns a URL and fields object for a valid document upload', async () => {
    const result = await generatePresignedUploadUrl({
      contentType: 'application/pdf',
      propertyId: 'prop-123',
      module: 'library',
    });

    expect(result.url).toBe('https://s3.amazonaws.com/test-bucket/signed-url');
    expect(result.key).toMatch(/\.pdf$/);
    expect(result.fields['Content-Type']).toBe('application/pdf');
  });

  it('uses provided key when specified', async () => {
    const result = await generatePresignedUploadUrl({
      key: 'custom/path/file.png',
      contentType: 'image/png',
    });

    expect(result.key).toBe('custom/path/file.png');
  });

  it('calls getSignedUrl with correct S3 parameters', async () => {
    await generatePresignedUploadUrl({
      contentType: 'image/jpeg',
      propertyId: 'prop-123',
      module: 'maintenance',
    });

    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    const command = mockGetSignedUrl.mock.calls[0]![1];
    expect(command.Bucket).toBe('test-bucket');
    expect(command.ContentType).toBe('image/jpeg');
  });
});

// ---------------------------------------------------------------------------
// 2. File type validation — allowlist
// ---------------------------------------------------------------------------

describe('validateFileType — allowlist', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/gif', 'gif'],
    ['image/heic', 'heic'],
    ['application/pdf', 'pdf'],
    ['application/msword', 'doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ])('allows %s and returns extension "%s"', (contentType, expectedExt) => {
    const ext = validateFileType(contentType);
    expect(ext).toBe(expectedExt);
  });

  it('has exactly 8 allowed content types', () => {
    expect(Object.keys(ALLOWED_CONTENT_TYPES)).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// 3. File type validation — rejects disallowed types
// ---------------------------------------------------------------------------

describe('validateFileType — rejects disallowed types', () => {
  it.each([
    ['application/x-msdownload', 'exe'],
    ['application/x-sh', 'sh'],
    ['application/x-msdos-program', 'bat'],
    ['text/javascript', 'js'],
    ['application/octet-stream', 'unknown binary'],
    ['text/html', 'html'],
  ])('rejects %s (%s)', (contentType) => {
    expect(() => validateFileType(contentType)).toThrow(FileValidationError);
  });

  it('rejects file with blocked extension even if content type would be valid', () => {
    expect(() => validateFileType('image/jpeg', 'malware.exe')).toThrow(FileValidationError);
  });

  it('rejects .sh extension', () => {
    expect(() => validateFileType('image/jpeg', 'script.sh')).toThrow(FileValidationError);
  });

  it('rejects .bat extension', () => {
    expect(() => validateFileType('image/jpeg', 'run.bat')).toThrow(FileValidationError);
  });

  it('rejects .js extension', () => {
    expect(() => validateFileType('image/jpeg', 'payload.js')).toThrow(FileValidationError);
  });
});

// ---------------------------------------------------------------------------
// 4. File size enforcement
// ---------------------------------------------------------------------------

describe('validateFileSize', () => {
  it('allows images up to 4MB', () => {
    expect(() => validateFileSize('image/jpeg', 4 * 1024 * 1024)).not.toThrow();
  });

  it('rejects images over 4MB', () => {
    expect(() => validateFileSize('image/jpeg', 4 * 1024 * 1024 + 1)).toThrow(FileValidationError);
    expect(() => validateFileSize('image/jpeg', 4 * 1024 * 1024 + 1)).toThrow(/4MB/);
  });

  it('allows documents up to 10MB', () => {
    expect(() => validateFileSize('application/pdf', 10 * 1024 * 1024)).not.toThrow();
  });

  it('rejects documents over 10MB', () => {
    expect(() => validateFileSize('application/pdf', 10 * 1024 * 1024 + 1)).toThrow(
      FileValidationError,
    );
    expect(() => validateFileSize('application/pdf', 10 * 1024 * 1024 + 1)).toThrow(/10MB/);
  });

  it('applies image limit to all image/* types', () => {
    expect(() => validateFileSize('image/png', MAX_FILE_SIZES.image + 1)).toThrow();
    expect(() => validateFileSize('image/gif', MAX_FILE_SIZES.image + 1)).toThrow();
    expect(() => validateFileSize('image/heic', MAX_FILE_SIZES.image + 1)).toThrow();
  });

  it('applies document limit to non-image types', () => {
    expect(() => validateFileSize('application/msword', MAX_FILE_SIZES.document)).not.toThrow();
  });

  it('generatePresignedUploadUrl validates maxSize when provided', async () => {
    await expect(
      generatePresignedUploadUrl({
        contentType: 'image/jpeg',
        maxSize: 5 * 1024 * 1024, // 5MB > 4MB image limit
        propertyId: 'prop-123',
        module: 'maintenance',
      }),
    ).rejects.toThrow(FileValidationError);
  });
});

// ---------------------------------------------------------------------------
// 5. Key generation — property/module/date path structure
// ---------------------------------------------------------------------------

describe('generateStorageKey', () => {
  it('generates key with property/module/YYYY-MM/uuid.ext structure', () => {
    const key = generateStorageKey('prop-123', 'maintenance', 'jpg');

    const parts = key.split('/');
    expect(parts[0]).toBe('prop-123');
    expect(parts[1]).toBe('maintenance');
    expect(parts[2]).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM
    expect(parts[3]).toMatch(/^[a-f0-9-]+\.jpg$/); // uuid.ext
  });

  it('uses the mocked UUID for deterministic testing', () => {
    const key = generateStorageKey('prop-456', 'packages', 'png');
    expect(key).toContain('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png');
  });

  it('pads single-digit months with zero', () => {
    // Our mock date is current — just verify format
    const key = generateStorageKey('prop-123', 'incidents', 'pdf');
    const yearMonth = key.split('/')[2]!;
    expect(yearMonth).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// 6. generatePresignedDownloadUrl
// ---------------------------------------------------------------------------

describe('generatePresignedDownloadUrl', () => {
  it('returns a signed download URL', async () => {
    const result = await generatePresignedDownloadUrl('prop-123/maintenance/2026-03/file.jpg');

    expect(result.url).toBe('https://s3.amazonaws.com/test-bucket/signed-url');
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('passes correct key to S3 GetObjectCommand', async () => {
    const key = 'prop-123/maintenance/2026-03/abc.pdf';
    await generatePresignedDownloadUrl(key);

    const command = mockGetSignedUrl.mock.calls[0]![1];
    expect(command.Bucket).toBe('test-bucket');
    expect(command.Key).toBe(key);
  });
});

// ---------------------------------------------------------------------------
// 7. Dev mode — missing AWS_S3_BUCKET
// ---------------------------------------------------------------------------

describe('dev mode — no AWS_S3_BUCKET', () => {
  beforeEach(() => {
    delete process.env.AWS_S3_BUCKET;
    resetS3Client();
  });

  it('generatePresignedUploadUrl returns local file URL', async () => {
    const result = await generatePresignedUploadUrl({
      contentType: 'image/jpeg',
      propertyId: 'prop-123',
      module: 'maintenance',
    });

    expect(result.url).toContain('localhost:3000');
    expect(result.fields['x-dev-mode']).toBe('true');
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('generatePresignedDownloadUrl returns local file URL', async () => {
    const result = await generatePresignedDownloadUrl('some/key.jpg');

    expect(result.url).toContain('localhost:3000');
    expect(result.url).toContain('some/key.jpg');
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('deleteFile is a no-op in dev mode', async () => {
    await expect(deleteFile('some/key.jpg')).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('still validates content type even in dev mode', async () => {
    await expect(
      generatePresignedUploadUrl({
        contentType: 'application/x-msdownload',
        propertyId: 'prop-123',
        module: 'maintenance',
      }),
    ).rejects.toThrow(FileValidationError);
  });
});

// ---------------------------------------------------------------------------
// 8. deleteFile
// ---------------------------------------------------------------------------

describe('deleteFile', () => {
  it('sends DeleteObjectCommand to S3', async () => {
    await deleteFile('prop-123/maintenance/2026-03/file.jpg');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const command = mockSend.mock.calls[0]![0];
    expect(command.Bucket).toBe('test-bucket');
    expect(command.Key).toBe('prop-123/maintenance/2026-03/file.jpg');
  });

  it('propagates S3 errors', async () => {
    mockSend.mockRejectedValueOnce(new Error('S3 AccessDenied'));

    await expect(deleteFile('some/key.jpg')).rejects.toThrow('S3 AccessDenied');
  });
});
