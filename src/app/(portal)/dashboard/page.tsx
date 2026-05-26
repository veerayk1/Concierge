'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
// Using <a> tags instead of Next.js Link for demo mode compatibility
import { useAuth } from '@/lib/hooks/use-auth';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncidentWizard } from '@/components/forms/incident-wizard';
import { CreateShiftEntryDialog } from '@/components/forms/create-shift-entry-dialog';
import { CreatePackageDialog } from '@/components/forms/create-package-dialog';
import { CreateVisitorDialog } from '@/components/forms/create-visitor-dialog';
import { ShiftHandoffCard } from '@/components/dashboard/shift-handoff-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiTile } from '@/components/ui/kpi-tile';
import type { Role } from '@/types';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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
  Lock,
  Megaphone,
  Package,
  Plane,
  Shield,
  Sparkles,
  Star,
  StickyNote,
  Thermometer,
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
    kpiCards: ['Resident Count', 'Open Requests', 'Pending Approvals', 'Announcements'],
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

/** Maps a KPI label to the page that lets the user act on it. */
const KPI_DRILL_HREFS: Record<string, string> = {
  'Open Requests': '/maintenance',
  'Unreleased Packages': '/packages',
  'Active Visitors': '/visitors',
  'Expected Visitors': '/visitors',
  Bookings: '/amenities',
  'Resident Count': '/residents',
  'My Packages': '/packages',
  'Upcoming Bookings': '/amenities',
  'Incident Count': '/security',
  'Guard Coverage': '/security',
  'Open Escalations': '/security',
  'Patrol Status': '/security',
  'Keys Out': '/keys',
  'Pending Items': '/shift-log',
  'Assigned Requests': '/maintenance',
  'Equipment Alerts': '/equipment',
  'Scheduled Tasks': '/recurring-tasks',
  'Building Systems': '/equipment',
  "Today's Schedule": '/my-schedule',
  Announcements: '/announcements',
  'Upcoming Events': '/events',
  'Financial Summary': '/reports',
  'Compliance %': '/compliance',
  'Pending Approvals': '/amenities',
  'Satisfaction Score': '/reports',
};

/** Maps a KPI label to a KpiTile accent color */
const KPI_ACCENTS: Record<
  string,
  'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  'Open Requests': 'warning',
  'Unreleased Packages': 'primary',
  'Active Visitors': 'success',
  'Expected Visitors': 'info',
  Bookings: 'info',
  'Resident Count': 'primary',
  'My Packages': 'primary',
  'Upcoming Bookings': 'info',
  'Incident Count': 'error',
  'Guard Coverage': 'primary',
  'Open Escalations': 'warning',
  'Patrol Status': 'success',
  'Keys Out': 'warning',
  'Pending Items': 'warning',
  'Assigned Requests': 'primary',
  'Equipment Alerts': 'error',
  'Scheduled Tasks': 'info',
  'Building Systems': 'primary',
  "Today's Schedule": 'info',
  Announcements: 'primary',
  'Upcoming Events': 'info',
  'Financial Summary': 'success',
  'Compliance %': 'success',
  'Pending Approvals': 'warning',
  'Satisfaction Score': 'primary',
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
    residentCount: number;
    keysOut: number;
    upcomingBookings: number;
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

// Building health visualization: a thin conic ring + label + context line.
// The previous version was a solid coloured square with the number inside,
// which read as a flat warning chip instead of a metric.
function BuildingHealthRing({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const label = getBuildingHealthLabel(score);
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="flex items-center gap-4 py-1">
      <div
        aria-hidden="true"
        className="relative flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${color} 0% ${pct}%, rgba(15,23,42,0.06) ${pct}% 100%)`,
        }}
      >
        <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-white">
          <span
            className="text-[22px] font-semibold tracking-tight text-neutral-900"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {score}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold tracking-[-0.005em]" style={{ color }}>
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: color }}
          />
          {label}
        </div>
        <p className="mt-1.5 text-[12px] leading-snug text-neutral-500">
          Rolling 30-day score across maintenance, safety, and operations.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResidentDashboard — purpose-built layout for residents. Tight, focused on
// "what's mine right now," no fake building-wide AI briefing, no duplicate
// quick action rows.
// ---------------------------------------------------------------------------

interface ResidentDashboardProps {
  name: string;
  greeting: string;
  kpiCards: string[];
  kpiValues: Record<string, string>;
  buildingHealthScore: number | null;
  apiData: {
    kpis?: {
      unreleasedPackages?: number;
      activeVisitors?: number;
      openMaintenanceRequests?: number;
      pendingBookingApprovals?: number;
      upcomingBookings?: number;
    };
    recentActivity?: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      unit?: string;
      timestamp?: string;
      createdAt?: string;
      status?: string;
    }>;
  } | null;
}

interface AnnouncementSummary {
  id: string;
  title: string;
  content?: string | null;
  priority?: string | null;
  status?: string | null;
  isPinned?: boolean;
  requireAcknowledgment?: boolean;
  category?: { id: string; name: string } | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

// ============================================================================
// FrontDeskDashboard
//
// Purpose-built for the concierge persona (Marcus / Emily). One-handed
// operation, 3-second clicks, "what is right in front of me this minute"
// instead of platform-wide ops counts. Sections, top to bottom:
//
//   1. Greeting hero with time-of-day wash + shift handover ribbon
//   2. "Right now at the desk" — 4 live counters (waiting visitors,
//      packages this hour, calls/alerts, keys overdue) that tick up as
//      events come in
//   3. Quick actions — 4 large gradient tiles, each opens a dialog
//      directly on the dashboard (no extra navigation)
//   4. Live feed — newest packages and visitors, side by side
// ============================================================================
interface FrontDeskDashboardProps {
  name: string;
  greeting: string;
  apiData: {
    kpis?: {
      unreleasedPackages?: number;
      activeVisitors?: number;
      openMaintenanceRequests?: number;
      pendingBookingApprovals?: number;
      upcomingBookings?: number;
    };
    recentActivity?: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      unit?: string;
      timestamp?: string;
      createdAt?: string;
      status?: string;
    }>;
  } | null;
}

