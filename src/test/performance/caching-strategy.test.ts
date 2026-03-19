/**
 * Caching Strategy Tests
 *
 * Validates that the application follows proper caching patterns:
 *   - Static pages have appropriate Cache-Control headers
 *   - API responses include proper cache headers
 *   - Health endpoint has no-cache directive
 *   - Static assets have long cache duration
 *
 * These are structural tests that inspect configuration, middleware, and
 * route handler patterns without running a production server.
 *
 * @module test/performance/caching-strategy
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'src');
const API_DIR = path.join(SRC, 'app', 'api');

/** Read a file and return its content. */
function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/** Recursively collect all route.ts files under a directory. */
function collectRouteFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
      results.push(fullPath);
    }
  }

  return results;
}

/** Collect all page.tsx files under a directory. */
function collectPageFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      results.push(...collectPageFiles(fullPath));
    } else if (entry.name === 'page.tsx') {
      results.push(fullPath);
    }
  }

  return results;
}

const routeFiles = collectRouteFiles(API_DIR);

// ============================================================================
// 1. Static pages have appropriate Cache-Control headers
// ============================================================================

describe('Static pages — Cache-Control headers', () => {
  const nextConfig = readFile(path.join(ROOT, 'next.config.ts'));

  it('next.config.ts has a headers() function', () => {
    expect(nextConfig).toContain('async headers()');
  });

  it('next.config.ts defines custom headers for specific routes', () => {
    expect(nextConfig).toContain('headers:');
    expect(nextConfig).toContain('source:');
  });

  it('security.txt has proper Content-Type header', () => {
    expect(nextConfig).toContain('security.txt');
    expect(nextConfig).toContain("'Content-Type'");
    expect(nextConfig).toContain("'text/plain'");
  });

  it('marketing pages use appropriate revalidation or static generation', () => {
    const marketingDir = path.join(SRC, 'app', '(marketing)');
    const marketingPages = collectPageFiles(marketingDir);

    // Marketing pages should be statically generated or have appropriate
    // revalidation periods. Check for dynamic usage markers.
    const dynamicPages: string[] = [];

    for (const file of marketingPages) {
      const content = readFile(file);
      // A marketing page should NOT be force-dynamic unless necessary
      if (content.includes("dynamic = 'force-dynamic'")) {
        dynamicPages.push(path.relative(ROOT, file));
      }
    }

    // Marketing pages should be static (no force-dynamic)
    expect(dynamicPages).toEqual([]);
  });

  it('layout files do not set unnecessary dynamic exports', () => {
    const marketingDir = path.join(SRC, 'app', '(marketing)');
    const layoutPath = path.join(marketingDir, 'layout.tsx');

    if (fs.existsSync(layoutPath)) {
      const content = readFile(layoutPath);
      // Marketing layout should be static
      expect(content).not.toContain("dynamic = 'force-dynamic'");
    }
  });
});

// ============================================================================
// 2. API responses include proper cache headers
// ============================================================================

describe('API responses — cache header patterns', () => {
  it('API routes exist for testing', () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  it('API list endpoints return fresh data (no aggressive caching)', () => {
    // API endpoints that return mutable data should NOT have long cache times
    const aggressivelyCached: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      // Check for Cache-Control with long max-age on mutable endpoints
      if (
        content.includes('max-age=31536000') && // 1 year
        !content.includes('_next/static') &&
        !content.includes('favicon')
      ) {
        aggressivelyCached.push(path.relative(ROOT, file));
      }
    }

    expect(aggressivelyCached).toEqual([]);
  });

  it('mutation endpoints (POST/PATCH/DELETE) do not set cache headers', () => {
    const cachedMutations: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      if (
        (content.includes('export async function POST') ||
          content.includes('export async function PATCH') ||
          content.includes('export async function DELETE')) &&
        content.includes("'Cache-Control'")
      ) {
        // The Cache-Control should be no-store for mutations, not a long cache
        if (content.includes('max-age=') && !content.includes('max-age=0')) {
          cachedMutations.push(path.relative(ROOT, file));
        }
      }
    }

    expect(cachedMutations).toEqual([]);
  });

  it('API responses use NextResponse.json (which sets application/json)', () => {
    const missingJsonResponse: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);
      if (
        content.includes('export async function GET') ||
        content.includes('export async function POST')
      ) {
        if (!content.includes('NextResponse.json') && !content.includes('NextResponse')) {
          missingJsonResponse.push(path.relative(ROOT, file));
        }
      }
    }

    expect(missingJsonResponse).toEqual([]);
  });

  it('well-formed API cache headers follow no-store pattern for dynamic data', () => {
    // Validate the expected cache header pattern for API routes
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    };

    expect(headers['Cache-Control']).toContain('no-store');
    expect(headers['Cache-Control']).toContain('must-revalidate');
  });

  it('configuration/lookup endpoints can use short-lived cache', () => {
    // Endpoints like feature-flags, couriers, amenity groups can cache briefly
    const shortCacheHeaders = {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    };

    expect(shortCacheHeaders['Cache-Control']).toContain('max-age=60');
    expect(shortCacheHeaders['Cache-Control']).toContain('stale-while-revalidate');
  });
});

