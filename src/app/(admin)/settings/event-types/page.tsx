'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Brush, FileWarning, Key, MessageSquare, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface EventType {
  id: string;
  name: string;
  group: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  enabled: boolean;
  notificationTemplate: string;
  description: string;
}

const INITIAL_EVENT_TYPES: EventType[] = [
  {
    id: '1',
    name: 'Package',
    group: 'Logistics',
    icon: Box,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    enabled: true,
    notificationTemplate:
      'A package has arrived for unit {{unit}}. Please pick up at the front desk.',
    description: 'Track incoming and outgoing packages, parcels, and deliveries.',
  },
  {
    id: '2',
    name: 'Visitor',
    group: 'Access',
    icon: UserCheck,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
    enabled: true,
    notificationTemplate: 'A visitor ({{visitor_name}}) has arrived for unit {{unit}}.',
    description: 'Log visitors, expected guests, and contractor access.',
  },
  {
    id: '3',
    name: 'Incident',
    group: 'Security',
    icon: FileWarning,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
    enabled: true,
    notificationTemplate: 'An incident has been reported: {{summary}}. Location: {{location}}.',
    description: 'Report security incidents, disturbances, and safety concerns.',
  },
  {
    id: '4',
    name: 'Key / FOB',
    group: 'Access',
    icon: Key,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    enabled: true,
    notificationTemplate: 'Key/FOB {{action}} for unit {{unit}}. Serial: {{serial}}.',
    description: 'Track key and FOB sign-outs, returns, and replacements.',
  },
  {
    id: '5',
    name: 'Pass-On',
    group: 'Operations',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    enabled: true,
    notificationTemplate: 'New pass-on note from {{author}}: {{summary}}.',
    description: 'Shift handoff notes and inter-staff communication.',
  },
  {
    id: '6',
    name: 'Cleaning',
    group: 'Operations',
    icon: Brush,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
    enabled: false,
    notificationTemplate: 'Cleaning {{status}} for {{area}}. Completed by {{staff}}.',
    description: 'Log cleaning tasks, schedules, and inspections.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState(INITIAL_EVENT_TYPES);

  function toggleEventType(id: string) {
    setEventTypes((prev) =>
      prev.map((et) => (et.id === id ? { ...et, enabled: !et.enabled } : et)),
    );
  }

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
            Event Type Configuration
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Configure event types, groups, icons, and notification templates.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          + Add Event Type
        </Button>
      </div>

      {/* Event Types List */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Event Types ({eventTypes.length})
        </h2>
        <div className="space-y-3">
          {eventTypes.map((et) => {
            const Icon = et.icon;
            return (
              <Card key={et.id}>
                <CardContent>
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${et.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${et.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-neutral-900">{et.name}</h3>
                          <Badge variant="default" size="sm">
                            {et.group}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[13px] text-neutral-500">{et.description}</p>
                      </div>
                      {/* Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={et.enabled}
                        onClick={() => toggleEventType(et.id)}
                        className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                          et.enabled ? 'bg-primary-500' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            et.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Notification Template */}
                    {et.enabled && (
                      <div className="pl-14">
                        <Input
                          label="Notification Template"
                          defaultValue={et.notificationTemplate}
                          helperText="Use {{unit}}, {{visitor_name}}, {{summary}}, {{staff}} as placeholders."
                        />
                      </div>
                    )}
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
