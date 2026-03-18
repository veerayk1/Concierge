'use client';

/**
 * Concierge — Role-Aware Sidebar Navigation
 *
 * Collapsible sidebar (260px expanded, 64px collapsed) with:
 * - Concierge logo at top
 * - Navigation items grouped by category, filtered by user role
 * - Active state: primary-50 bg, primary-600 text, left border accent
 * - Collapse/expand toggle at bottom
 *
 * Per PRD 02 Section 7: items not assigned to the user's role are absent.
 * Per COMPONENT-SPECS 4.1: nav landmark, aria-current on active item.
 *
 * @module components/layout/sidebar
 */

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import { getNavigationForRole, type NavGroup } from '@/lib/navigation';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarProps {
  /** Current user's role — determines visible navigation items */
  role: Role;
  /** Whether the sidebar is collapsed (icon-only mode) */
  collapsed: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange: (collapsed: boolean) => void;
  /** Optional badge counts keyed by NavItem.badgeKey */
  badgeCounts?: Record<string, number>;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar({
  role,
  collapsed,
  onCollapsedChange,
  badgeCounts,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavigationForRole(role);

  const toggleCollapsed = useCallback(() => {
    onCollapsedChange(!collapsed);
  }, [collapsed, onCollapsedChange]);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-neutral-200 bg-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-[260px]',
        className,
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-neutral-200 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          {collapsed ? (
            <span className="text-primary-600 text-xl font-bold">C</span>
          ) : (
            <span className="text-lg font-bold text-neutral-900">Concierge</span>
          )}
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col gap-6">
            {navGroups.map((group) => (
              <NavGroupSection
                key={group.label}
                group={group}
                collapsed={collapsed}
                pathname={pathname}
                badgeCounts={badgeCounts}
              />
            ))}
          </div>
        </TooltipProvider>
      </nav>

      {/* Collapse Toggle */}
      <div className="shrink-0 border-t border-neutral-200 p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// NavGroupSection
// ---------------------------------------------------------------------------

interface NavGroupSectionProps {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  badgeCounts?: Record<string, number>;
}

function NavGroupSection({ group, collapsed, pathname, badgeCounts }: NavGroupSectionProps) {
  return (
    <div>
      {/* Group label — hidden when collapsed */}
      {!collapsed && (
        <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          {group.label}
        </p>
      )}
      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? badgeCounts?.[item.badgeKey] : undefined;

          const linkContent = (
            <Link
              href={item.href as never}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary-600 bg-primary-50 text-primary-600 border-l-[3px] pl-[9px]'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                collapsed && 'justify-center px-0',
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600',
                )}
              />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="bg-primary-100 text-primary-700 ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </>
              )}
              {collapsed && badgeCount !== undefined && badgeCount > 0 && (
                <span className="bg-primary-500 absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full" />
              )}
            </Link>
          );

          const tooltipLabel =
            badgeCount !== undefined && badgeCount > 0
              ? `${item.label} (${badgeCount} pending)`
              : item.label;

          return (
            <li key={item.id}>
              {collapsed ? (
                <Tooltip content={tooltipLabel} side="right" sideOffset={8} delayDuration={0}>
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
