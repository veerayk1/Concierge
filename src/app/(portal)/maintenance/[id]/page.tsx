/**
 * Concierge — Request Details
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Request Details | Concierge',
};

interface MaintenanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell title="Request Details" description={`Viewing maintenance request ${id}.`}>
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
