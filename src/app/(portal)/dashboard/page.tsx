/**
 * Concierge — Dashboard
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Dashboard | Concierge',
};

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard" description="Overview of your building at a glance.">
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
