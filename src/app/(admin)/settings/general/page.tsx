/**
 * Concierge — General Settings
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'General Settings | Concierge',
};

export default function GeneralSettingsPage() {
  return (
    <PageShell
      title="General Settings"
      description="Configure general application settings and defaults."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