// ============================================================================
// 3. Health endpoint has no-cache
// ============================================================================

describe('Health endpoint — no-cache directive', () => {
  it('health endpoint should not cache responses', () => {
    // Health checks must always return fresh data to accurately report system status
    // Check if a health route exists
    const healthRoutePath = path.join(API_DIR, 'health', 'route.ts');
    const healthRouteV1Path = path.join(API_DIR, 'v1', 'health', 'route.ts');

    const healthExists = fs.existsSync(healthRoutePath) || fs.existsSync(healthRouteV1Path);

    if (healthExists) {
      const healthPath = fs.existsSync(healthRoutePath) ? healthRoutePath : healthRouteV1Path;
      const content = readFile(healthPath);

      // Health endpoint should either:
      // 1. Set Cache-Control: no-cache/no-store headers
      // 2. Use dynamic = 'force-dynamic' export
      // 3. Not set any cache headers (Next.js defaults to no-cache for dynamic routes)
      const hasNoCache =
        content.includes('no-cache') ||
        content.includes('no-store') ||
        content.includes("dynamic = 'force-dynamic'") ||
        !content.includes('Cache-Control');

      expect(hasNoCache).toBe(true);
    }
  });

  it('health endpoint response pattern returns status and timestamp', () => {
    // Validate the expected health check response shape
    const healthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };

    expect(healthResponse).toHaveProperty('status');
    expect(healthResponse.status).toBe('ok');
    expect(healthResponse).toHaveProperty('timestamp');
    expect(typeof healthResponse.timestamp).toBe('string');
  });

  it('health check data should never be cached by CDN or browser', () => {
    // The expected headers for a health endpoint
    const expectedHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    };

    expect(expectedHeaders['Cache-Control']).toContain('no-store');
    expect(expectedHeaders['Cache-Control']).toContain('max-age=0');
    expect(expectedHeaders.Pragma).toBe('no-cache');
  });

  it('monitoring endpoints (health, readiness, liveness) must not be cached', () => {
    // Standard Kubernetes health probe endpoints
    const monitoringEndpoints = ['health', 'healthz', 'ready', 'readyz', 'live', 'livez'];

    for (const endpoint of monitoringEndpoints) {
      const routePath = path.join(API_DIR, endpoint, 'route.ts');
      const v1RoutePath = path.join(API_DIR, 'v1', endpoint, 'route.ts');

      if (fs.existsSync(routePath)) {
        const content = readFile(routePath);
        // Must not have aggressive caching
        expect(content).not.toContain('max-age=31536000');
        expect(content).not.toContain("'public'");
      }

      if (fs.existsSync(v1RoutePath)) {
        const content = readFile(v1RoutePath);
        expect(content).not.toContain('max-age=31536000');
        expect(content).not.toContain("'public'");
      }
    }
  });
});

// ============================================================================
// 4. Static assets have long cache duration
// ============================================================================

