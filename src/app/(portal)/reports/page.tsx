/**
 * Concierge — Reports & Analytics
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Reports | Concierge',
};

export default function ReportsPage() {
  return (
    <PageShell
      title="Reports & Analytics"
      description="Generate and export reports across all modules."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
