/**
 * Concierge — JWT Module Tests
 *
 * Tests for access token signing/verification, refresh token generation,
 * and security invariants (no PII in tokens, correct algorithm, expiry).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as jose from 'jose';

import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  initializeKeys,
} from '@/server/auth/jwt';
import type { TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_PAYLOAD: TokenPayload = {
  sub: '550e8400-e29b-41d4-a716-446655440001',
  pid: '550e8400-e29b-41d4-a716-446655440010',
  role: 'property_admin',
  perms: ['event:manage', 'unit:manage'],
  mfa: true,
  iat: 0, // will be set by signing
  exp: 0, // will be set by signing
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Initialize ephemeral keys for testing (dev mode)
  await initializeKeys();
});

// ---------------------------------------------------------------------------
// signAccessToken
// ---------------------------------------------------------------------------

describe('signAccessToken', () => {
  it('creates a valid JWT string', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    // JWT has 3 base64url segments separated by dots
    expect(token.split('.')).toHaveLength(3);
  });

  it('includes correct claims: sub, role, pid, perms, mfa', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const decoded = await verifyAccessToken(token);

    expect(decoded.sub).toBe(VALID_PAYLOAD.sub);
    expect(decoded.pid).toBe(VALID_PAYLOAD.pid);
    expect(decoded.role).toBe(VALID_PAYLOAD.role);
    expect(decoded.perms).toEqual(VALID_PAYLOAD.perms);
    expect(decoded.mfa).toBe(true);
  });

  it('sets an expiration time (exp claim)', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const decoded = await verifyAccessToken(token);

    expect(decoded.exp).toBeDefined();
    expect(typeof decoded.exp).toBe('number');
    // exp should be in the future
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(decoded.exp).toBeGreaterThan(nowSeconds);
  });

  it('sets an issued-at time (iat claim)', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const decoded = await verifyAccessToken(token);

    expect(decoded.iat).toBeDefined();
    expect(typeof decoded.iat).toBe('number');
    // iat should be close to now (within 5 seconds)
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(decoded.iat).toBeGreaterThanOrEqual(nowSeconds - 5);
    expect(decoded.iat).toBeLessThanOrEqual(nowSeconds + 5);
  });

  it('uses RS256 algorithm in the header', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);

    // Decode the header without verification
    const header = jose.decodeProtectedHeader(token);
    expect(header.alg).toBe('RS256');
    expect(header.typ).toBe('JWT');
  });

  it('sets access token expiry to 15 minutes by default', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const decoded = await verifyAccessToken(token);

    // 15 minutes = 900 seconds (allow ±5s tolerance)
    const expectedExpiry = decoded.iat + 900;
    expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
  });

  it('includes a unique jti (JWT ID) in each token', async () => {
    const token1 = await signAccessToken(VALID_PAYLOAD);
    const token2 = await signAccessToken(VALID_PAYLOAD);

    const claims1 = jose.decodeJwt(token1);
    const claims2 = jose.decodeJwt(token2);

    expect(claims1.jti).toBeDefined();
    expect(claims2.jti).toBeDefined();
    expect(claims1.jti).not.toBe(claims2.jti);
  });

  it('contains no PII — no email, no name, no phone', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const claims = jose.decodeJwt(token);

    // Ensure no PII fields leak into the token
    expect(claims).not.toHaveProperty('email');
    expect(claims).not.toHaveProperty('name');
    expect(claims).not.toHaveProperty('firstName');
    expect(claims).not.toHaveProperty('lastName');
    expect(claims).not.toHaveProperty('phone');
    expect(claims).not.toHaveProperty('address');
  });
});

// ---------------------------------------------------------------------------
// verifyAccessToken
// ---------------------------------------------------------------------------

describe('verifyAccessToken', () => {
  it('returns payload for a valid token', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const decoded = await verifyAccessToken(token);

    expect(decoded.sub).toBe(VALID_PAYLOAD.sub);
    expect(decoded.role).toBe(VALID_PAYLOAD.role);
    expect(decoded.pid).toBe(VALID_PAYLOAD.pid);
    expect(decoded.perms).toEqual(VALID_PAYLOAD.perms);
    expect(decoded.mfa).toBe(true);
  });

  it('throws for an expired token', async () => {
    // Create a token that expired 1 hour ago by using jose directly
    const { privateKey } = await jose.generateKeyPair('RS256');
    const pastIat = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago

    const expiredToken = await new jose.SignJWT({
      sub: VALID_PAYLOAD.sub,
      pid: VALID_PAYLOAD.pid,
      role: VALID_PAYLOAD.role,
      perms: VALID_PAYLOAD.perms,
      mfa: VALID_PAYLOAD.mfa,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(pastIat)
      .setIssuer('concierge')
      .setAudience('concierge-app')
      .setExpirationTime(pastIat + 900) // expired 1 hour 45 min ago
      .sign(privateKey);

    await expect(verifyAccessToken(expiredToken)).rejects.toThrow();
  });

  it('throws for a completely invalid token string', async () => {
    await expect(verifyAccessToken('not.a.valid.jwt')).rejects.toThrow();
  });

  it('throws for a token with tampered payload', async () => {
    const token = await signAccessToken(VALID_PAYLOAD);

    // Tamper with the payload segment
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'hacker', role: 'super_admin', pid: 'x', perms: ['*'], mfa: true }),
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    await expect(verifyAccessToken(tamperedToken)).rejects.toThrow();
  });

  it('throws for a token signed with a different key', async () => {
    // Sign with an entirely different RSA key pair
    const { privateKey: otherKey } = await jose.generateKeyPair('RS256');

    const foreignToken = await new jose.SignJWT({
      sub: VALID_PAYLOAD.sub,
      pid: VALID_PAYLOAD.pid,
      role: VALID_PAYLOAD.role,
      perms: VALID_PAYLOAD.perms,
      mfa: VALID_PAYLOAD.mfa,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer('concierge')
      .setAudience('concierge-app')
      .setExpirationTime('15m')
      .sign(otherKey);

    await expect(verifyAccessToken(foreignToken)).rejects.toThrow();
  });

  it('throws for a token signed with wrong algorithm (HS256)', async () => {
    const secret = new TextEncoder().encode('some-secret-key-for-hs256-testing');
    const hs256Token = await new jose.SignJWT({
      sub: VALID_PAYLOAD.sub,
      pid: VALID_PAYLOAD.pid,
      role: VALID_PAYLOAD.role,
      perms: VALID_PAYLOAD.perms,
      mfa: VALID_PAYLOAD.mfa,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer('concierge')
      .setAudience('concierge-app')
      .setExpirationTime('15m')
      .sign(secret);

    await expect(verifyAccessToken(hs256Token)).rejects.toThrow();
  });

  it('throws for empty string token', async () => {
    await expect(verifyAccessToken('')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// generateRefreshToken
// ---------------------------------------------------------------------------

describe('generateRefreshToken', () => {
  it('returns a UUID string', () => {
    const token = generateRefreshToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    // UUID v4 format
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique tokens on each call', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateRefreshToken());
    }
    expect(tokens.size).toBe(100);
  });
});
