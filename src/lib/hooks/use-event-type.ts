'use client';

/**
 * Hook to look up an event type by slug for a property.
 * Returns the resolved UUID event type ID.
 */

import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface EventType {
  id: string;
  name: string;
  slug: string;
}

export function useEventTypeBySlug(propertyId: string, slug: string) {
  // Fetch all event types for the property
  const { data: eventTypes, loading } = useApi<EventType[]>(
    propertyId ? apiUrl('/api/v1/event-types', { propertyId }) : null,
  );

  const eventType = eventTypes?.find((et) => et.slug === slug) || null;

  return {
    eventTypeId: eventType?.id || null,
    eventType,
    loading,
  };
}
