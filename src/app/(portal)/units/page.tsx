/**
 * Concierge — Unit Directory
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Units | Concierge',
};

export default function UnitsPage() {
  return (
    <PageShell
      title="Unit Directory"
      description="Browse all units with modular overview and custom fields."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
