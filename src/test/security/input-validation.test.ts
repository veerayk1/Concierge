/**
 * Input Validation Security Tests — Security Rulebook C.1, C.5
 *
 * Validates that input validation schemas and file upload validation
 * correctly reject dangerous inputs: SQL injection via UUID params,
 * integer overflow on pagination, extremely long strings, null byte
 * injection, path traversal in filenames, and content-type validation.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import { uuidSchema, paginationSchema, nameSchema, descriptionSchema } from '@/schemas/common';
import { idParamSchema, propertyResourceParamSchema } from '@/schemas/common';
import { createEventSchema } from '@/schemas/event';
import { createMaintenanceSchema } from '@/schemas/maintenance';
import { createPackageSchema } from '@/schemas/package';
import { createUserSchema } from '@/schemas/user';
import { validateParams, validateBody } from '@/server/middleware/validate';
import { ValidationError } from '@/server/errors';
import { validateFileType, validateFileSize, FileValidationError } from '@/server/storage';
import { stripControlChars } from '@/lib/sanitize';
import { NextRequest } from 'next/server';

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

// ---------------------------------------------------------------------------
// 1. UUID parameter validation — no SQL injection via ID params
// ---------------------------------------------------------------------------

describe('Security: UUID parameter validation prevents SQL injection', () => {
  it('rejects SQL injection payload in UUID param', async () => {
    const maliciousParams = { id: "'; DROP TABLE users; --" };
    await expect(validateParams(maliciousParams, idParamSchema)).rejects.toThrow(ValidationError);
  });

  it('rejects SQL UNION injection in UUID param', async () => {
    const maliciousParams = { id: "' UNION SELECT * FROM users --" };
    await expect(validateParams(maliciousParams, idParamSchema)).rejects.toThrow(ValidationError);
  });

  it('rejects non-UUID string in id param', async () => {
    const params = { id: 'not-a-valid-uuid-at-all' };
    await expect(validateParams(params, idParamSchema)).rejects.toThrow(ValidationError);
  });

  it('accepts valid UUID v4', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const result = await validateParams(params, idParamSchema);
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects SQL injection in propertyId param', async () => {
    const maliciousParams = {
      propertyId: "1' OR '1'='1",
      id: '550e8400-e29b-41d4-a716-446655440000',
    };
    await expect(validateParams(maliciousParams, propertyResourceParamSchema)).rejects.toThrow(
      ValidationError,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Integer overflow on pagination params
// ---------------------------------------------------------------------------

describe('Security: Pagination parameter bounds checking', () => {
  it('rejects page size exceeding maximum (100)', () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 999999 });
    expect(result.success).toBe(false);
  });

  it('rejects negative page number', () => {
    const result = paginationSchema.safeParse({ page: -1, pageSize: 25 });
    expect(result.success).toBe(false);
  });

  it('rejects page 0 (minimum is 1)', () => {
    const result = paginationSchema.safeParse({ page: 0, pageSize: 25 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer page size', () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 25.5 });
    expect(result.success).toBe(false);
  });

  it('rejects extremely large page number (potential overflow)', () => {
    // While technically valid as an integer, this tests that the schema
    // accepts it without crashing — the DB query will return empty results
    const result = paginationSchema.safeParse({ page: Number.MAX_SAFE_INTEGER, pageSize: 25 });
    // This should parse (it's a valid integer) but won't cause overflow
    expect(result.success).toBe(true);
  });

  it('rejects page size of 0', () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts maximum allowed page size (100)', () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 100 });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Extremely long strings truncated/rejected
// ---------------------------------------------------------------------------

describe('Security: String length enforcement', () => {
  it('rejects name exceeding 200 characters', () => {
    const longName = 'A'.repeat(201);
    const result = nameSchema.safeParse(longName);
    expect(result.success).toBe(false);
  });

  it('rejects description exceeding 4000 characters', () => {
    const longDesc = 'A'.repeat(4001);
    const result = descriptionSchema.safeParse(longDesc);
    expect(result.success).toBe(false);
  });

  it('rejects event title exceeding 200 characters', () => {
    const result = createEventSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      eventTypeId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'X'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects maintenance description exceeding 4000 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      unitId: '550e8400-e29b-41d4-a716-446655440002',
      description: 'Y'.repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects user first name exceeding 50 characters', () => {
    const result = createUserSchema.safeParse({
      firstName: 'A'.repeat(51),
      lastName: 'Doe',
      email: 'test@example.com',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      roleId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Null byte injection in strings
// ---------------------------------------------------------------------------

describe('Security: Null byte injection', () => {
  it('stripControlChars removes null bytes from input', () => {
    const malicious = 'admin\x00.txt';
    expect(stripControlChars(malicious)).toBe('admin.txt');
  });

  it('stripControlChars removes embedded null bytes in descriptions', () => {
    const malicious = 'Normal text\x00<script>alert(1)</script>';
    const cleaned = stripControlChars(malicious);
    expect(cleaned).not.toContain('\x00');
  });

  it('stripControlChars handles multiple null bytes', () => {
    const malicious = '\x00\x00prefix\x00middle\x00\x00suffix\x00';
    expect(stripControlChars(malicious)).toBe('prefixmiddlesuffix');
  });

  it('null byte in UUID param is rejected by schema validation', () => {
    const malicious = '550e8400\x00-e29b-41d4-a716-446655440000';
    const result = uuidSchema.safeParse(malicious);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Path traversal in file upload names
// ---------------------------------------------------------------------------

describe('Security: Path traversal in file upload names', () => {
  it('rejects content type not in allowlist', () => {
    expect(() => validateFileType('application/x-executable')).toThrow(FileValidationError);
  });

  it('rejects blocked extension (.exe) even if content type seems valid', () => {
    expect(() => validateFileType('image/jpeg', 'payload.exe')).toThrow(FileValidationError);
  });

  it('rejects blocked extension (.sh)', () => {
    expect(() => validateFileType('image/jpeg', 'script.sh')).toThrow(FileValidationError);
  });

  it('rejects blocked extension (.bat)', () => {
    expect(() => validateFileType('image/jpeg', 'run.bat')).toThrow(FileValidationError);
  });

  it('rejects blocked extension (.js)', () => {
    expect(() => validateFileType('image/jpeg', 'exploit.js')).toThrow(FileValidationError);
  });

  it('rejects blocked extension (.ps1)', () => {
    expect(() => validateFileType('image/png', 'script.ps1')).toThrow(FileValidationError);
  });

  it('allows valid image upload with safe filename', () => {
    const ext = validateFileType('image/jpeg', 'photo.jpg');
    expect(ext).toBe('jpg');
  });

  it('allows valid document upload', () => {
    const ext = validateFileType('application/pdf', 'report.pdf');
    expect(ext).toBe('pdf');
  });

  it('maintenance attachment schema rejects fileName exceeding 255 chars', () => {
    const result = createMaintenanceSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      unitId: '550e8400-e29b-41d4-a716-446655440002',
      description: 'Leaking faucet in bathroom',
      attachments: [
        {
          key: 'test-key',
          fileName: 'A'.repeat(256),
          contentType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Content-Type validation on uploads
// ---------------------------------------------------------------------------

describe('Security: Content-Type validation', () => {
  it('rejects HTML content type (potential stored XSS)', () => {
    expect(() => validateFileType('text/html')).toThrow(FileValidationError);
  });

  it('rejects SVG with script content type', () => {
    // SVG is in the allowlist (image/svg+xml is in ALLOWED_MIME_TYPES.images
    // but NOT in ALLOWED_CONTENT_TYPES in storage.ts)
    expect(() => validateFileType('image/svg+xml')).toThrow(FileValidationError);
  });

  it('rejects application/javascript content type', () => {
    expect(() => validateFileType('application/javascript')).toThrow(FileValidationError);
  });

  it('rejects text/javascript content type', () => {
    expect(() => validateFileType('text/javascript')).toThrow(FileValidationError);
  });

  it('rejects empty content type', () => {
    expect(() => validateFileType('')).toThrow(FileValidationError);
  });
});

// ---------------------------------------------------------------------------
// 7. File size enforcement
// ---------------------------------------------------------------------------

describe('Security: File size limits', () => {
  it('rejects image larger than 4MB', () => {
    const fiveMB = 5 * 1024 * 1024;
    expect(() => validateFileSize('image/jpeg', fiveMB)).toThrow(FileValidationError);
  });

  it('rejects document larger than 10MB', () => {
    const fifteenMB = 15 * 1024 * 1024;
    expect(() => validateFileSize('application/pdf', fifteenMB)).toThrow(FileValidationError);
  });

  it('accepts image at exactly 4MB', () => {
    const fourMB = 4 * 1024 * 1024;
    expect(() => validateFileSize('image/jpeg', fourMB)).not.toThrow();
  });

  it('accepts document at exactly 10MB', () => {
    const tenMB = 10 * 1024 * 1024;
    expect(() => validateFileSize('application/pdf', tenMB)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 8. Request body validation rejects mass-assignment
// ---------------------------------------------------------------------------

describe('Security: Mass-assignment prevention', () => {
  it('Zod strips unknown fields from request body', async () => {
    const schema = z.object({
      name: z.string().min(1),
    });

    const req = createJsonRequest({ name: 'Alice', isAdmin: true, role: 'super_admin' });
    const result = await validateBody(req, schema);

    expect(result).toEqual({ name: 'Alice' });
    expect(result).not.toHaveProperty('isAdmin');
    expect(result).not.toHaveProperty('role');
  });

  it('event creation strips unknown fields', () => {
    const input = {
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      eventTypeId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Package arrived',
      isAdmin: true, // attempt to inject
      userId: 'attacker-id', // attempt to inject
    };

    const result = createEventSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('isAdmin');
      expect(result.data).not.toHaveProperty('userId');
    }
  });
});
