/**
 * Concierge — Community
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Community | Concierge',
};

export default function CommunityPage() {
  return (
    <PageShell
      title="Community"
      description="Classified ads, events, and community engagement features."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
