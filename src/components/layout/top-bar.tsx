'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, LogOut, Search, Settings, Shuffle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import type { Role } from '@/types';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    avatarUrl?: string;
  };
  notificationCount?: number;
  hasMultipleProperties?: boolean;
  hasSettingsAccess?: boolean;
  onSearchOpen?: () => void;
  onLogout?: () => void;
  onSwitchProperty?: () => void;
  mobileMenuButton?: React.ReactNode;
  className?: string;
}

export function TopBar({
  breadcrumbs = [],
  user,
  notificationCount = 0,
  hasMultipleProperties = false,
  hasSettingsAccess = false,
  onSearchOpen,
  onLogout,
  onSwitchProperty,
  mobileMenuButton,
  className,
}: TopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearchOpen) {
          onSearchOpen();
        } else {
          searchInputRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchOpen]);

  const handleSearchFocus = useCallback(() => {
    if (onSearchOpen) {
      onSearchOpen();
      searchInputRef.current?.blur();
    }
  }, [onSearchOpen]);

  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
  const shortcutHint = isMac ? '\u2318K' : 'Ctrl+K';

  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-6',
        className,
      )}
    >
      {/* Left: Mobile menu + Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center">
        {mobileMenuButton}
        <ol className="flex items-center gap-1.5 text-[14px]">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />}
                {isLast || !crumb.href ? (
                  <span
                    className={cn('font-medium', isLast ? 'text-neutral-900' : 'text-neutral-400')}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href as never}
                    className="text-neutral-400 transition-colors hover:text-neutral-600"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Center: Global Search */}
      <div className="mx-4 flex max-w-md flex-1 justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search anything..."
            className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 pr-16 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:bg-white focus:ring-4 focus:outline-none"
            onFocus={handleSearchFocus}
            readOnly={!!onSearchOpen}
            aria-label="Global search"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
            {shortcutHint}
          </kbd>
        </div>
      </div>

      {/* Right: Notifications + User Menu */}
      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-neutral-400 transition-all duration-200 hover:bg-neutral-50 hover:text-neutral-600"
          aria-label={
            notificationCount > 0 ? `${notificationCount} unread notifications` : 'Notifications'
          }
        >
          <Bell className="h-[18px] w-[18px]" />
          {notificationCount > 0 && (
            <span className="bg-error-500 absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-xl p-2 transition-all duration-200 hover:bg-neutral-50"
              aria-label="Account menu"
            >
              <Avatar name={userDisplayName} src={user?.avatarUrl} size="sm" />
              {user && (
                <span className="hidden text-[14px] font-medium text-neutral-700 lg:inline">
                  {user.firstName}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-medium text-neutral-900">
                      {userDisplayName}
                    </span>
                    <span className="text-[12px] font-normal text-neutral-500">
                      {ROLE_DISPLAY_NAMES[user.role]}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/my-account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {hasSettingsAccess && (
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {hasMultipleProperties && (
                <DropdownMenuItem
                  onSelect={() => onSwitchProperty?.()}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Switch Property</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onLogout?.()}
              destructive
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
