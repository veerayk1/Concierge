/**
 * Concierge — My Account
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'My Account | Concierge',
};

export default function MyAccountPage() {
  return (
    <PageShell
      title="My Account"
      description="Manage your profile, preferences, and security settings."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
