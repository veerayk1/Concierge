/**
 * Concierge — Security Console
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Security | Concierge',
};

export default function SecurityPage() {
  return (
    <PageShell
      title="Security Console"
      description="Unified security dashboard with incident logging, FOB tracking, and visitor management."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
