/**
 * Concierge — Parking Management
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Parking | Concierge',
};

export default function ParkingPage() {
  return (
    <PageShell
      title="Parking Management"
      description="Parking permits, violations, and spot tracking."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
