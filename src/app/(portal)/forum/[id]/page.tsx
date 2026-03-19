'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Eye, Heart, Lock, MessageSquare, Pin, User } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForumReply {
  id: string;
  userId: string;
  body: string;
  likeCount: number;
  createdAt: string;
}

interface ForumTopicData {
  id: string;
  title: string;
  body?: string;
  category?: string;
  status: string;
  userId?: string;
  viewCount?: number;
  likeCount?: number;
  replyCount?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  createdAt: string;
  replies?: ForumReply[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THREAD_STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'default' | 'error'; label: string }
> = {
  active: { variant: 'success', label: 'Open' },
  open: { variant: 'success', label: 'Open' },
  closed: { variant: 'default', label: 'Closed' },
  resolved: { variant: 'default', label: 'Resolved' },
  locked: { variant: 'error', label: 'Locked' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(userId: string): string {
  return userId.slice(0, 2).toUpperCase();
}

function ForumSkeleton() {
  return (
    <PageShell title="" description="Discussion Forum">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
        <div className="mt-6">
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="mt-8">
          <Skeleton className="h-6 w-32" />
          <div className="mt-4 flex flex-col gap-4">
            <Card>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForumThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<ForumTopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchThread() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/forum/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch topic (${res.status})`);
        const json = await res.json();
        setThread(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchThread();
  }, [id]);

  if (loading) return <ForumSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <MessageSquare className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Topic not found</h1>
        <p className="text-[14px] text-neutral-500">
          The forum topic you are looking for does not exist or has been removed.
        </p>
        <Link href={'/forum' as never}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to forum
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading topic</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href={'/forum' as never}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to forum
          </Button>
        </Link>
      </div>
    );
  }

  if (!thread) return null;

  const statusCfg = THREAD_STATUS_CONFIG[thread.status] || THREAD_STATUS_CONFIG.active;
  const replies = thread.replies || [];
  const isLocked = thread.isLocked || false;
  const isPinned = thread.isPinned || false;
  const authorInitials = getInitials(thread.userId || 'UN');

  return (
    <PageShell title={thread.title} description="Discussion Forum">
      <div className="-mt-4 mb-4">
        <Link
          href={'/forum' as never}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Thread Header */}
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-neutral-900">
                {thread.title}
              </h1>
              {isPinned && <Pin className="text-warning-500 h-4 w-4" />}
              {isLocked && <Lock className="text-error-500 h-4 w-4" />}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {thread.category && (
                <Badge variant="primary" size="lg">
                  {thread.category}
                </Badge>
              )}
              <Badge variant={statusCfg.variant} size="lg" dot>
                {statusCfg.label}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-neutral-500">
              <div className="flex items-center gap-2">
                <div className="bg-primary-100 text-primary-700 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold">
                  {authorInitials}
                </div>
                <span className="font-semibold text-neutral-700">{thread.userId || 'Unknown'}</span>
              </div>
              <span>{formatDate(thread.createdAt)}</span>
            </div>
            <div className="mt-4 flex items-center gap-5 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {thread.viewCount || 0} views
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {thread.likeCount || 0} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {replies.length} replies
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Original Post */}
        {thread.body && (
          <div className="mt-6">
            <Card>
              <CardContent>
                <div className="flex gap-3">
                  <div className="bg-primary-100 text-primary-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold">
                    {authorInitials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-neutral-900">
                        {thread.userId || 'Unknown'}
                      </span>
                      <span className="text-[12px] text-neutral-400">
                        &middot; {formatDate(thread.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-neutral-700">
                      {thread.body}
                    </p>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="hover:text-error-500 inline-flex items-center gap-1.5 text-[13px] text-neutral-400 transition-colors"
                      >
                        <Heart className="h-3.5 w-3.5" />
                        {thread.likeCount || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-[15px] font-semibold text-neutral-900">
              Replies ({replies.length})
            </h2>
            <div className="flex flex-col gap-4">
              {replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent>
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-bold text-neutral-600">
                        {getInitials(reply.userId)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-neutral-900">
                            {reply.userId}
                          </span>
                          <span className="text-[12px] text-neutral-400">
                            &middot; {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                          {reply.body}
                        </p>
                        <div className="mt-3">
                          <button
                            type="button"
                            className="hover:text-error-500 inline-flex items-center gap-1.5 text-[13px] text-neutral-400 transition-colors"
                          >
                            <Heart className="h-3.5 w-3.5" />
                            {reply.likeCount}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reply Input / Locked Notice */}
        <div className="mt-8">
          {isLocked ? (
            <Card>
              <CardContent>
                <div className="flex items-center justify-center gap-2 py-4 text-center">
                  <Lock className="h-5 w-5 text-neutral-400" />
                  <p className="text-[14px] font-medium text-neutral-500">
                    This thread is locked. No new replies.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Post a Reply</h3>
                <textarea
                  rows={4}
                  placeholder="Write your reply..."
                  className="focus:border-primary-300 focus:ring-primary-100 w-full resize-none rounded-xl border border-neutral-200 bg-white p-4 text-[14px] placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                />
                <div className="mt-3 flex justify-end">
                  <Button>
                    <MessageSquare className="h-4 w-4" />
                    Post Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
