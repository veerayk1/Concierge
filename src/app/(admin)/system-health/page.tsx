/**
 * Concierge — System Health
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'System Health | Concierge',
};

export default function SystemHealthPage() {
  return (
    <PageShell
      title="System Health"
      description="Monitor system status, service health, and performance metrics."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
