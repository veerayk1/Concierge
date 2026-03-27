'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import { getNavigationForRole, type NavGroup } from '@/lib/navigation';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { useModuleConfig } from '@/lib/hooks/use-module-config';

export interface SidebarProps {
  role: Role;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  badgeCounts?: Record<string, number>;
  className?: string;
}

export function Sidebar({
  role,
  collapsed,
  onCollapsedChange,
  badgeCounts,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const roleNavGroups = getNavigationForRole(role);
  const { disabledNavItemIds } = useModuleConfig();

  // Filter out nav items whose modules are disabled for this property
  const navGroups = useMemo(() => {
    if (disabledNavItemIds.size === 0) return roleNavGroups;
    const filtered: NavGroup[] = [];
    for (const group of roleNavGroups) {
      const items = group.items.filter((item) => !disabledNavItemIds.has(item.id));
      if (items.length > 0) {
        filtered.push({ label: group.label, items });
      }
    }
    return filtered;
  }, [roleNavGroups, disabledNavItemIds]);

  const toggleCollapsed = useCallback(() => {
    onCollapsedChange(!collapsed);
  }, [collapsed, onCollapsedChange]);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-neutral-200/80 bg-white transition-[width] duration-300 ease-out',
        collapsed ? 'w-[68px]' : 'w-[260px]',
        className,
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-neutral-100 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-[17px] font-bold tracking-tight text-neutral-900">Concierge</span>
          )}
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col gap-7">
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
      <div className="shrink-0 border-t border-neutral-100 p-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center rounded-xl p-2 text-neutral-400 transition-all duration-200 hover:bg-neutral-50 hover:text-neutral-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
      {!collapsed && (
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
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
                'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                collapsed && 'justify-center px-0',
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-600',
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
