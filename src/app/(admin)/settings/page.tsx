'use client';

import { useRouter } from 'next/navigation';
import {
  Bell,
  Brain,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  Key,
  Layers,
  Palette,
  Settings,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Settings Categories
// ---------------------------------------------------------------------------

const SETTING_GROUPS = [
  {
    title: 'Property',
    items: [
      {
        label: 'General',
        description: 'Property name, address, timezone, and branding',
        icon: Settings,
        href: '/settings/general',
        color: 'text-neutral-600',
        bg: 'bg-neutral-100',
      },
      {
        label: 'Event Types',
        description: 'Configure event types, groups, icons, and notification templates',
        icon: Layers,
        href: '/settings/event-types',
        color: 'text-primary-600',
        bg: 'bg-primary-50',
      },
      {
        label: 'Roles & Permissions',
        description: 'Define roles, assign permissions, and manage access control',
        icon: Shield,
        href: '/settings/roles',
        color: 'text-error-600',
        bg: 'bg-error-50',
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        label: 'Notifications',
        description: 'Email, SMS, push notification templates and delivery settings',
        icon: Bell,
        href: '/settings/notifications',
        color: 'text-warning-600',
        bg: 'bg-warning-50',
      },
      {
        label: 'Integrations',
        description: 'Third-party services, webhooks, and API connections',
        icon: Zap,
        href: '/settings/integrations',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      },
    ],
  },
  {
    title: 'Platform',
    items: [
      {
        label: 'AI Configuration',
        description: 'AI features, model selection, and automation settings',
        icon: Brain,
        href: '/settings/ai',
        color: 'text-info-600',
        bg: 'bg-info-50',
      },
      {
        label: 'Billing & Subscription',
        description: 'Plan details, invoices, payment methods, and usage',
        icon: CreditCard,
        href: '/settings/billing',
        color: 'text-success-600',
        bg: 'bg-success-50',
      },
      {
        label: 'Audit Log',
        description: 'View all administrative actions and system changes',
        icon: FileText,
        href: '/settings/audit-log',
        color: 'text-neutral-600',
        bg: 'bg-neutral-100',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();

  return (
    <PageShell title="Settings" description="Configure system-wide settings and preferences.">
      <div className="flex flex-col gap-8">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              {group.title}
            </h2>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.label}
                    padding="none"
                    hoverable
                    className="cursor-pointer"
                    onClick={() => router.push(item.href as never)}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}
                      >
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-semibold text-neutral-900">{item.label}</h3>
                        <p className="text-[13px] text-neutral-500">{item.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
