/**
 * Concierge — Maintenance Requests
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Maintenance | Concierge',
};

export default function MaintenancePage() {
  return (
    <PageShell
      title="Maintenance Requests"
      description="Submit and track maintenance requests with photo uploads and vendor assignment."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
