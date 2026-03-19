'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Edit2,
  Link as LinkIcon,
  MessageSquare,
  Package,
  Printer,
  Shield,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShiftEntryComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface RelatedItem {
  id: string;
  type: 'package' | 'incident' | 'visitor' | 'maintenance';
  title: string;
  reference: string;
  status: string;
}

interface ShiftEntryDetail {
  id: string;
  author: string;
  role: string;
  shift: 'morning' | 'afternoon' | 'night';
  content: string;
  priority: 'normal' | 'important';
  createdAt: string;
  reference: string;
  relatedItems: RelatedItem[];
  comments: ShiftEntryComment[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ENTRIES: Record<string, ShiftEntryDetail> = {
  '1': {
    id: '1',
    author: 'Guard Patel',
    role: 'Security Guard',
    shift: 'morning',
    content:
      'Elevator B still out of service. Technician expected by 2pm. Route residents to Elevator A. Update posted in lobby. Building management has been notified and a notice was placed on the elevator doors on floors 1, 5, 10, 15, and 20. The technician from ElevatorPro will need access to the mechanical room on B1.',
    priority: 'important',
    createdAt: '2026-03-18T07:00:00',
    reference: 'SL-2026-0318-001',
    relatedItems: [
      {
        id: 'mr-845',
        type: 'maintenance',
        title: 'Elevator B - Out of Service',
        reference: 'MR-0845',
        status: 'In Progress',
      },
    ],
    comments: [
      {
        id: 'c1',
        author: 'Mike Johnson',
        text: 'Technician arrived at 1:30pm. Parts need to be ordered. ETA for repair is March 20.',
        createdAt: '2026-03-18T13:45:00',
      },
      {
        id: 'c2',
        author: 'Guard Patel',
        text: 'Updated lobby notice with new timeline. Residents have been understanding.',
        createdAt: '2026-03-18T14:00:00',
      },
    ],
  },
  '2': {
    id: '2',
    author: 'Guard Martinez',
    role: 'Security Guard',
    shift: 'night',
    content:
      'Lobby doors were sticking around 11pm. Applied WD-40 as temporary fix. Maintenance ticket MR-0845 created. Use side entrance if it recurs.',
    priority: 'important',
    createdAt: '2026-03-17T23:30:00',
    reference: 'SL-2026-0317-005',
    relatedItems: [
      {
        id: 'mr-846',
        type: 'maintenance',
        title: 'Lobby Door Sticking',
        reference: 'MR-0846',
        status: 'Open',
      },
    ],
    comments: [],
  },
  '3': {
    id: '3',
    author: 'Guard Chen',
    role: 'Security Guard',
    shift: 'night',
    content:
      'Quiet night. All patrols completed on schedule. P2 garage camera #3 has intermittent static — IT notified.',
    priority: 'normal',
    createdAt: '2026-03-17T22:00:00',
    reference: 'SL-2026-0317-004',
    relatedItems: [
      {
        id: 'inc-12',
        type: 'incident',
        title: 'Camera #3 P2 Garage - Intermittent Static',
        reference: 'INC-0012',
        status: 'Open',
      },
    ],
    comments: [],
  },
  '4': {
    id: '4',
    author: 'Mike Johnson',
    role: 'Front Desk',
    shift: 'afternoon',
    content:
      'Unit 1501 (Janet Smith) expecting a furniture delivery tomorrow between 10am-12pm. Moving company: AllStar Movers. They will need elevator booking.',
    priority: 'normal',
    createdAt: '2026-03-17T16:00:00',
    reference: 'SL-2026-0317-003',
    relatedItems: [
      {
        id: 'vis-44',
        type: 'visitor',
        title: 'AllStar Movers - Furniture Delivery',
        reference: 'VIS-0044',
        status: 'Expected',
      },
    ],
    comments: [],
  },
  '5': {
    id: '5',
    author: 'Angela Davis',
    role: 'Front Desk',
    shift: 'morning',
    content:
      'Received 12 packages from Amazon bulk delivery. All logged and notified. Storage shelf A is getting full — start using shelf D for overflow.',
    priority: 'normal',
    createdAt: '2026-03-17T10:30:00',
    reference: 'SL-2026-0317-002',
    relatedItems: [
      {
        id: 'pkg-batch',
        type: 'package',
        title: 'Amazon Bulk Delivery (12 packages)',
        reference: 'PKG-0298 to PKG-0309',
        status: 'Logged',
      },
    ],
    comments: [
      {
        id: 'c3',
        author: 'Mike Johnson',
        text: 'Shelf D is now set up. Moved 4 older packages there as well.',
        createdAt: '2026-03-17T14:20:00',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHIFT_COLORS = {
  morning: 'bg-warning-50 text-warning-700',
  afternoon: 'bg-primary-50 text-primary-700',
  night: 'bg-neutral-800 text-white',
};

const RELATED_ITEM_ICONS: Record<RelatedItem['type'], typeof Package> = {
  package: Package,
  incident: Shield,
  visitor: Users,
  maintenance: Calendar,
};

const RELATED_ITEM_COLORS: Record<RelatedItem['type'], { bg: string; text: string }> = {
  package: { bg: 'bg-primary-50', text: 'text-primary-600' },
  incident: { bg: 'bg-error-50', text: 'text-error-600' },
  visitor: { bg: 'bg-success-50', text: 'text-success-600' },
  maintenance: { bg: 'bg-warning-50', text: 'text-warning-600' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShiftLogEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [commentText, setCommentText] = useState('');

  // Use mock data, falling back to a default entry for unknown IDs
  const entry: ShiftEntryDetail = MOCK_ENTRIES[id] ?? {
    id,
    author: 'Unknown',
    role: 'Staff',
    shift: 'morning' as const,
    content: 'Entry not found.',
    priority: 'normal' as const,
    createdAt: new Date().toISOString(),
    reference: `SL-${id}`,
    relatedItems: [],
    comments: [],
  };

  return (
    <PageShell
      title={entry.reference}
      description="Shift Log Entry"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="danger" size="sm">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/shift-log"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shift log
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Entry Content */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Author"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.author}
                    </span>
                  }
                />
                <InfoRow label="Role" value={entry.role} />
                <InfoRow
                  label="Shift"
                  value={
                    <Badge variant="default" size="lg" className={SHIFT_COLORS[entry.shift]}>
                      {entry.shift.charAt(0).toUpperCase() + entry.shift.slice(1)}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Priority"
                  value={
                    entry.priority === 'important' ? (
                      <Badge variant="warning" size="lg" dot>
                        Important
                      </Badge>
                    ) : (
                      <Badge variant="default" size="lg">
                        Normal
                      </Badge>
                    )
                  }
                />
                <InfoRow
                  label="Date & Time"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(entry.createdAt).toLocaleString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  }
                />
                <InfoRow label="Reference" value={entry.reference} />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Content"
                    value={<p className="leading-relaxed text-neutral-700">{entry.content}</p>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          {entry.relatedItems.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-neutral-400" />
                  <CardTitle>Related Items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {entry.relatedItems.map((item) => {
                    const Icon = RELATED_ITEM_ICONS[item.type];
                    const colors = RELATED_ITEM_COLORS[item.type];
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 transition-all duration-200 hover:border-neutral-300 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}
                          >
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-neutral-900">
                              {item.title}
                            </p>
                            <p className="text-[12px] text-neutral-500">
                              {item.reference} &middot;{' '}
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.status === 'Open' || item.status === 'Expected'
                              ? 'info'
                              : item.status === 'In Progress'
                                ? 'warning'
                                : 'success'
                          }
                          size="sm"
                          dot
                        >
                          {item.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                <CardTitle>Comments ({entry.comments.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {entry.comments.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {entry.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <User className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {c.author}
                          </span>
                          <span className="text-[12px] text-neutral-400">
                            {new Date(c.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-[14px] text-neutral-700">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-[13px] text-neutral-500">
                  No comments yet. Be the first to add one.
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-[14px] placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                />
                <Button size="sm">Post</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                  <MessageSquare className="h-8 w-8 text-neutral-400" />
                </div>
                <Badge variant="default" size="lg" className={SHIFT_COLORS[entry.shift]}>
                  {entry.shift.charAt(0).toUpperCase() + entry.shift.slice(1)} Shift
                </Badge>
                <p className="text-[13px] text-neutral-500">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Edit Entry
                </Button>
                <Button variant="secondary" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print Entry
                </Button>
                <Button variant="secondary" fullWidth>
                  <Download className="h-4 w-4" />
                  Export as PDF
                </Button>
                <Button variant="danger" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Delete Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
