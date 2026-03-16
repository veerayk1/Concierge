/**
 * Concierge — AI Configuration
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'AI Configuration | Concierge',
};

export default function AIConfigPage() {
  return (
    <PageShell
      title="AI Configuration"
      description="Configure AI features, model settings, and automation rules."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
