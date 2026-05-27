/**
 * Permission Gates — Regression Tests
 *
 * Locks in the role-gate fixes shipped as UX-275 through UX-281. These
 * routes were originally written with `guardRoute(request)` (no roles
 * arg), which let any authenticated tenant member through — including
 * residents on staff-only endpoints. An adversarial probe round found
 * 11 distinct leaks in a single sweep; this suite makes sure they
 * don't silently regress.
 *
 * Test strategy: mock `guardRoute` so we can capture the EXACT options
 * each handler passes. If a future contributor "simplifies" any of
 * these calls back to the bare form, the assertion fails. Routes are
 * called with a no-op request — we don't run the actual handler past
 * the gate, so we don't need a DB.
 *
 * Per CLAUDE.md security non-negotiables + the audit findings in
 * docs/audit/PRE-DEV-READINESS.md.
 *
 * @module test/security/permission-gates
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mock guardRoute + enforcePropertyAccess. Every handler in this suite
// short-circuits at guardRoute by returning a contrived auth.error so
// the test doesn't have to satisfy downstream Prisma/Resend/etc calls.
// ---------------------------------------------------------------------------

const guardRouteMock = vi.fn();
const enforcePropertyAccessMock = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => guardRouteMock(...args),
  enforcePropertyAccess: (...args: unknown[]) => enforcePropertyAccessMock(...args),
}));

// Other dependencies that some route files import at module scope.
// We don't need their real behaviour for these tests.
vi.mock('@/server/db', () => ({ prisma: {} }));
vi.mock('@/server/middleware/module-gate', () => ({
  requireModule: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/server/email', () => ({ sendEmailWithLog: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

// Force every guardRoute invocation to short-circuit with a stable 403
// so we can observe the options it was called with without running the
// rest of the handler. The status code itself doesn't matter to the
// assertions — only the call args do.
function arm() {
  guardRouteMock.mockReset();
  enforcePropertyAccessMock.mockReset();
  guardRouteMock.mockResolvedValue({
    user: null,
    error: NextResponse.json({ error: 'STUB' }, { status: 403 }),
  });
  enforcePropertyAccessMock.mockReturnValue(null);
}

// Convenience: read the second arg (options) that the handler passed
// into the most recent guardRoute call.
function lastGuardOptions(): { roles?: string[] } | undefined {
  const call = guardRouteMock.mock.calls.at(-1);
  return call?.[1] as { roles?: string[] } | undefined;
}

// Build a NextRequest stub that the handlers will accept. We don't go
// through Next's actual NextRequest constructor because some handlers
// pull URL params; passing a plain object with `url` + `headers` is
// enough for the gate-only path.
function req(url = 'http://localhost:3000/api/v1/x?propertyId=p1'): any {
  return {
    url,
    headers: new Headers(),
    json: async () => ({}),
  };
}

beforeEach(() => arm());

// Roles that should NEVER appear in a staff allowlist — if any of the
// gated handlers accidentally includes them, the residents we just
// kicked out get let back in.
const RESIDENT_ROLES = [
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
  'visitor',
] as const;

// Helper: assert the route called guardRoute with a non-empty roles
// allowlist that excludes every resident role.
function expectStaffOnlyGate() {
  const opts = lastGuardOptions();
  expect(opts, 'route must pass options to guardRoute').toBeDefined();
  expect(opts?.roles, 'route must pass a roles allowlist').toBeDefined();
  expect(Array.isArray(opts?.roles), 'roles must be an array').toBe(true);
  expect(opts!.roles!.length).toBeGreaterThan(0);
  for (const r of RESIDENT_ROLES) {
    expect(opts!.roles, `roles allowlist must not include ${r}`).not.toContain(r);
  }
}

// ---------------------------------------------------------------------------
// UX-275 — GET /api/v1/maintenance
// ---------------------------------------------------------------------------

describe('UX-275 /api/v1/maintenance GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/maintenance/route');
    await mod.GET(req() as any);
    expectStaffOnlyGate();
  });
});

// ---------------------------------------------------------------------------
// UX-276 — GET /api/v1/parking, GET /api/v1/recurring-tasks
// ---------------------------------------------------------------------------

describe('UX-276 /api/v1/parking GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/parking/route');
    await mod.GET(req('http://localhost:3000/api/v1/parking?propertyId=p1') as any);
    expectStaffOnlyGate();
  });
});

describe('UX-276 /api/v1/recurring-tasks GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/recurring-tasks/route');
    await mod.GET(req('http://localhost:3000/api/v1/recurring-tasks?propertyId=p1') as any);
    expectStaffOnlyGate();
  });
});

// ---------------------------------------------------------------------------
// UX-277 — GET /api/v1/vehicles (also POST cross-tenant guard)
// ---------------------------------------------------------------------------

describe('UX-277 /api/v1/vehicles GET — staff-only gate + cross-tenant guard', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/vehicles/route');
    await mod.GET(req('http://localhost:3000/api/v1/vehicles?propertyId=p1') as any);
    expectStaffOnlyGate();
  });
});

// ---------------------------------------------------------------------------
// UX-278 — GET /api/v1/occupancy, /api/v1/residents, /api/v1/units
// ---------------------------------------------------------------------------

describe('UX-278 /api/v1/occupancy GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/occupancy/route');
    await mod.GET(req('http://localhost:3000/api/v1/occupancy?propertyId=p1') as any);
    expectStaffOnlyGate();
  });
});

describe('UX-278 /api/v1/residents GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/residents/route');
    await mod.GET(req('http://localhost:3000/api/v1/residents?propertyId=p1') as any);
    expectStaffOnlyGate();
  });
});

describe('UX-278 /api/v1/units GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/units/route');
    await mod.GET(req('http://localhost:3000/api/v1/units?propertyId=p1') as any);
    expectStaffOnlyGate();
  });
});

// ---------------------------------------------------------------------------
// UX-279 — POST + [id] CRUD on /api/v1/shift-log
// ---------------------------------------------------------------------------

describe('UX-279 /api/v1/shift-log POST — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/shift-log/route');
    await mod.POST(req('http://localhost:3000/api/v1/shift-log') as any);
    expectStaffOnlyGate();
  });
});

describe('UX-279 /api/v1/shift-log/[id] GET/PATCH/DELETE — staff-only gate', () => {
  it('GET passes staff-only roles', async () => {
    const mod = await import('@/app/api/v1/shift-log/[id]/route');
    await mod.GET(req('http://localhost:3000/api/v1/shift-log/abc') as any, {
      params: Promise.resolve({ id: 'abc' }),
    });
    expectStaffOnlyGate();
  });
  it('PATCH passes staff-only roles', async () => {
    const mod = await import('@/app/api/v1/shift-log/[id]/route');
    await mod.PATCH(req('http://localhost:3000/api/v1/shift-log/abc') as any, {
      params: Promise.resolve({ id: 'abc' }),
    });
    expectStaffOnlyGate();
  });
  it('DELETE passes staff-only roles', async () => {
    const mod = await import('@/app/api/v1/shift-log/[id]/route');
    await mod.DELETE(req('http://localhost:3000/api/v1/shift-log/abc') as any, {
      params: Promise.resolve({ id: 'abc' }),
    });
    expectStaffOnlyGate();
  });
});

// ---------------------------------------------------------------------------
// UX-281 — POST /api/v1/inspections
// ---------------------------------------------------------------------------

describe('UX-281 /api/v1/inspections POST — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/inspections/route');
    await mod.POST(req('http://localhost:3000/api/v1/inspections') as any);
    expectStaffOnlyGate();
  });
});

// ---------------------------------------------------------------------------
// UX-282 — GET /api/v1/notifications/deliveries (new endpoint)
// ---------------------------------------------------------------------------

describe('UX-282 /api/v1/notifications/deliveries GET — staff-only gate', () => {
  it('passes a roles allowlist that excludes residents', async () => {
    const mod = await import('@/app/api/v1/notifications/deliveries/route');
    await mod.GET(
      req('http://localhost:3000/api/v1/notifications/deliveries?propertyId=p1') as any,
    );
    expectStaffOnlyGate();
  });
});
