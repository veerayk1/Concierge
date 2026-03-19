'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Lightbulb,
  MessageSquare,
  Shield,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const CATEGORY_COLORS: Record<IdeaCategory, 'default' | 'warning' | 'info' | 'error' | 'success'> =
  {
    amenity: 'info',
    security: 'error',
    maintenance: 'warning',
    community: 'success',
    policy: 'default',
    other: 'default',
  };

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  amenity: 'Amenity',
  security: 'Security',
  maintenance: 'Maintenance',
  community: 'Community',
  policy: 'Policy',
  other: 'Other',
};

const STATUS_COLORS: Record<IdeaStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  new: 'default',
  under_review: 'info',
  planned: 'success',
  in_progress: 'warning',
  completed: 'success',
  declined: 'error',
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_IDEA: IdeaDetail = {
  id: '1',
  title: 'Add EV charging stations',
  description:
    'Install electric vehicle charging stations in the underground parking garage. With more residents switching to EVs, this would be a huge quality-of-life improvement and increase property value. I suggest starting with 4 Level 2 chargers on P1 near the elevator lobby. Several other buildings in the area have already done this and report high usage. The cost could be offset through a small per-use fee. This would also make our building more attractive to prospective buyers and renters who own electric vehicles.',
  category: 'amenity',
  status: 'under_review',
  author: 'David C.',
  authorUnit: '802',
  votesUp: 12,
  votesDown: 2,
  createdAt: '2026-03-10T09:00:00',
  adminResponse:
    'Thank you for this suggestion. The Board has reviewed the proposal and we are currently obtaining quotes from two EV charging installation companies. We expect to have a decision by end of April. We will keep residents updated on the progress.',
  adminRespondedAt: '2026-03-15T14:00:00',
  comments: [
    {
      id: 'c-1',
      author: 'Lisa B.',
      unit: '1105',
      text: 'Great idea! I just bought a Tesla and have been charging at a public station down the street. Would love to charge at home.',
      createdAt: '2026-03-10T11:30:00',
    },
    {
      id: 'c-2',
      author: 'Robert K.',
      unit: '305',
      text: 'How would the cost be split? Would it be included in condo fees or pay-per-use?',
      createdAt: '2026-03-11T09:00:00',
    },
    {
      id: 'c-3',
      author: 'Maria G.',
      unit: '1203',
      text: "I think pay-per-use is fairest. Not everyone drives an EV so it shouldn't be in condo fees.",
      createdAt: '2026-03-11T14:15:00',
    },
    {
      id: 'c-4',
      author: 'Alice W.',
      unit: '101',
      text: 'Fully support this. Maybe we could apply for a government green energy rebate to offset the installation cost?',
      createdAt: '2026-03-12T10:45:00',
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const idea = MOCK_IDEA;

  const upCount = idea.votesUp + (userVote === 'up' ? 1 : 0);
  const downCount = idea.votesDown + (userVote === 'down' ? 1 : 0);

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
                <Badge variant={CATEGORY_COLORS[idea.category]} size="sm">
                  {CATEGORY_LABELS[idea.category]}
                </Badge>
                <Badge variant={STATUS_COLORS[idea.status]} size="sm" dot>
                  {STATUS_LABELS[idea.status]}
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
                <CardTitle>Comments ({idea.comments.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {idea.comments.map((c) => (
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
                <Badge variant={STATUS_COLORS[idea.status]} size="lg" dot>
                  {STATUS_LABELS[idea.status]}
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
