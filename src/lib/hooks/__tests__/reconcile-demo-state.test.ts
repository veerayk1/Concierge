/**
 * Regression test for the super-admin "stuck in a property's dashboard" bug.
 *
 * A real authenticated super_admin who had a leftover `demo_role` in localStorage
 * (e.g. from a prior "Open Portal" impersonation or a demo-role switch) was being
 * shown a single property's property_admin dashboard instead of their
 * multi-property overview — because the dashboard honored the stale demo_role.
 *
 * reconcileDemoStateForRealSession() is called whenever a real session is
 * restored: it purges stale demo impersonation, but PRESERVES an active
 * showcase impersonation (demo_mode === 'showcase'), which is banner-guarded
 * and has its own exit.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { reconcileDemoStateForRealSession } from '../use-auth';

describe('reconcileDemoStateForRealSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('purges a stale (non-showcase) demo_role left over on a real session', () => {
    localStorage.setItem('demo_role', 'property_admin');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
    localStorage.setItem('demo_return_role', 'super_admin');
    // no demo_mode → this is leftover junk, not an active impersonation

    reconcileDemoStateForRealSession();

    expect(localStorage.getItem('demo_role')).toBeNull();
    expect(localStorage.getItem('demo_propertyId')).toBeNull();
    expect(localStorage.getItem('demo_return_role')).toBeNull();
  });

  it('PRESERVES an active showcase impersonation (banner-guarded, has its own exit)', () => {
    localStorage.setItem('demo_role', 'property_admin');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
    localStorage.setItem('demo_mode', 'showcase');

    reconcileDemoStateForRealSession();

    expect(localStorage.getItem('demo_role')).toBe('property_admin');
    expect(localStorage.getItem('demo_mode')).toBe('showcase');
  });

  it('is a no-op when there is no demo state', () => {
    reconcileDemoStateForRealSession();
    expect(localStorage.getItem('demo_role')).toBeNull();
  });
});
