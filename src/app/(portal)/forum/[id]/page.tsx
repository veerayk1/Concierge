'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Heart, Lock, MessageSquare, Pin, User } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThreadStatus = 'open' | 'closed' | 'locked';

interface Reply {
  id: string;
  authorName: string;
  authorUnit: string;
  authorInitials: string;
  body: string;
  createdAt: string;
  likes: number;
}

interface ForumThread {
  id: string;
  title: string;
  category: string;
  status: ThreadStatus;
  authorName: string;
  authorUnit: string;
  authorInitials: string;
  createdAt: string;
  body: string;
  views: number;
  likes: number;
  replyCount: number;
  pinned: boolean;
  locked: boolean;
  replies: Reply[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_THREAD: ForumThread = {
  id: '1',
  title: 'Proposed Changes to Guest Parking Policy',
  category: 'Building Rules',
  status: 'open',
  authorName: 'Maria Santos',
  authorUnit: '1204',
  authorInitials: 'MS',
  createdAt: '2026-03-10T09:15:00',
  body: 'Hi everyone,\n\nI wanted to open a discussion about the current guest parking policy. As many of you know, we currently allow overnight guest parking for a maximum of 3 consecutive nights. However, several residents have mentioned that this can be difficult when hosting family from out of town.\n\nI would like to propose extending the guest parking limit to 7 consecutive nights, with a requirement to register at the front desk. This would make it easier for residents who have visitors staying for a week, while still maintaining oversight through front desk registration.\n\nWhat does everyone think? I know parking is limited, so I am open to hearing other suggestions as well.\n\nThanks,\nMaria',
  views: 142,
  likes: 18,
  replyCount: 4,
  pinned: true,
  locked: false,
  replies: [
    {
      id: 'r-1',
      authorName: 'James Okonkwo',
      authorUnit: '405',
      authorInitials: 'JO',
      body: 'I think this is a great idea, Maria. My parents visit from Winnipeg a few times a year and 3 nights is never enough. A 7-night limit with front desk registration sounds very reasonable. I fully support this proposal.',
      createdAt: '2026-03-10T11:30:00',
      likes: 8,
    },
    {
      id: 'r-2',
      authorName: 'Karen Liu',
      authorUnit: '802',
      authorInitials: 'KL',
      body: 'I understand the need, but I am concerned about parking availability. We already have issues finding spots on weekends. Could we limit the extended parking to weekdays only, or cap the number of extended permits active at any given time? Maybe 5 extended permits maximum building-wide?',
      createdAt: '2026-03-11T08:45:00',
      likes: 12,
    },
    {
      id: 'r-3',
      authorName: 'David Chen',
      authorUnit: '1501',
      authorInitials: 'DC',
      body: 'Karen raises a good point. I would be comfortable with 7 nights if there is a cap. Perhaps the board could trial it for 3 months and then review the data? That way we can see if it actually causes parking shortages before making it permanent.',
      createdAt: '2026-03-12T14:20:00',
      likes: 15,
    },
    {
      id: 'r-4',
      authorName: 'Maria Santos',
      authorUnit: '1204',
      authorInitials: 'MS',
      body: 'Great feedback, everyone. I like the trial period idea from David and the cap suggestion from Karen. I will put together a formal proposal incorporating both ideas and submit it to the board for the next meeting. Will keep this thread updated!',
      createdAt: '2026-03-13T10:00:00',
      likes: 22,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THREAD_STATUS_CONFIG: Record<
  ThreadStatus,
  { variant: 'success' | 'default' | 'error'; label: string }
> = {
  open: { variant: 'success', label: 'Open' },
  closed: { variant: 'default', label: 'Closed' },
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForumThreadDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In production this would come from an API call using id
  const thread = MOCK_THREAD;
  const statusCfg = THREAD_STATUS_CONFIG[thread.status];

  return (
    <PageShell title={thread.title} description="Discussion Forum">
      {/* Back link */}
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
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-neutral-900">
                {thread.title}
              </h1>
              {thread.pinned && <Pin className="text-warning-500 h-4 w-4" />}
              {thread.locked && <Lock className="text-error-500 h-4 w-4" />}
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="lg">
                {thread.category}
              </Badge>
              <Badge variant={statusCfg.variant} size="lg" dot>
                {statusCfg.label}
              </Badge>
            </div>

            {/* Author + meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-neutral-500">
              <div className="flex items-center gap-2">
                <div className="bg-primary-100 text-primary-700 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold">
                  {thread.authorInitials}
                </div>
                <span className="font-semibold text-neutral-700">{thread.authorName}</span>
                <span>&middot; Unit {thread.authorUnit}</span>
              </div>
              <span>{formatDate(thread.createdAt)}</span>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-5 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {thread.views} views
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {thread.likes} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {thread.replyCount} replies
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Original Post */}
        <div className="mt-6">
          <Card>
            <CardContent>
              <div className="flex gap-3">
                <div className="bg-primary-100 text-primary-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold">
                  {thread.authorInitials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-neutral-900">
                      {thread.authorName}
                    </span>
                    <span className="text-[12px] text-neutral-400">Unit {thread.authorUnit}</span>
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
                      {thread.likes}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Replies */}
        <div className="mt-8">
          <h2 className="mb-4 text-[15px] font-semibold text-neutral-900">
            Replies ({thread.replies.length})
          </h2>
          <div className="flex flex-col gap-4">
            {thread.replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent>
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-bold text-neutral-600">
                      {reply.authorInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-neutral-900">
                          {reply.authorName}
                        </span>
                        <span className="text-[12px] text-neutral-400">
                          Unit {reply.authorUnit}
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
                          {reply.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reply Input / Locked Notice */}
        <div className="mt-8">
          {thread.locked ? (
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
