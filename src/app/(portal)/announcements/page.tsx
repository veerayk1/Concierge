'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CreateAnnouncementDialog } from '@/components/forms/create-announcement-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  Mail,
  Megaphone,
  Plus,
  Search,
  Send,
  Smartphone,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Announcement {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  priority: 'normal' | 'important' | 'urgent';
  channels: ('web' | 'email' | 'sms' | 'push')[];
  author: string;
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  viewCount: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Fire Alarm Testing — March 20th',
    body: 'Annual fire alarm testing will take place on March 20th between 10am and 2pm. Please ensure all smoke detectors are accessible. No evacuation required.',
    status: 'published',
    priority: 'important',
    channels: ['web', 'email', 'push'],
    author: 'Property Management',
    publishedAt: '2026-03-18T09:00:00',
    createdAt: '2026-03-17T14:00:00',
    viewCount: 342,
  },
  {
    id: '2',
    title: 'Pool Maintenance — Closed March 22-24',
    body: 'The rooftop pool will be closed for scheduled maintenance and cleaning from March 22nd to March 24th. The gym and sauna will remain open.',
    status: 'published',
    priority: 'normal',
    channels: ['web', 'email'],
    author: 'Property Management',
    publishedAt: '2026-03-17T10:00:00',
    createdAt: '2026-03-16T16:00:00',
    viewCount: 187,
  },
  {
    id: '3',
    title: 'Guest Parking Policy Update',
    body: 'Effective April 1st, guest parking permits must be registered at the front desk before 6pm. Overnight guests require advance notice. See full policy attached.',
    status: 'scheduled',
    priority: 'normal',
    channels: ['web', 'email', 'sms'],
    author: 'Board of Directors',
    scheduledFor: '2026-03-25T09:00:00',
    createdAt: '2026-03-18T11:00:00',
    viewCount: 0,
  },
  {
    id: '4',
    title: 'Emergency Elevator Repair — Elevator B',
    body: 'Elevator B is currently out of service due to a mechanical issue. Repair technicians have been dispatched. Please use Elevator A or the stairs. We apologize for the inconvenience.',
    status: 'published',
    priority: 'urgent',
    channels: ['web', 'email', 'sms', 'push'],
    author: 'Property Management',
    publishedAt: '2026-03-18T07:30:00',
    createdAt: '2026-03-18T07:25:00',
    viewCount: 478,
  },
  {
    id: '5',
    title: 'Spring Community BBQ — Save the Date',
    body: 'Join us for the annual Spring Community BBQ on the rooftop terrace, Saturday April 12th from 12pm to 4pm. Food, drinks, and music provided. RSVP by April 5th.',
    status: 'draft',
    priority: 'normal',
    channels: ['web', 'email'],
    author: 'Social Committee',
    createdAt: '2026-03-18T13:00:00',
    viewCount: 0,
  },
];

// ---------------------------------------------------------------------------
// Channel Icon
// ---------------------------------------------------------------------------

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel) {
    case 'email':
      return <Mail className="h-3 w-3" />;
    case 'sms':
      return <Smartphone className="h-3 w-3" />;
    case 'push':
      return <Send className="h-3 w-3" />;
    default:
      return <Eye className="h-3 w-3" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnnouncementsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: apiAnnouncements, refetch } = useApi<Announcement[]>(
    apiUrl('/api/v1/announcements', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allAnnouncements = useMemo(() => {
    if (apiAnnouncements && Array.isArray(apiAnnouncements) && apiAnnouncements.length > 0) {
      return apiAnnouncements.map((a: Announcement) => ({
        id: a.id as string,
        title: a.title as string,
        body: a.body as string,
        status: a.status as string as Announcement['status'],
        priority: a.priority as string as Announcement['priority'],
        channels: (a.channels as string[]) || ['web'],
        author: 'Property Management',
        publishedAt: a.publishedAt as string | undefined,
        scheduledFor: a.scheduledFor as string | undefined,
        createdAt: a.createdAt as string,
        viewCount: 0,
      }));
    }
    return MOCK_ANNOUNCEMENTS;
  }, [apiAnnouncements]);

  const filteredAnnouncements = allAnnouncements.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <PageShell
      title="Announcements"
      description="Create and distribute announcements via web, email, SMS, and push."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      }
    >
      {/* Search + Filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'published', label: 'Published' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'draft', label: 'Drafts' },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                statusFilter === s.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="flex flex-col gap-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
              <Megaphone className="h-6 w-6" />
            </div>
            <p className="text-[15px] font-medium text-neutral-900">No announcements found</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const statusConfig = {
              draft: { variant: 'default' as const, label: 'Draft' },
              scheduled: { variant: 'info' as const, label: 'Scheduled' },
              published: { variant: 'success' as const, label: 'Published' },
              archived: { variant: 'default' as const, label: 'Archived' },
            };
            const priorityConfig = {
              normal: null,
              important: { variant: 'warning' as const, label: 'Important' },
              urgent: { variant: 'error' as const, label: 'Urgent' },
            };
            const sc = statusConfig[announcement.status];
            const pc = priorityConfig[announcement.priority];

            return (
              <Card
                key={announcement.id}
                hoverable
                className="cursor-pointer transition-all duration-200"
                onClick={() => router.push(`/announcements/${announcement.id}` as never)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-semibold text-neutral-900">
                        {announcement.title}
                      </h3>
                      <Badge variant={sc.variant} size="sm">
                        {sc.label}
                      </Badge>
                      {pc && (
                        <Badge variant={pc.variant} size="sm" dot>
                          {pc.label}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">
                      {announcement.body}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-[12px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {announcement.author}
                      </span>
                      {announcement.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {announcement.scheduledFor && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduled:{' '}
                          {new Date(announcement.scheduledFor).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {announcement.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {announcement.viewCount} views
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="flex items-center gap-1">
                    {announcement.channels.map((ch) => (
                      <div
                        key={ch}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500"
                        title={ch}
                      >
                        <ChannelIcon channel={ch} />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <CreateAnnouncementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
