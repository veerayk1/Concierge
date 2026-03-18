'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Circle,
  ClipboardList,
  Cog,
  Eye,
  Gavel,
  HardHat,
  Headphones,
  Home,
  Megaphone,
  Shield,
  Star,
  Truck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface Role {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  permissions: string[];
  isSystem: boolean;
}

const ROLES: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    memberCount: 1,
    description: 'Full system access. Can manage properties, billing, and all platform settings.',
    icon: Star,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    permissions: ['All Permissions'],
    isSystem: true,
  },
  {
    id: '2',
    name: 'Property Admin',
    memberCount: 2,
    description: 'Full property-level access. Manages users, settings, and all modules.',
    icon: UserCog,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
    permissions: ['Users', 'Settings', 'Events', 'Maintenance', 'Amenities', 'Reports'],
    isSystem: true,
  },
  {
    id: '3',
    name: 'Property Manager',
    memberCount: 3,
    description: 'Oversees daily operations, maintenance, vendor management, and reporting.',
    icon: Building2,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    permissions: ['Events', 'Maintenance', 'Vendors', 'Reports', 'Amenities', 'Units'],
    isSystem: true,
  },
  {
    id: '4',
    name: 'Front Desk / Concierge',
    memberCount: 8,
    description: 'Package intake, visitor logging, shift notes, and unit instructions.',
    icon: Headphones,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
    permissions: ['Events', 'Packages', 'Visitors', 'Shift Log', 'Units (Read)'],
    isSystem: true,
  },
  {
    id: '5',
    name: 'Security Guard',
    memberCount: 6,
    description: 'Incident reporting, parking violations, FOB tracking, and emergency contacts.',
    icon: Shield,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
    permissions: ['Incidents', 'Parking', 'FOBs', 'Emergency Contacts', 'Shift Log'],
    isSystem: true,
  },
  {
    id: '6',
    name: 'Maintenance Staff',
    memberCount: 4,
    description: 'View and update assigned maintenance requests and work orders.',
    icon: Wrench,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    permissions: ['Maintenance (Assigned)', 'Equipment', 'Work Orders'],
    isSystem: true,
  },
  {
    id: '7',
    name: 'Board Member',
    memberCount: 5,
    description: 'Governance view with reports, financials, and alteration approvals.',
    icon: Gavel,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    permissions: ['Reports', 'Financials', 'Alteration Approvals', 'Analytics'],
    isSystem: true,
  },
  {
    id: '8',
    name: 'Resident',
    memberCount: 312,
    description:
      'Self-service portal for packages, maintenance requests, bookings, and announcements.',
    icon: Home,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
    permissions: ['My Packages', 'My Requests', 'Bookings', 'Announcements'],
    isSystem: true,
  },
  {
    id: '9',
    name: 'Resident (Owner)',
    memberCount: 187,
    description:
      'Owner-specific features including financials, board communications, and AGM voting.',
    icon: Home,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
    permissions: ['My Packages', 'My Requests', 'Bookings', 'Financials', 'AGM Voting'],
    isSystem: true,
  },
  {
    id: '10',
    name: 'Cleaning Staff',
    memberCount: 3,
    description: 'View cleaning schedules, log completed tasks, and report supply needs.',
    icon: ClipboardList,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
    permissions: ['Cleaning Log', 'Supply Requests'],
    isSystem: false,
  },
  {
    id: '11',
    name: 'Vendor',
    memberCount: 14,
    description: 'External vendor access for assigned work orders and document uploads.',
    icon: Truck,
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    permissions: ['Work Orders (Assigned)', 'Documents (Upload)'],
    isSystem: false,
  },
  {
    id: '12',
    name: 'Contractor',
    memberCount: 7,
    description: 'Temporary access for renovation contractors with time-limited permissions.',
    icon: HardHat,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    permissions: ['Alteration Projects (Assigned)', 'Documents (Upload)'],
    isSystem: false,
  },
  {
    id: '13',
    name: 'Communications Manager',
    memberCount: 1,
    description: 'Draft and distribute announcements, manage community events and surveys.',
    icon: Megaphone,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    permissions: ['Announcements', 'Events', 'Surveys', 'Classified Ads'],
    isSystem: false,
  },
  {
    id: '14',
    name: 'Read-Only Auditor',
    memberCount: 1,
    description: 'View-only access to all modules for compliance audits and inspections.',
    icon: Eye,
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    permissions: ['All Modules (Read-Only)'],
    isSystem: false,
  },
];

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface ApiRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: unknown;
  memberCount: number;
}

