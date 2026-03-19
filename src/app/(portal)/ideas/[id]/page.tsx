'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Lightbulb,
  MessageSquare,
  Shield,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IdeaCategory = 'amenity' | 'security' | 'maintenance' | 'community' | 'policy' | 'other';
type IdeaStatus = 'new' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';

interface Comment {
  id: string;
  author: string;
  unit: string;
  text: string;
  createdAt: string;
}

interface IdeaDetail {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  author: string;
  authorUnit: string;
  votesUp: number;
  votesDown: number;
  createdAt: string;
  adminResponse: string | null;
  adminRespondedAt: string | null;
  comments: Comment[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  amenity: 'info',
  security: 'error',
  maintenance: 'warning',
  community: 'success',
  policy: 'default',
  other: 'default',
};

const CATEGORY_LABELS: Record<string, string> = {
  amenity: 'Amenity',
  security: 'Security',
  maintenance: 'Maintenance',
  community: 'Community',
  policy: 'Policy',
  other: 'Other',
};

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  new: 'default',
  under_review: 'info',
  planned: 'success',
  in_progress: 'warning',
  completed: 'success',
  declined: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function IdeaDetailSkeleton() {
  return (
    <PageShell title="" description="Idea Board">
      <div className="-mt-4 mb-4">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="mb-4 h-6 w-2/3" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
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

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const {
    data: idea,
    loading,
    error,
    refetch,
  } = useApi<IdeaDetail>(apiUrl(`/api/v1/ideas/${id}`, { propertyId: DEMO_PROPERTY_ID }));

  if (loading) return <IdeaDetailSkeleton />;

  if (error || !idea) {
    return (
      <PageShell title="Idea" description="Idea Board">
        <div className="-mt-4 mb-4">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ideas
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertTriangle className="text-error-500 h-12 w-12" />
          <h1 className="text-[20px] font-bold text-neutral-900">
            {error ? 'Error loading idea' : 'Idea not found'}
          </h1>
          <p className="text-[14px] text-neutral-500">
            {error || 'The idea you are looking for does not exist or has been removed.'}
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const upCount = (idea.votesUp ?? 0) + (userVote === 'up' ? 1 : 0);
  const downCount = (idea.votesDown ?? 0) + (userVote === 'down' ? 1 : 0);
  const comments = idea.comments ?? [];

  return (
    <PageShell title={idea.title} description="Idea Board">
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/ideas"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ideas
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Idea Content */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Lightbulb className="text-primary-500 h-5 w-5" />
                  </div>
                  <CardTitle>{idea.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[14px] leading-relaxed text-neutral-700">{idea.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={CATEGORY_COLORS[idea.category] || 'default'} size="sm">
                  {CATEGORY_LABELS[idea.category] || idea.category}
                </Badge>
                <Badge variant={STATUS_COLORS[idea.status] || 'default'} size="sm" dot>
                  {STATUS_LABELS[idea.status] || idea.status}
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px] text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {idea.author}
                </span>
                <span>Unit {idea.authorUnit}</span>
                <span>
                  {new Date(idea.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Response */}
          {idea.adminResponse && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="text-primary-500 h-4 w-4" />
                  <CardTitle>Admin Response</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-primary-50 rounded-xl p-4">
                  <p className="text-[14px] leading-relaxed text-neutral-700">
                    {idea.adminResponse}
                  </p>
                  {idea.adminRespondedAt && (
                    <p className="mt-3 text-[12px] text-neutral-400">
                      Responded on{' '}
                      {new Date(idea.adminRespondedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                <CardTitle>Comments ({comments.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-neutral-400">
                  No comments yet. Share your thoughts on this idea.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <User className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {c.author}
                          </span>
                          <span className="text-[12px] text-neutral-400">Unit {c.unit}</span>
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
              )}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-[14px] placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                />
                <Button size="sm">Post</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Voting */}
          <Card>
            <CardHeader>
              <CardTitle>Vote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => setUserVote(userVote === 'up' ? null : 'up')}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                    userVote === 'up'
                      ? 'bg-success-100 text-success-600 ring-success-300 ring-2'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  <ThumbsUp className="h-7 w-7" />
                </button>
                <span className="text-[28px] font-bold tracking-tight text-neutral-900">
                  {upCount}
                </span>
                <p className="text-[12px] text-neutral-400">Upvotes</p>

                <div className="h-px w-full bg-neutral-100" />

                <button
                  type="button"
                  onClick={() => setUserVote(userVote === 'down' ? null : 'down')}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                    userVote === 'down'
                      ? 'bg-error-100 text-error-600 ring-error-300 ring-2'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  <ThumbsDown className="h-7 w-7" />
                </button>
                <span className="text-[28px] font-bold tracking-tight text-neutral-900">
                  {downCount}
                </span>
                <p className="text-[12px] text-neutral-400">Downvotes</p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <Badge variant={STATUS_COLORS[idea.status] || 'default'} size="lg" dot>
                  {STATUS_LABELS[idea.status] || idea.status}
                </Badge>
                <p className="text-[13px] text-neutral-500">
                  Submitted{' '}
                  {new Date(idea.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
