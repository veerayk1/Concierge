'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function MySchedulePage() {
  return (
    <PageShell title="My Schedule" description="Your tasks and assignments for today.">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Today&apos;s Tasks</p>
          <p className="text-[24px] font-bold text-neutral-900">0</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Completed</p>
          <p className="text-success-600 text-[24px] font-bold">0</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Remaining</p>
          <p className="text-primary-600 text-[24px] font-bold">0</p>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
          <Calendar className="h-5 w-5 text-neutral-400" />
        </div>
        <p className="mt-4 text-[15px] font-medium text-neutral-600">No schedule items</p>
        <p className="mt-1 text-[13px] text-neutral-400">
          Your assigned tasks and shifts will appear here.
        </p>
      </div>
    </PageShell>
  );
}
