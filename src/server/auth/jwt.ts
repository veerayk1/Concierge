import * as jose from 'jose';

import type { TokenPayload } from '@/types';

// Keys loaded at startup from env paths
let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

const ACCESS_TOKEN_EXPIRY = process.env['JWT_ACCESS_TOKEN_EXPIRY'] || '15m';
const REFRESH_TOKEN_EXPIRY = process.env['JWT_REFRESH_TOKEN_EXPIRY'] || '7d';
const ISSUER = 'concierge';
const AUDIENCE = 'concierge-app';

/**
 * Initialize JWT keys from PEM files.
 * Must be called at application startup.
 */
export async function initializeKeys(): Promise<void> {
  const privatePem = process.env['JWT_PRIVATE_KEY'];
  const publicPem = process.env['JWT_PUBLIC_KEY'];

  if (!privatePem || !publicPem) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('JWT keys must be configured in production');
    }
    // Development: generate ephemeral keys
    const { publicKey: pub, privateKey: priv } = await jose.generateKeyPair('RS256');
    privateKey = priv;
    publicKey = pub;
    return;
  }

  privateKey = await jose.importPKCS8(privatePem, 'RS256');
  publicKey = await jose.importSPKI(publicPem, 'RS256');
}

/**
 * Sign an access token (RS256). Per SECURITY-RULEBOOK A.1
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  if (!privateKey) await initializeKeys();

  return new jose.SignJWT({
    sub: payload.sub,
    pid: payload.pid,
    role: payload.role,
    perms: payload.perms,
    mfa: payload.mfa,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(privateKey!);
}

/**
 * Verify an access token. Returns decoded payload or throws.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  if (!publicKey) await initializeKeys();

  const { payload } = await jose.jwtVerify(token, publicKey!, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  return {
    sub: payload['sub'] as string,
    pid: payload['pid'] as string,
    role: payload['role'] as TokenPayload['role'],
    perms: payload['perms'] as string[],
    mfa: payload['mfa'] as boolean,
    iat: payload['iat'] as number,
    exp: payload['exp'] as number,
  };
}

/**
 * Generate a refresh token (opaque UUID stored in DB). Per A.1.2
 */
export function generateRefreshToken(): string {
  return crypto.randomUUID();
}

export { REFRESH_TOKEN_EXPIRY };
