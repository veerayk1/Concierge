/**
 * Concierge — Settings
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Settings | Concierge',
};

export default function SettingsPage() {
  return (
    <PageShell title="Settings" description="Configure system-wide settings and preferences.">
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
