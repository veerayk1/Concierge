/**
 * Concierge — Resident Directory
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Residents | Concierge',
};

export default function ResidentsPage() {
  return (
    <PageShell
      title="Resident Directory"
      description="View and manage all residents, owners, and tenants."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