function FrontDeskDashboard({ name, greeting, apiData }: FrontDeskDashboardProps) {
  const firstName = name.split(' ')[0] || name;
  const router = useRouter();
  // Inline dialog state — open package, visitor, and shift-entry forms
  // straight from the quick-action tiles so the concierge never leaves
  // the dashboard.
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [showVisitorDialog, setShowVisitorDialog] = useState(false);
  const [showShiftEntryDialog, setShowShiftEntryDialog] = useState(false);
  const timeOfDay = getTimeOfDay();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // KPIs the front desk actually cares about right now. The numbers come
  // from the shared property dashboard payload; we just relabel them in
  // human terms.
  const kpis = apiData?.kpis ?? {};
  const unreleasedPackages = kpis.unreleasedPackages ?? 0;
  const activeVisitors = kpis.activeVisitors ?? 0;
  const pendingApprovals = kpis.pendingBookingApprovals ?? 0;
  const openRequests = kpis.openMaintenanceRequests ?? 0;

  // Packages received in the last hour, derived from the unified activity
  // feed. Drops anything older. Used as the headline "What just came
  // through the door" panel.
  const allActivity = (apiData?.recentActivity ?? []).filter((a) => !isTestSeedTitle(a.title));
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const packagesThisHour = allActivity.filter((a) => {
    const isPackage = (a.type || '').toLowerCase().includes('package');
    const ts = new Date(a.createdAt ?? a.timestamp ?? 0).getTime();
    return isPackage && ts >= oneHourAgo;
  });
  const visitorsToday = allActivity
    .filter((a) => {
      const t = (a.type || '').toLowerCase();
      return t.includes('visitor') || t.includes('guest');
    })
    .slice(0, 6);
  const recentPackages = allActivity
    .filter((a) => (a.type || '').toLowerCase().includes('package'))
    .slice(0, 6);

  // Quick actions — every tile opens the canonical create dialog on its
  // own page rather than scrolling through a list to find a "New" button.
  // For now these route to the corresponding module with ?action=new so
  // the page can autoload its dialog — same shorthand the dashboard
  // already uses for /announcements/new → ?create=1.
  const quickActions: {
    label: string;
    sub: string;
    href: string;
    icon: LucideIcon;
    bg: string;
    iconBg: string;
    iconColor: string;
    onClick?: () => void;
  }[] = [
    {
      label: 'Log a package',
      sub: 'Courier just walked in. Two clicks, you are back at the desk.',
      href: '/packages?action=new',
      icon: Package,
      bg: 'from-amber-50 via-white to-orange-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      onClick: () => setShowPackageDialog(true),
    },
    {
      label: 'Sign in a visitor',
      sub: 'Buzzer rang. Name, unit, done.',
      href: '/visitors?action=new',
      icon: Users,
      bg: 'from-sky-50 via-white to-indigo-50',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-700',
      onClick: () => setShowVisitorDialog(true),
    },
    {
      label: 'Issue a key or FOB',
      sub: 'Temp access for the cleaner.',
      href: '/keys?action=new',
      icon: Plane,
      bg: 'from-violet-50 via-white to-fuchsia-50',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-700',
    },
    {
      label: 'Add a shift note',
      sub: 'Pass-on for the next person at the desk.',
      href: '/shift-log?action=new',
      icon: ArrowRight,
      bg: 'from-emerald-50 via-white to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      onClick: () => setShowShiftEntryDialog(true),
    },
  ];

  return (
    <div
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12"
      data-time-of-day={timeOfDay}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Greeting hero — same time-of-day wash the resident dashboard uses  */}
      {/* ----------------------------------------------------------------- */}
      <header
        className="conc-rise relative isolate flex flex-col gap-1.5"
        style={{ animationDelay: '0ms' }}
      >
        <div className="conc-greeting-wash" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-1.5">
          <h1 className="text-[30px] leading-[1.05] font-bold tracking-tight text-neutral-900">
            {greeting}, <span className="text-primary-500">{firstName}.</span>
          </h1>
          <p className="text-[13.5px] text-neutral-500">
            At the front desk <span className="px-1.5 text-neutral-300">·</span> {today}
          </p>
        </div>
      </header>

      {/* Pass-on from the prior shift — pulses if there are flagged items. */}
      <ShiftHandoffCard />

      {/* ----------------------------------------------------------------- */}
      {/* Right now at the desk — live counters                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '120ms' }}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-neutral-900">Right now at the desk</h2>
          <span className="text-[11.5px] tracking-[0.06em] text-neutral-400 uppercase">
            live · refreshes every minute
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResidentKpi
            label="Visitors on site"
            value={activeVisitors}
            icon={Users}
            href="/visitors"
            tone={activeVisitors > 0 ? 'info' : 'neutral'}
            caption={
              activeVisitors > 0
                ? `${activeVisitors} guest${activeVisitors === 1 ? '' : 's'} signed in`
                : 'Lobby is quiet.'
            }
          />
          <ResidentKpi
            label="Packages this hour"
            value={packagesThisHour.length}
            icon={Package}
            href="/packages?filter=unreleased"
            tone={packagesThisHour.length > 0 ? 'warning' : 'neutral'}
            caption={
              packagesThisHour.length > 0
                ? 'Notify the residents.'
                : 'No deliveries in the last hour.'
            }
          />
          <ResidentKpi
            label="Open requests"
            value={openRequests}
            icon={Wrench}
            href="/maintenance"
            tone={openRequests > 0 ? 'warning' : 'success'}
            caption={openRequests > 0 ? 'Worth a quick scan.' : 'Nothing waiting on you.'}
          />
          <ResidentKpi
            label="Booking approvals"
            value={pendingApprovals}
            icon={Calendar}
            href="/amenities"
            tone={pendingApprovals > 0 ? 'primary' : 'neutral'}
            caption={
              pendingApprovals > 0
                ? `${pendingApprovals} waiting on a yes/no.`
                : 'No approvals queued.'
            }
          />
        </div>
        {/* Quiet footer cue — unreleased package backlog. Not a primary KPI
            (you can't act on yesterday's package right this second), but
            you want it on the dashboard so it doesn't disappear. */}
        {unreleasedPackages > 0 && (
          <p className="text-[12px] text-neutral-500">
            <span className="font-semibold text-neutral-700">{unreleasedPackages}</span> package
            {unreleasedPackages === 1 ? '' : 's'} still waiting overall —{' '}
            <a
              href="/packages?filter=unreleased"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              clear the backlog →
            </a>
          </p>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Quick actions — big gradient tiles, one-handed                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '200ms' }}>
        <h2 className="text-[15px] font-semibold text-neutral-900">Do something fast</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              onClick={(e) => {
                e.preventDefault();
                const click = (action as { onClick?: () => void }).onClick;
                if (click) click();
                else router.push(action.href as never);
              }}
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md ${action.bg}`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] ${action.iconBg}`}
              >
                <action.icon
                  className={`h-5 w-5 ${action.iconColor}`}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-neutral-900">{action.label}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500">
                  {action.sub}
                </p>
              </div>
              <ArrowRight
                className="absolute top-5 right-5 h-4 w-4 -translate-x-2 text-neutral-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Live feed — packages + visitors side-by-side                        */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="conc-rise grid grid-cols-1 gap-4 lg:grid-cols-2"
        style={{ animationDelay: '280ms' }}
      >
        {/* Packages this shift */}
        <Card padding="none" className="flex flex-col">
          <CardHeader className="border-b border-neutral-100 px-5 pt-5 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle>Packages this shift</CardTitle>
              <a
                href="/packages"
                className="text-primary-600 hover:text-primary-700 text-[12.5px] font-medium"
              >
                All packages →
              </a>
            </div>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">
              Newest first — release with one click
            </p>
          </CardHeader>
          {recentPackages.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {recentPackages.map((p, i) => (
                <li
                  key={p.id ?? i}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 px-5 py-3.5"
                >
                  <Package
                    className="mt-0.5 h-4 w-4 text-amber-500"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">{p.title}</p>
                    {p.unit && <p className="mt-0.5 text-[12px] text-neutral-500">Unit {p.unit}</p>}
                  </div>
                  <span className="text-[11.5px] whitespace-nowrap text-neutral-400">
                    {formatRelativeTimestamp(p.createdAt ?? p.timestamp ?? '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Package className="h-5 w-5 text-amber-500" strokeWidth={1.6} aria-hidden="true" />
              </div>
              <p className="mt-1 text-[14.5px] font-semibold text-neutral-900 italic">
                Nothing came through yet.
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
                When a courier rings, log it here and the resident gets a ping.
              </p>
            </div>
          )}
        </Card>

        {/* Visitors today */}
        <Card padding="none" className="flex flex-col">
          <CardHeader className="border-b border-neutral-100 px-5 pt-5 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle>Visitors today</CardTitle>
              <a
                href="/visitors"
                className="text-primary-600 hover:text-primary-700 text-[12.5px] font-medium"
              >
                All visitors →
              </a>
            </div>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">Signed in or expected</p>
          </CardHeader>
          {visitorsToday.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {visitorsToday.map((v, i) => (
                <li
                  key={v.id ?? i}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 px-5 py-3.5"
                >
                  <Users
                    className="mt-0.5 h-4 w-4 text-sky-500"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">{v.title}</p>
                    {v.unit && <p className="mt-0.5 text-[12px] text-neutral-500">Unit {v.unit}</p>}
                  </div>
                  <span className="text-[11.5px] whitespace-nowrap text-neutral-400">
                    {formatRelativeTimestamp(v.createdAt ?? v.timestamp ?? '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50">
                <Users className="h-5 w-5 text-sky-500" strokeWidth={1.6} aria-hidden="true" />
              </div>
              <p className="mt-1 text-[14.5px] font-semibold text-neutral-900 italic">
                Lobby's been quiet.
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
                Sign someone in the moment they walk through the door.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Inline dialogs — opened from quick-action tiles so the concierge
          never has to leave the dashboard to log a package, sign in a
          visitor, or drop a shift note. */}
      <CreatePackageDialog
        open={showPackageDialog}
        onOpenChange={setShowPackageDialog}
        propertyId={getPropertyId()}
      />
      <CreateVisitorDialog
        open={showVisitorDialog}
        onOpenChange={setShowVisitorDialog}
        propertyId={getPropertyId()}
      />
      <CreateShiftEntryDialog
        open={showShiftEntryDialog}
        onOpenChange={setShowShiftEntryDialog}
        propertyId={getPropertyId()}
      />
    </div>
  );
}

// ============================================================================
// SecurityDashboard
//
// Purpose-built for the security_guard / security_supervisor persona.
// Guards glance at this page on patrol — they need to know in one second:
//   - Are there active incidents I should be on?
//   - Who's currently inside the building (visitor count)?
//   - Are any keys / FOBs out and overdue?
//   - Any recent parking violations to follow up on?
// They don't need package counts, booking approvals, or maintenance queues
// — those are concierge / manager concerns.
// ============================================================================
type SecurityDashboardProps = FrontDeskDashboardProps;

function SecurityDashboard({ name, greeting, apiData }: SecurityDashboardProps) {
  const firstName = name.split(' ')[0] || name;
  const router = useRouter();
  // Inline dialog state — quick-action tiles open the create UI right
  // on the dashboard instead of bouncing to a list page and forcing a
  // second click. Guard never loses context.
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showShiftEntryDialog, setShowShiftEntryDialog] = useState(false);
  const timeOfDay = getTimeOfDay();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const kpis = apiData?.kpis ?? {};
  const activeVisitors = kpis.activeVisitors ?? 0;
  const keysOut = (kpis as { keysOut?: number }).keysOut ?? 0;
  const todayEvents = (kpis as { todayEvents?: number }).todayEvents ?? 0;

  // Pull the activity feed for "recent" incidents / patrol notes / parking
  // violations. We split it three ways: open incidents (red), recent
  // checkouts (amber if overdue), and routine patrol notes (neutral).
  const allActivity = (apiData?.recentActivity ?? []).filter((a) => !isTestSeedTitle(a.title));

  const isIncident = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('incident') || t.includes('alarm') || t.includes('alert');
  };
  const isPatrol = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('patrol') || t.includes('pass-on') || t.includes('note');
  };
  const isParking = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('parking') || t.includes('violation') || t.includes('tow');
  };

  const incidents = allActivity.filter((a) => isIncident(a.type));
  const activeIncidents = incidents.filter(
    (a) =>
      (a.status || '').toLowerCase() !== 'resolved' && (a.status || '').toLowerCase() !== 'closed',
  );
  const patrols = allActivity.filter((a) => isPatrol(a.type)).slice(0, 5);
  const parkingFeed = allActivity.filter((a) => isParking(a.type)).slice(0, 4);

  const quickActions: {
    label: string;
    sub: string;
    href: string;
    icon: LucideIcon;
    bg: string;
    iconBg: string;
    iconColor: string;
    onClick?: () => void;
  }[] = [
    {
      label: 'Report incident',
      sub: 'Intruder, alarm, anything urgent — get it on the record.',
      href: '/security?action=incident',
      icon: AlertTriangle,
      bg: 'from-rose-50 via-white to-orange-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-700',
      onClick: () => setShowIncidentDialog(true),
    },
    {
      label: 'Log a patrol',
      sub: 'End-of-round note with a stamped timestamp.',
      href: '/shift-log?action=new',
      icon: Activity,
      bg: 'from-emerald-50 via-white to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      onClick: () => setShowShiftEntryDialog(true),
    },
    {
      label: 'Issue a FOB or key',
      sub: 'Temp access for the cleaner, contractor, or guest.',
      href: '/keys?action=new',
      icon: Plane,
      bg: 'from-violet-50 via-white to-fuchsia-50',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-700',
    },
    {
      label: 'Parking violation',
      sub: 'Photo + plate. The form fills in the rest.',
      href: '/parking?action=violation',
      icon: Package,
      bg: 'from-amber-50 via-white to-orange-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
    },
  ];

  return (
    <div
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-12"
      data-time-of-day={timeOfDay}
    >
      {/* Greeting hero */}
      <header
        className="conc-rise relative isolate flex flex-col gap-1.5"
        style={{ animationDelay: '0ms' }}
      >
        <div className="conc-greeting-wash" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-1.5">
          <h1 className="text-[30px] leading-[1.05] font-bold tracking-tight text-neutral-900">
            {greeting}, <span className="text-primary-500">{firstName}.</span>
          </h1>
          <p className="text-[13.5px] text-neutral-500">
            On security duty <span className="px-1.5 text-neutral-300">·</span> {today}
          </p>
        </div>
      </header>

      {/* Pass-on from the prior shift — pulses if items need follow-up. */}
      <ShiftHandoffCard />

      {/* ACTIVE INCIDENT BANNER — red, pulsing, the loudest thing on the
          page when there's anything open. Guard cannot miss this. */}
      {activeIncidents.length > 0 && (
        <section
          className="conc-rise relative"
          style={{ animationDelay: '60ms' }}
          aria-label="Active incident"
        >
          <a
            href={`/security?id=${activeIncidents[0]?.id ?? ''}`}
            className="conc-spotlight block overflow-hidden rounded-2xl border border-rose-300 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-5 py-4 transition-transform hover:scale-[1.005]"
            style={{
              // Override the .conc-spotlight amber pulse to a red pulse for
              // genuine urgency. Inline so it doesn't bleed to other
              // spotlights elsewhere in the app.
              animationName: 'concSpotlight',
            }}
          >
            <div className="relative flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-rose-300/60 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5 text-rose-600" strokeWidth={1.9} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold tracking-[0.1em] text-rose-700 uppercase">
                    Active incident
                  </span>
                  {activeIncidents.length > 1 && (
                    <span className="text-[11.5px] text-rose-700/80">
                      · +{activeIncidents.length - 1} more open
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-[16px] font-semibold text-neutral-900">
                  {activeIncidents[0]?.title}
                </h3>
                {activeIncidents[0]?.unit && (
                  <p className="mt-0.5 text-[12.5px] text-neutral-600">
                    Unit {activeIncidents[0]?.unit}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1 self-center text-[12.5px] font-semibold text-rose-700">
                Open it
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </a>
        </section>
      )}

      {/* "On post right now" — four glanceable counters */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '120ms' }}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-neutral-900">On post right now</h2>
          <span className="text-[11.5px] tracking-[0.06em] text-neutral-400 uppercase">
            refreshes every minute
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResidentKpi
            label="Active incidents"
            value={activeIncidents.length}
            icon={AlertTriangle}
            href="/security"
            tone={activeIncidents.length > 0 ? 'warning' : 'success'}
            caption={
              activeIncidents.length > 0
                ? activeIncidents.length === 1
                  ? 'One open. Get on it.'
                  : `${activeIncidents.length} open right now.`
                : 'All clear.'
            }
          />
          <ResidentKpi
            label="People in building"
            value={activeVisitors}
            icon={Users}
            href="/visitors"
            tone={activeVisitors > 0 ? 'info' : 'neutral'}
            caption={
              activeVisitors > 0
                ? `${activeVisitors} guest${activeVisitors === 1 ? '' : 's'} signed in.`
                : 'Lobby is quiet.'
            }
          />
          <ResidentKpi
            label="Keys / FOBs out"
            value={keysOut}
            icon={Plane}
            href="/keys"
            tone={keysOut > 0 ? 'warning' : 'neutral'}
            caption={keysOut > 0 ? 'Check none are overdue for return.' : 'Nothing checked out.'}
          />
          <ResidentKpi
            label="Events today"
            value={todayEvents}
            icon={Calendar}
            href="/events"
            tone="neutral"
            caption={
              todayEvents > 0 ? 'Heads up — extra foot traffic.' : 'No building events on calendar.'
            }
          />
        </div>
      </section>

      {/* Quick actions — distinct from concierge: report incident is the
          big red one, not a beige administrative tile. */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '200ms' }}>
        <h2 className="text-[15px] font-semibold text-neutral-900">Do something fast</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              onClick={(e) => {
                e.preventDefault();
                const click = (action as { onClick?: () => void }).onClick;
                if (click) click();
                else router.push(action.href as never);
              }}
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md ${action.bg}`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] ${action.iconBg}`}
              >
                <action.icon
                  className={`h-5 w-5 ${action.iconColor}`}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-neutral-900">{action.label}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500">
                  {action.sub}
                </p>
              </div>
              <ArrowRight
                className="absolute top-5 right-5 h-4 w-4 -translate-x-2 text-neutral-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </section>

      {/* Recent patrol notes + parking — two side-by-side cards */}
      <section
        className="conc-rise grid grid-cols-1 gap-4 lg:grid-cols-2"
        style={{ animationDelay: '280ms' }}
      >
        <Card padding="none" className="flex flex-col">
          <CardHeader className="border-b border-neutral-100 px-5 pt-5 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle>Latest patrol notes</CardTitle>
              <a
                href="/shift-log"
                className="text-primary-600 hover:text-primary-700 text-[12.5px] font-medium"
              >
                Open shift log →
              </a>
            </div>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">
              Newest first — from this shift and the last
            </p>
          </CardHeader>
          {patrols.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {patrols.map((p, i) => (
                <li
                  key={p.id ?? i}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 px-5 py-3.5"
                >
                  <Activity
                    className="mt-0.5 h-4 w-4 text-emerald-500"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">{p.title}</p>
                    {p.unit && <p className="mt-0.5 text-[12px] text-neutral-500">Unit {p.unit}</p>}
                  </div>
                  <span className="text-[11.5px] whitespace-nowrap text-neutral-400">
                    {formatRelativeTimestamp(p.createdAt ?? p.timestamp ?? '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <Activity
                  className="h-5 w-5 text-emerald-500"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[14.5px] font-semibold text-neutral-900 italic">
                Quiet shift so far.
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
                Log a patrol after your next round and it shows up here.
              </p>
            </div>
          )}
        </Card>

        <Card padding="none" className="flex flex-col">
          <CardHeader className="border-b border-neutral-100 px-5 pt-5 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <CardTitle>Parking activity</CardTitle>
              <a
                href="/parking"
                className="text-primary-600 hover:text-primary-700 text-[12.5px] font-medium"
              >
                All parking →
              </a>
            </div>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">Recent violations + tow notes</p>
          </CardHeader>
          {parkingFeed.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {parkingFeed.map((p, i) => (
                <li
                  key={p.id ?? i}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 px-5 py-3.5"
                >
                  <Package
                    className="mt-0.5 h-4 w-4 text-amber-500"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">{p.title}</p>
                    {p.unit && <p className="mt-0.5 text-[12px] text-neutral-500">Unit {p.unit}</p>}
                  </div>
                  <span className="text-[11.5px] whitespace-nowrap text-neutral-400">
                    {formatRelativeTimestamp(p.createdAt ?? p.timestamp ?? '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Package className="h-5 w-5 text-amber-500" strokeWidth={1.6} aria-hidden="true" />
              </div>
              <p className="mt-1 text-[14.5px] font-semibold text-neutral-900 italic">
                No parking issues today.
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
                Any vehicle in the wrong spot? Snap a photo and log it.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Inline dialogs — opened directly by the quick-action tiles so the
          guard never leaves the dashboard. */}
      <IncidentWizard
        open={showIncidentDialog}
        onOpenChange={setShowIncidentDialog}
        propertyId={getPropertyId()}
      />
      <CreateShiftEntryDialog
        open={showShiftEntryDialog}
        onOpenChange={setShowShiftEntryDialog}
        propertyId={getPropertyId()}
      />
    </div>
  );
}

function ResidentDashboard({ name, greeting, apiData }: ResidentDashboardProps) {
  const firstName = name.split(' ')[0] || name;

  // Long, readable date — "Sunday, May 25" reads warmer than "May 25, 2026".
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Pinned/recent announcements for the "From management" section.
  // The dashboard payload only returns a count of unread, so we fetch
  // titles + bodies separately rather than bloating every dashboard call.
  const { data: annData } = useApi<AnnouncementSummary[]>(
    apiUrl('/api/v1/announcements', {
      propertyId: getPropertyId(),
      status: 'published',
      limit: '3',
    }),
  );
  const announcements: AnnouncementSummary[] = useMemo(() => {
    if (!annData) return [];
    const list = Array.isArray(annData) ? annData : [];
    return list.filter((a) => !isTestSeedTitle(a.title)).slice(0, 3);
  }, [annData]);

  // Resident-scoped KPI sources.
  //
  // The shared /api/v1/dashboard route is intended to scope by occupancy
  // unit, but in the demo it has been observed to leak building-wide
  // counts (15 packages, 26 requests) into a resident's view. The
  // dedicated /api/v1/resident/* endpoints are guaranteed unit-scoped
  // and they are the same endpoints the matching detail pages render,
  // so the dashboard numbers match what the resident sees when they
  // click through.
  const propertyId = getPropertyId();
  const { data: residentPkgData } = useApi<unknown>(
    apiUrl('/api/v1/resident/packages', { propertyId, status: 'unreleased' }),
  );
  const { data: residentMaintData } = useApi<unknown>(
    apiUrl('/api/v1/resident/maintenance', { propertyId }),
  );
  const { data: residentBookingsData } = useApi<unknown>(
    apiUrl('/api/v1/resident/bookings', { propertyId }),
  );

  // Split the unified activity feed into past (Recent activity) and
  // future (Coming up). Each item carries its own timestamp.
  //
  // We also strip entries whose titles are obviously seed/test data —
  // anything starting with EXH-C:, UI-CHAIN, CHAIN-E, QA-TEST,
  // WRITE-MATRIX, SEC-, etc. A resident should never see "EXH-C: Work
  // Order test event" on their own dashboard.
  const allActivity = (apiData?.recentActivity ?? []).filter((a) => !isTestSeedTitle(a.title));
  const nowMs = Date.now();
  const getTime = (a: { timestamp?: string; createdAt?: string }) =>
    new Date(a.createdAt ?? a.timestamp ?? 0).getTime();
  const recentActivity = allActivity.filter((a) => getTime(a) <= nowMs).slice(0, 6);
  const upcomingItems = allActivity.filter((a) => getTime(a) > nowMs).slice(0, 5);

  // KPI counts come from the unit-scoped resident endpoints above (not
  // the shared dashboard endpoint, which has been leaking building-wide
  // totals to residents). Each list is also filtered for seed/test data
  // so demo dashboards don't surface "QA-TEST: brown box 30x20".
  const extractList = (raw: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
    if (raw && typeof raw === 'object' && 'data' in raw) {
      const inner = (raw as { data?: unknown }).data;
      if (Array.isArray(inner)) return inner as Array<Record<string, unknown>>;
    }
    return [];
  };

  const residentPkgs = extractList(residentPkgData).filter(
    (p) => !isTestSeedTitle(String(p.description ?? '')),
  );
  const pkgCount = residentPkgs.length;

  const residentMaint = extractList(residentMaintData).filter((m) => {
    const status = String(m.status ?? '').toLowerCase();
    if (status === 'closed' || status === 'completed' || status === 'cancelled') return false;
    return !isTestSeedTitle(String(m.title ?? m.description ?? ''));
  });
  const reqCount = residentMaint.length;

  const residentBookingsAll = extractList(residentBookingsData);
  // Compare against midnight at the start of today (local time). The
  // amenity bookings API stores start-of-day timestamps in startDate,
  // so a booking scheduled for "today" should still count as upcoming.
  const nowForBookings = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const residentBookings = residentBookingsAll.filter((b) => {
    const status = String(b.status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'rejected') return false;
    // The API exposes both `startDate` (yyyy-mm-ddT00:00:00Z, the actual
    // calendar day) and `startTime` (Unix epoch with just the
    // time-of-day component — 1970-01-01THH:MM:00Z). Prior code read
    // startTime first, which always evaluated to Jan 1 1970 and made
    // every upcoming reservation look like it was in the past.
    // Prefer startDate.
    const start = b.startDate ?? b.startDatetime ?? b.startTime;
    if (!start) return false;
    return new Date(String(start)).getTime() >= nowForBookings;
  });
  const bookingCount = residentBookings.length;

  // We don't yet have a resident-scoped visitors endpoint — the staff
  // /api/v1/visitors route is intentionally gated. Until we add a
  // per-unit endpoint, show a graceful em-dash with an honest caption
  // rather than the leaked building-wide count.
  const visitorCount: number | null = null;

  // Quick actions are the verbs a resident actually does today. We only
  // surface actions that route to features we have actually built.
  // Each quick action carries its own colour palette so the card grid
  // feels like four distinct affordances instead of four identical white
  // twins. Palette pairs (bg, ring, icon) are soft so the page still
  // reads as restrained — these are warm accents, not loud chips.
  const quickActions: {
    label: string;
    sub: string;
    href: string;
    icon: LucideIcon;
    bg: string;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      label: 'Book an amenity',
      sub: 'Pool, sauna, party room.',
      href: '/amenity-booking',
      icon: Calendar,
      bg: 'from-sky-50 via-white to-white',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      label: 'Submit a request',
      sub: 'Maintenance, plumbing, more.',
      href: '/my-requests',
      icon: Wrench,
      bg: 'from-emerald-50 via-white to-white',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'View packages',
      sub: 'See what is waiting for you.',
      href: '/my-packages',
      icon: Package,
      bg: 'from-amber-50 via-white to-white',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
    },
    {
      label: 'Set vacation dates',
      sub: 'Let staff know you are away.',
      href: '/residents/vacations',
      icon: Plane,
      bg: 'from-violet-50 via-white to-white',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
  ];

  // The greeting block sits over a soft radial wash that shifts colour
  // based on the time of day — peach at sunrise, soft sky during the
  // day, warm gold at sunset, dusky violet at night. The wash is muted
  // (low alpha + blur) so the H1 stays crisp; it just adds ambient
  // warmth instead of the page reading as bone-white.
  const timeOfDay = getTimeOfDay();

  return (
    <div
      className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 pb-12"
      data-time-of-day={timeOfDay}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Greeting hero                                                       */}
      {/* ----------------------------------------------------------------- */}
      <header
        className="conc-rise relative isolate flex flex-col gap-1.5"
        style={{ animationDelay: '0ms' }}
      >
        <div className="conc-greeting-wash" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-1.5">
          <h1 className="text-[30px] leading-[1.05] font-bold tracking-tight text-neutral-900">
            {greeting}, <span className="text-primary-500">{firstName}.</span>
          </h1>
          <p className="text-[13.5px] text-neutral-500">
            Your dashboard <span className="px-1.5 text-neutral-300">·</span> {today}
          </p>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Spotlight — top pinned/high-priority unread notice. Pulses gently  */}
      {/* until the resident clicks through; the click marks it seen and    */}
      {/* the pulse stops on the next render.                                */}
      {/* ----------------------------------------------------------------- */}
      <SpotlightBanner announcements={announcements} />

      {/* ----------------------------------------------------------------- */}
      {/* From management — what the desk needs you to know, first          */}
      {/* ----------------------------------------------------------------- */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '120ms' }}>
        {/* On narrow viewports the heading, count, and link were all
            competing for one row, forcing "From management" to wrap onto
            two lines. Wrap the right-side link on small screens. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[15px] font-semibold whitespace-nowrap text-neutral-900">
              From management
            </h2>
            {announcements.length > 0 && (
              <span className="text-[12px] whitespace-nowrap text-neutral-400">
                {announcements.length} active notice{announcements.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <a
            href="/announcements"
            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-[12.5px] font-medium whitespace-nowrap"
          >
            All announcements
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {announcements.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <ul className="divide-y divide-neutral-100">
              {announcements.map((ann, i) => (
                <li
                  key={ann.id ?? i}
                  className={`grid grid-cols-[40px_1fr_auto] items-start gap-4 px-5 py-4 ${
                    ann.isPinned ? 'bg-primary-50/40' : ''
                  }`}
                >
                  {/* Category icon */}
                  <div className="pt-0.5">{iconForAnnouncement(ann)}</div>

                  {/* Tags + title + body */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {ann.isPinned && (
                        <span className="text-primary-600 inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                          <Star
                            className="fill-primary-500 stroke-primary-500 h-3 w-3"
                            aria-hidden="true"
                          />
                          Pinned
                        </span>
                      )}
                      {ann.category?.name && (
                        <span className="text-[10.5px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
                          {ann.isPinned ? '·' : ''} {ann.category.name}
                        </span>
                      )}
                      {ann.requireAcknowledgment && (
                        <span className="text-warning-600 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                          · Action required
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-[15px] font-semibold text-neutral-900">{ann.title}</h3>
                    {ann.content && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                        {stripHtml(ann.content)}
                      </p>
                    )}
                  </div>

                  {/* Date column */}
                  <div className="flex flex-col items-end pt-1 text-right whitespace-nowrap">
                    <span className="text-[14px] font-semibold text-neutral-900">
                      {formatAnnouncementDate(ann.expiresAt ?? ann.publishedAt)}
                    </span>
                    <span className="text-[11.5px] text-neutral-400">
                      {formatAnnouncementRelative(ann.expiresAt ?? ann.publishedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 px-6 py-10 text-center">
            <div className="bg-primary-50 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle2 className="text-primary-500 h-5 w-5" strokeWidth={1.6} />
            </div>
            <p className="text-[14.5px] font-semibold text-neutral-900 italic">
              All quiet from the desk.
            </p>
            <p className="max-w-md text-[12.5px] leading-relaxed text-neutral-500">
              There are no active notices from management right now. Anything that needs your
              attention will land here first.
            </p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Today, at a glance — 4 KPI tiles with rich subtext + count-up      */}
      {/* ----------------------------------------------------------------- */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '200ms' }}>
        <h2 className="text-[15px] font-semibold text-neutral-900">Today, at a glance</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResidentKpi
            label="My packages"
            value={pkgCount}
            icon={Package}
            href="/my-packages"
            tone={pkgCount > 0 ? 'primary' : 'neutral'}
            caption={pkgCount > 0 ? 'Ready for pickup at the front desk' : 'Nothing waiting'}
          />
          <ResidentKpi
            label="Visitors today"
            value={visitorCount}
            icon={Users}
            tone="neutral"
            caption="No one expected"
          />
          <ResidentKpi
            label="My requests"
            value={reqCount}
            icon={Wrench}
            href="/my-requests"
            tone={reqCount > 0 ? 'warning' : 'success'}
            caption={reqCount > 0 ? 'In progress' : 'All caught up'}
          />
          <ResidentKpi
            label="Bookings"
            value={bookingCount}
            icon={Calendar}
            href="/amenity-booking"
            tone={bookingCount > 0 ? 'primary' : 'neutral'}
            caption={
              bookingCount > 0
                ? bookingCount === 1
                  ? 'Next reservation ahead'
                  : `${bookingCount} reservations ahead`
                : 'Book the pool, sauna, party room…'
            }
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Quick actions — verbs the resident actually does                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="conc-rise flex flex-col gap-3" style={{ animationDelay: '280ms' }}>
        <h2 className="text-[15px] font-semibold text-neutral-900">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md ${action.bg}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] ${action.iconBg}`}
              >
                <action.icon
                  className={`h-5 w-5 ${action.iconColor}`}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[14.5px] font-semibold text-neutral-900">{action.label}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{action.sub}</p>
              </div>
              {/* Hover arrow — fades in from the right edge. Subtle
                  affordance that this card is interactive. */}
              <ArrowRight
                className="absolute top-5 right-5 h-4 w-4 -translate-x-2 text-neutral-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Recent activity + Coming up                                        */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="conc-rise grid grid-cols-1 gap-4 lg:grid-cols-2"
        style={{ animationDelay: '360ms' }}
      >
        {/* Recent activity */}
        <Card padding="none" className="flex flex-col">
          <CardHeader className="border-b border-neutral-100 px-5 pt-5 pb-3">
            <CardTitle>Recent activity</CardTitle>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">
              Things touching your unit, last 7 days
            </p>
          </CardHeader>
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {recentActivity.map((a, i) => (
                <li
                  key={a.id ?? i}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 px-5 py-3.5"
                >
                  <span className="mt-0.5">{iconForActivity(a.type)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">{a.title}</p>
                    {a.unit && (
                      <p className="mt-0.5 truncate text-[12px] text-neutral-500">Unit {a.unit}</p>
                    )}
                  </div>
                  <span className="text-[11.5px] whitespace-nowrap text-neutral-400">
                    {formatRelativeTimestamp(a.createdAt ?? a.timestamp ?? '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
                <Activity className="h-5 w-5 text-neutral-400" strokeWidth={1.6} />
              </div>
              <p className="mt-1 text-[14.5px] font-semibold text-neutral-900 italic">
                A quiet week.
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
                No packages, visitors, or requests in the last seven days. Activity will appear here
                as it happens.
              </p>
            </div>
          )}
        </Card>

        {/* Coming up */}
        <Card padding="none" className="flex flex-col">
          <CardHeader className="border-b border-neutral-100 px-5 pt-5 pb-3">
            <CardTitle>Coming up</CardTitle>
            <p className="mt-0.5 text-[11.5px] text-neutral-400">
              Bookings, deliveries, building events
            </p>
          </CardHeader>
          {upcomingItems.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {upcomingItems.map((a, i) => (
                <li
                  key={a.id ?? i}
                  className="grid grid-cols-[52px_1fr] items-start gap-3 px-5 py-3.5"
                >
                  <DateChip iso={a.createdAt ?? a.timestamp ?? ''} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-neutral-900">{a.title}</p>
                    <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                      {formatRelativeTimestamp(a.createdAt ?? a.timestamp ?? '')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
                <Calendar className="h-5 w-5 text-neutral-400" strokeWidth={1.6} />
              </div>
              <p className="mt-1 text-[14.5px] font-semibold text-neutral-900 italic">
                Nothing on the horizon.
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-neutral-500">
                You have no upcoming bookings or building events. The pool is yours to claim.
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resident dashboard helpers
// ---------------------------------------------------------------------------

// Test/seed-data prefixes and substrings that show up in the demo
// ---------------------------------------------------------------------------
// getTimeOfDay — picks a colour palette key for the greeting wash.
// 5–9am = sunrise (peach), 9am–5pm = day (sky blue), 5–8pm = golden
// (gold/pink), otherwise evening (dusky violet). Driven by local time so
// it always feels right for the resident, not the server.
// ---------------------------------------------------------------------------
function getTimeOfDay(): 'sunrise' | 'day' | 'golden' | 'evening' {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return 'sunrise';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'golden';
  return 'evening';
}

// ---------------------------------------------------------------------------
// SpotlightBanner — animated, attention-getting card that surfaces the top
// unread high-priority announcement. Pulses (via .conc-spotlight CSS) until
// the resident clicks through. Acknowledgement persists in localStorage so
// the same notice doesn't keep nagging the user across reloads, but a new
// urgent notice will surface immediately.
// ---------------------------------------------------------------------------
function SpotlightBanner({ announcements }: { announcements: AnnouncementSummary[] }) {
  const router = useRouter();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  // Hydrate dismissed list once on mount — we can't read localStorage during
  // render (SSR mismatch), so we wait for the client to take over.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('concierge:spotlightDismissed');
      if (raw) setDismissedIds(new Set(JSON.parse(raw)));
    } catch {
      // localStorage unavailable / parse failure — show banner normally.
    }
  }, []);

  // Pick the first announcement that:
  //   - is urgent or important priority, OR isPinned, OR requireAcknowledgment
  //   - has not been dismissed
  // Falls back to the first announcement at all if nothing matches the
  // priority filter — keeps the spotlight pattern visible in the demo even
  // when seed data has no high-priority items.
  const candidate = useMemo(() => {
    const isHighPriority = (a: AnnouncementSummary) =>
      Boolean(a.requireAcknowledgment) ||
      a.isPinned === true ||
      (a.priority || '').toLowerCase() === 'urgent' ||
      (a.priority || '').toLowerCase() === 'high';

    const unread = announcements.filter((a) => !!a.id && !dismissedIds.has(a.id));
    return unread.find(isHighPriority) ?? unread[0] ?? null;
  }, [announcements, dismissedIds]);

  if (!candidate) return null;

  const dismiss = (navigate: boolean) => {
    if (!candidate.id) return;
    const next = new Set(dismissedIds);
    next.add(candidate.id);
    setDismissedIds(next);
    try {
      window.localStorage.setItem('concierge:spotlightDismissed', JSON.stringify(Array.from(next)));
    } catch {
      // ignore — dismissal is best-effort.
    }
    if (navigate) router.push(`/announcements/${candidate.id}` as never);
  };

  const isUrgent =
    (candidate.priority || '').toLowerCase() === 'urgent' ||
    candidate.requireAcknowledgment === true;

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '60ms' }}
      aria-label="Heads up"
    >
      <button
        type="button"
        onClick={() => dismiss(true)}
        className="conc-spotlight relative block w-full overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-5 py-4 text-left transition-transform hover:scale-[1.005] active:scale-[0.998]"
      >
        {/* Decorative gradient swatch in the corner — adds depth without
            stealing focus from the message. */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-rose-300/20 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-amber-200/60 backdrop-blur-sm">
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={1.8} />
            ) : (
              <Star
                className="h-5 w-5 fill-amber-500 text-amber-500"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-amber-700 uppercase">
                {isUrgent ? 'Heads up' : 'Worth knowing'}
              </span>
              {candidate.publishedAt && (
                <span className="text-[11.5px] text-amber-700/70">
                  · {formatAnnouncementRelative(candidate.publishedAt)}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-[16px] font-semibold text-neutral-900">{candidate.title}</h3>
            {candidate.content && (
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-700">
                {stripHtml(candidate.content)}
              </p>
            )}
          </div>
          <div className="hidden flex-shrink-0 items-center gap-1 self-center text-[12.5px] font-semibold text-amber-700 sm:flex">
            Got it
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// useCountUp — tick a number from 0 up to `value` over `duration` ms,
// using requestAnimationFrame for smooth 60fps. Used by ResidentKpi to give
// the dashboard a small "comes alive" moment on first paint instead of
// numbers just popping in.
// ---------------------------------------------------------------------------
function useCountUp(value: number, duration = 600): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplay(value);
      return;
    }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || value === 0) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    let rafId = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);
  return display;
}

// database. A real resident should never see "EXH-C: Work Order test
// event" or "QA Test: Elevator Maintenance Notice" on their dashboard.
// Kept in sync with the same patterns in /my-packages, /my-requests, and
// /announcements list pages. If you add a prefix here, add it there too —
// otherwise the dashboard KPI count diverges from the actual page (e.g.
// "My Requests 2" on the dashboard while /my-requests shows 1 because
// UX-NNN was filtered there but not here).
const TEST_TITLE_PATTERN =
  /^(EXH[-_]?[A-Z]+|UI[-_]?CHAIN|UI[-_]?TASK|CHAIN[-_]?[A-Z]|QA[-_ ]?(TEST|[A-Z]+:|TOWER)|QA TEST|UX[-_]?\d+|WRITE[-_]?MATRIX|SEC[-_]?\d+|TEST[-_ ]?|FBSNCK|VERIFY[-_ ]?|TC[-_]?\d+|E2E[-_ ]?)/i;

// Common test-data marker substrings that can appear anywhere in a title.
const TEST_SUBSTRING_PATTERN = /\btest (event|notice|announcement|item|run|data|xyz)\b/i;

function isTestSeedTitle(title: string | undefined | null): boolean {
  if (!title) return false;
  const t = title.trim();
  return TEST_TITLE_PATTERN.test(t) || TEST_SUBSTRING_PATTERN.test(t);
}

// Strip HTML markup from announcement bodies. The CMS stores rich text
// with <p>, <strong>, etc. — we only want the readable text on the
// dashboard preview. Also collapses whitespace and trims.
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Resident-tuned KPI tile. Bigger number, top-right icon, tighter caption
// — closer in feel to the inspiration than the shared KpiTile which is
// optimised for staff-side data density.
type ResidentKpiTone = 'primary' | 'info' | 'warning' | 'success' | 'neutral';

const KPI_TONE_VALUE: Record<ResidentKpiTone, string> = {
  primary: 'text-neutral-900',
  info: 'text-neutral-900',
  warning: 'text-neutral-900',
  success: 'text-neutral-900',
  neutral: 'text-neutral-900',
};

const KPI_TONE_ICON: Record<ResidentKpiTone, string> = {
  primary: 'text-primary-500',
  info: 'text-info-500',
  warning: 'text-warning-500',
  success: 'text-success-500',
  neutral: 'text-neutral-300',
};

const KPI_TONE_CAPTION: Record<ResidentKpiTone, string> = {
  primary: 'text-neutral-500',
  info: 'text-neutral-500',
  warning: 'text-neutral-500',
  success: 'text-success-600',
  neutral: 'text-neutral-400',
};

function ResidentKpi({
  label,
  value,
  icon: Icon,
  href,
  tone,
  caption,
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
  href?: string;
  tone: ResidentKpiTone;
  caption: string;
}) {
  // Numbers tick up from 0 to value on first paint so the page feels alive
  // when Alice walks up to it. Falls back to instant render under
  // prefers-reduced-motion or when the value is genuinely unknown (null).
  const animatedValue = useCountUp(value ?? 0);
  // Truly unknown values (e.g. visitors today, until we have a unit-scoped
  // endpoint) render as a calm vertical dash that sits on the cap-height of
  // surrounding numbers rather than a 34px em-dash that visually shouts.
  const display =
    value === null ? (
      <span
        className="inline-block align-middle text-[24px] leading-none font-light text-neutral-300"
        aria-label="not available"
      >
        —
      </span>
    ) : (
      animatedValue.toString()
    );
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10.5px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 flex-shrink-0 ${KPI_TONE_ICON[tone]}`}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
      <div
        className={`mt-3 flex h-[36px] items-end text-[34px] leading-none font-semibold tracking-[-0.02em] ${KPI_TONE_VALUE[tone]}`}
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {display}
      </div>
      <p
        className={`mt-3 line-clamp-2 min-h-[34px] text-[12.5px] leading-snug ${KPI_TONE_CAPTION[tone]}`}
      >
        {caption}
      </p>
    </>
  );

  // Relative + group so we can layer a soft tone-coloured halo behind the
  // KPI value on hover without breaking the icon/label layout. The halo is
  // a low-opacity radial that bleeds out of the top-right corner.
  const haloTone: Record<ResidentKpiTone, string> = {
    primary: 'group-hover:from-primary-100/60',
    info: 'group-hover:from-info-100/60',
    warning: 'group-hover:from-amber-100/70',
    success: 'group-hover:from-emerald-100/60',
    neutral: 'group-hover:from-neutral-100/70',
  };
  const base =
    'group relative block overflow-hidden rounded-2xl border border-neutral-200 bg-white px-5 py-5 transition-all duration-200';
  const halo = (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-transparent to-transparent blur-2xl transition-all duration-300 ${haloTone[tone]}`}
    />
  );
  if (href) {
    return (
      <a
        href={href}
        className={`${base} hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md`}
      >
        {halo}
        <span className="relative">{inner}</span>
      </a>
    );
  }
  return (
    <div className={base}>
      {halo}
      <span className="relative">{inner}</span>
    </div>
  );
}

// Map an announcement to a category icon. Falls back to a megaphone so
// uncategorised notices still render a recognisable affordance.
function iconForAnnouncement(ann: AnnouncementSummary) {
  const isUrgent = (ann.priority || '').toLowerCase() === 'urgent';
  const cat = (ann.category?.name || ann.title || '').toLowerCase();
  let Icon: LucideIcon = Megaphone;
  let tint = 'text-primary-500 bg-primary-50';
  if (isUrgent) {
    Icon = AlertTriangle;
    tint = 'text-error-600 bg-error-50';
  } else if (/parking|garage|vehicle|tow/.test(cat)) {
    Icon = Lock;
  } else if (/hvac|heat|cool|temperature/.test(cat)) {
    Icon = Thermometer;
  } else if (/amenit|pool|gym|sauna|party/.test(cat)) {
    Icon = Clock;
  } else if (/maintenance|repair|service/.test(cat)) {
    Icon = Wrench;
  } else if (/security|incident|emergency/.test(cat)) {
    Icon = Shield;
    tint = 'text-warning-600 bg-warning-50';
  }
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
      <Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
    </div>
  );
}

// Map an activity type to the small leading icon for the timeline row.
function iconForActivity(type: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('package'))
    return <Package className="h-4 w-4 text-neutral-400" strokeWidth={1.7} aria-hidden="true" />;
  if (t.includes('visitor'))
    return <Users className="h-4 w-4 text-neutral-400" strokeWidth={1.7} aria-hidden="true" />;
  if (t.includes('request') || t.includes('maintenance'))
    return <Wrench className="h-4 w-4 text-neutral-400" strokeWidth={1.7} aria-hidden="true" />;
  if (t.includes('booking') || t.includes('amenity'))
    return <Calendar className="h-4 w-4 text-neutral-400" strokeWidth={1.7} aria-hidden="true" />;
  if (t.includes('announcement'))
    return <Megaphone className="h-4 w-4 text-neutral-400" strokeWidth={1.7} aria-hidden="true" />;
  return <CheckCircle2 className="text-success-500 h-4 w-4" strokeWidth={1.7} aria-hidden="true" />;
}

// Short, weekday-prefixed date — "Tue 26".
function formatAnnouncementDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  return `${weekday} ${day}`;
}

// Relative descriptor for the date column — "today", "tomorrow", "in 3 days",
// or empty for anything more than two weeks away (the top "Tue 26" line
// already shows the absolute date, so we don't want to print "Apr 3 / Apr 3").
function formatAnnouncementRelative(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const ms = d.getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1 && days < 14) return `in ${days} days`;
  if (days < -1 && days > -14) return `${Math.abs(days)} days ago`;
  // Older than two weeks — show the year if it's not the current year,
  // otherwise leave the relative line empty (the top line carries the date).
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear ? '' : String(d.getFullYear());
}

// Stacked date chip for the "Coming up" rail — MAY over 26.
function DateChip({ iso }: { iso: string }) {
  if (!iso) {
    return (
      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
        <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">—</span>
      </div>
    );
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return (
    <div className="bg-primary-50 flex h-12 w-12 flex-col items-center justify-center rounded-lg">
      <span className="text-primary-600 text-[9.5px] font-semibold tracking-[0.08em] uppercase">
        {month}
      </span>
      <span className="text-primary-700 text-[16px] leading-none font-bold">{d.getDate()}</span>
    </div>
  );
}

// Small helper — turn an ISO timestamp into "5m / 2h / Yesterday / May 21"
// without dragging in a date library.
function formatRelativeTimestamp(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Support demo mode — read role from localStorage
  const demoRole =
    typeof window !== 'undefined' ? (localStorage.getItem('demo_role') as Role | null) : null;
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
  const resolvedDemoRole = demoRole ? ((ROLE_ALIASES[demoRole] ?? demoRole) as Role) : null;
  const effectiveRole: Role = user?.role ?? resolvedDemoRole ?? 'front_desk';

  // In demo mode (no real auth), fetch the demo user's profile so we can greet
  // them by their actual DB name instead of a hardcoded placeholder.
  const { data: meData } = useApi<{ firstName: string; lastName: string }>(
    !user && resolvedDemoRole ? '/api/v1/users/me' : null,
  );
  const effectiveName =
    user?.firstName ??
    meData?.firstName ??
    (resolvedDemoRole ? (ROLE_DISPLAY_NAMES[effectiveRole] ?? 'User') : 'User');

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

  // Fetch aggregated platform KPIs (active users, subscriptions, health)
  // so the hero tiles show real numbers instead of em-dashes.
  const { data: platformKpis } = useApi<{
    totalProperties: number;
    activeUsers: number;
    activeSubscriptions: number;
    platformHealth: number;
    openCriticalIncidents: number;
  }>(isSuperAdmin ? '/api/v1/system/platform-kpis' : null);

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
      // Prefer the live platform-kpis endpoint (active users +
      // subscriptions + health), fall back to "\u2014" only when that fetch
      // hasn't returned yet. Total Properties / Total Units come from
      // the existing properties fetch so they show instantly.
      return {
        'Total Properties': String(platformKpis?.totalProperties ?? activeProps.length),
        'Total Users': platformKpis ? String(platformKpis.activeUsers) : '\u2014',
        'Active Users': platformKpis ? String(platformKpis.activeUsers) : '\u2014',
        'Platform Health': platformKpis ? `${platformKpis.platformHealth}%` : '\u2014',
        'Active Subscriptions': platformKpis ? String(platformKpis.activeSubscriptions) : '\u2014',
        'AI Spend': '\u2014',
        'Total Units': totalUnits.toLocaleString('en-US'),
      };
    }

    if (!apiData?.kpis) return {} as Record<string, string>;
    const k = apiData.kpis;
    const map: Record<string, string> = {
      'Unreleased Packages': String(k.unreleasedPackages),
      'Open Requests': String(k.openMaintenanceRequests),
      'Active Visitors': String(k.activeVisitors),
      'Resident Count': String(k.residentCount ?? 0),
      'Active Users': '\u2014',
      'Total Properties': '1',
      'My Packages': String(k.unreleasedPackages),
      'Assigned Requests': String(k.openMaintenanceRequests),
      'Pending Items': String(k.pendingBookingApprovals),
      'Pending Approvals': String(k.pendingBookingApprovals),
      'Expected Visitors': String(k.activeVisitors),
      Bookings: String(k.pendingBookingApprovals),
      Announcements: String(k.unreadAnnouncements),
      'Incident Count': String(k.todayEvents),
      'Scheduled Tasks': upcomingTasksData ? String(upcomingTasksData.length) : '\u2014',
      'Equipment Alerts': String(k.overdueMaintenanceRequests),
      'Keys Out': String(k.keysOut ?? 0),
      'Upcoming Bookings': String(k.upcomingBookings ?? 0),
    };
    return map;
  }, [apiData, upcomingTasksData, isSuperAdmin, platformProperties, platformKpis]);

  // Fetch real AI analytics for building health score (skip for super_admin)
  // NOTE: This hook MUST be called before any early returns to satisfy Rules of Hooks
  const { data: aiAnalytics } = useApi<{
    healthScore: number | null;
    trend: string;
    factors: { name: string; score: number; weight: number }[];
  }>(!isSuperAdmin ? apiUrl('/api/v1/ai/analytics', { propertyId: getPropertyId() }) : null);

  const buildingHealthScore = aiAnalytics?.healthScore ?? null;

  if (loading && !demoRole) {
    return <DashboardSkeleton />;
  }

  const config = DASHBOARD_CONFIGS[effectiveRole] ?? DASHBOARD_CONFIGS['front_desk'];
  const greeting = getGreeting();

  // -------------------------------------------------------------------------
  // Super Admin — Platform-level dashboard
  // -------------------------------------------------------------------------
  if (isSuperAdmin) {
    const props = Array.isArray(platformProperties) ? platformProperties : [];
    const inactiveProps = props.filter((p) => !p.isActive);
    const noUnitProps = props.filter((p) => (p.unitCount || 0) === 0);
    const criticalIncidents = platformKpis?.openCriticalIncidents ?? 0;
    const needsAttention: {
      id: string;
      label: string;
      href: string;
      tone: 'error' | 'warning' | 'info';
    }[] = [];
    if (criticalIncidents > 0) {
      needsAttention.push({
        id: 'crit',
        label: `${criticalIncidents} open critical incident${criticalIncidents === 1 ? '' : 's'}`,
        href: '/system/health',
        tone: 'error',
      });
    }
    if (inactiveProps.length > 0) {
      needsAttention.push({
        id: 'inactive',
        label: `${inactiveProps.length} inactive propert${inactiveProps.length === 1 ? 'y' : 'ies'}`,
        href: '/system/properties',
        tone: 'warning',
      });
    }
    if (noUnitProps.length > 0) {
      needsAttention.push({
        id: 'no-units',
        label: `${noUnitProps.length} propert${noUnitProps.length === 1 ? 'y has' : 'ies have'} no units configured`,
        href: '/system/properties',
        tone: 'warning',
      });
    }

    return (
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
              {greeting}, {effectiveName}
            </h1>
            <p className="mt-0.5 text-[14px] text-neutral-500">
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

        {/* Platform KPI tiles — compact, clickable, drill into the source list */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            label="Total Properties"
            value={kpiValues['Total Properties'] ?? '\u2014'}
            icon={Building2}
            accent="primary"
            href="/system/properties"
            caption={`${kpiValues['Total Units'] ?? '\u2014'} units across portfolio`}
          />
          <KpiTile
            label="Active Users"
            value={kpiValues['Active Users'] ?? '\u2014'}
            icon={Users}
            accent="success"
            href="/users"
          />
          <KpiTile
            label="Platform Health"
            value={kpiValues['Platform Health'] ?? '\u2014'}
            icon={Activity}
            accent={
              platformKpis && platformKpis.platformHealth >= 80
                ? 'success'
                : platformKpis && platformKpis.platformHealth >= 60
                  ? 'warning'
                  : 'error'
            }
            href="/system/health"
            caption={
              criticalIncidents > 0
                ? `${criticalIncidents} critical incident${criticalIncidents === 1 ? '' : 's'} open`
                : 'All systems nominal'
            }
          />
          <KpiTile
            label="Active Subscriptions"
            value={kpiValues['Active Subscriptions'] ?? '\u2014'}
            icon={CreditCard}
            accent="info"
            href="/system/billing"
          />
        </div>

        {/* Needs Attention + Quick navigation — two-column work surface */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-warning-500 h-4 w-4" />
                <CardTitle>Needs your attention</CardTitle>
              </div>
              {needsAttention.length > 0 ? (
                <Badge variant="warning" size="sm">
                  {needsAttention.length}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {needsAttention.length === 0 ? (
                <div className="border-success-100 bg-success-50/40 flex items-center gap-3 rounded-xl border px-4 py-3">
                  <CheckCircle2 className="text-success-500 h-5 w-5 flex-none" />
                  <p className="text-success-700 text-[14px] font-medium">
                    Nothing requires action right now.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-neutral-100">
                  {needsAttention.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className="group flex items-center justify-between gap-3 py-3 transition-colors hover:text-neutral-900"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={
                              item.tone === 'error'
                                ? 'bg-error-500 h-2 w-2 rounded-full'
                                : item.tone === 'warning'
                                  ? 'bg-warning-500 h-2 w-2 rounded-full'
                                  : 'bg-info-500 h-2 w-2 rounded-full'
                            }
                            aria-hidden="true"
                          />
                          <span className="text-[14px] font-medium text-neutral-700 group-hover:text-neutral-900">
                            {item.label}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-neutral-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-600" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Properties', href: '/system/properties', icon: Building2 },
                  { label: 'Platform health', href: '/system/health', icon: Activity },
                  { label: 'AI dashboard', href: '/system/ai', icon: Sparkles },
                  { label: 'Billing', href: '/system/billing', icon: CreditCard },
                  { label: 'User management', href: '/users', icon: Users },
                  { label: 'Compliance', href: '/compliance', icon: Shield },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
                        {action.label}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-500" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Resident dashboard (resident_owner, resident_tenant, family_member,
  // offsite_owner) — purpose-built layout. Residents should NEVER see the
  // operations-style "AI Daily Briefing" that quotes building-wide counts
  // (15 packages waiting, 26 service requests open) — those numbers are
  // for the whole property and read as alarming when a resident sees
  // "you have 15 packages."
  // -------------------------------------------------------------------------
  const isResidentRoleDash =
    effectiveRole === 'resident_owner' ||
    effectiveRole === 'resident_tenant' ||
    effectiveRole === 'family_member' ||
    effectiveRole === 'offsite_owner';

  if (isResidentRoleDash) {
    return (
      <ResidentDashboard
        name={effectiveName}
        greeting={greeting}
        kpiCards={config.kpiCards}
        kpiValues={kpiValues}
        buildingHealthScore={buildingHealthScore}
        apiData={apiData}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Front Desk / Concierge dashboard.
  // Per the design brief, the front desk persona (Marcus / Emily) is the
  // most-under-served role: 10-hour shift on their feet, three things
  // ringing at once, every click costs 3 seconds with a real human waiting.
  // We render a purpose-built layout that leads with "right now" — what's
  // at the desk this minute — instead of the generic ops grid.
  // -------------------------------------------------------------------------
  if (effectiveRole === 'front_desk') {
    return <FrontDeskDashboard name={effectiveName} greeting={greeting} apiData={apiData} />;
  }

  // -------------------------------------------------------------------------
  // Security Guard dashboard.
  // Distinct from the concierge view. Guards lead with active incidents and
  // who's currently in the building — they glance, they don't read. Colour
  // language matters: red for active incidents, amber for keys overdue,
  // neutral otherwise.
  // -------------------------------------------------------------------------
  if (effectiveRole === 'security_guard' || effectiveRole === 'security_supervisor') {
    return <SecurityDashboard name={effectiveName} greeting={greeting} apiData={apiData} />;
  }

  // -------------------------------------------------------------------------
  // Property-level dashboard (staff, manager, board)
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
            {greeting}, {effectiveName}
          </h1>
          <p className="mt-0.5 text-[14px] text-neutral-500">
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
        <Card className="max-h-[320px] overflow-y-auto lg:col-span-2">
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
            {apiData?.recentActivity && apiData.recentActivity.length > 0 ? (
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
                  {/* Role-aware copy. Without this, residents saw manager-style
                      lines like "8 booking approvals pending review" — confusing
                      because residents don't approve bookings (managers do). */}
                  {(() => {
                    const isResident =
                      effectiveRole === 'resident_owner' ||
                      effectiveRole === 'resident_tenant' ||
                      effectiveRole === 'family_member' ||
                      effectiveRole === 'offsite_owner';
                    const lines: React.ReactNode[] = [];
                    if (isResident) {
                      if (apiData.kpis.unreleasedPackages > 0) {
                        lines.push(
                          <li key="pkg">
                            You have{' '}
                            <strong>
                              {apiData.kpis.unreleasedPackages} package
                              {apiData.kpis.unreleasedPackages !== 1 ? 's' : ''}
                            </strong>{' '}
                            waiting for pickup at the front desk.
                          </li>,
                        );
                      }
                      if (apiData.kpis.openMaintenanceRequests > 0) {
                        lines.push(
                          <li key="mr">
                            <strong>
                              {apiData.kpis.openMaintenanceRequests} of your service request
                              {apiData.kpis.openMaintenanceRequests !== 1 ? 's' : ''}
                            </strong>{' '}
                            {apiData.kpis.openMaintenanceRequests !== 1 ? 'are' : 'is'} still open.
                          </li>,
                        );
                      }
                      if (apiData.kpis.pendingBookingApprovals > 0) {
                        lines.push(
                          <li key="bk">
                            <strong>
                              {apiData.kpis.pendingBookingApprovals} of your booking request
                              {apiData.kpis.pendingBookingApprovals !== 1 ? 's' : ''}
                            </strong>{' '}
                            {apiData.kpis.pendingBookingApprovals !== 1 ? 'are' : 'is'} awaiting
                            management approval.
                          </li>,
                        );
                      }
                      if (lines.length === 0) {
                        lines.push(
                          <li key="ok">All caught up — no packages or open requests today.</li>,
                        );
                      }
                      return lines;
                    }
                    // Staff & manager view (original copy)
                    if (apiData.kpis.openMaintenanceRequests > 0) {
                      lines.push(
                        <li key="mr">
                          <strong>
                            {apiData.kpis.openMaintenanceRequests} maintenance request
                            {apiData.kpis.openMaintenanceRequests !== 1 ? 's' : ''}
                          </strong>{' '}
                          currently open
                          {apiData.kpis.overdueMaintenanceRequests > 0
                            ? `, ${apiData.kpis.overdueMaintenanceRequests} overdue`
                            : ''}
                          .
                        </li>,
                      );
                    }
                    if (apiData.kpis.unreleasedPackages > 0) {
                      lines.push(
                        <li key="pkg">
                          <strong>
                            {apiData.kpis.unreleasedPackages} package
                            {apiData.kpis.unreleasedPackages !== 1 ? 's' : ''}
                          </strong>{' '}
                          awaiting pickup.
                        </li>,
                      );
                    }
                    if (apiData.kpis.activeVisitors > 0) {
                      lines.push(
                        <li key="vis">
                          <strong>
                            {apiData.kpis.activeVisitors} active visitor
                            {apiData.kpis.activeVisitors !== 1 ? 's' : ''}
                          </strong>{' '}
                          currently on-site.
                        </li>,
                      );
                    }
                    if (apiData.kpis.pendingBookingApprovals > 0) {
                      lines.push(
                        <li key="bk">
                          <strong>
                            {apiData.kpis.pendingBookingApprovals} booking approval
                            {apiData.kpis.pendingBookingApprovals !== 1 ? 's' : ''}
                          </strong>{' '}
                          pending review.
                        </li>,
                      );
                    }
                    if (apiData.kpis.todayEvents > 0) {
                      lines.push(
                        <li key="ev">
                          <strong>
                            {apiData.kpis.todayEvents} event
                            {apiData.kpis.todayEvents !== 1 ? 's' : ''}
                          </strong>{' '}
                          logged today.
                        </li>,
                      );
                    }
                    return lines;
                  })()}
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
          {/* Building Health Score — conic ring + signal copy */}
          <Card>
            <CardHeader>
              <CardTitle>Building health</CardTitle>
            </CardHeader>
            <CardContent>
              {buildingHealthScore !== null ? (
                <BuildingHealthRing score={buildingHealthScore} />
              ) : (
                <div className="flex items-center gap-4 py-2">
                  <div
                    aria-hidden="true"
                    className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-full bg-neutral-100"
                  >
                    <span className="text-[22px] font-light text-neutral-300">&mdash;</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-neutral-500">No data yet</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
                      Score appears once operations data starts flowing.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions — role-aware top tasks. Front desk and security
              get the operational shortcuts. Property admin / manager get
              management shortcuts. Residents get resident-portal flows. */}
          {(() => {
            const isResidentRole =
              effectiveRole === 'resident_owner' || effectiveRole === 'resident_tenant';
            const isAdminRole =
              effectiveRole === 'property_admin' ||
              effectiveRole === 'property_manager' ||
              effectiveRole === 'super_admin' ||
              effectiveRole === 'board_member';

            const actions = isResidentRole
              ? [
                  { label: 'Submit a request', href: '/my-requests?action=new', icon: Wrench },
                  { label: 'Book an amenity', href: '/amenity-booking', icon: Calendar },
                  { label: 'View announcements', href: '/announcements', icon: Megaphone },
                ]
              : isAdminRole
                ? [
                    {
                      label: 'Post an announcement',
                      href: '/announcements?action=new',
                      icon: Megaphone,
                    },
                    { label: 'Add a resident', href: '/residents?action=new', icon: Users },
                    { label: 'Review reports', href: '/reports', icon: BarChart3 },
                  ]
                : [
                    { label: 'Log a package', href: '/packages?action=new', icon: Package },
                    { label: 'Check in a visitor', href: '/visitors?action=new', icon: Users },
                    { label: 'Open shift log', href: '/shift-log', icon: StickyNote },
                  ];

            return (
              <Card data-testid="quick-actions-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-primary-500 h-4 w-4" />
                    <CardTitle>Quick Actions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="-mx-2 flex flex-col">
                    {actions.map((action) => (
                      <a
                        key={action.label}
                        href={action.href}
                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                      >
                        <span className="flex items-center gap-2.5">
                          <action.icon
                            className="text-primary-500 h-3.5 w-3.5 flex-shrink-0"
                            strokeWidth={1.8}
                          />
                          {action.label}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-600" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* KPI Cards — compact, clickable, drill into the source list */}
      {config.kpiCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {config.kpiCards.map((kpi) => {
            const kpiConfig = KPI_ICONS[kpi] || {
              label: kpi,
              icon: FileText,
              color: 'text-neutral-600',
              bgColor: 'bg-neutral-50',
            };
            return (
              <KpiTile
                key={kpi}
                label={kpiConfig.label}
                value={kpiValues[kpi] ?? '\u2014'}
                icon={kpiConfig.icon}
                accent={KPI_ACCENTS[kpi] ?? 'neutral'}
                href={KPI_DRILL_HREFS[kpi]}
              />
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
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    window.location.href = route;
                  }}
                  className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                >
                  {action}
                </button>
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

          {/* Dedicated staff quick action buttons — hidden for residents,
              board members, visitors, and other non-operational roles. */}
          {(effectiveRole === 'front_desk' ||
            effectiveRole === 'security_guard' ||
            effectiveRole === 'security_supervisor' ||
            effectiveRole === 'property_admin' ||
            effectiveRole === 'property_manager' ||
            effectiveRole === 'maintenance_staff' ||
            effectiveRole === 'superintendent') && (
            <>
              <div className="mx-1 h-auto w-px bg-neutral-200" />
              {Object.entries(QUICK_ACTION_LINKS).map(([label, { href, icon: QAIcon }]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    window.location.href = href;
                  }}
                  className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                >
                  <QAIcon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </>
          )}
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
                    <a
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="focus-visible:outline-primary-500 flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-2"
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
                    </a>
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
