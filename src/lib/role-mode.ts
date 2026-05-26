/**
 * Persona-mode detection.
 *
 * Many shared pages in /(portal) need slightly different copy / actions
 * depending on whether the viewer is a resident, a member of staff, or
 * an admin authoring content. We keep the role check identical across
 * pages so the UI never inconsistently leaks admin controls.
 *
 * Pages should declare which role-set they want and call
 * `hasAnyRole(THIS_SET)` once on mount. Don't import this into server
 * components — it reads from window.localStorage.
 *
 * Two sources of truth, in priority order:
 *   1. `demo_role` localStorage key (used by the demo property switcher
 *      that admins flip between roles without logging out).
 *   2. `auth_user` localStorage key — the real signed-in user.
 *
 * Returns false in SSR / when no role is available, which is the safe
 * fallback (hides admin controls until we know who's looking).
 */

import { useEffect, useState } from 'react';

// -- Common role-set presets used across the portal ---------------------------

/** Anyone who lives in the building (or owns a unit from abroad). */
export const RESIDENT_ROLES = new Set([
  'resident_owner',
  'resident_tenant',
  'offsite_owner',
  'family_member',
]);

/** Property-level admins + board. Can author building-wide content. */
export const PROPERTY_ADMIN_ROLES = new Set([
  'super_admin',
  'property_admin',
  'property_manager',
  'board_member',
]);

/** Property admins + ops staff who keep building services running. */
export const BUILDING_OPS_ROLES = new Set([
  'super_admin',
  'property_admin',
  'property_manager',
  'board_member',
  'superintendent',
  'front_desk',
]);

// -- Detection helpers --------------------------------------------------------

function readRole(): string {
  if (typeof window === 'undefined') return '';
  const demo = window.localStorage.getItem('demo_role') ?? '';
  if (demo) return demo;
  try {
    const stored = window.localStorage.getItem('auth_user');
    const parsed = stored ? (JSON.parse(stored) as { role?: string }) : null;
    return parsed?.role ?? '';
  } catch {
    return '';
  }
}

/** Synchronous check — returns true if the current viewer's role is in the
 *  given set. SSR-safe (returns false). */
export function hasAnyRole(roles: Set<string>): boolean {
  return roles.has(readRole());
}

/** React hook variant. Reads the role once on mount (no live subscription —
 *  if the user switches demo_role, navigate to re-render). Returns false
 *  on the first render so SSR matches the initial client paint. */
export function useHasRole(roles: Set<string>): boolean {
  const [yes, setYes] = useState(false);
  useEffect(() => {
    setYes(hasAnyRole(roles));
  }, [roles]);
  return yes;
}

/** Convenience hook — am I a resident? */
export function useIsResident(): boolean {
  return useHasRole(RESIDENT_ROLES);
}

/** Convenience hook — can I author property-wide content (admin / board)? */
export function useIsPropertyAdmin(): boolean {
  return useHasRole(PROPERTY_ADMIN_ROLES);
}

/** Convenience hook — am I property ops staff (admin / board / super / desk)? */
export function useIsBuildingOps(): boolean {
  return useHasRole(BUILDING_OPS_ROLES);
}
