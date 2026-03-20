'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Tag,
  User,
  Users,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
  X as XIcon,
  AlertTriangle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RsvpChoice = 'going' | 'maybe' | 'cant';

interface Comment {
  id: string;
  author: string;
  unit: string;
  text: string;
  createdAt: string;
}

interface CommunityEventDetail {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  category: string;
  goingCount: number;
  maybeCount: number;
  cantCount: number;
  comments: Comment[];
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <PageShell title="" description="Community Event">
      <div className="-mt-4 mb-4">
        <Skeleton className="h-5 w-40" />
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
              <Skeleton className="h-32 w-full" />
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

export default function CommunityEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [rsvpChoice, setRsvpChoice] = useState<RsvpChoice | null>(null);

  const {
    data: event,
    loading,
    error,
    refetch,
  } = useApi<CommunityEventDetail>(
    apiUrl(`/api/v1/community/${id}`, { propertyId: getPropertyId() }),
  );

  if (loading) return <DetailSkeleton />;

  if (error || !event) {
    return (
      <PageShell title="Event" description="Community Event">
        <div className="-mt-4 mb-4">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to community
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertTriangle className="text-error-500 h-12 w-12" />
          <h1 className="text-[20px] font-bold text-neutral-900">
            {error ? 'Error loading event' : 'Event not found'}
          </h1>
          <p className="text-[14px] text-neutral-500">
            {error || 'The community event you are looking for does not exist or has been removed.'}
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const rsvpButtons: { key: RsvpChoice; label: string; icon: typeof ThumbsUp }[] = [
    { key: 'going', label: "I'll be there", icon: ThumbsUp },
    { key: 'maybe', label: 'Maybe', icon: HelpCircle },
    { key: 'cant', label: "Can't make it", icon: XIcon },
  ];

  const comments = event.comments ?? [];

  return (
    <PageShell
      title={event.title}
      description="Community Event"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: event.title, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Event link copied to clipboard.');
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Share Event
        </Button>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to community
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Event Name
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-neutral-900">{event.title}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-neutral-700">
                    {event.description}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Date
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {event.startTime} &ndash; {event.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Location
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {event.location}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Organizer
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    {event.organizer}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <div className="mt-1">
                    <Badge variant="primary" size="lg">
                      <Tag className="h-3 w-3" />
                      {event.category}
                    </Badge>
                  </div>
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
              {comments.length === 0 ? (
                <p className="py-6 text-center text-[14px] text-neutral-400">
                  No comments yet. Be the first to share your thoughts.
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
          {/* RSVP */}
          <Card>
            <CardHeader>
              <CardTitle>RSVP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {rsvpButtons.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={rsvpChoice === key ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={() => setRsvpChoice(key)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-400" />
                <CardTitle>Attendance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-600">Going</span>
                  <span className="text-success-600 text-[15px] font-bold">
                    {event.goingCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-600">Maybe</span>
                  <span className="text-warning-600 text-[15px] font-bold">
                    {event.maybeCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-600">Can&apos;t Make It</span>
                  <span className="text-error-600 text-[15px] font-bold">
                    {event.cantCount ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <Card>
            <CardHeader>
              <CardTitle>Share</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: event.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Event link copied to clipboard.');
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                Share Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
