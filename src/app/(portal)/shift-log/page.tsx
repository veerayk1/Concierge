'use client';

import { useState } from 'react';
import { Clock, MessageSquare, Plus, User } from 'lucide-react';
import { CreateShiftEntryDialog } from '@/components/forms/create-shift-entry-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShiftEntry {
  id: string;
  author: string;
  role: string;
  shift: 'morning' | 'afternoon' | 'night';
  content: string;
  priority: 'normal' | 'important';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ENTRIES: ShiftEntry[] = [
  {
    id: '1',
    author: 'Guard Patel',
    role: 'Security Guard',
    shift: 'morning',
    content:
      'Elevator B still out of service. Technician expected by 2pm. Route residents to Elevator A. Update posted in lobby.',
    priority: 'important',
    createdAt: '2026-03-18T07:00:00',
  },
  {
    id: '2',
    author: 'Guard Martinez',
    role: 'Security Guard',
    shift: 'night',
    content:
      'Lobby doors were sticking around 11pm. Applied WD-40 as temporary fix. Maintenance ticket MR-0845 created. Use side entrance if it recurs.',
    priority: 'important',
    createdAt: '2026-03-17T23:30:00',
  },
  {
    id: '3',
    author: 'Guard Chen',
    role: 'Security Guard',
    shift: 'night',
    content:
      'Quiet night. All patrols completed on schedule. P2 garage camera #3 has intermittent static — IT notified.',
    priority: 'normal',
    createdAt: '2026-03-17T22:00:00',
  },
  {
    id: '4',
    author: 'Mike Johnson',
    role: 'Front Desk',
    shift: 'afternoon',
    content:
      'Unit 1501 (Janet Smith) expecting a furniture delivery tomorrow between 10am-12pm. Moving company: AllStar Movers. They will need elevator booking.',
    priority: 'normal',
    createdAt: '2026-03-17T16:00:00',
  },
  {
    id: '5',
    author: 'Angela Davis',
    role: 'Front Desk',
    shift: 'morning',
    content:
      'Received 12 packages from Amazon bulk delivery. All logged and notified. Storage shelf A is getting full — start using shelf D for overflow.',
    priority: 'normal',
    createdAt: '2026-03-17T10:30:00',
  },
];

const SHIFT_COLORS = {
  morning: 'bg-warning-50 text-warning-700',
  afternoon: 'bg-primary-50 text-primary-700',
  night: 'bg-neutral-800 text-white',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShiftLogPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <PageShell
      title="Shift Log"
      description="Staff handoff notes and shift-to-shift communication."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {MOCK_ENTRIES.map((entry) => (
          <Card key={entry.id} className="transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <User className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-neutral-900">
                      {entry.author}
                    </span>
                    <span className="text-[12px] text-neutral-400">{entry.role}</span>
                    <Badge variant="default" size="sm" className={SHIFT_COLORS[entry.shift]}>
                      {entry.shift}
                    </Badge>
                    {entry.priority === 'important' && (
                      <Badge variant="warning" size="sm" dot>
                        Important
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                    {entry.content}
                  </p>
                  <p className="mt-2 text-[12px] text-neutral-400">
                    {new Date(entry.createdAt).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreateShiftEntryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId="prop-1"
        onSuccess={() => setShowCreateDialog(false)}
      />
    </PageShell>
  );
}