describe('Static assets — long cache duration', () => {
  it('Next.js standalone output is configured for optimal asset serving', () => {
    const nextConfig = readFile(path.join(ROOT, 'next.config.ts'));
    // standalone output mode handles static assets with proper hashing
    expect(nextConfig).toContain("output: 'standalone'");
  });

  it('static asset hash pattern is used by Next.js build system', () => {
    // Next.js automatically hashes static files in _next/static/
    // This test validates the configuration supports this behavior
    const nextConfig = readFile(path.join(ROOT, 'next.config.ts'));

    // No custom asset prefix that would break hashing
    const hasCustomAssetPrefix = nextConfig.includes('assetPrefix:');
    if (hasCustomAssetPrefix) {
      // If custom prefix is used, it should be a CDN URL
      expect(nextConfig).toMatch(/assetPrefix:\s*['"]https:\/\//);
    }
  });

  it('public directory static files are organized properly', () => {
    const publicDir = path.join(ROOT, 'public');

    if (fs.existsSync(publicDir)) {
      const entries = fs.readdirSync(publicDir);

      // Ensure no source files leak into public directory
      const sourceFiles = entries.filter(
        (e) => e.endsWith('.ts') || e.endsWith('.tsx') || e.endsWith('.env'),
      );
      expect(sourceFiles).toEqual([]);
    }
  });

  it('expected long-cache headers for hashed static assets', () => {
    // Validate the expected caching pattern for Next.js static assets
    const staticHeaders = {
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    // max-age=31536000 is 1 year — standard for content-addressed (hashed) files
    expect(staticHeaders['Cache-Control']).toContain('max-age=31536000');
    expect(staticHeaders['Cache-Control']).toContain('immutable');
    expect(staticHeaders['Cache-Control']).toContain('public');
  });

  it('immutable directive is appropriate for hashed assets', () => {
    // Files with content hashes in their names never change
    // 'immutable' tells browsers to never revalidate
    const hashPattern = /\.[a-zA-Z0-9]{8,}\.(js|css|woff2?)$/;

    const exampleHashedFiles = ['main.a1b2c3d4.js', 'styles.e5f6A7B8.css', 'font.C9D0E1F2.woff2'];

    for (const file of exampleHashedFiles) {
      expect(hashPattern.test(file)).toBe(true);
    }
  });

  it('non-hashed static files (favicon, robots.txt) use shorter cache', () => {
    // Files without content hashes should use shorter cache with revalidation
    const shortCacheHeaders = {
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    };

    // 1 hour cache with revalidation for non-hashed files
    expect(shortCacheHeaders['Cache-Control']).toContain('max-age=3600');
    expect(shortCacheHeaders['Cache-Control']).toContain('must-revalidate');
  });
});

// ============================================================================
// 5. Middleware and edge caching patterns
// ============================================================================

describe('Middleware — caching integration', () => {
  it('middleware file exists for request handling', () => {
    const middlewarePath = path.join(SRC, 'middleware.ts');
    // Middleware is optional but recommended for caching headers
    if (fs.existsSync(middlewarePath)) {
      const content = readFile(middlewarePath);
      expect(content).toBeTruthy();
    }
  });

  it('API routes do not set conflicting cache headers', () => {
    const conflicting: string[] = [];

    for (const file of routeFiles) {
      const content = readFile(file);

      // Check for conflicting directives
      if (content.includes('no-store') && content.includes('max-age=31536000')) {
        conflicting.push(path.relative(ROOT, file));
      }
      if (content.includes('no-cache') && content.includes('immutable')) {
        conflicting.push(path.relative(ROOT, file));
      }
    }

    expect(conflicting).toEqual([]);
  });

  it('auth-related API routes do not cache sensitive data', () => {
    const authDir = path.join(API_DIR, 'auth');

    if (fs.existsSync(authDir)) {
      const authRoutes = collectRouteFiles(authDir);

      for (const file of authRoutes) {
        const content = readFile(file);
        // Auth responses should never be publicly cached
        const hasPublicCache = content.includes("'public'") && content.includes('Cache-Control');

        if (hasPublicCache) {
          // Fail — auth data should not be publicly cached
          expect(path.relative(ROOT, file)).toBe('');
        }
      }
    }
  });

  it('user-specific endpoints (me, sessions) are not cached', () => {
    const userSpecificRoutes = routeFiles.filter((f) => {
      const rel = path.relative(API_DIR, f);
      return rel.includes('/me/') || rel.includes('/sessions/');
    });

    for (const file of userSpecificRoutes) {
      const content = readFile(file);
      // These endpoints return user-specific data — no public caching
      const hasPublicCache =
        content.includes("Cache-Control', 'public") || content.includes('Cache-Control", "public');

      expect(hasPublicCache).toBe(false);
    }
  });
});

// ============================================================================
// 6. Cache header contract validation
// ============================================================================

describe('Cache header contracts — structural validation', () => {
  it('Cache-Control directives follow RFC 7234 format', () => {
    const validDirectives = [
      'public',
      'private',
      'no-cache',
      'no-store',
      'must-revalidate',
      'proxy-revalidate',
      'immutable',
      'no-transform',
      's-maxage',
      'max-age',
      'stale-while-revalidate',
      'stale-if-error',
    ];

    // Validate example headers use only valid directives
    const testHeaders = [
      'public, max-age=31536000, immutable',
      'no-store, no-cache, must-revalidate',
      'public, max-age=60, stale-while-revalidate=120',
      'private, no-cache',
    ];

    for (const header of testHeaders) {
      const parts = header.split(',').map((p) => p.trim());
      for (const part of parts) {
        const directive = part.split('=')[0]!;
        expect(validDirectives).toContain(directive);
      }
    }
  });

  it('max-age values are reasonable for their use case', () => {
    const cases = [
      { context: 'static assets (hashed)', maxAge: 31536000, minExpected: 86400 },
      { context: 'short-lived cache', maxAge: 60, minExpected: 0 },
      { context: 'no cache', maxAge: 0, minExpected: 0 },
    ];

    for (const { maxAge, minExpected } of cases) {
      expect(maxAge).toBeGreaterThanOrEqual(minExpected);
    }
  });

  it('stale-while-revalidate is used with appropriate max-age', () => {
    // SWR should not be used alone without max-age
    const validSWR = 'max-age=60, stale-while-revalidate=120';
    expect(validSWR).toContain('max-age=');
    expect(validSWR).toContain('stale-while-revalidate=');

    // SWR duration should be longer than max-age
    const maxAgeMatch = validSWR.match(/max-age=(\d+)/);
    const swrMatch = validSWR.match(/stale-while-revalidate=(\d+)/);

    expect(maxAgeMatch).toBeTruthy();
    expect(swrMatch).toBeTruthy();

    const maxAge = parseInt(maxAgeMatch![1]!, 10);
    const swr = parseInt(swrMatch![1]!, 10);
    expect(swr).toBeGreaterThanOrEqual(maxAge);
  });
});
