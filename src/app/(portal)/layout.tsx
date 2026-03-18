'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { CommandPalette } from '@/components/layout/command-palette';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROPERTY = {
  id: 'prop-1',
  name: 'Bond Tower',
  address: '123 Bond Street, Toronto, ON',
};

const MOCK_PROPERTIES = [MOCK_PROPERTY];

const DEMO_USERS: Record<string, { firstName: string; lastName: string; email: string }> = {
  front_desk: { firstName: 'Mike', lastName: 'Johnson', email: 'mike.j@bondtower.com' },
  security_guard: { firstName: 'Guard', lastName: 'Patel', email: 'guard.patel@bondtower.com' },
  property_admin: { firstName: 'Admin', lastName: 'User', email: 'admin@bondtower.com' },
  property_manager: { firstName: 'Sarah', lastName: 'Lee', email: 'sarah.l@bondtower.com' },
  resident_owner: { firstName: 'Janet', lastName: 'Smith', email: 'janet.smith@email.com' },
  resident_tenant: { firstName: 'David', lastName: 'Chen', email: 'david.chen@email.com' },
  board_member: { firstName: 'Board', lastName: 'Member', email: 'board@bondtower.com' },
  super_admin: { firstName: 'Super', lastName: 'Admin', email: 'superadmin@concierge.com' },
  maintenance_staff: { firstName: 'Mike', lastName: 'Thompson', email: 'mike.t@bondtower.com' },
  security_supervisor: {
    firstName: 'Supervisor',
    lastName: 'Chen',
    email: 'supervisor@bondtower.com',
  },
  superintendent: { firstName: 'James', lastName: 'Wilson', email: 'james.w@bondtower.com' },
  family_member: { firstName: 'Tom', lastName: 'Smith', email: 'tom.s@email.com' },
  offsite_owner: { firstName: 'Offsite', lastName: 'Owner', email: 'offsite@email.com' },
  visitor: { firstName: 'Guest', lastName: 'Visitor', email: 'guest@email.com' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [mounted, setMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleSearchOpen = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('demo_role') as Role | null;
    if (role) {
      setDemoRole(role);
    }
  }, []);

  if (!mounted) {
    return <PortalSkeleton />;
  }

  // Demo mode — use mock user based on selected role
  if (demoRole) {
    const demoUser = DEMO_USERS[demoRole] || DEMO_USERS.front_desk;
    return (
      <AppShell
        user={{
          id: 'demo-user',
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          email: demoUser.email,
          role: demoRole,
          avatarUrl: undefined,
        }}
        currentProperty={MOCK_PROPERTY}
        properties={MOCK_PROPERTIES}
        notificationCount={3}
        badgeCounts={{ unreleased_packages: 4 }}
        onLogout={() => {
          localStorage.removeItem('demo_role');
          router.push('/login');
        }}
        onSearchOpen={handleSearchOpen}
      >
        {children}
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </AppShell>
    );
  }

  // Real auth mode
  if (!loading && !isAuthenticated) {
    router.replace('/login');
    return null;
  }

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
      onSearchOpen={handleSearchOpen}
    >
      {children}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </AppShell>
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
