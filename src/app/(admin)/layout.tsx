'use client';

/**
 * Concierge — Admin Layout
 *
 * Admin-specific layout using AppShell with admin sidebar navigation.
 * Only accessible to Super Admin and Property Admin roles.
 */

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_ROLES } from '@/types';

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

  // Redirect non-admin users to dashboard
  if (!loading && user && !ADMIN_ROLES.has(user.role)) {
    router.replace('/dashboard');
    return null;
  }

  // Show loading skeleton while auth state is resolving
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Skeleton className="h-8 w-32" />
      </div>
    );
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
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }]}
      notificationCount={0}
      onLogout={logout}
    >
      {children}
    </AppShell>
  );
}
