'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Cloud, ExternalLink, MessageCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  connected: boolean;
  lastSync?: string;
  details?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: '1',
    name: 'Slack',
    description:
      'Send real-time notifications to Slack channels for events, incidents, and maintenance updates.',
    icon: MessageCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    connected: true,
    lastSync: '2 minutes ago',
    details: 'Connected to #concierge-alerts and #maintenance channels.',
  },
  {
    id: '2',
    name: 'Sentry',
    description: 'Error tracking and performance monitoring for the Concierge platform.',
    icon: ShieldAlert,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
    connected: true,
    lastSync: '5 minutes ago',
    details: 'Project: concierge-prod. 0 unresolved issues.',
  },
  {
    id: '3',
    name: 'AWS S3 / Storage',
    description: 'Cloud storage for document uploads, photos, attachments, and backups.',
    icon: Cloud,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    connected: true,
    lastSync: 'Just now',
    details: 'Bucket: concierge-prod-uploads. Region: ca-central-1. 2.4 GB used.',
  },
  {
    id: '4',
    name: 'Google Calendar Sync',
    description: 'Sync amenity bookings and community events with Google Calendar.',
    icon: Calendar,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
    connected: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Integrations</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Manage third-party integrations and API connections.
        </p>
      </div>

      {/* Connected */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Connected ({INTEGRATIONS.filter((i) => i.connected).length})
        </h2>
        <div className="space-y-3">
          {INTEGRATIONS.filter((i) => i.connected).map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.id}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${integration.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${integration.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-neutral-900">
                          {integration.name}
                        </h3>
                        <Badge variant="success" size="sm" dot>
                          Connected
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        {integration.description}
                      </p>
                      {integration.details && (
                        <p className="mt-1.5 text-[12px] text-neutral-400">{integration.details}</p>
                      )}
                      {integration.lastSync && (
                        <p className="mt-1 text-[12px] text-neutral-400">
                          Last synced: {integration.lastSync}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm">
                        Configure
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Available ({INTEGRATIONS.filter((i) => !i.connected).length})
        </h2>
        <div className="space-y-3">
          {INTEGRATIONS.filter((i) => !i.connected).map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.id}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${integration.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${integration.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-neutral-900">
                          {integration.name}
                        </h3>
                        <Badge variant="default" size="sm">
                          Not Connected
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        {integration.description}
                      </p>
                    </div>
                    <Button variant="primary" size="sm">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
