'use client';

/**
 * Concierge — Admin Sidebar Navigation
 *
 * Admin-specific sidebar with settings, user management, and system links.
 * Same visual structure as the portal sidebar but with admin navigation items.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Sliders,
  ShieldCheck,
  CalendarCog,
  BellRing,
  Puzzle,
  Sparkles,
  CreditCard,
  ScrollText,
  Users,
  Building2,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'General', href: '/settings/general', icon: Sliders },
  { label: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck },
  { label: 'Event Types', href: '/settings/event-types', icon: CalendarCog },
  { label: 'Notifications', href: '/settings/notifications', icon: BellRing },
  { label: 'Integrations', href: '/settings/integrations', icon: Puzzle },
  { label: 'AI Configuration', href: '/settings/ai', icon: Sparkles },
  { label: 'Billing', href: '/settings/billing', icon: CreditCard },
  { label: 'Audit Log', href: '/settings/audit-log', icon: ScrollText },
  { label: 'User Management', href: '/users', icon: Users },
  { label: 'Properties', href: '/properties', icon: Building2 },
  { label: 'System Health', href: '/system-health', icon: Activity },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const width = collapsed ? 'w-16' : 'w-60';

  return (
    <aside
      className={`${width} flex h-screen flex-col border-r border-neutral-200 bg-white transition-[width] duration-200`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-200 px-4">
        {collapsed ? (
          <span className="text-primary-500 text-lg font-bold">C</span>
        ) : (
          <span className="text-lg font-bold text-neutral-900">Concierge</span>
        )}
      </div>

      {/* Back to Portal */}
      {!collapsed && (
        <div className="border-b border-neutral-200 px-2 py-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portal
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Admin">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-neutral-200 p-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
