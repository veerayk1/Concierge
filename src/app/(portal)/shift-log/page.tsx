/**
 * Concierge — Shift Log
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Shift Log | Concierge',
};

export default function ShiftLogPage() {
  return (
    <PageShell
      title="Shift Log"
      description="Staff handoff notes and shift-to-shift communication."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
