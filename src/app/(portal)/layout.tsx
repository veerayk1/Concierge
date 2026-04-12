'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { CommandPalette } from '@/components/layout/command-palette';
import { DemoShowcaseBanner } from '@/components/layout/demo-showcase-banner';
import { ModuleConfigProvider } from '@/lib/hooks/use-module-config';
import { getFlatNavigationForRole } from '@/lib/navigation';
import type { Role } from '@/types';

import { getPropertyId, DEMO_PROPERTY } from '@/lib/demo-config';

// Property info derived from centralized config
const currentProperty = {
  id: getPropertyId(),
  name: DEMO_PROPERTY.name,
  address: DEMO_PROPERTY.address,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [demoMode, setDemoMode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleSearchOpen = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
    const rawRole = localStorage.getItem('demo_role');
    if (rawRole) {
      // Map shorthand demo roles to actual Role enum values
      const ROLE_ALIASES: Record<string, Role> = {
        resident: 'resident_owner',
        owner: 'resident_owner',
        tenant: 'resident_tenant',
        security: 'security_guard',
        maintenance: 'maintenance_staff',
        admin: 'property_admin',
        manager: 'property_manager',
      };
      const role = (ROLE_ALIASES[rawRole] ?? rawRole) as Role;
      setDemoRole(role);
    }
    setDemoMode(localStorage.getItem('demo_mode'));
  }, []);

  // Redirect to login if not authenticated (must be before early returns for Rules of Hooks)
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated && !demoRole) {
      router.replace('/login');
    }
  }, [mounted, loading, isAuthenticated, demoRole, router]);

  // usePathname must be called unconditionally (before any early returns)
  // to comply with React's Rules of Hooks
  const pathname = usePathname();

  // Route guard — block access to pages not allowed for the current role.
  // PIPEDA compliance: residents must not see other residents' data.
  const isRouteBlocked = (() => {
    if (!mounted || !demoRole || !pathname) return false;
    const universalPaths = ['/dashboard', '/my-account', '/my-requests', '/my-packages'];
    if (universalPaths.some((p) => pathname.startsWith(p))) return false;
    try {
      const allowedPaths = getFlatNavigationForRole(demoRole).map((item) => item.href);
      return !allowedPaths.some(
        (allowed) => pathname === allowed || pathname.startsWith(allowed + '/'),
      );
    } catch {
      return false; // Fail-open if navigation config errors
    }
  })();

  useEffect(() => {
    if (isRouteBlocked) {
      router.replace('/dashboard');
    }
  }, [isRouteBlocked, router]);

  if (!mounted) {
    return <PortalSkeleton />;
  }

  // Block rendering while redirecting — prevents flash of restricted content
  if (isRouteBlocked) {
    return <PortalSkeleton />;
  }

  // Demo mode — derive display name from role
  if (demoRole) {
    const roleName = demoRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const isShowcase = demoMode === 'showcase';
    return (
      <ModuleConfigProvider>
        {isShowcase && <DemoShowcaseBanner />}
        <AppShell
          user={{
            id: 'demo-user',
            firstName: roleName,
            lastName: '',
            email: '',
            role: demoRole,
            avatarUrl: undefined,
          }}
          currentProperty={currentProperty}
          properties={[currentProperty]}
          notificationCount={isShowcase ? 3 : 0}
          badgeCounts={isShowcase ? { unreleased_packages: 4 } : {}}
          onLogout={() => {
            localStorage.removeItem('demo_role');
            localStorage.removeItem('demo_mode');
            localStorage.removeItem('demo_return_role');
            router.push('/login' as never);
          }}
          onSearchOpen={handleSearchOpen}
        >
          {children}
          <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
        </AppShell>
      </ModuleConfigProvider>
    );
  }

  // Real auth mode
  if (loading || !user) {
    return <PortalSkeleton />;
  }

  return (
    <ModuleConfigProvider>
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
        notificationCount={0}
        onLogout={logout}
        onSearchOpen={handleSearchOpen}
      >
        {children}
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </AppShell>
    </ModuleConfigProvider>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PortalSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
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
