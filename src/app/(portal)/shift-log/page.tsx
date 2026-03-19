'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Megaphone,
  MessageSquare,
  Moon,
  Plus,
  Sun,
  Sunrise,
  User,
  Users,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { CreateShiftEntryDialog } from '@/components/forms/create-shift-entry-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface PassOnNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  priority: 'normal' | 'critical';
}

interface StaffBulletin {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  pinned: boolean;
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

const MOCK_PASS_ON_NOTES: PassOnNote[] = [
  {
    id: 'pon-1',
    author: 'Guard Martinez',
    content:
      'Resident in Unit 302 reported a suspicious person in the parking garage around 10pm. CCTV footage saved. Follow up with property manager.',
    createdAt: '2026-03-17T23:45:00',
    isRead: false,
    priority: 'critical',
  },
  {
    id: 'pon-2',
    author: 'Angela Davis',
    content:
      'Delivery for Unit 1802 (perishable — frozen food) arrived at 3pm. Resident not home. Stored in staff fridge. Must be picked up today.',
    createdAt: '2026-03-17T15:10:00',
    isRead: false,
    priority: 'critical',
  },
  {
    id: 'pon-3',
    author: 'Mike Johnson',
    content:
      'Fire alarm test scheduled for tomorrow 9am-11am. Notify any residents who call about it.',
    createdAt: '2026-03-17T14:00:00',
    isRead: true,
    priority: 'normal',
  },
];

const MOCK_BULLETINS: StaffBulletin[] = [
  {
    id: 'bul-1',
    title: 'New Package Logging Procedure',
    content:
      'Effective March 20th, all packages must be photographed upon intake. Use the camera icon in the package form. See updated SOP in the library.',
    author: 'Property Manager',
    createdAt: '2026-03-15T09:00:00',
    pinned: true,
  },
  {
    id: 'bul-2',
    title: 'Holiday Schedule - Easter Weekend',
    content:
      'Building office closed April 18-21. Skeleton security staff on duty. All non-emergency maintenance requests will be handled April 22.',
    author: 'HR Department',
    createdAt: '2026-03-14T10:00:00',
    pinned: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHIFT_COLORS = {
  morning: 'bg-warning-50 text-warning-700',
  afternoon: 'bg-primary-50 text-primary-700',
  night: 'bg-neutral-800 text-white',
};

const SHIFT_ICONS = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

type ShiftFilter = 'all' | 'morning' | 'afternoon' | 'night';
type EntryTypeFilter = 'all' | 'important' | 'normal';

function getCurrentShift(): 'morning' | 'afternoon' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

function getShiftTimes(shift: 'morning' | 'afternoon' | 'night') {
  switch (shift) {
    case 'morning':
      return { start: '6:00 AM', end: '2:00 PM' };
    case 'afternoon':
      return { start: '2:00 PM', end: '10:00 PM' };
    case 'night':
      return { start: '10:00 PM', end: '6:00 AM' };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShiftLogPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>('all');
  const [passOnNotes, setPassOnNotes] = useState(MOCK_PASS_ON_NOTES);

  const { data: apiEntries, refetch } = useApi<ShiftEntry[]>(
    apiUrl('/api/v1/shift-log', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allEntries = useMemo<ShiftEntry[]>(() => apiEntries ?? MOCK_ENTRIES, [apiEntries]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (shiftFilter !== 'all' && entry.shift !== shiftFilter) return false;
      if (entryTypeFilter !== 'all' && entry.priority !== entryTypeFilter) return false;
      return true;
    });
  }, [allEntries, shiftFilter, entryTypeFilter]);

  const currentShift = getCurrentShift();
  const shiftTimes = getShiftTimes(currentShift);
  const CurrentShiftIcon = SHIFT_ICONS[currentShift];
  const unreadPassOnCount = passOnNotes.filter((n) => !n.isRead).length;

  function handleMarkAsRead(noteId: string) {
    setPassOnNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, isRead: true } : n)));
  }

  return (
    <PageShell
      title="Shift Log"
      description="Staff handoff notes and shift-to-shift communication."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCreateDialog(true)}>
            <MessageSquare className="h-4 w-4" />
            Add Pass-On Note
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Current Shift Info */}
        <Card className="border-primary-200/60 to-primary-50/30 bg-gradient-to-r from-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${SHIFT_COLORS[currentShift]}`}
              >
                <CurrentShiftIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                  Current Shift
                </p>
                <p className="text-[18px] font-bold text-neutral-900 capitalize">
                  {currentShift} Shift
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-[11px] font-medium text-neutral-400 uppercase">Start</p>
                  <p className="text-[14px] font-semibold text-neutral-700">{shiftTimes.start}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-[11px] font-medium text-neutral-400 uppercase">End</p>
                  <p className="text-[14px] font-semibold text-neutral-700">{shiftTimes.end}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-[11px] font-medium text-neutral-400 uppercase">
                    Staff on Duty
                  </p>
                  <p className="text-[14px] font-semibold text-neutral-700">3</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pass-On Notes */}
        {passOnNotes.some((n) => !n.isRead) && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="text-warning-600 h-4 w-4" />
              <h2 className="text-warning-600 text-[12px] font-semibold tracking-[0.08em] uppercase">
                Pass-On Notes ({unreadPassOnCount} unread)
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {passOnNotes
                .filter((n) => !n.isRead)
                .map((note) => (
                  <Card
                    key={note.id}
                    className={`transition-all duration-200 ${
                      note.priority === 'critical'
                        ? 'border-error-200 bg-error-50/30'
                        : 'border-warning-200 bg-warning-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            note.priority === 'critical' ? 'bg-error-100' : 'bg-warning-100'
                          }`}
                        >
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              note.priority === 'critical' ? 'text-error-600' : 'text-warning-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-neutral-900">
                              {note.author}
                            </span>
                            <Badge
                              variant={note.priority === 'critical' ? 'error' : 'warning'}
                              size="sm"
                              dot
                            >
                              {note.priority}
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-700">
                            {note.content}
                          </p>
                          <p className="mt-1.5 text-[12px] text-neutral-400">
                            {new Date(note.createdAt).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkAsRead(note.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as Read
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Staff Bulletins */}
        {MOCK_BULLETINS.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="text-primary-600 h-4 w-4" />
              <h2 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Staff Bulletins
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {MOCK_BULLETINS.map((bulletin) => (
                <Card key={bulletin.id} hoverable className="cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-50 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Megaphone className="text-primary-600 h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-neutral-900">
                          {bulletin.title}
                        </span>
                        {bulletin.pinned && (
                          <Badge variant="primary" size="sm">
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                        {bulletin.content}
                      </p>
                      <p className="mt-1.5 text-[12px] text-neutral-400">
                        {bulletin.author} &middot;{' '}
                        {new Date(bulletin.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <span className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Filter by Shift
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Shift filters */}
            {(['all', 'morning', 'afternoon', 'night'] as const).map((shift) => (
              <button
                key={shift}
                type="button"
                onClick={() => setShiftFilter(shift)}
                className={`rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                  shiftFilter === shift
                    ? shift === 'all'
                      ? 'bg-neutral-900 text-white'
                      : SHIFT_COLORS[shift] + ' ring-primary-500 ring-2'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {shift === 'all' ? 'All Shifts' : shift.charAt(0).toUpperCase() + shift.slice(1)}
              </button>
            ))}

            <div className="mx-1 h-5 w-px bg-neutral-200" />

            {/* Entry type filters */}
            {(['all', 'important', 'normal'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEntryTypeFilter(type)}
                className={`rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                  entryTypeFilter === type
                    ? type === 'important'
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-neutral-900 text-white'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Shift Log Entries */}
        <div className="flex flex-col gap-4">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                  <MessageSquare className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-[15px] font-medium text-neutral-900">No entries found</p>
                <p className="mt-1 text-[13px] text-neutral-500">
                  Try adjusting your filters or add a new entry.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => {
              const entryHref = `/shift-log/${entry.id}`;
              return (
                <Link key={entry.id} href={entryHref as never} className="block">
                  <Card className="transition-all duration-200 hover:shadow-md">
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
                            <Badge
                              variant="default"
                              size="sm"
                              className={SHIFT_COLORS[entry.shift]}
                            >
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
                </Link>
              );
            })
          )}
        </div>
      </div>

      <CreateShiftEntryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
