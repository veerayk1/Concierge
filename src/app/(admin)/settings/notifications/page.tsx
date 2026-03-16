/**
 * Concierge — Notification Templates
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Notifications | Concierge',
};

export default function NotificationsPage() {
  return (
    <PageShell
      title="Notification Templates"
      description="Configure notification channels, templates, and delivery preferences."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
