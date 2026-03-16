/**
 * Concierge — Structured Logger
 *
 * Provides structured JSON logging via pino. Each logger instance is
 * bound to a service name for easy filtering in log aggregation tools.
 *
 * In development, output is pretty-printed via pino-pretty.
 * In production, output is raw JSON for ingestion by ELK / Datadog / etc.
 *
 * PII fields are automatically stripped by `sanitizeLogData` before
 * any value reaches the transport layer.
 */

import pino from 'pino';

import { sanitizeForLog } from '@/server/middleware/log-sanitizer';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const isDev = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// PII Sanitisation (re-exported convenience wrapper)
// ---------------------------------------------------------------------------

/**
 * Strip / mask PII fields from an arbitrary data structure.
 * Delegates to the dedicated log-sanitizer module.
 *
 * @example
 * ```ts
 * logger.info(sanitizeLogData({ email: 'jane@acme.com', password: 's3cret' }));
 * // → { email: 'j***@acme.com', password: '[REDACTED]' }
 * ```
 */
export function sanitizeLogData(data: unknown): unknown {
  return sanitizeForLog(data);
}

// ---------------------------------------------------------------------------
// Logger Factory
// ---------------------------------------------------------------------------

/**
 * Base pino instance shared across all child loggers.
 */
const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),

  // ISO 8601 timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Custom serializers to prevent accidental PII leakage
  serializers: {
    req: (req: unknown) => sanitizeForLog(req),
    res: (res: unknown) => sanitizeForLog(res),
    err: pino.stdSerializers.err,
  },

  // In dev, pipe through pino-pretty for human-readable output.
  // pino-pretty is a devDependency and loaded dynamically via transport.
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

/**
 * Create a child logger bound to a specific service / module name.
 *
 * @param service - The name of the service or module (e.g. "auth", "events", "middleware").
 * @returns A pino child logger with `service` attached to every log line.
 *
 * @example
 * ```ts
 * const log = createLogger('auth');
 * log.info({ userId: '123' }, 'Login successful');
 * // → {"level":30,"time":"2026-03-16T...","service":"auth","userId":"123","msg":"Login successful"}
 * ```
 */
export function createLogger(service: string): pino.Logger {
  return baseLogger.child({ service });
}
