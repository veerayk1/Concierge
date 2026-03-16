/**
 * TOTP (Time-based One-Time Password) operations.
 * Per SECURITY-RULEBOOK A.5
 *
 * Uses HMAC-SHA1 with 6-digit codes and 30-second periods.
 * Recovery codes: 10 single-use codes (A.5.6)
 */

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_ISSUER = process.env['TOTP_ISSUER'] || 'Concierge';

/**
 * Generate a new TOTP secret for user enrollment. Per A.5
 */
export function generateTotpSecret(): {
  secret: string;
  uri: string;
  qrData: string;
} {
  // Generate 20 random bytes for TOTP secret
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const secret = base32Encode(bytes);

  const uri = `otpauth://totp/${TOTP_ISSUER}:user?secret=${secret}&issuer=${TOTP_ISSUER}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

  return { secret, uri, qrData: uri };
}

/**
 * Verify a TOTP code with ±1 period tolerance. Per A.5.7
 */
export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);

  // Check current period and ±1 for clock skew (A.5.7)
  for (const offset of [-1, 0, 1]) {
    const counter = Math.floor((now + offset * TOTP_PERIOD) / TOTP_PERIOD);
    const expected = await generateCode(secret, counter);
    if (timingSafeEqual(expected, code)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate 10 single-use recovery codes. Per A.5.6
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    // Format as XXXXX-XXXXX
    codes.push(`${code.slice(0, 5)}-${code.slice(5, 10)}`);
  }
  return codes;
}

// --- Internal helpers ---

async function generateCode(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secret).buffer as ArrayBuffer,
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

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
  }
  return result === 0;
}

function base32Encode(data: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of encoded.toUpperCase()) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}
