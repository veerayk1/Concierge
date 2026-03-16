/**
 * Concierge — Announcements
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Announcements | Concierge',
};

export default function AnnouncementsPage() {
  return (
    <PageShell
      title="Announcements"
      description="Create and distribute announcements via web, email, SMS, and push."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
