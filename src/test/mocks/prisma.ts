/**
 * Shared Prisma mock factory for unit tests.
 *
 * The portal has 179 Prisma models and routes grow new queries over time.
 * Per-file inline mocks that list only *some* models break the moment a
 * route adds a call to an unlisted model: the mock returns `undefined`, the
 * route throws, and the assertion fails with a misleading 500.
 *
 * createMockPrisma() returns a Proxy that auto-stubs EVERY model and EVERY
 * method as a vi.fn(). Unconfigured methods resolve to a safe default
 * (null for single-record reads, [] is NOT assumed — callers override
 * findMany where they need an array). This means an unanticipated query can
 * never throw; tests only wire up the calls they actually assert on.
 *
 * Usage:
 *   import { createMockPrisma } from '@/test/mocks/prisma';
 *   const findFirst = vi.fn().mockResolvedValue(null);
 *   vi.mock('@/server/db', () => ({
 *     prisma: createMockPrisma({ user: { findFirst } }),
 *   }));
 *
 * Any model/method not in the overrides object is a fresh vi.fn() resolving
 * to null. Override per test for the data your assertions need.
 */

import { vi } from 'vitest';

type AnyFn = (...args: unknown[]) => unknown;
type ModelOverrides = Record<string, AnyFn>;
type PrismaOverrides = Record<string, ModelOverrides>;

// Methods that should default to resolving an empty array rather than null,
// because route code almost always iterates the result.
const ARRAY_METHODS = new Set(['findMany']);

function makeModelProxy(modelName: string, overrides: ModelOverrides = {}): Record<string, AnyFn> {
  const cache: Record<string, AnyFn> = {};
  return new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (typeof prop !== 'string') return undefined;
        if (overrides[prop]) return overrides[prop];
        if (!cache[prop]) {
          const fn = vi.fn();
          if (ARRAY_METHODS.has(prop)) fn.mockResolvedValue([]);
          else if (prop === 'count') fn.mockResolvedValue(0);
          else fn.mockResolvedValue(null);
          cache[prop] = fn as unknown as AnyFn;
        }
        return cache[prop];
      },
    },
  ) as Record<string, AnyFn>;
}

/**
 * Build a fully-populated Prisma mock. Pass overrides keyed by model name,
 * each an object of method → vi.fn(). Everything else is auto-stubbed.
 *
 * Also stubs $transaction (runs the callback with the same mock, or resolves
 * an array of awaited promises), $queryRaw / $executeRaw (resolve null/0),
 * $connect / $disconnect.
 */
export function createMockPrisma(overrides: PrismaOverrides = {}): Record<string, unknown> {
  const modelCache: Record<string, Record<string, AnyFn>> = {};

  const base: Record<string, unknown> = {
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        // interactive transaction: hand the proxy back as the tx client
        return (arg as (tx: unknown) => unknown)(proxy);
      }
      if (Array.isArray(arg)) return Promise.all(arg);
      return null;
    }),
    $queryRaw: vi.fn().mockResolvedValue(null),
    $queryRawUnsafe: vi.fn().mockResolvedValue(null),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };

  const proxy: Record<string, unknown> = new Proxy(base, {
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      if (prop in target) return target[prop];
      // any model access → cached model proxy
      if (!modelCache[prop]) {
        modelCache[prop] = makeModelProxy(prop, overrides[prop]);
      }
      return modelCache[prop];
    },
  });

  return proxy;
}
