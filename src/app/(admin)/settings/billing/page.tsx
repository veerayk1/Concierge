/**
 * Concierge — Billing & Subscription
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Billing | Concierge',
};

export default function BillingPage() {
  return (
    <PageShell
      title="Billing & Subscription"
      description="Manage subscription plans, invoices, and payment methods."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
