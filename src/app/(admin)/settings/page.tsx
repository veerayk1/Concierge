'use client';

import { useRouter } from 'next/navigation';
import {
  Bell,
  Brain,
  ChevronRight,
  CreditCard,
  FileText,
  Layers,
  ToggleRight,
  Settings as SettingsIcon,
  Shield,
  Zap,
  Mail,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';

const SETTING_GROUPS = [
  {
    title: 'Property',
    items: [
      {
        label: 'General',
        description: 'Property name, address, timezone, and branding',
        icon: SettingsIcon,
        href: '/settings/general',
      },
      {
        label: 'Modules',
        description: 'Enable or disable modules like Amenities, Parking, Training',
        icon: ToggleRight,
        href: '/settings/modules',
      },
      {
        label: 'Event Types',
        description: 'Configure event types, groups, icons, and notification templates',
        icon: Layers,
        href: '/settings/event-types',
      },
      {
        label: 'Roles & Permissions',
        description: 'Define roles, assign permissions, and manage access control',
        icon: Shield,
        href: '/settings/roles',
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
      },
      {
        label: 'Email Configuration',
        description: 'Configure per-module email sender addresses',
        icon: Mail,
        href: '/settings/email-config',
      },
      {
        label: 'Integrations',
        description: 'Third-party services, webhooks, and API connections',
        icon: Zap,
        href: '/settings/integrations',
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
      },
      {
        label: 'Billing & Subscription',
        description: 'Plan details, invoices, payment methods, and usage',
        icon: CreditCard,
        href: '/settings/billing',
      },
      {
        label: 'Audit Log',
        description: 'View all administrative actions and system changes',
        icon: FileText,
        href: '/settings/audit-log',
      },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <PageShell title="Settings" description="Configure system-wide settings and preferences.">
      <div className="max-w-[760px]">
        <div className="flex flex-col gap-10">
          {SETTING_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 px-1 text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">
                {group.title}
              </h2>
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => router.push(item.href as never)}
                      className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50/80 focus-visible:bg-neutral-50 focus-visible:outline-none"
                    >
                      <Icon
                        className="h-[18px] w-[18px] shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-700"
                        strokeWidth={1.6}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium tracking-[-0.005em] text-neutral-900">
                          {item.label}
                        </p>
                        <p className="mt-0.5 truncate text-[12.5px] leading-snug text-neutral-500">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-600"
                        strokeWidth={1.8}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
