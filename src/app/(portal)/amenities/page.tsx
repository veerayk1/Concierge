/**
 * Concierge — Amenity Booking
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Amenities | Concierge',
};

export default function AmenitiesPage() {
  return (
    <PageShell
      title="Amenity Booking"
      description="Browse and reserve building amenities with calendar and list views."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
