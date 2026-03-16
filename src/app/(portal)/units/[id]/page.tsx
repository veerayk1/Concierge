/**
 * Concierge — Unit File
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Unit File | Concierge',
};

interface UnitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitDetailPage({ params }: UnitDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell title="Unit File" description={`Viewing unit ${id}.`}>
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
