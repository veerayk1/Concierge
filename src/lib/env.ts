/**
 * Concierge — Environment Variable Validation
 *
 * Zod schema for all environment variables.
 * Validates and provides type-safe access. Fails fast on missing
 * required vars in production, graceful defaults for development.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   console.log(env.DATABASE_URL);
 *
 * @module lib/env
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema Definition
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // -- App ------------------------------------------------------------------
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // -- Database (PostgreSQL) ------------------------------------------------
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_DIRECT_URL: z.string().optional(),
  DATABASE_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  // -- Redis ----------------------------------------------------------------
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_KEY_PREFIX: z.string().default('concierge:'),

  // -- Auth / JWT -----------------------------------------------------------
  JWT_PRIVATE_KEY: z.string().default('not-set'),
  JWT_PUBLIC_KEY: z.string().default('not-set'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-in-production-min-32-chars'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-in-production-min-32-chars'),
  JWT_ISSUER: z.string().default('concierge'),
  JWT_AUDIENCE: z.string().default('concierge-app'),

  // -- AI Integrations ------------------------------------------------------
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // -- Email (SES / SMTP) ---------------------------------------------------
  EMAIL_FROM: z.string().email().default('noreply@concierge.app'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // -- SMS (Twilio) ---------------------------------------------------------
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // -- Object Storage (S3) --------------------------------------------------
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('ca-central-1'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),

  // -- CORS -----------------------------------------------------------------
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((s) => s.trim())),

  // -- Feature Flags --------------------------------------------------------
  ENABLE_MFA: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ENABLE_PUSH_NOTIFICATIONS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // -- Encryption (KMS) -----------------------------------------------------
  KMS_KEY_ARN: z.string().optional(),

  // -- Monitoring -----------------------------------------------------------
  SENTRY_DSN: z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// Type Export
// ---------------------------------------------------------------------------

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(', ')}`)
      .join('\n');

    // In production, fail loudly and immediately
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing or invalid environment variables:\n${errorMessages}\n\n` +
          'The application cannot start with invalid configuration.',
      );
    }

    // In development/test, warn but continue with defaults
    console.warn(
      `[env] Warning: Some environment variables are missing or invalid:\n${errorMessages}\n` +
        'Using defaults where possible. Set these variables to suppress this warning.',
    );

    // Re-parse with partial to get as much as possible
    const lenient = envSchema.partial().safeParse(process.env);

    if (lenient.success) {
      return lenient.data as Env;
    }

    // Last resort: return defaults by parsing empty object
    const defaults = envSchema.safeParse({
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/concierge',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
      JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY ?? 'dev-private-key',
      JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY ?? 'dev-public-key',
    });

    if (defaults.success) {
      return defaults.data;
    }

    throw new Error(`Cannot initialize environment configuration:\n${errorMessages}`);
  }

  return parsed.data;
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

/**
 * Validated, type-safe environment variables.
 *
 * In production, the app crashes on startup if required vars are missing.
 * In development, missing vars use defaults with a console warning.
 */
export const env: Env = validateEnv();
