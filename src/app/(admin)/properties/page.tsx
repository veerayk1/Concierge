/**
 * Concierge — Property Management
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Properties | Concierge',
};

export default function PropertiesPage() {
  return (
    <PageShell
      title="Property Management"
      description="Manage buildings and property configurations."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
