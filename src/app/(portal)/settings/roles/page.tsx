'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Shield,
  Users,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types (aligned with API response)
// ---------------------------------------------------------------------------

interface RoleFromApi {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: Record<string, string[]> | null;
  memberCount: number;
}

// ---------------------------------------------------------------------------
// Permission categories (used for display)
// ---------------------------------------------------------------------------

const PERMISSION_CATEGORIES = [
  'Events',
  'Packages',
  'Maintenance',
  'Security',
  'Amenities',
  'Users',
  'Settings',
  'Reports',
  'Community',
  'Finance',
] as const;

// ---------------------------------------------------------------------------
// Action badge colours
// ---------------------------------------------------------------------------

const actionBadgeVariant: Record<
  string,
  'default' | 'success' | 'info' | 'warning' | 'error' | 'primary'
> = {
  view: 'default',
  create: 'success',
  edit: 'info',
  delete: 'error',
  export: 'warning',
  approve: 'primary',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RolesPermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  // Fetch roles from API
  const {
    data: apiRoles,
    loading,
    error,
    refetch,
  } = useApi<RoleFromApi[]>(apiUrl('/api/v1/roles', { propertyId: DEMO_PROPERTY_ID }));

  const roles: RoleFromApi[] = useMemo(() => {
    if (!apiRoles) return [];
    return Array.isArray(apiRoles) ? apiRoles : [];
  }, [apiRoles]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }, [roles, searchQuery]);

  const totalUsers = useMemo(() => roles.reduce((sum, r) => sum + r.memberCount, 0), [roles]);

  // Extract permissions for a role, organized by category
  function getPermissionsForRole(role: RoleFromApi): { category: string; actions: string[] }[] {
    const perms = role.permissions as Record<string, string[]> | null;
    if (!perms) {
      // If no permissions data, show all categories with no access
      return PERMISSION_CATEGORIES.map((cat) => ({ category: cat, actions: [] }));
    }

    // The permissions object may have category keys directly, or may be structured differently
    return PERMISSION_CATEGORIES.map((cat) => {
      const key = cat.toLowerCase();
      const actions = perms[key] ?? perms[cat] ?? [];
      return { category: cat, actions: Array.isArray(actions) ? actions : [] };
    });
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
            Roles &amp; Permissions
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Manage user roles and configure permissions for your property.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load roles"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
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
            Roles &amp; Permissions
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Manage user roles and configure permissions for your property.
          </p>
        </div>
        <Button size="md">
          <Plus className="h-4 w-4" />
          Create Custom Role
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Shield className="text-primary-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-neutral-900">{roles.length}</p>
                <p className="text-[13px] text-neutral-500">Total Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="bg-success-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Users className="text-success-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-neutral-900">{totalUsers}</p>
                <p className="text-[13px] text-neutral-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="bg-info-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Lock className="text-info-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold text-neutral-900">
                  {PERMISSION_CATEGORIES.length}
                </p>
                <p className="text-[13px] text-neutral-500">Permission Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus:border-primary-500 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Empty state when no roles at all */}
      {roles.length === 0 && !searchQuery && (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="No roles configured"
          description="Create your first role to start managing user permissions."
          action={
            <Button size="md">
              <Plus className="h-4 w-4" />
              Create Custom Role
            </Button>
          }
        />
      )}

      {/* Roles Table with Expandable Permissions */}
      <div className="space-y-3">
        {filteredRoles.map((role) => (
          <div key={role.id}>
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full">
                  {role.id === filteredRoles[0]?.id && (
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/80">
                        <th className="w-12 px-4 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase" />
                        <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                          Role Name
                        </th>
                        <th className="w-24 px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                          Users
                        </th>
                        <th className="w-28 px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                          Type
                        </th>
                        <th className="w-24 px-5 py-3 text-right text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    <tr
                      className="cursor-pointer transition-colors hover:bg-neutral-50/80"
                      onClick={() =>
                        setExpandedRoleId((prev) => (prev === role.id ? null : role.id))
                      }
                    >
                      <td className="w-12 px-4 py-3.5">
                        <div className="text-neutral-400">
                          {expandedRoleId === role.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                            <Shield className="h-4 w-4 text-neutral-500" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-neutral-900">{role.name}</p>
                            <p className="line-clamp-1 max-w-md text-[13px] text-neutral-500">
                              {role.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="w-24 px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-[14px] text-neutral-700">{role.memberCount}</span>
                        </div>
                      </td>
                      <td className="w-28 px-5 py-3.5">
                        {role.isSystem ? (
                          <Badge variant="info" size="md" dot>
                            System
                          </Badge>
                        ) : (
                          <Badge variant="default" size="md">
                            Custom
                          </Badge>
                        )}
                      </td>
                      <td className="w-24 px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                            title="Edit role"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={
                              role.isSystem
                                ? 'cursor-not-allowed rounded-lg p-1.5 text-neutral-200'
                                : 'hover:bg-error-50 hover:text-error-600 rounded-lg p-1.5 text-neutral-400 transition-colors'
                            }
                            title={role.isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                            disabled={role.isSystem}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expanded Permission Detail */}
              {expandedRoleId === role.id && (
                <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-5">
                  <h4 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                    Permissions for {role.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {getPermissionsForRole(role).map((perm) => (
                      <div
                        key={perm.category}
                        className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white px-4 py-3"
                      >
                        <span className="text-[14px] font-medium text-neutral-900">
                          {perm.category}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {perm.actions.length > 0 ? (
                            perm.actions.map((action) => (
                              <Badge
                                key={action}
                                variant={actionBadgeVariant[action] ?? 'default'}
                                size="sm"
                              >
                                {action}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="default" size="sm">
                              No access
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRoles.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-[16px] font-semibold text-neutral-900">
              No roles match your search
            </h3>
            <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-neutral-500">
              Try adjusting your search query or create a new custom role.
            </p>
          </div>
        )}
      </div>

      {/* Permission Legend */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Permission Actions Legend
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(['view', 'create', 'edit', 'delete', 'export', 'approve'] as const).map(
                (action) => (
                  <div key={action} className="flex items-center gap-2">
                    <Badge variant={actionBadgeVariant[action]} size="md">
                      {action}
                    </Badge>
                    <span className="text-[13px] text-neutral-500">
                      {action === 'view' && 'Read-only access to records'}
                      {action === 'create' && 'Create new records'}
                      {action === 'edit' && 'Modify existing records'}
                      {action === 'delete' && 'Remove records permanently'}
                      {action === 'export' && 'Download data as CSV/PDF'}
                      {action === 'approve' && 'Approve or reject requests'}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
