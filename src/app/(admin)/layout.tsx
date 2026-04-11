'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_ROLES } from '@/types';
import type { Role } from '@/types';
import { getPropertyId, DEMO_PROPERTY } from '@/lib/demo-config';
import { DemoShowcaseBanner } from '@/components/layout/demo-showcase-banner';

// Property info derived from centralized config
const currentProperty = {
  id: getPropertyId(),
  name: DEMO_PROPERTY.name,
  address: DEMO_PROPERTY.address,
};

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
    const isShowcase =
      typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'showcase';
    return (
      <>
        {isShowcase && <DemoShowcaseBanner />}
        <AppShell
          user={{
            id: 'demo-user',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@concierge.com',
            role: demoRole,
            avatarUrl: undefined,
          }}
          currentProperty={currentProperty}
          properties={[currentProperty]}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }]}
          notificationCount={0}
          onLogout={() => {
            localStorage.removeItem('demo_role');
            localStorage.removeItem('demo_mode');
            localStorage.removeItem('demo_return_role');
            router.push('/login');
          }}
        >
          {children}
        </AppShell>
      </>
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
      currentProperty={currentProperty}
      properties={[currentProperty]}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }]}
      notificationCount={0}
      onLogout={logout}
    >
      {children}
    </AppShell>
  );
}
