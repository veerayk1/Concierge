'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
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
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types — mapped from API response (Prisma Event model)
// ---------------------------------------------------------------------------

interface ShiftEntry {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  referenceNo: string | null;
  createdAt: string;
  createdById: string | null;
  customFields: {
    category?: string;
    pinned?: boolean;
    readBy?: string[];
    mentionedUnitId?: string;
  } | null;
  eventType: { name: string } | null;
}

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

type EntryTypeFilter = 'all' | 'important' | 'normal' | 'urgent';

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
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>('all');

  const {
    data: apiEntries,
    loading,
    error,
    refetch,
  } = useApi<ShiftEntry[]>(
    apiUrl('/api/v1/shift-log', {
      propertyId: DEMO_PROPERTY_ID,
      priority: entryTypeFilter !== 'all' ? entryTypeFilter : undefined,
    }),
  );

  const allEntries = useMemo<ShiftEntry[]>(() => apiEntries ?? [], [apiEntries]);

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
