'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar, type BreadcrumbItem } from '@/components/layout/top-bar';
import type { PropertyInfo } from '@/components/layout/property-switcher';
import type { Role } from '@/types';
import { BREAKPOINTS } from '@/lib/constants';
import { ADMIN_ROLES } from '@/types';

export interface AppShellUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface AppShellProps {
  user: AppShellUser;
  currentProperty: PropertyInfo;
  properties: PropertyInfo[];
  breadcrumbs?: BreadcrumbItem[];
  notificationCount?: number;
  badgeCounts?: Record<string, number>;
  onSearchOpen?: () => void;
  onLogout?: () => void;
  onSwitchProperty?: (propertyId: string) => void;
  children: ReactNode;
}

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
      <Sidebar
        role={user.role}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        badgeCounts={badgeCounts}
      />

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
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 p-8">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
