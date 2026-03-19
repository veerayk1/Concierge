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

export function usePropertyUnits(propertyId: string) {
  const url = propertyId ? apiUrl('/api/v1/units', { propertyId, pageSize: '200' }) : null;

  const { data, loading } = useApi<Unit[]>(url);

  return {
    units: data || [],
    loading,
  };
}
