'use client';

/**
 * Concierge — Dashboard
 *
 * Role-aware dashboard with greeting and placeholder cards.
 * Each role sees a different layout per PRD 02 Section 8
 * and PRD ADMIN-SUPERADMIN-ARCHITECTURE Section 2.1.
 */

import { useAuth } from '@/lib/hooks/use-auth';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Dashboard config per role (from PRD 02 Section 8)
// ---------------------------------------------------------------------------

interface DashboardConfig {
  title: string;
  kpiCards: string[];
  quickActions: string[];
}

const DASHBOARD_CONFIGS: Record<Role, DashboardConfig> = {
  super_admin: {
    title: 'System Overview',
    kpiCards: ['Platform Health', 'Total Properties', 'AI Spend', 'Active Users'],
    quickActions: ['Switch Property', 'View Alerts', 'AI Config'],
  },
  property_admin: {
    title: 'Management Overview',
    kpiCards: [
      'Open Requests',
      'Unreleased Packages',
      'Active Visitors',
      'Bookings',
      'Resident Count',
    ],
    quickActions: ['Create User', 'Send Announcement', 'View Reports'],
  },
  board_member: {
    title: 'Governance Overview',
    kpiCards: ['Financial Summary', 'Compliance %', 'Pending Approvals', 'Satisfaction Score'],
    quickActions: ['View Reports', 'Upcoming Meetings'],
  },
  property_manager: {
    title: 'Operations Command Center',
    kpiCards: ['Open Requests', 'Unreleased Packages', 'Active Visitors', 'Bookings'],
    quickActions: ['Create Announcement', 'Assign Request', 'View Reports'],
  },
  security_supervisor: {
    title: 'Security Analytics',
    kpiCards: ['Incident Count', 'Guard Coverage', 'Open Escalations', 'Patrol Status'],
    quickActions: ['View Reports', 'Manage Shifts', 'Review Incidents'],
  },
  security_guard: {
    title: 'Security Dashboard',
    kpiCards: ['Active Visitors', 'Unreleased Packages', 'Keys Out'],
    quickActions: ['+ Visitor', '+ Package', '+ Incident', '+ Key'],
  },
  front_desk: {
    title: 'Front Desk Hub',
    kpiCards: ['Unreleased Packages', 'Expected Visitors', 'Pending Items'],
    quickActions: ['+ Package', '+ Visitor', '+ Note'],
  },
  maintenance_staff: {
    title: 'Work Queue',
    kpiCards: ['Assigned Requests', 'Equipment Alerts', 'Scheduled Tasks'],
    quickActions: ['Update Request', 'Log Work', 'View Schedule'],
  },
  superintendent: {
    title: 'Superintendent Command',
    kpiCards: ['Assigned Requests', 'Building Systems', 'Equipment Alerts', "Today's Schedule"],
    quickActions: ['Update Request', 'Log Work', 'Request Parts', 'View Schedule'],
  },
  resident_owner: {
    title: 'My Dashboard',
    kpiCards: ['My Packages', 'Open Requests', 'Upcoming Bookings'],
    quickActions: ['Book Amenity', 'Submit Request', 'View Directory'],
  },
  resident_tenant: {
    title: 'My Dashboard',
    kpiCards: ['My Packages', 'Open Requests', 'Upcoming Bookings'],
    quickActions: ['Book Amenity', 'Submit Request'],
  },
  offsite_owner: {
    title: 'My Dashboard',
    kpiCards: ['Announcements', 'Upcoming Events'],
    quickActions: ['View Announcements', 'View Library'],
  },
  family_member: {
    title: 'My Dashboard',
    kpiCards: ['My Packages', 'Upcoming Bookings'],
    quickActions: ['Book Amenity'],
  },
  visitor: {
    title: 'Welcome',
    kpiCards: [],
    quickActions: [],
  },
};

// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  const config = DASHBOARD_CONFIGS[user.role];
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {greeting}, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {config.title} &middot; {ROLE_DISPLAY_NAMES[user.role]}
        </p>
      </div>

      {/* KPI Cards */}
      {config.kpiCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {config.kpiCards.map((kpi) => (
            <Card key={kpi} hoverable className="cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-500">{kpi}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-neutral-900">&mdash;</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Data will be available when the module is connected
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {config.quickActions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-neutral-500 uppercase">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {config.quickActions.map((action) => (
              <button
                key={action}
                type="button"
                className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed Placeholder */}
      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wider text-neutral-500 uppercase">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-neutral-400">
              No recent activity. Events will appear here as staff and residents interact with the
              system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
