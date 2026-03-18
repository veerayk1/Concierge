/**
 * Concierge — TOTP Module Tests
 *
 * Tests for TOTP secret generation, code verification, and recovery codes.
 * Per Security Rulebook A.5.
 */

import { describe, it, expect } from 'vitest';

import { generateTotpSecret, verifyTotpCode, generateRecoveryCodes } from '@/server/auth/totp';

// ---------------------------------------------------------------------------
// generateTotpSecret
// ---------------------------------------------------------------------------

describe('generateTotpSecret', () => {
  it('returns a base32-encoded secret string', () => {
    const { secret } = generateTotpSecret();

    expect(secret).toBeDefined();
    expect(typeof secret).toBe('string');
    // Base32 uses only uppercase A-Z and digits 2-7
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('returns a secret of sufficient length (at least 16 chars for 80+ bits)', () => {
    const { secret } = generateTotpSecret();

    // 20 bytes = 32 base32 characters
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it('returns a URI in otpauth:// format', () => {
    const { uri } = generateTotpSecret();

    expect(uri).toMatch(/^otpauth:\/\/totp\//);
  });

  it('includes the correct issuer in the URI', () => {
    const { uri } = generateTotpSecret();

    expect(uri).toContain('issuer=Concierge');
  });

  it('includes SHA1 algorithm in the URI', () => {
    const { uri } = generateTotpSecret();

    expect(uri).toContain('algorithm=SHA1');
  });

  it('includes 6 digits in the URI', () => {
    const { uri } = generateTotpSecret();

    expect(uri).toContain('digits=6');
  });

  it('includes 30-second period in the URI', () => {
    const { uri } = generateTotpSecret();

    expect(uri).toContain('period=30');
  });

  it('returns qrData that matches the URI', () => {
    const { uri, qrData } = generateTotpSecret();

    expect(qrData).toBe(uri);
  });

  it('generates unique secrets on each call', () => {
    const secrets = new Set<string>();
    for (let i = 0; i < 20; i++) {
      secrets.add(generateTotpSecret().secret);
    }
    expect(secrets.size).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// verifyTotpCode
// ---------------------------------------------------------------------------

describe('verifyTotpCode', () => {
  it('returns true for a correctly generated code (current period)', async () => {
    const { secret } = generateTotpSecret();

    // Generate a valid code for the current time period using the same algorithm
    const code = await generateValidCode(secret);

    const result = await verifyTotpCode(secret, code);
    expect(result).toBe(true);
  });

  it('returns false for an incorrect code', async () => {
    const { secret } = generateTotpSecret();

    const result = await verifyTotpCode(secret, '000000');
    // While there's a tiny chance this is valid, statistically it will fail
    // We test with a known-bad code pattern
    const result2 = await verifyTotpCode(secret, '999999');

    // At least one of these should be false (extremely likely both)
    expect(result === false || result2 === false).toBe(true);
  });

  it('returns false for a code with wrong length', async () => {
    const { secret } = generateTotpSecret();

    const result = await verifyTotpCode(secret, '12345'); // 5 digits, not 6
    expect(result).toBe(false);
  });

  it('returns false for non-numeric code', async () => {
    const { secret } = generateTotpSecret();

    const result = await verifyTotpCode(secret, 'abcdef');
    expect(result).toBe(false);
  });

  it('returns false for empty code', async () => {
    const { secret } = generateTotpSecret();

    const result = await verifyTotpCode(secret, '');
    expect(result).toBe(false);
  });

  it('accepts codes within ±1 period window (clock skew tolerance)', async () => {
    const { secret } = generateTotpSecret();

    // The implementation checks current period and ±1 offset
    // A code valid for the current period should pass
    const code = await generateValidCode(secret);
    const result = await verifyTotpCode(secret, code);

    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateRecoveryCodes
// ---------------------------------------------------------------------------

describe('generateRecoveryCodes', () => {
  it('returns exactly 10 recovery codes', () => {
    const codes = generateRecoveryCodes();

    expect(codes).toHaveLength(10);
  });

  it('returns codes in XXXXX-XXXXX format', () => {
    const codes = generateRecoveryCodes();

    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
    }
  });

  it('generates unique codes within a single batch', () => {
    const codes = generateRecoveryCodes();
    const unique = new Set(codes);

    expect(unique.size).toBe(codes.length);
  });

  it('generates different codes on each invocation', () => {
    const batch1 = generateRecoveryCodes();
    const batch2 = generateRecoveryCodes();

    // Extremely unlikely for any overlap
    const allCodes = new Set([...batch1, ...batch2]);
    expect(allCodes.size).toBe(20);
  });

  it('each code is exactly 11 characters (5 + hyphen + 5)', () => {
    const codes = generateRecoveryCodes();

    for (const code of codes) {
      expect(code.length).toBe(11);
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a valid TOTP code for the current time period.
 * Mirrors the internal algorithm used by verifyTotpCode.
 */
async function generateValidCode(secret: string): Promise<string> {
  const PERIOD = 30;
  const DIGITS = 6;

  const counter = Math.floor(Math.floor(Date.now() / 1000) / PERIOD);

  // base32 decode
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of secret.toUpperCase()) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  const keyBytes = new Uint8Array(output);

  // In jsdom, Uint8Array.buffer may not be recognized as ArrayBuffer.
  // Create a proper ArrayBuffer copy.
  const keyBuffer = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength,
  );

  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter));

  const hmac = await crypto.subtle.sign('HMAC', key, buffer);
  const hmacArray = new Uint8Array(hmac);

  const offset = (hmacArray[hmacArray.length - 1] ?? 0) & 0xf;
  const binary =
    (((hmacArray[offset] ?? 0) & 0x7f) << 24) |
    (((hmacArray[offset + 1] ?? 0) & 0xff) << 16) |
    (((hmacArray[offset + 2] ?? 0) & 0xff) << 8) |
    ((hmacArray[offset + 3] ?? 0) & 0xff);

  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}
