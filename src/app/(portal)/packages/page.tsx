/**
 * Concierge — Package Management
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Packages | Concierge',
};

export default function PackagesPage() {
  return (
    <PageShell
      title="Package Management"
      description="Track incoming and outgoing packages with courier-specific logging."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
