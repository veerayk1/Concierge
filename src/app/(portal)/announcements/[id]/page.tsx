'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Eye,
  Mail,
  Send,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MOCK = {
  title: 'Fire Alarm Testing — March 20th',
  body: 'Annual fire alarm testing will take place on March 20th between 10am and 2pm. Please ensure all smoke detectors are accessible. No evacuation required.\n\nThe testing will proceed floor by floor starting from the ground level. Each floor will experience approximately 5-10 minutes of alarm sounds. Building management will be present on each floor to coordinate.\n\nIf you have any concerns or accessibility needs, please contact the front desk before March 19th.',
  status: 'published' as const,
  priority: 'important' as const,
  channels: ['web', 'email', 'push'] as const,
  author: 'Property Management',
  publishedAt: '2026-03-18T09:00:00',
  createdAt: '2026-03-17T14:00:00',
  viewCount: 342,
  deliveryStats: {
    email: { sent: 450, opened: 312, failed: 3 },
    push: { sent: 380, opened: 245, failed: 0 },
  },
};

interface AnnouncementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
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
          <Button variant="ghost" size="sm" className="text-error-600">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Delivery Stats</h2>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Eye className="h-4 w-4 text-neutral-400" />
                    Total Views
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">{MOCK.viewCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    Email Sent
                  </span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {MOCK.deliveryStats.email.sent}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Mail className="text-success-500 h-4 w-4" />
                    Email Opened
                  </span>
                  <span className="text-success-700 text-[14px] font-medium">
                    {MOCK.deliveryStats.email.opened}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Send className="h-4 w-4 text-neutral-400" />
                    Push Sent
                  </span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {MOCK.deliveryStats.push.sent}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Channels</h2>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {MOCK.channels.map((ch) => (
                  <Badge key={ch} variant="primary" size="md">
                    {ch}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