// Map role slugs to icons and colors
const ROLE_ICON_MAP: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  super_admin: { icon: Star, color: 'text-warning-600', bgColor: 'bg-warning-50' },
  property_admin: { icon: UserCog, color: 'text-error-600', bgColor: 'bg-error-50' },
  property_manager: { icon: Building2, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  front_desk: { icon: Headphones, color: 'text-info-600', bgColor: 'bg-info-50' },
  security_guard: { icon: Shield, color: 'text-error-600', bgColor: 'bg-error-50' },
  security_supervisor: { icon: Shield, color: 'text-error-600', bgColor: 'bg-error-50' },
  maintenance_staff: { icon: Wrench, color: 'text-warning-600', bgColor: 'bg-warning-50' },
  superintendent: { icon: HardHat, color: 'text-warning-600', bgColor: 'bg-warning-50' },
  board_member: { icon: Gavel, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  resident_owner: { icon: Home, color: 'text-success-600', bgColor: 'bg-success-50' },
  resident_tenant: { icon: Home, color: 'text-success-600', bgColor: 'bg-success-50' },
  offsite_owner: { icon: Home, color: 'text-success-600', bgColor: 'bg-success-50' },
  family_member: { icon: Users, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  vendor: { icon: Truck, color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  visitor: { icon: Eye, color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RolesPage() {
  const {
    data: apiRoles,
    loading,
    refetch,
  } = useApi<ApiRole[]>(apiUrl('/api/v1/roles', { propertyId: DEMO_PROPERTY_ID }));

  const roles = useMemo<Role[]>(() => {
    if (!apiRoles || apiRoles.length === 0) return ROLES;
    return apiRoles.map((r) => {
      const iconConfig = ROLE_ICON_MAP[r.slug] || {
        icon: Circle,
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
      };
      const perms = Array.isArray(r.permissions) ? (r.permissions as string[]) : ['View'];
      return {
        id: r.id,
        name: r.name,
        memberCount: r.memberCount,
        description: r.description || '',
        icon: iconConfig.icon,
        color: iconConfig.color,
        bgColor: iconConfig.bgColor,
        permissions: perms,
        isSystem: r.isSystem,
      };
    });
  }, [apiRoles]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Define roles, assign permissions, and manage access control policies.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          + Create Role
        </Button>
      </div>

      {/* System Roles */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          System Roles ({roles.filter((r) => r.isSystem).length})
        </h2>
        <div className="space-y-3">
          {roles
            .filter((r) => r.isSystem)
            .map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Custom Roles ({roles.filter((r) => !r.isSystem).length})
        </h2>
        <div className="space-y-3">
          {roles
            .filter((r) => !r.isSystem)
            .map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}

function RoleCard({ role }: { role: Role }) {
  const Icon = role.icon;
  return (
    <Card hoverable className="cursor-pointer">
      <CardContent>
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${role.bgColor}`}
          >
            <Icon className={`h-5 w-5 ${role.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-neutral-900">{role.name}</h3>
              {role.isSystem && (
                <Badge variant="default" size="sm">
                  System
                </Badge>
              )}
              <Badge variant="info" size="sm">
                {role.memberCount} {role.memberCount === 1 ? 'member' : 'members'}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-neutral-500">{role.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {role.permissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex rounded-md bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-neutral-200/60 ring-inset"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Cog className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
