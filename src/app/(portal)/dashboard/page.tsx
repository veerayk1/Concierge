'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
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
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CloudSun,
  FileText,
  Key,
  Megaphone,
  Package,
  Plus,
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
// Mock data for new sections
// ---------------------------------------------------------------------------

const MOCK_UPCOMING_TASKS = [
  {
    id: 't1',
    title: 'Fire alarm test',
    time: '9:00 AM',
    type: 'maintenance',
    priority: 'high' as const,
  },
  {
    id: 't2',
    title: 'Elevator B technician visit',
    time: '2:00 PM',
    type: 'maintenance',
    priority: 'high' as const,
  },
  {
    id: 't3',
    title: 'Pool filter inspection',
    time: '3:30 PM',
    type: 'inspection',
    priority: 'normal' as const,
  },
  {
    id: 't4',
    title: 'Lobby plant watering',
    time: '4:00 PM',
    type: 'routine',
    priority: 'low' as const,
  },
];

const MOCK_RECENT_ACTIVITY = [
  {
    id: 'ra1',
    type: 'Package',
    title: 'Amazon delivery for Unit 1205',
    status: 'Logged',
    time: '5 min ago',
    icon: Package,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    id: 'ra2',
    type: 'Visitor',
    title: 'John Smith signed in to visit Unit 802',
    status: 'Active',
    time: '12 min ago',
    icon: Users,
    color: 'text-success-600',
    bg: 'bg-success-50',
  },
  {
    id: 'ra3',
    type: 'Maintenance',
    title: 'Leaking faucet reported - Unit 1501',
    status: 'Open',
    time: '25 min ago',
    icon: Wrench,
    color: 'text-warning-600',
    bg: 'bg-warning-50',
  },
  {
    id: 'ra4',
    type: 'Security',
    title: 'Parking violation logged - P1 Spot 42',
    status: 'Open',
    time: '45 min ago',
    icon: Shield,
    color: 'text-error-600',
    bg: 'bg-error-50',
  },
  {
    id: 'ra5',
    type: 'Announcement',
    title: 'Easter weekend schedule posted',
    status: 'Published',
    time: '1 hr ago',
    icon: Megaphone,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    id: 'ra6',
    type: 'Package',
    title: 'FedEx delivery for Unit 405',
    status: 'Logged',
    time: '1.5 hrs ago',
    icon: Package,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    id: 'ra7',
    type: 'Shift Log',
    title: 'Morning shift started - Guard Patel',
    status: 'Active',
    time: '2 hrs ago',
    icon: Clock,
    color: 'text-info-600',
    bg: 'bg-info-50',
  },
  {
    id: 'ra8',
    type: 'Visitor',
    title: 'Delivery driver signed out',
    status: 'Complete',
    time: '2.5 hrs ago',
    icon: Users,
    color: 'text-success-600',
    bg: 'bg-success-50',
  },
  {
    id: 'ra9',
    type: 'Maintenance',
    title: 'Hallway light replaced - Floor 12',
    status: 'Closed',
    time: '3 hrs ago',
    icon: Wrench,
    color: 'text-warning-600',
    bg: 'bg-warning-50',
  },
  {
    id: 'ra10',
    type: 'Package',
    title: 'UPS bulk delivery (8 packages)',
    status: 'Logged',
    time: '3.5 hrs ago',
    icon: Package,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
];

// ---------------------------------------------------------------------------
// Quick Action Links
// ---------------------------------------------------------------------------

const QUICK_ACTION_LINKS: Record<string, { href: string; icon: LucideIcon }> = {
  'Log Package': { href: '/packages', icon: Package },
  'Sign In Visitor': { href: '/security', icon: Users },
  'Create Maintenance Request': { href: '/maintenance', icon: Wrench },
  'Add Shift Note': { href: '/shift-log', icon: StickyNote },
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
  const buildingHealthScore = 87;

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
              </div>
            </CardContent>
          </Card>

          {/* Weather Widget */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CloudSun className="text-info-500 h-4 w-4" />
                <CardTitle>Weather</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[24px] font-bold text-neutral-900">8&deg;C</p>
                  <p className="text-[13px] text-neutral-500">Partly cloudy</p>
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
          {config.quickActions.map((action) => (
            <button
              key={action}
              type="button"
              className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
            >
              {action}
            </button>
          ))}

          {/* Dedicated quick action buttons */}
          <div className="mx-1 h-auto w-px bg-neutral-200" />
          {Object.entries(QUICK_ACTION_LINKS).map(([label, { href, icon: QAIcon }]) => (
            <Link
              key={label}
              href={href as never}
              className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
            >
              <QAIcon className="h-4 w-4" />
              {label}
            </Link>
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
          <Card padding="none">
            <div className="divide-y divide-neutral-100">
              {MOCK_UPCOMING_TASKS.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        task.priority === 'high'
                          ? 'bg-error-50'
                          : task.priority === 'normal'
                            ? 'bg-warning-50'
                            : 'bg-neutral-100'
                      }`}
                    >
                      <Calendar
                        className={`h-4 w-4 ${
                          task.priority === 'high'
                            ? 'text-error-600'
                            : task.priority === 'normal'
                              ? 'text-warning-600'
                              : 'text-neutral-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{task.title}</p>
                      <p className="text-[12px] text-neutral-500 capitalize">{task.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[13px] font-medium text-neutral-600">{task.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="xl:col-span-2">
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
            <Card padding="none">
              <div className="divide-y divide-neutral-100">
                {MOCK_RECENT_ACTIVITY.map((event) => {
                  const EventIcon = event.icon;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${event.bg}`}
                        >
                          <EventIcon className={`h-4 w-4 ${event.color}`} />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-neutral-900">{event.title}</p>
                          <p className="text-[12px] text-neutral-500">{event.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            event.status === 'Active' || event.status === 'Published'
                              ? 'success'
                              : event.status === 'Open'
                                ? 'warning'
                                : event.status === 'Closed' || event.status === 'Complete'
                                  ? 'default'
                                  : 'info'
                          }
                          size="sm"
                        >
                          {event.status}
                        </Badge>
                        <span className="text-[12px] text-neutral-400">{event.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
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
