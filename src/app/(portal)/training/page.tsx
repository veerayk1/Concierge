/**
 * Concierge — Training & LMS
 */

import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Training | Concierge',
};

export default function TrainingPage() {
  return (
    <PageShell
      title="Training & LMS"
      description="Staff training courses with quizzes and progress tracking."
    >
      <p className="text-neutral-500">This module is under development.</p>
    </PageShell>
  );
}
