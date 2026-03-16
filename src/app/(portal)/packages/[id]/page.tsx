/**
 * Concierge — Package Details
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Package Details | Concierge',
};

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell title="Package Details" description={`Viewing package ${id}.`}>
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
