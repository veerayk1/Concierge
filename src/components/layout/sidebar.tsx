'use client';

/**
 * Concierge — Sidebar Navigation
 *
 * Left sidebar with logo, navigation items, and collapse toggle.
 * Width: 240px expanded, 64px collapsed (per design tokens).
 * White background with right border per design system.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarClock,
  Package,
  Wrench,
  CalendarDays,
  Shield,
  Building2,
  Users,
  Megaphone,
  BarChart3,
  GraduationCap,
  Heart,
  Car,
  ClipboardList,
  User,
  ChevronLeft,
  ChevronRight,
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
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Event Log', href: '/events', icon: CalendarClock },
  { label: 'Packages', href: '/packages', icon: Package },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  { label: 'Amenities', href: '/amenities', icon: CalendarDays },
  { label: 'Security', href: '/security', icon: Shield },
  { label: 'Units', href: '/units', icon: Building2 },
  { label: 'Residents', href: '/residents', icon: Users },
  { label: 'Announcements', href: '/announcements', icon: Megaphone },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Training', href: '/training', icon: GraduationCap },
  { label: 'Community', href: '/community', icon: Heart },
  { label: 'Parking', href: '/parking', icon: Car },
  { label: 'Shift Log', href: '/shift-log', icon: ClipboardList },
  { label: 'My Account', href: '/my-account', icon: User },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar() {
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
