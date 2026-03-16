/**
 * Concierge — Audit Log
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Audit Log | Concierge',
};

export default function AuditLogPage() {
  return (
    <PageShell
      title="Audit Log"
      description="View system-wide audit trail of user actions and changes."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
