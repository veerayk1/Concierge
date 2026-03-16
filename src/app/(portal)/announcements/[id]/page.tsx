/**
 * Concierge — Announcement Details
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Announcement Details | Concierge',
};

interface AnnouncementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell title="Announcement Details" description={`Viewing announcement ${id}.`}>
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
