/**
 * Concierge — Incident Reports
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Incident Reports | Concierge',
};

export default function IncidentsPage() {
  return (
    <PageShell title="Incident Reports" description="Log, track, and resolve security incidents.">
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
