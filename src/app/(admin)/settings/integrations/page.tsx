/**
 * Concierge — Integrations
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Integrations | Concierge',
};

export default function IntegrationsPage() {
  return (
    <PageShell
      title="Integrations"
      description="Manage third-party integrations and API connections."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
