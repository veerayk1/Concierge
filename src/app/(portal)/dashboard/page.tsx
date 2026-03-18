'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/types';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Key,
  Megaphone,
  Package,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// KPI Card Data
// ---------------------------------------------------------------------------

interface KpiCardConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const KPI_ICONS: Record<string, KpiCardConfig> = {
  'Platform Health': {
    label: 'Platform Health',
    icon: Activity,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  'Total Properties': {
    label: 'Total Properties',
    icon: Building2,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'AI Spend': { label: 'AI Spend', icon: Sparkles, color: 'text-info-600', bgColor: 'bg-info-50' },
  'Active Users': {
    label: 'Active Users',
    icon: Users,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Open Requests': {
    label: 'Open Requests',
    icon: Wrench,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  'Unreleased Packages': {
    label: 'Unreleased Packages',
    icon: Package,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Active Visitors': {
    label: 'Active Visitors',
    icon: Users,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  Bookings: { label: 'Bookings', icon: Calendar, color: 'text-info-600', bgColor: 'bg-info-50' },
  'Resident Count': {
    label: 'Resident Count',
    icon: Users,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Financial Summary': {
    label: 'Financial Summary',
    icon: TrendingUp,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  'Compliance %': {
    label: 'Compliance %',
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  'Pending Approvals': {
    label: 'Pending Approvals',
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  'Satisfaction Score': {
    label: 'Satisfaction Score',
    icon: BarChart3,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Incident Count': {
    label: 'Incident Count',
    icon: AlertTriangle,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  'Guard Coverage': {
    label: 'Guard Coverage',
    icon: Shield,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Open Escalations': {
    label: 'Open Escalations',
    icon: AlertTriangle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  'Patrol Status': {
    label: 'Patrol Status',
    icon: Activity,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  'Keys Out': { label: 'Keys Out', icon: Key, color: 'text-warning-600', bgColor: 'bg-warning-50' },
  'Expected Visitors': {
    label: 'Expected Visitors',
    icon: Users,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
  'Pending Items': {
    label: 'Pending Items',
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  'Assigned Requests': {
    label: 'Assigned Requests',
    icon: Wrench,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Equipment Alerts': {
    label: 'Equipment Alerts',
    icon: AlertTriangle,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  'Scheduled Tasks': {
    label: 'Scheduled Tasks',
    icon: Calendar,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
  'Building Systems': {
    label: 'Building Systems',
    icon: Building2,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  "Today's Schedule": {
    label: "Today's Schedule",
    icon: Calendar,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
  'My Packages': {
    label: 'My Packages',
    icon: Package,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Upcoming Bookings': {
    label: 'Upcoming Bookings',
    icon: Calendar,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
  Announcements: {
    label: 'Announcements',
    icon: Megaphone,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  'Upcoming Events': {
    label: 'Upcoming Events',
    icon: Calendar,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
};

// ---------------------------------------------------------------------------
// Dashboard config per role
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

const DEMO_NAMES: Partial<Record<Role, string>> = {
  front_desk: 'Mike',
  security_guard: 'Patel',
  property_admin: 'Admin',
  property_manager: 'Sarah',
  resident_owner: 'Janet',
  resident_tenant: 'David',
  board_member: 'Director',
  super_admin: 'Super Admin',
  maintenance_staff: 'Mike',
  security_supervisor: 'Supervisor',
  superintendent: 'James',
  family_member: 'Tom',
  offsite_owner: 'Owner',
  visitor: 'Guest',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface DashboardApiData {
  kpis: {
    unreleasedPackages: number;
    openMaintenanceRequests: number;
    openEvents: number;
    totalUnits: number;
    activeUsers: number;
  };
  recentActivity: {
    id: string;
    type: string;
    title: string;
    unit?: string;
    status: string;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Support demo mode — read role from localStorage
  const demoRole =
    typeof window !== 'undefined' ? (localStorage.getItem('demo_role') as Role | null) : null;
  const effectiveRole: Role = user?.role ?? demoRole ?? 'front_desk';
  const effectiveName = user?.firstName ?? (demoRole ? (DEMO_NAMES[demoRole] ?? 'User') : 'User');

  // Fetch real dashboard data from API
  const { data: apiData } = useApi<DashboardApiData>(
    apiUrl('/api/v1/dashboard', { propertyId: DEMO_PROPERTY_ID, role: effectiveRole }),
  );

  // Map KPI names to real values from the API, falling back to em-dash
  const kpiValues: Record<string, string> = useMemo(() => {
    if (!apiData?.kpis) return {} as Record<string, string>;
    const k = apiData.kpis;
    const map: Record<string, string> = {
      'Unreleased Packages': String(k.unreleasedPackages),
      'Open Requests': String(k.openMaintenanceRequests),
      'Active Visitors': String(k.openEvents),
      'Resident Count': String(k.totalUnits),
      'Active Users': String(k.activeUsers),
      'Total Properties': '1',
      'My Packages': String(k.unreleasedPackages),
      'Assigned Requests': String(k.openMaintenanceRequests),
      'Pending Items': String(k.openEvents),
      'Expected Visitors': String(k.openEvents),
      Bookings: '\u2014',
    };
    return map;
  }, [apiData]);

  if (loading && !demoRole) {
    return <DashboardSkeleton />;
  }

  const config = DASHBOARD_CONFIGS[effectiveRole];
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
            {greeting}, {effectiveName}
          </h1>
          <p className="mt-1 text-[15px] text-neutral-500">
            {config.title} &middot; {ROLE_DISPLAY_NAMES[effectiveRole]}
          </p>
        </div>
        <p className="hidden text-[13px] text-neutral-400 xl:block">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* KPI Cards */}
      {config.kpiCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {config.kpiCards.map((kpi) => {
            const kpiConfig = KPI_ICONS[kpi] || {
              label: kpi,
              icon: FileText,
              color: 'text-neutral-600',
              bgColor: 'bg-neutral-50',
            };
            const Icon = kpiConfig.icon;

            return (
              <Card key={kpi} hoverable className="group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpiConfig.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${kpiConfig.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-500" />
                </div>
                <div className="mt-4">
                  <p className="text-[13px] font-medium text-neutral-500">{kpiConfig.label}</p>
                  <p className="mt-1 text-[24px] font-bold tracking-tight text-neutral-900">
                    {kpiValues[kpi] ?? '\u2014'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {config.quickActions.length > 0 && (
        <div>
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {config.quickActions.map((action) => (
              <button
                key={action}
                type="button"
                className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div>
        <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Recent Activity
        </h2>
        {apiData?.recentActivity && apiData.recentActivity.length > 0 ? (
          <div className="space-y-2">
            {apiData.recentActivity.map((event) => (
              <Card key={event.id} hoverable className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                      <Activity className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{event.title}</p>
                      <p className="text-[12px] text-neutral-500">
                        {event.type}
                        {event.unit ? ` \u00B7 Unit ${event.unit}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] text-neutral-400">
                    {new Date(event.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                <Activity className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-[15px] font-medium text-neutral-900">No activity yet</p>
              <p className="mt-1 text-[13px] text-neutral-500">
                Events will appear here as activity occurs across the building.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[130px] rounded-2xl" />
        ))}
      </div>
      <div>
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
