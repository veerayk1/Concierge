/**
 * Concierge — Event Type Configuration
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Event Types | Concierge',
};

export default function EventTypesPage() {
  return (
    <PageShell
      title="Event Type Configuration"
      description="Configure event types, groups, icons, and notification templates."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
