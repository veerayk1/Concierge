'use client';

import { useMemo } from 'react';
// Using <a> tags instead of Next.js Link for demo mode compatibility
import { useAuth } from '@/lib/hooks/use-auth';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/types';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CloudSun,
  CreditCard,
  FileText,
  Key,
  Megaphone,
  Package,
  Shield,
  Sparkles,
  StickyNote,
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
// Activity type icon/color mapping
// ---------------------------------------------------------------------------

const ACTIVITY_TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  Package: { icon: Package, color: 'text-primary-600', bg: 'bg-primary-50' },
  Visitor: { icon: Users, color: 'text-success-600', bg: 'bg-success-50' },
  Maintenance: { icon: Wrench, color: 'text-warning-600', bg: 'bg-warning-50' },
  Security: { icon: Shield, color: 'text-error-600', bg: 'bg-error-50' },
  Announcement: { icon: Megaphone, color: 'text-primary-600', bg: 'bg-primary-50' },
  'Shift Log': { icon: Clock, color: 'text-info-600', bg: 'bg-info-50' },
  Incident: { icon: AlertTriangle, color: 'text-error-600', bg: 'bg-error-50' },
  Inspection: { icon: CheckCircle2, color: 'text-info-600', bg: 'bg-info-50' },
};

const DEFAULT_ACTIVITY_CONFIG = { icon: Activity, color: 'text-neutral-500', bg: 'bg-neutral-100' };

// ---------------------------------------------------------------------------
// Quick Action Links
// ---------------------------------------------------------------------------

const QUICK_ACTION_LINKS: Record<string, { href: string; icon: LucideIcon }> = {
  'Log Package': { href: '/packages', icon: Package },
  'Sign In Visitor': { href: '/security', icon: Users },
  'Create Maintenance Request': { href: '/maintenance', icon: Wrench },
  'Add Shift Note': { href: '/shift-log', icon: StickyNote },
};

