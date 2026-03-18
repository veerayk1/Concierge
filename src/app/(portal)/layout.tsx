'use client';

/**
 * Concierge — Portal Layout
 *
 * Protected dashboard layout using AppShell. Redirects to /login if
 * not authenticated. Renders role-aware navigation based on user's role.
 *
 * The AppShell provides: collapsible sidebar, top bar with breadcrumbs
 * and search, notification bell, user menu, and property switcher.
 */

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Mock data — will be replaced with real API calls
// ---------------------------------------------------------------------------

const MOCK_PROPERTY = {
  id: 'prop-1',
  name: 'Bond Tower',
  address: '123 Bond Street, Toronto, ON',
};

const MOCK_PROPERTIES = [MOCK_PROPERTY];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

  // Show loading skeleton while auth state is resolving
  if (loading || !user) {
    return <PortalSkeleton />;
  }

  return (
    <AppShell
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: undefined,
      }}
      currentProperty={MOCK_PROPERTY}
      properties={MOCK_PROPERTIES}
      notificationCount={0}
      onLogout={logout}
      onSearchOpen={() => {
        // Will open command palette in the future
      }}
    >
      {children}
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Skeleton for loading state
// ---------------------------------------------------------------------------

function PortalSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar skeleton */}
      <div className="flex w-[260px] flex-col border-r border-neutral-200">
        <div className="flex h-16 items-center border-b border-neutral-200 px-4">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      {/* Main area skeleton */}
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-neutral-200 px-6">
          <Skeleton className="h-5 w-32" />
          <div className="mx-auto">
            <Skeleton className="h-9 w-64 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
        <div className="flex-1 bg-neutral-50 p-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="mt-6 grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
