'use client';

/**
 * Concierge — Application Shell
 *
 * Main layout wrapper combining:
 * - Role-aware sidebar (left, includes logo + property switcher + nav)
 * - Top bar with breadcrumbs, search, notifications, user menu (top)
 * - Main content area (center, scrollable)
 *
 * Responsive: sidebar auto-collapses below xl breakpoint (1280px).
 * Desktop monitors are the primary target (1920x1080+).
 *
 * @module components/layout/app-shell
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar, type BreadcrumbItem } from '@/components/layout/top-bar';
import type { PropertyInfo } from '@/components/layout/property-switcher';
import type { Role } from '@/types';
import { BREAKPOINTS } from '@/lib/constants';
import { ADMIN_ROLES } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppShellUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface AppShellProps {
  /** Current authenticated user */
  user: AppShellUser;
  /** Current active property */
  currentProperty: PropertyInfo;
  /** All properties the user has access to */
  properties: PropertyInfo[];
  /** Breadcrumb trail for current page */
  breadcrumbs?: BreadcrumbItem[];
  /** Unread notification count */
  notificationCount?: number;
  /** Badge counts for navigation items */
  badgeCounts?: Record<string, number>;
  /** Called when search is triggered */
  onSearchOpen?: () => void;
  /** Called when user clicks logout */
  onLogout?: () => void;
  /** Called when user switches property */
  onSwitchProperty?: (propertyId: string) => void;
  /** Page content */
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppShell({
  user,
  currentProperty,
  properties,
  breadcrumbs,
  notificationCount,
  badgeCounts,
  onSearchOpen,
  onLogout,
  onSwitchProperty,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on smaller screens (below xl breakpoint)
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < BREAKPOINTS.xl) {
        setCollapsed(true);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasMultipleProperties = properties.length > 1;
  const hasSettingsAccess = ADMIN_ROLES.has(user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar with role-aware navigation */}
      <Sidebar
        role={user.role}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        badgeCounts={badgeCounts}
      />

      {/* Main area: top bar + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          breadcrumbs={breadcrumbs}
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
          }}
          notificationCount={notificationCount}
          hasMultipleProperties={hasMultipleProperties}
          hasSettingsAccess={hasSettingsAccess}
          onSearchOpen={onSearchOpen}
          onLogout={onLogout}
          onSwitchProperty={
            onSwitchProperty ? () => onSwitchProperty(currentProperty.id) : undefined
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
