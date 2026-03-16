/**
 * Concierge — User Management
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'User Management | Concierge',
};

export default function UsersPage() {
  return (
    <PageShell
      title="User Management"
      description="Create, edit, and manage user accounts and role assignments."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
