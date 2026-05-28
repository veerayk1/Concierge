'use client';

/**
 * useNotificationBadge — drives the header bell count (UX-286).
 *
 * Returns the count of FAILED outbound notification deliveries for the
 * current property in the last 24 hours. That's the highest-signal
 * thing the bell can surface to a staff member: emails the platform
 * tried to send to residents that bounced or failed at Resend. A
 * non-zero count is an immediate "go to /notifications and look".
 *
 * Residents don't have access to /notifications today (it's staff-only
 * per UX-282), so the hook returns 0 for them and the bell stays
 * silent. A future iteration can return a per-resident count if/when
 * a resident-facing inbox is built.
 */

import { useEffect, useMemo, useState } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { useAuth } from '@/lib/hooks/use-auth';
import { getPropertyId } from '@/lib/demo-config';

const STAFF_ROLES = new Set([
  'super_admin',
  'property_admin',
  'property_manager',
  'front_desk',
  'security_supervisor',
  'board_member',
]);

interface DeliveriesMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DeliveriesResponse {
  items: unknown[];
  meta: DeliveriesMeta;
}

export function useNotificationBadge(): { count: number; href: string } {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isStaff = user ? STAFF_ROLES.has(user.role) : false;

  const url = useMemo(() => {
    if (!mounted || !isStaff) return null;
    const propertyId = getPropertyId();
    if (!propertyId) return null;
    // Pull failed deliveries in the last 24h. pageSize=1 because we
    // only need the meta.total — the page never renders these items.
    return apiUrl('/api/v1/notifications/deliveries', {
      propertyId,
      status: 'failed',
      pageSize: '1',
    });
  }, [mounted, isStaff]);

  const { data } = useApi<DeliveriesResponse>(url);
  const total = data?.meta?.total ?? 0;

  // Residents don't have read access to /notifications (it's the staff
  // failed-delivery dashboard), so clicking their bell would land them
  // on a 403 / redirect. /announcements is the closest "what's new for
  // me" surface they do have. Staff get the failed-delivery view, which
  // is where the badge count is sourced from anyway.
  const href = isStaff ? '/notifications?status=failed' : '/announcements';

  return {
    count: total,
    href,
  };
}
