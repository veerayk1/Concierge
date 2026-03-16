/**
 * Concierge — Amenity Details
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Amenity Details | Concierge',
};

interface AmenityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AmenityDetailPage({ params }: AmenityDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell title="Amenity Details" description={`Viewing amenity ${id}.`}>
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