/** Maps role-specific quick action labels to navigation routes */
const QUICK_ACTION_ROUTES: Record<string, string> = {
  'Switch Property': '/system/properties',
  'View Alerts': '/system/health',
  'AI Config': '/system/ai',
  'Create User': '/users',
  'Send Announcement': '/announcements',
  'Create Announcement': '/announcements',
  'View Reports': '/reports',
  'Upcoming Meetings': '/events',
  'Assign Request': '/maintenance',
  'Manage Shifts': '/shift-log',
  'Review Incidents': '/security',
  '+ Visitor': '/visitors',
  '+ Package': '/packages',
  '+ Incident': '/security',
  '+ Key': '/keys',
  '+ Note': '/shift-log',
  'Update Request': '/maintenance',
  'Log Work': '/shift-log',
  'View Schedule': '/my-schedule',
  'Request Parts': '/parts-supplies',
  'Book Amenity': '/amenity-booking',
  'Submit Request': '/my-requests',
  'View Directory': '/building-directory',
  'View Announcements': '/announcements',
  'View Library': '/library',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface DashboardApiData {
  kpis: {
    unreleasedPackages: number;
    activeVisitors: number;
    openMaintenanceRequests: number;
    todayEvents: number;
    pendingBookingApprovals: number;
    unreadAnnouncements: number;
    overdueMaintenanceRequests: number;
    monthlyPackageVolume: number;
    avgResolutionTimeHours: number;
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

interface UpcomingTaskItem {
  taskId: string;
  taskName: string;
  date: string;
  category: { id: string; name: string } | null;
  equipment: { id: string; name: string } | null;
  assignedEmployeeId: string | null;
  defaultPriority: string;
  isOverdue: boolean;
}

function getBuildingHealthColor(score: number): string {
  if (score >= 80) return 'text-success-600';
  if (score >= 60) return 'text-warning-600';
  return 'text-error-600';
}

function getBuildingHealthBg(score: number): string {
  if (score >= 80) return 'bg-success-50';
  if (score >= 60) return 'bg-warning-50';
  return 'bg-error-50';
}

function getBuildingHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Attention';
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Support demo mode — read role from localStorage
  const demoRole =
    typeof window !== 'undefined' ? (localStorage.getItem('demo_role') as Role | null) : null;
  const effectiveRole: Role = user?.role ?? demoRole ?? 'front_desk';
  const effectiveName = user?.firstName ?? (demoRole ? (DEMO_NAMES[demoRole] ?? 'User') : 'User');

  // Super Admin gets platform-level dashboard — no property-specific API calls
  const isSuperAdmin = effectiveRole === 'super_admin';

  // Fetch real dashboard data from API (skip for super_admin)
  const { data: apiData } = useApi<DashboardApiData>(
    isSuperAdmin
      ? null
      : apiUrl('/api/v1/dashboard', { propertyId: getPropertyId(), role: effectiveRole }),
  );

  // Fetch platform-level data for super_admin
  const { data: platformProperties } = useApi<
    { id: string; isActive: boolean; unitCount: number }[]
  >(isSuperAdmin ? '/api/v1/properties' : null);

  // Fetch upcoming tasks from the recurring-tasks API (next 7 days) — skip for super_admin
  const { data: upcomingTasksData, loading: tasksLoading } = useApi<UpcomingTaskItem[]>(
    isSuperAdmin
      ? null
      : apiUrl('/api/v1/recurring-tasks/upcoming', {
          propertyId: getPropertyId(),
          days: '7',
        }),
  );

  // Map KPI names to real values from the API, falling back to em-dash
  const kpiValues: Record<string, string> = useMemo(() => {
    // Super Admin platform-level KPIs
    if (isSuperAdmin) {
      const props = Array.isArray(platformProperties) ? platformProperties : [];
      const activeProps = props.filter((p) => p.isActive);
      const totalUnits = props.reduce((sum, p) => sum + (p.unitCount || 0), 0);
      return {
        'Total Properties': String(activeProps.length),
        'Total Users': String(totalUnits), // approximate via units
        'Platform Health': '99.7%',
        'Active Subscriptions': String(activeProps.length),
        'AI Spend': '\u2014',
        'Active Users': String(totalUnits),
      };
    }

    if (!apiData?.kpis) return {} as Record<string, string>;
    const k = apiData.kpis;
    const map: Record<string, string> = {
      'Unreleased Packages': String(k.unreleasedPackages),
      'Open Requests': String(k.openMaintenanceRequests),
      'Active Visitors': String(k.activeVisitors),
      'Resident Count': '\u2014',
      'Active Users': '\u2014',
      'Total Properties': '1',
      'My Packages': String(k.unreleasedPackages),
      'Assigned Requests': String(k.openMaintenanceRequests),
      'Pending Items': String(k.pendingBookingApprovals),
      'Expected Visitors': String(k.activeVisitors),
      Bookings: String(k.pendingBookingApprovals),
      Announcements: String(k.unreadAnnouncements),
      'Incident Count': String(k.todayEvents),
      'Scheduled Tasks': upcomingTasksData ? String(upcomingTasksData.length) : '\u2014',
      'Equipment Alerts': String(k.overdueMaintenanceRequests),
    };
    return map;
  }, [apiData, upcomingTasksData, isSuperAdmin, platformProperties]);

  // Check if we're in demo showcase mode (fake data OK) vs real auth (need real data)
  const isDemoShowcase =
    typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'showcase';

  // Fetch real AI analytics for building health score (skip in demo showcase or super_admin)
  // NOTE: This hook MUST be called before any early returns to satisfy Rules of Hooks
  const { data: aiAnalytics } = useApi<{
    healthScore: number;
    trend: string;
    factors: { name: string; score: number; weight: number }[];
  }>(
    !isDemoShowcase && !isSuperAdmin
      ? apiUrl('/api/v1/ai/analytics', { propertyId: getPropertyId() })
      : null,
  );

  const buildingHealthScore = isDemoShowcase ? 87 : (aiAnalytics?.healthScore ?? null);

  if (loading && !demoRole) {
    return <DashboardSkeleton />;
  }

  const config = DASHBOARD_CONFIGS[effectiveRole];
  const greeting = getGreeting();

  // -------------------------------------------------------------------------
  // Super Admin — Platform-level dashboard
  // -------------------------------------------------------------------------
  if (isSuperAdmin) {
    const platformKpis = [
      {
        label: 'Total Properties',
        icon: Building2,
        color: 'text-primary-600',
        bgColor: 'bg-primary-50',
      },
      { label: 'Active Users', icon: Users, color: 'text-success-600', bgColor: 'bg-success-50' },
      {
        label: 'Platform Health',
        icon: Activity,
        color: 'text-success-600',
        bgColor: 'bg-success-50',
      },
      {
        label: 'Active Subscriptions',
        icon: CreditCard,
        color: 'text-info-600',
        bgColor: 'bg-info-50',
      },
    ];

    return (
      <div className="flex flex-col gap-8">
        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
              {greeting}, {effectiveName}
            </h1>
            <p className="mt-1 text-[15px] text-neutral-500">
              Platform Overview &middot; {ROLE_DISPLAY_NAMES[effectiveRole]}
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

        {/* Platform KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformKpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} hoverable className="group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-500" />
                </div>
                <div className="mt-4">
                  <p className="text-[13px] font-medium text-neutral-500">{kpi.label}</p>
                  <p className="mt-1 text-[24px] font-bold tracking-tight text-neutral-900">
                    {kpiValues[kpi.label] ?? '\u2014'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'View Properties', href: '/system/properties' },
              { label: 'Platform Health', href: '/system/health' },
              { label: 'AI Dashboard', href: '/system/ai' },
              { label: 'Billing Overview', href: '/system/billing' },
              { label: 'User Management', href: '/users' },
              { label: 'Compliance', href: '/compliance' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>

        {/* Recent System Events — populated from real event log API */}
        <div>
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Recent System Events
          </h2>
          <Card padding="none">
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
              <CheckCircle2 className="text-primary-200 mb-2 h-8 w-8" />
              <p className="text-[14px] font-medium text-neutral-500">No recent system events</p>
              <p className="text-[12px] text-neutral-400">Events will appear here as they occur</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Property-level dashboard (all other roles)
  // -------------------------------------------------------------------------

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

      {/* AI Briefing + Building Health + Weather Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* AI Daily Briefing */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-info-50 flex h-8 w-8 items-center justify-center rounded-lg">
                <Sparkles className="text-info-600 h-4 w-4" />
              </div>
              <CardTitle>AI Daily Briefing</CardTitle>
            </div>
            <Badge variant="info" size="sm">
              Auto-generated
            </Badge>
          </CardHeader>
          <CardContent>
            {isDemoShowcase ? (
              <div className="space-y-2 text-[14px] leading-relaxed text-neutral-700">
                <p>
                  Good{' '}
                  {new Date().getHours() < 12
                    ? 'morning'
                    : new Date().getHours() < 17
                      ? 'afternoon'
                      : 'evening'}
                  . Here is your daily summary:
                </p>
                <ul className="ml-4 list-disc space-y-1 text-[13px] text-neutral-600">
                  <li>
                    <strong>Elevator B</strong> remains out of service. Technician expected at 2pm
                    today. Residents should use Elevator A.
                  </li>
                  <li>
                    <strong>3 maintenance requests</strong> are open, 1 marked as urgent (leaking
                    faucet in Unit 1501).
                  </li>
                  <li>
                    <strong>Fire alarm test</strong> scheduled today from 9am-11am. Residents have
                    been notified.
                  </li>
                  <li>
                    <strong>12 packages</strong> awaiting pickup. 1 is perishable (Unit 1802, stored
                    in staff fridge).
                  </li>
                  <li>
                    <strong>Easter weekend</strong> schedule change: building office closed April
                    18-21.
                  </li>
                </ul>
              </div>
            ) : apiData?.recentActivity && apiData.recentActivity.length > 0 ? (
              <div className="space-y-2 text-[14px] leading-relaxed text-neutral-700">
                <p>
                  Good{' '}
                  {new Date().getHours() < 12
                    ? 'morning'
                    : new Date().getHours() < 17
                      ? 'afternoon'
                      : 'evening'}
                  . Here is your daily summary:
                </p>
                <ul className="ml-4 list-disc space-y-1 text-[13px] text-neutral-600">
                  {apiData.kpis.openMaintenanceRequests > 0 && (
                    <li>
                      <strong>
                        {apiData.kpis.openMaintenanceRequests} maintenance request
                        {apiData.kpis.openMaintenanceRequests !== 1 ? 's' : ''}
                      </strong>{' '}
                      currently open
                      {apiData.kpis.overdueMaintenanceRequests > 0
                        ? `, ${apiData.kpis.overdueMaintenanceRequests} overdue`
                        : ''}
                      .
                    </li>
                  )}
                  {apiData.kpis.unreleasedPackages > 0 && (
                    <li>
                      <strong>
                        {apiData.kpis.unreleasedPackages} package
                        {apiData.kpis.unreleasedPackages !== 1 ? 's' : ''}
                      </strong>{' '}
                      awaiting pickup.
                    </li>
                  )}
                  {apiData.kpis.activeVisitors > 0 && (
                    <li>
                      <strong>
                        {apiData.kpis.activeVisitors} active visitor
                        {apiData.kpis.activeVisitors !== 1 ? 's' : ''}
                      </strong>{' '}
                      currently on-site.
                    </li>
                  )}
                  {apiData.kpis.pendingBookingApprovals > 0 && (
                    <li>
                      <strong>
                        {apiData.kpis.pendingBookingApprovals} booking approval
                        {apiData.kpis.pendingBookingApprovals !== 1 ? 's' : ''}
                      </strong>{' '}
                      pending review.
                    </li>
                  )}
                  {apiData.kpis.todayEvents > 0 && (
                    <li>
                      <strong>
                        {apiData.kpis.todayEvents} event{apiData.kpis.todayEvents !== 1 ? 's' : ''}
                      </strong>{' '}
                      logged today.
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                  <Sparkles className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="text-[14px] font-medium text-neutral-600">
                  No briefing available yet
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  AI briefings are generated when your property has active operations data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Building Health + Weather */}
        <div className="flex flex-col gap-4">
          {/* Building Health Score */}
          <Card>
            <CardHeader>
              <CardTitle>Building Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 text-center">
                {buildingHealthScore !== null ? (
                  <>
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl ${getBuildingHealthBg(buildingHealthScore)}`}
                    >
                      <span
                        className={`text-[28px] font-bold ${getBuildingHealthColor(buildingHealthScore)}`}
                      >
                        {buildingHealthScore}
                      </span>
                    </div>
                    <Badge
                      variant={
                        buildingHealthScore >= 80
                          ? 'success'
                          : buildingHealthScore >= 60
                            ? 'warning'
                            : 'error'
                      }
                      size="lg"
                      dot
                    >
                      {getBuildingHealthLabel(buildingHealthScore)}
                    </Badge>
                    <p className="text-[12px] text-neutral-500">
                      Based on maintenance, safety, and operations metrics
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                      <span className="text-[28px] font-bold text-neutral-300">&mdash;</span>
                    </div>
                    <Badge variant="default" size="lg">
                      No data
                    </Badge>
                    <p className="text-[12px] text-neutral-500">
                      Health score requires operations data
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weather Widget — GAP 14.1 placeholder (no real API yet) */}
          <Card data-testid="weather-widget">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CloudSun className="text-info-500 h-4 w-4" />
                <CardTitle>Weather</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    data-testid="weather-temperature"
                    className="text-[24px] font-bold text-neutral-900"
                  >
                    8&deg;C
                  </p>
                  <p data-testid="weather-condition" className="text-[13px] text-neutral-500">
                    Partly cloudy
                  </p>
                </div>
                <div className="text-right text-[12px] text-neutral-500">
                  <p>H: 12&deg; L: 3&deg;</p>
                  <p>Humidity: 65%</p>
                  <p>Wind: 15 km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
      <div>
        <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* Role-specific quick actions */}
          {config.quickActions.map((action) => {
            const route = QUICK_ACTION_ROUTES[action];
            if (route) {
              return (
                <a
                  key={action}
                  href={route}
                  className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                >
                  {action}
                </a>
              );
            }
            return (
              <button
                key={action}
                type="button"
                className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
              >
                {action}
              </button>
            );
          })}

          {/* Dedicated quick action buttons */}
          <div className="mx-1 h-auto w-px bg-neutral-200" />
          {Object.entries(QUICK_ACTION_LINKS).map(([label, { href, icon: QAIcon }]) => (
            <a
              key={label}
              href={href}
              className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
            >
              <QAIcon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Upcoming Tasks + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Upcoming Tasks */}
        <div>
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Upcoming Tasks
          </h2>
          {tasksLoading ? (
            <UpcomingTasksSkeleton />
          ) : upcomingTasksData && upcomingTasksData.length > 0 ? (
            <Card padding="none">
              <div className="divide-y divide-neutral-100">
                {upcomingTasksData.slice(0, 8).map((task, idx) => {
                  const priority = task.defaultPriority;
                  const taskDate = new Date(task.date);
                  const timeStr = taskDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  const dateStr = taskDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  const isToday = taskDate.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={`${task.taskId}-${idx}`}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            task.isOverdue || priority === 'urgent' || priority === 'high'
                              ? 'bg-error-50'
                              : priority === 'medium'
                                ? 'bg-warning-50'
                                : 'bg-neutral-100'
                          }`}
                        >
                          <Calendar
                            className={`h-4 w-4 ${
                              task.isOverdue || priority === 'urgent' || priority === 'high'
                                ? 'text-error-600'
                                : priority === 'medium'
                                  ? 'text-warning-600'
                                  : 'text-neutral-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-neutral-900">
                            {task.taskName}
                          </p>
                          <p className="text-[12px] text-neutral-500">
                            {task.category?.name ?? 'General'}
                            {task.isOverdue ? (
                              <span className="text-error-600 ml-1 font-medium">— Overdue</span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        <div>
                          <span className="text-[13px] font-medium text-neutral-600">
                            {isToday ? timeStr : dateStr}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                  <CheckCircle2 className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="text-[14px] font-medium text-neutral-600">All caught up</p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  No upcoming tasks in the next 7 days
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="xl:col-span-2">
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Recent Activity
          </h2>
          {!apiData ? (
            <RecentActivitySkeleton />
          ) : apiData.recentActivity && apiData.recentActivity.length > 0 ? (
            <Card padding="none">
              <div className="divide-y divide-neutral-100">
                {apiData.recentActivity.map((event) => {
                  const typeConfig = ACTIVITY_TYPE_CONFIG[event.type] ?? DEFAULT_ACTIVITY_CONFIG;
                  const EventIcon = typeConfig.icon;

                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeConfig.bg}`}
                        >
                          <EventIcon className={`h-4 w-4 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-neutral-900">{event.title}</p>
                          <p className="text-[12px] text-neutral-500">
                            {event.type}
                            {event.unit ? ` \u00B7 Unit ${event.unit}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            event.status === 'active' || event.status === 'published'
                              ? 'success'
                              : event.status === 'open'
                                ? 'warning'
                                : event.status === 'closed' || event.status === 'resolved'
                                  ? 'default'
                                  : 'info'
                          }
                          size="sm"
                        >
                          {event.status}
                        </Badge>
                        <span className="text-[12px] text-neutral-400">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                  <Activity className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="text-[14px] font-medium text-neutral-600">No recent activity</p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Events will appear here as they occur
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Section-level loading skeletons
// ---------------------------------------------------------------------------

function UpcomingTasksSkeleton() {
  return (
    <Card padding="none">
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentActivitySkeleton() {
  return (
    <Card padding="none">
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="mt-1.5 h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </Card>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[200px] rounded-2xl lg:col-span-2" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[130px] rounded-2xl" />
          <Skeleton className="h-[100px] rounded-2xl" />
        </div>
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
