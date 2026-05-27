'use client';

/**
 * Hook to fetch units for a property — used by all dialogs that need a unit selector.
 * Returns { units, loading } where units is an array of { id, number, floor }.
 */

import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface Unit {
  id: string;
  number: string;
  floor: number;
}

// Numeric-aware comparator: "1001" must come AFTER "101", not before.
// Locale-string compare with { numeric: true } handles mixed formats
// (e.g. "PH-1", "PH-2", "101A", "101B") correctly without resorting
// to a hand-rolled regex parse. Stable across locales because we pass
// 'en' explicitly.
const compareUnitNumbers = (a: string, b: string): number =>
  a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });

export function usePropertyUnits(propertyId: string) {
  const url = propertyId ? apiUrl('/api/v1/units', { propertyId, pageSize: '200' }) : null;

  const { data, loading } = useApi<Unit[]>(url);

  // Sort in the hook (one place) so every dialog consuming this hook
  // gets numerically-ordered units automatically. Previously every
  // dropdown rendered the API's string-sorted order: 1001, 1002, …,
  // 101, 102, …, 1101 — confusing for staff selecting a unit on the
  // fly. The API itself doesn't guarantee an order so we sort client-
  // side rather than depending on a server change.
  const sortedUnits = data ? [...data].sort((a, b) => compareUnitNumbers(a.number, b.number)) : [];

  return {
    units: sortedUnits,
    loading,
  };
}
