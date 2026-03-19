/**
 * Input Validation Security Tests — Security Rulebook C.1, C.5
 *
 * Comprehensive tests for input validation and injection prevention:
 *   - SQL injection in search queries and parameters
 *   - NoSQL injection in JSON body fields
 *   - Path traversal in file URLs
 *   - Oversized input handling
 *   - Unicode handling (emoji, RTL, null bytes)
 *   - Email validation
 *   - URL validation
 *   - Phone number validation
 *   - Date validation
 *   - Integer overflow handling
 *   - Empty/null/undefined handling
 *   - Content-Type enforcement
 *   - File upload validation
 *   - Mass-assignment prevention
 *
 * @module test/security/input-validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  uuidSchema,
  paginationSchema,
  nameSchema,
  descriptionSchema,
  emailSchema,
  phoneSchema,
  searchSchema,
  commentSchema,
  dateRangeSchema,
} from '@/schemas/common';
import { idParamSchema, propertyResourceParamSchema } from '@/schemas/common';
import { createEventSchema } from '@/schemas/event';
import { createMaintenanceSchema } from '@/schemas/maintenance';
import { createPackageSchema } from '@/schemas/package';
import { createUserSchema } from '@/schemas/user';
import { createSupportTicketSchema } from '@/schemas/help';
import { validateParams, validateBody } from '@/server/middleware/validate';
import { ValidationError } from '@/server/errors';
import { validateFileType, validateFileSize, FileValidationError } from '@/server/storage';
import { stripControlChars, sanitizeUrl } from '@/lib/sanitize';
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
// 1. SQL injection attempts in search queries
// ---------------------------------------------------------------------------

describe('SQL injection prevention — search queries', () => {
  it('rejects SQL DROP TABLE in UUID param', async () => {
    const maliciousParams = { id: "'; DROP TABLE users; --" };
    await expect(validateParams(maliciousParams, idParamSchema)).rejects.toThrow(ValidationError);
  });

  it('rejects SQL UNION SELECT in UUID param', async () => {
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

  it('rejects SQL comment injection (--) in UUID', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000--' };
    await expect(validateParams(params, idParamSchema)).rejects.toThrow(ValidationError);
  });

  it('rejects SQL semicolon injection in UUID', async () => {
    const params = { id: '550e8400; SELECT 1;' };
    await expect(validateParams(params, idParamSchema)).rejects.toThrow(ValidationError);
  });

  it('search schema accepts legitimate search terms', () => {
    const result = searchSchema.safeParse({ query: 'fire drill unit 302' });
    expect(result.success).toBe(true);
  });

  it('search schema rejects empty query', () => {
    const result = searchSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  it('search schema enforces max length (500 chars)', () => {
    const result = searchSchema.safeParse({ query: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. NoSQL injection attempts in JSON body fields
// ---------------------------------------------------------------------------

describe('NoSQL injection prevention — JSON body fields', () => {
  it('Zod strips $gt operator from body fields', async () => {
    const schema = z.object({ name: z.string().min(1) });
    const req = createJsonRequest({ name: 'Alice', password: { $gt: '' } });
    const result = await validateBody(req, schema);
    expect(result).toEqual({ name: 'Alice' });
    expect(result).not.toHaveProperty('password');
  });

  it('Zod rejects non-string where string expected ($ne injection)', async () => {
    const schema = z.object({ email: z.string().email() });
    const req = createJsonRequest({ email: { $ne: '' } });
    await expect(validateBody(req, schema)).rejects.toThrow(ValidationError);
  });

  it('Zod rejects $where operator injection', async () => {
    const schema = z.object({ query: z.string().min(1) });
    const req = createJsonRequest({ query: 'test', $where: 'this.password.length > 0' });
    // $where is stripped by Zod as an unknown field
    const result = await validateBody(req, schema);
    expect(result).not.toHaveProperty('$where');
  });

  it('Zod rejects array where string expected', async () => {
    const schema = z.object({ name: z.string().min(1) });
    const req = createJsonRequest({ name: ['injection', 'array'] });
    await expect(validateBody(req, schema)).rejects.toThrow(ValidationError);
  });

  it('event schema rejects object in title field', () => {
    const result = createEventSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      eventTypeId: '550e8400-e29b-41d4-a716-446655440001',
      title: { $regex: '.*' },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Path traversal attempts in file URLs
// ---------------------------------------------------------------------------

describe('Path traversal prevention — file URLs and filenames', () => {
  it('rejects blocked extension (.exe)', () => {
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

  it('rejects blocked extension (.cmd)', () => {
    expect(() => validateFileType('image/png', 'run.cmd')).toThrow(FileValidationError);
  });

  it('rejects blocked extension (.vbs)', () => {
    expect(() => validateFileType('image/png', 'macro.vbs')).toThrow(FileValidationError);
  });

  it('maintenance attachment rejects fileName exceeding 255 chars', () => {
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

  it('allows valid image upload with safe filename', () => {
    const ext = validateFileType('image/jpeg', 'photo.jpg');
    expect(ext).toBe('jpg');
  });

  it('allows valid document upload', () => {
    const ext = validateFileType('application/pdf', 'report.pdf');
    expect(ext).toBe('pdf');
  });
});

// ---------------------------------------------------------------------------
// 4. Oversized input handling
// ---------------------------------------------------------------------------

describe('Oversized input handling', () => {
  it('rejects description exceeding 4000 characters', () => {
    const longDesc = 'A'.repeat(4001);
    const result = descriptionSchema.safeParse(longDesc);
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 characters', () => {
    const longName = 'A'.repeat(201);
    const result = nameSchema.safeParse(longName);
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

  it('rejects comment exceeding 2000 characters', () => {
    const result = commentSchema.safeParse('B'.repeat(2001));
    expect(result.success).toBe(false);
  });

  it('rejects support ticket description exceeding 4000 characters', () => {
    const result = createSupportTicketSchema.safeParse({
      subject: 'Test ticket',
      description: 'C'.repeat(4001),
      category: 'packages',
    });
    expect(result.success).toBe(false);
  });

  it('rejects support ticket subject exceeding 200 characters', () => {
    const result = createSupportTicketSchema.safeParse({
      subject: 'D'.repeat(201),
      description: 'A valid description for a test ticket',
      category: 'packages',
    });
    expect(result.success).toBe(false);
  });

  it('rejects search query exceeding 500 characters', () => {
    const result = searchSchema.safeParse({ query: 'E'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts maximum allowed description (4000 chars)', () => {
    const result = descriptionSchema.safeParse('A'.repeat(4000));
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Unicode handling (emoji, RTL text, null bytes)
// ---------------------------------------------------------------------------

describe('Unicode handling — emoji, RTL, null bytes', () => {
  it('name schema accepts accented characters', () => {
    const result = createUserSchema.safeParse({
      firstName: 'Ren\u00E9',
      lastName: 'Descartes',
      email: 'rene@example.com',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      roleId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(true);
  });

  it('name schema accepts hyphenated names', () => {
    const result = createUserSchema.safeParse({
      firstName: 'Mary-Jane',
      lastName: "O'Brien",
      email: 'mj@example.com',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      roleId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(true);
  });

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

  it('description schema accepts RTL text (Arabic)', () => {
    const result = descriptionSchema.safeParse(
      '\u0645\u0631\u062D\u0628\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645',
    );
    expect(result.success).toBe(true);
  });

  it('description schema accepts emoji in text', () => {
    const result = descriptionSchema.safeParse('Broken pipe in bathroom \u{1F6B0}');
    expect(result.success).toBe(true);
  });

  it('description schema accepts CJK characters', () => {
    const result = descriptionSchema.safeParse('\u4F60\u597D\u4E16\u754C');
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Email validation
// ---------------------------------------------------------------------------

describe('Email validation', () => {
  it('accepts valid standard email', () => {
    const result = emailSchema.safeParse('user@example.com');
    expect(result.success).toBe(true);
  });

  it('accepts valid email with plus addressing', () => {
    const result = emailSchema.safeParse('user+tag@example.com');
    expect(result.success).toBe(true);
  });

  it('accepts valid email with subdomain', () => {
    const result = emailSchema.safeParse('user@mail.example.com');
    expect(result.success).toBe(true);
  });

  it('rejects email without @ sign', () => {
    const result = emailSchema.safeParse('userexample.com');
    expect(result.success).toBe(false);
  });

  it('rejects email without domain', () => {
    const result = emailSchema.safeParse('user@');
    expect(result.success).toBe(false);
  });

  it('rejects email without local part', () => {
    const result = emailSchema.safeParse('@example.com');
    expect(result.success).toBe(false);
  });

  it('rejects email exceeding 254 characters', () => {
    const longLocal = 'a'.repeat(245);
    const result = emailSchema.safeParse(`${longLocal}@example.com`);
    expect(result.success).toBe(false);
  });

  it('rejects email with spaces', () => {
    const result = emailSchema.safeParse('user @example.com');
    expect(result.success).toBe(false);
  });

  it('lowercases email input', () => {
    const result = emailSchema.safeParse('User@Example.COM');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });
});

// ---------------------------------------------------------------------------
// 7. URL validation
// ---------------------------------------------------------------------------

describe('URL validation — sanitizeUrl', () => {
  it('accepts valid https URL', () => {
    expect(sanitizeUrl('https://example.com/page')).toBe('https://example.com/page');
  });

  it('rejects http URL (non-TLS)', () => {
    expect(sanitizeUrl('http://example.com')).toBeNull();
  });

  it('rejects data: URL', () => {
    expect(sanitizeUrl('data:text/html,<h1>test</h1>')).toBeNull();
  });

  it('rejects javascript: URL', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects vbscript: URL', () => {
    expect(sanitizeUrl('vbscript:MsgBox("test")')).toBeNull();
  });

  it('allows relative path', () => {
    expect(sanitizeUrl('/dashboard')).toBe('/dashboard');
  });
});

// ---------------------------------------------------------------------------
// 8. Phone number validation
// ---------------------------------------------------------------------------

describe('Phone number validation', () => {
  it('accepts valid North American phone', () => {
    const result = phoneSchema.safeParse('+1-416-555-1234');
    expect(result.success).toBe(true);
  });

  it('accepts valid international phone', () => {
    const result = phoneSchema.safeParse('+44 20 7946 0958');
    expect(result.success).toBe(true);
  });

  it('rejects phone exceeding 20 characters', () => {
    const result = phoneSchema.safeParse('+1234567890123456789012');
    expect(result.success).toBe(false);
  });

  it('rejects phone shorter than 7 characters', () => {
    const result = phoneSchema.safeParse('12345');
    expect(result.success).toBe(false);
  });

  it('rejects phone with letters', () => {
    const result = phoneSchema.safeParse('+1-416-CALL-ME');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. Date validation
// ---------------------------------------------------------------------------

describe('Date validation', () => {
  it('accepts valid ISO 8601 date range', () => {
    const result = dateRangeSchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects date range where from > to', () => {
    const result = dateRangeSchema.safeParse({
      from: '2026-12-31T23:59:59.000Z',
      to: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = dateRangeSchema.safeParse({
      from: '01/01/2026',
      to: '12/31/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-date string', () => {
    const result = dateRangeSchema.safeParse({
      from: 'not-a-date',
      to: 'also-not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts same from and to date (single-day range)', () => {
    const result = dateRangeSchema.safeParse({
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-15T23:59:59.000Z',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. Integer overflow handling
// ---------------------------------------------------------------------------

describe('Integer overflow handling — pagination', () => {
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

  it('accepts extremely large page number without crashing', () => {
    const result = paginationSchema.safeParse({ page: Number.MAX_SAFE_INTEGER, pageSize: 25 });
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

  it('rejects NaN page number', () => {
    const result = paginationSchema.safeParse({ page: NaN, pageSize: 25 });
    expect(result.success).toBe(false);
  });

  it('rejects Infinity page size', () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: Infinity });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. Empty string vs null vs undefined handling
// ---------------------------------------------------------------------------

describe('Empty string vs null vs undefined handling', () => {
  it('name schema rejects empty string', () => {
    const result = nameSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('description schema accepts empty string (optional-like)', () => {
    const result = descriptionSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('comment schema rejects empty string', () => {
    const result = commentSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('event title rejects empty string', () => {
    const result = createEventSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      eventTypeId: '550e8400-e29b-41d4-a716-446655440001',
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('package schema accepts optional fields as empty strings', () => {
    const result = createPackageSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      unitId: '550e8400-e29b-41d4-a716-446655440002',
      trackingNumber: '',
      description: '',
      courierOtherName: '',
    });
    expect(result.success).toBe(true);
  });

  it('user firstName rejects null', () => {
    const result = createUserSchema.safeParse({
      firstName: null,
      lastName: 'Doe',
      email: 'test@example.com',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      roleId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(false);
  });

  it('user firstName rejects undefined (required field)', () => {
    const result = createUserSchema.safeParse({
      lastName: 'Doe',
      email: 'test@example.com',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      roleId: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 12. Content-Type enforcement
// ---------------------------------------------------------------------------

describe('Content-Type enforcement — file uploads', () => {
  it('rejects HTML content type (potential stored XSS)', () => {
    expect(() => validateFileType('text/html')).toThrow(FileValidationError);
  });

  it('rejects SVG content type (script injection risk)', () => {
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

  it('rejects application/x-executable content type', () => {
    expect(() => validateFileType('application/x-executable')).toThrow(FileValidationError);
  });

  it('accepts image/jpeg content type', () => {
    const ext = validateFileType('image/jpeg', 'photo.jpg');
    expect(ext).toBe('jpg');
  });

  it('accepts image/png content type', () => {
    const ext = validateFileType('image/png', 'screenshot.png');
    expect(ext).toBe('png');
  });

  it('accepts application/pdf content type', () => {
    const ext = validateFileType('application/pdf', 'document.pdf');
    expect(ext).toBe('pdf');
  });
});

// ---------------------------------------------------------------------------
// 13. File size enforcement
// ---------------------------------------------------------------------------

describe('File size limits', () => {
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
// 14. Mass-assignment prevention
// ---------------------------------------------------------------------------

describe('Mass-assignment prevention', () => {
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
      isAdmin: true,
      userId: 'attacker-id',
    };

    const result = createEventSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('isAdmin');
      expect(result.data).not.toHaveProperty('userId');
    }
  });

  it('package creation strips unknown fields', () => {
    const input = {
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      unitId: '550e8400-e29b-41d4-a716-446655440002',
      propertyAdminOverride: true,
      __proto__: { isAdmin: true },
    };

    const result = createPackageSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('propertyAdminOverride');
      expect(result.data).not.toHaveProperty('__proto__');
    }
  });

  it('user creation strips unknown fields like passwordHash', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
      roleId: '550e8400-e29b-41d4-a716-446655440003',
      passwordHash: 'injected-hash',
      isVerified: true,
    };

    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('passwordHash');
      expect(result.data).not.toHaveProperty('isVerified');
    }
  });
});

// ---------------------------------------------------------------------------
// 15. Invalid JSON body handling
// ---------------------------------------------------------------------------

describe('Invalid JSON body handling', () => {
  it('validateBody rejects non-JSON body', async () => {
    const schema = z.object({ name: z.string() });
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json {{{',
    });
    await expect(validateBody(req, schema)).rejects.toThrow(ValidationError);
  });

  it('validateBody rejects empty body', async () => {
    const schema = z.object({ name: z.string().min(1) });
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });
    await expect(validateBody(req, schema)).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// 16. Prototype pollution prevention
// ---------------------------------------------------------------------------

describe('Prototype pollution prevention', () => {
  it('Zod strips __proto__ from parsed input', () => {
    const schema = z.object({ name: z.string() });
    const malicious = JSON.parse('{"name":"test","__proto__":{"isAdmin":true}}');
    const result = schema.safeParse(malicious);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('__proto__');
      expect(result.data).toEqual({ name: 'test' });
    }
  });

  it('Zod strips constructor from parsed input', () => {
    const schema = z.object({ name: z.string() });
    const input = { name: 'test', constructor: { prototype: { isAdmin: true } } };
    const result = schema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('constructor');
    }
  });
});
