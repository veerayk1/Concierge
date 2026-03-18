'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_ROLES } from '@/types';
import type { Role } from '@/types';

const MOCK_PROPERTY = {
  id: 'prop-1',
  name: 'Bond Tower',
  address: '123 Bond Street, Toronto, ON',
};

const MOCK_PROPERTIES = [MOCK_PROPERTY];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('demo_role') as Role | null;
    if (role) setDemoRole(role);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Demo mode
  if (demoRole) {
    if (!ADMIN_ROLES.has(demoRole)) {
      router.replace('/dashboard');
      return null;
    }
    return (
      <AppShell
        user={{
          id: 'demo-user',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@bondtower.com',
          role: demoRole,
          avatarUrl: undefined,
        }}
        currentProperty={MOCK_PROPERTY}
        properties={MOCK_PROPERTIES}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }]}
        notificationCount={0}
        onLogout={() => {
          localStorage.removeItem('demo_role');
          router.push('/login');
        }}
      >
        {children}
      </AppShell>
    );
  }

  // Real auth
  if (!loading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

  if (!loading && user && !ADMIN_ROLES.has(user.role)) {
    router.replace('/dashboard');
    return null;
  }

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
