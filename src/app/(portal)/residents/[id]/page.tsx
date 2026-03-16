/**
 * Concierge — Resident Profile
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Resident Profile | Concierge',
};

interface ResidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell title="Resident Profile" description={`Viewing resident ${id}.`}>
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
