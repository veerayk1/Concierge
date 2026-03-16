/**
 * Concierge — Roles & Permissions
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Concierge',
};

export default function RolesPage() {
  return (
    <PageShell
      title="Roles & Permissions"
      description="Define roles, permissions, and access control policies."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
