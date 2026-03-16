/**
 * Concierge — Event Log
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Event Log | Concierge',
};

export default function EventsPage() {
  return (
    <PageShell title="Event Log" description="Unified event log with configurable event types.">
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
