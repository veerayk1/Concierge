'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  Edit2,
  Eye,
  Mail,
  Monitor,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MOCK = {
  title: 'Fire Alarm Testing — March 20th',
  body: 'Annual fire alarm testing will take place on March 20th between 10am and 2pm. Please ensure all smoke detectors are accessible. No evacuation required.\n\nThe testing will proceed floor by floor starting from the ground level. Each floor will experience approximately 5-10 minutes of alarm sounds. Building management will be present on each floor to coordinate.\n\nResidents who work from home may want to plan accordingly, as the alarm sounds can be loud and disruptive. Noise-cancelling headphones are recommended during the testing period.\n\nIf you have any concerns or accessibility needs, please contact the front desk before March 19th.',
  status: 'published' as const,
  priority: 'important' as const,
  category: 'Building Operations',
  channels: ['email', 'sms', 'push', 'lobby'] as const,
  author: 'Sarah Johnson',
  publishedAt: '2026-03-18T09:00:00',
  createdAt: '2026-03-17T14:00:00',
  audience: {
    type: 'all_residents' as const,
    label: 'All Residents',
    count: 482,
  },
  deliveryStats: {
    totalSent: 482,
    delivered: 475,
    opened: 312,
    clickRate: 18.4,
  },
  viewCount: 342,
};

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: Smartphone,
  push: Bell,
  lobby: Monitor,
};

interface AnnouncementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to announcements
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">{MOCK.title}</h1>
            <Badge variant="success" size="lg" dot>
              Published
            </Badge>
            <Badge variant="warning" size="lg" dot>
              Important
            </Badge>
          </div>
          <p className="text-[14px] text-neutral-500">
            By {MOCK.author} &middot;{' '}
            {new Date(MOCK.publishedAt).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4" />
            Resend
          </Button>
          <Button variant="secondary" size="sm">
            <Archive className="h-4 w-4" />
            Archive
          </Button>
          <Button variant="ghost" size="sm" className="text-error-600">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column — Content */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent>
              <div className="prose prose-neutral max-w-none">
                {MOCK.body.split('\n').map((p, i) =>
                  p ? (
                    <p key={i} className="text-[15px] leading-relaxed text-neutral-700">
                      {p}
                    </p>
                  ) : (
                    <br key={i} />
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Metadata */}
        <div className="flex flex-col gap-6">
          {/* Metadata */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Details</h2>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Published
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">
                    {new Date(MOCK.publishedAt).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Author
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">{MOCK.author}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <p className="mt-1">
                    <Badge variant="primary" size="md">
                      {MOCK.category}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Priority
                  </p>
                  <p className="mt-1">
                    <Badge variant="warning" size="md" dot>
                      {MOCK.priority}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Distribution Channels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK.channels.map((ch) => {
                      const Icon = channelIcons[ch] || Send;
                      return (
                        <Badge key={ch} variant="info" size="md">
                          <Icon className="h-3 w-3" />
                          {ch}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Audience</h2>
            </div>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-neutral-900">{MOCK.audience.label}</p>
                  <p className="text-[13px] text-neutral-500">{MOCK.audience.count} recipients</p>
                </div>
                <Badge variant="primary" size="sm">
                  {MOCK.audience.type === 'all_residents' ? 'All' : 'Targeted'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Stats */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Delivery Stats</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Send className="h-4 w-4 text-neutral-400" />
                    Total Sent
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">
                    {MOCK.deliveryStats.totalSent}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    Delivered
                  </span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {MOCK.deliveryStats.delivered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Eye className="h-4 w-4 text-neutral-400" />
                    Opened
                  </span>
                  <span className="text-success-700 text-[14px] font-medium">
                    {MOCK.deliveryStats.opened}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <BarChart3 className="h-4 w-4 text-neutral-400" />
                    Click Rate
                  </span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {MOCK.deliveryStats.clickRate}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
