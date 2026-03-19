'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < BREAKPOINTS.md;
      setIsMobile(mobile);
      if (mobile) {
        setMobileOpen(false);
      }
      if (window.innerWidth < BREAKPOINTS.xl) {
        setCollapsed(true);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const hasMultipleProperties = properties.length > 1;
  const hasSettingsAccess = ADMIN_ROLES.has(user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile unless toggled */}
      <div
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : ''
        }
      >
        <Sidebar
          role={user.role}
          collapsed={isMobile ? false : collapsed}
          onCollapsedChange={isMobile ? () => setMobileOpen(false) : setCollapsed}
          badgeCounts={badgeCounts}
        />
      </div>

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
          mobileMenuButton={
            isMobile ? (
              <button
                type="button"
                onClick={toggleMobile}
                className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            ) : undefined
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 p-4 md:p-6 xl:p-8">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
