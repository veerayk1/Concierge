'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
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
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShiftLogComment {
  id: string;
  content?: string;
  text?: string;
  authorId?: string;
  author?: string;
  createdAt: string;
}

interface ShiftLogEntryData {
  id: string;
  content: string;
  priority: string;
  category: string;
  createdAt: string;
  reference?: string;
  authorId?: string;
  author?: string;
  comments?: ShiftLogComment[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-warning-50 text-warning-700',
  afternoon: 'bg-primary-50 text-primary-700',
  night: 'bg-neutral-800 text-white',
};

function getShiftFromHour(dateStr: string): string {
  const hour = new Date(dateStr).getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ShiftLogSkeleton() {
  return (
    <PageShell title="" description="Shift Log Entry">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShiftLogEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<ShiftLogEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    async function fetchEntry() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/shift-log/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch entry (${res.status})`);
        const json = await res.json();
        setEntry(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchEntry();
  }, [id]);

  if (loading) return <ShiftLogSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <MessageSquare className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Shift log entry not found</h1>
        <p className="text-[14px] text-neutral-500">
          The entry you are looking for does not exist or has been removed.
        </p>
        <Link href="/shift-log">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to shift log
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading entry</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href="/shift-log">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to shift log
          </Button>
        </Link>
      </div>
    );
  }

  if (!entry) return null;

  const shift = getShiftFromHour(entry.createdAt);
  const shiftColor = SHIFT_COLORS[shift] || SHIFT_COLORS.morning;
  const comments = entry.comments || [];

  return (
    <PageShell
      title={entry.reference || `SL-${entry.id.slice(0, 8)}`}
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
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
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
                      {entry.author || entry.authorId || 'Unknown'}
                    </span>
                  }
                />
                <InfoRow label="Category" value={entry.category || 'general'} />
                <InfoRow
                  label="Shift"
                  value={
                    <Badge variant="default" size="lg" className={shiftColor}>
                      {shift.charAt(0).toUpperCase() + shift.slice(1)}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Priority"
                  value={
                    entry.priority === 'important' || entry.priority === 'urgent' ? (
                      <Badge variant="warning" size="lg" dot>
                        {entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
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
                <InfoRow
                  label="Reference"
                  value={entry.reference || `SL-${entry.id.slice(0, 8)}`}
                />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Content"
                    value={<p className="leading-relaxed text-neutral-700">{entry.content}</p>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                <CardTitle>Comments ({comments.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <User className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {c.author || c.authorId || 'Staff'}
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
                        <p className="mt-1 text-[14px] text-neutral-700">{c.content || c.text}</p>
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

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Entry Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                  <MessageSquare className="h-8 w-8 text-neutral-400" />
                </div>
                <Badge variant="default" size="lg" className={shiftColor}>
                  {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift
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
