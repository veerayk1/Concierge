'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Eye,
  Maximize2,
  Monitor,
  Pause,
  Play,
  Timer,
  Trash2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentType = 'announcement' | 'welcome' | 'emergency' | 'event' | 'weather' | 'custom';
type ContentStatus = 'active' | 'paused' | 'scheduled' | 'expired';

interface ScreenAssignment {
  id: string;
  name: string;
  location: string;
  resolution: string;
}

interface SignageContent {
  id: string;
  name: string;
  type: ContentType;
  content: string;
  screenZone: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  rotationDuration: number;
  status: ContentStatus;
  startDate: string;
  endDate: string;
  activeHours: string;
  screens: ScreenAssignment[];
  analytics: {
    views: number;
    impressions: number;
    avgDisplayTime: string;
  };
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_CONTENT: SignageContent = {
  id: '1',
  name: 'Lobby Welcome Message',
  type: 'welcome',
  content:
    'Welcome to Maple Heights Condominiums. Please check in at the front desk. Visitor parking is available on Level P1. For emergencies, call the concierge at ext. 100.',
  screenZone: 'Main Content',
  priority: 'normal',
  rotationDuration: 15,
  status: 'active',
  startDate: '2026-03-01',
  endDate: '2026-06-30',
  activeHours: '6:00 AM - 11:00 PM',
  screens: [
    {
      id: 'scr-1',
      name: 'Lobby Main Display',
      location: 'Main Lobby - East Wall',
      resolution: '3840 x 2160',
    },
    {
      id: 'scr-2',
      name: 'Lobby Secondary',
      location: 'Main Lobby - Reception',
      resolution: '1920 x 1080',
    },
    {
      id: 'scr-3',
      name: 'Elevator Landing',
      location: 'Ground Floor - Elevator Bank',
      resolution: '1920 x 1080',
    },
  ],
  analytics: {
    views: 12480,
    impressions: 38750,
    avgDisplayTime: '14.8s',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  { variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }
> = {
  announcement: { variant: 'info', label: 'Announcement' },
  welcome: { variant: 'primary', label: 'Welcome' },
  emergency: { variant: 'error', label: 'Emergency' },
  event: { variant: 'warning', label: 'Event' },
  weather: { variant: 'default', label: 'Weather' },
  custom: { variant: 'default', label: 'Custom' },
};

const STATUS_CONFIG: Record<
  ContentStatus,
  { variant: 'success' | 'warning' | 'info' | 'default'; label: string }
> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  scheduled: { variant: 'info', label: 'Scheduled' },
  expired: { variant: 'default', label: 'Expired' },
};

const PRIORITY_CONFIG: Record<
  'low' | 'normal' | 'high' | 'urgent',
  { variant: 'default' | 'info' | 'warning' | 'error'; label: string }
> = {
  low: { variant: 'default', label: 'Low' },
  normal: { variant: 'info', label: 'Normal' },
  high: { variant: 'warning', label: 'High' },
  urgent: { variant: 'error', label: 'Urgent' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DigitalSignageDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In production this would come from an API call using id
  const content = MOCK_CONTENT;
  const typeCfg = CONTENT_TYPE_CONFIG[content.type];
  const statusCfg = STATUS_CONFIG[content.status];
  const priorityCfg = PRIORITY_CONFIG[content.priority];
  const daysRemaining = getDaysRemaining(content.endDate);

  return (
    <PageShell
      title={content.name}
      description="Digital Signage Content"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Content
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/digital-signage"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to digital signage
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900">
                <div className="max-w-lg px-8 text-center">
                  <p className="text-[20px] leading-relaxed font-semibold text-white">
                    {content.content}
                  </p>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="success" size="sm" dot>
                    LIVE
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Name"
                    value={<span className="text-[16px] font-semibold">{content.name}</span>}
                  />
                </div>
                <InfoRow
                  label="Type"
                  value={
                    <Badge variant={typeCfg.variant} size="lg">
                      {typeCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Screen Zone"
                  value={
                    <Badge variant="default" size="lg">
                      {content.screenZone}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Priority"
                  value={
                    <Badge variant={priorityCfg.variant} size="lg" dot>
                      {priorityCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Rotation Duration"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5 text-neutral-400" />
                      {content.rotationDuration} seconds
                    </span>
                  }
                />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Content"
                    value={<p className="leading-relaxed text-neutral-700">{content.content}</p>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Start Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(content.startDate)}
                    </span>
                  }
                />
                <InfoRow
                  label="End Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(content.endDate)}
                    </span>
                  }
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span className="text-[16px] font-bold text-neutral-900">
                      {daysRemaining} days
                    </span>
                  }
                />
                <InfoRow
                  label="Active Hours"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {content.activeHours}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="bg-success-50 flex h-14 w-14 items-center justify-center rounded-2xl">
                  <Play className="text-success-600 h-7 w-7" />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <p className="text-[13px] text-neutral-500">
                  Displaying on {content.screens.length} screen
                  {content.screens.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" fullWidth>
                  <Pause className="h-4 w-4" />
                  Pause Content
                </Button>
                <Button variant="secondary" fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Edit Content
                </Button>
                <Button variant="secondary" fullWidth>
                  <Calendar className="h-4 w-4" />
                  Extend Schedule
                </Button>
                <Button variant="secondary" fullWidth>
                  <Maximize2 className="h-4 w-4" />
                  Preview Full Screen
                </Button>
                <Button variant="danger" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Delete Content
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Screen Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Screen Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {content.screens.map((screen) => (
                  <div
                    key={screen.id}
                    className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                  >
                    <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                      <Monitor className="text-primary-600 h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{screen.name}</p>
                      <p className="text-[11px] text-neutral-400">
                        {screen.location} &middot; {screen.resolution}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Views', value: content.analytics.views.toLocaleString() },
                  { label: 'Impressions', value: content.analytics.impressions.toLocaleString() },
                  { label: 'Avg Display Time', value: content.analytics.avgDisplayTime },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-600">{stat.label}</span>
                    <span className="text-[15px] font-bold text-neutral-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
