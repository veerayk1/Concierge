'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Clock, Edit2, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MOCK = {
  type: 'visitor',
  typeLabel: 'Visitor',
  typeColor: 'text-success-600',
  typeBg: 'bg-success-50',
  title: 'John Williams — Visiting Unit 1501',
  description:
    'Expected guest. Resident Janet Smith confirmed via intercom at 9:28 AM. Visitor presented government ID.',
  unit: '1501',
  resident: 'Janet Smith',
  status: 'open' as const,
  createdBy: 'Guard Patel',
  createdAt: '2026-03-18T09:30:00',
  comments: [
    {
      id: '1',
      author: 'Guard Patel',
      text: 'Visitor arrived. ID verified. Directed to elevators.',
      createdAt: '2026-03-18T09:30:00',
    },
  ],
};

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to event log
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="success" size="lg" className={`${MOCK.typeBg} ${MOCK.typeColor}`}>
              {MOCK.typeLabel}
            </Badge>
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">{MOCK.title}</h1>
            <Badge variant={MOCK.status === 'open' ? 'warning' : 'default'} size="lg" dot>
              {MOCK.status === 'open' ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm">Close Event</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">Unit {MOCK.unit}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Resident
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{MOCK.resident}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Logged By
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{MOCK.createdBy}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {new Date(MOCK.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Details
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {MOCK.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Comments</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                {MOCK.comments.map((c) => (
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

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth>Close Event</Button>
                <Button variant="secondary" fullWidth>
                  <Bell className="h-4 w-4" />
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
