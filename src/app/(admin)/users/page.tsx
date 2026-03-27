'use client';

import { useState, useMemo, useCallback } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import {
  AlertCircle,
  Download,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable, type Column } from '@/components/ui/data-table';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleDisplay: string;
  status: 'active' | 'inactive' | 'locked';
  mfaEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  temporaryPassword?: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  property_admin: 'primary',
  property_manager: 'info',
  front_desk: 'success',
  security_guard: 'warning',
  maintenance_staff: 'default',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

import { getPropertyId } from '@/lib/demo-config';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch real users from API
  const {
    data: apiUsers,
    loading,
    error,
    refetch,
  } = useApi<UserAccount[]>(apiUrl('/api/v1/users', { propertyId: getPropertyId() }));

  const handleUserCreated = useCallback(() => {
    // Don't close dialog here — the dialog manages its own closing
    // (it stays open to show temp password, then closes on "Done" click)
    refetch();
  }, [refetch]);

  // Normalize API response into UserAccount shape
  const allUsers = useMemo(() => {
    if (!apiUsers || !Array.isArray(apiUsers)) return [];
    return apiUsers.map((u: UserAccount) => ({
      id: u.id as string,
      firstName: u.firstName as string,
      lastName: u.lastName as string,
      email: u.email as string,
      role:
        ((u as unknown as Record<string, unknown>).role as Record<string, string>)?.slug ||
        (u.role as string) ||
        'front_desk',
      roleDisplay:
        ((u as unknown as Record<string, unknown>).role as Record<string, string>)?.name ||
        (u.roleDisplay as string) ||
        'Staff',
      status: ((u.status as string) || 'active') as UserAccount['status'],
      mfaEnabled: (u.mfaEnabled as boolean) || false,
      lastLogin: (u as unknown as Record<string, unknown>).lastLoginAt as string | undefined,
      createdAt: u.createdAt as string,
      temporaryPassword: (u as unknown as Record<string, string>).temporaryPassword || null,
    }));
  }, [apiUsers]);

  const filteredUsers = useMemo(
    () =>
      allUsers.filter((u) => {
        if (roleFilter !== 'all') {
          // Security filter should include both guard and supervisor
          if (roleFilter === 'security_guard') {
            if (u.role !== 'security_guard' && u.role !== 'security_supervisor') return false;
          } else if (u.role !== roleFilter) {
            return false;
          }
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const name = `${u.firstName} ${u.lastName}`.toLowerCase();
          return (
            name.includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.roleDisplay.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [searchQuery, roleFilter, allUsers],
  );

  const activeCount = allUsers.filter((u) => u.status === 'active').length;
  const inactiveCount = allUsers.length - activeCount;
  const mfaCount = allUsers.filter((u) => u.mfaEnabled).length;

  const columns: Column<UserAccount>[] = [
    {
      id: 'name',
      header: 'User',
      accessorKey: 'lastName',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${row.firstName} ${row.lastName}`}
            size="sm"
            status={row.status === 'active' ? 'online' : 'offline'}
          />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-[12px] text-neutral-500">{row.email}</p>
            {row.temporaryPassword && (
              <button
                type="button"
                className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                title="Click to copy password"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(row.temporaryPassword!);
                  const btn = e.currentTarget;
                  const orig = btn.textContent;
                  btn.textContent = 'Copied!';
                  setTimeout(() => { btn.textContent = orig; }, 1500);
                }}
              >
                <KeyRound className="h-2.5 w-2.5" />
                {row.temporaryPassword}
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'roleDisplay',
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            (ROLE_COLORS[row.role] || 'default') as
              | 'primary'
              | 'info'
              | 'success'
              | 'warning'
              | 'default'
          }
          size="sm"
        >
          {row.roleDisplay}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const m: Record<string, { v: 'success' | 'default' | 'error' | 'warning'; l: string }> = {
          active: { v: 'success', l: 'Active' },
          inactive: { v: 'default', l: 'Inactive' },
          locked: { v: 'error', l: 'Locked' },
          pending: { v: 'warning', l: 'Pending' },
          suspended: { v: 'error', l: 'Suspended' },
        };
        const s = m[row.status] || { v: 'default' as const, l: row.status || 'Unknown' };
        return (
          <Badge variant={s.v} size="sm" dot>
            {s.l}
          </Badge>
        );
      },
    },
    {
      id: 'mfa',
      header: '2FA',
      accessorKey: 'mfaEnabled',
      cell: (row) =>
        row.mfaEnabled ? (
          <Badge variant="success" size="sm">
            <Shield className="h-2.5 w-2.5" />
            Enabled
          </Badge>
        ) : (
          <span className="text-[13px] text-neutral-400">Off</span>
        ),
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      accessorKey: 'lastLogin',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.lastLogin
            ? new Date(row.lastLogin).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setActionMessage({
                  type: 'success',
                  text: `Password reset for ${row.firstName} ${row.lastName} is coming soon.`,
                });
                setTimeout(() => setActionMessage(null), 4000);
              }}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setActionMessage({
                  type: 'success',
                  text: `${row.status === 'active' ? 'Deactivate' : 'Activate'} for ${row.firstName} ${row.lastName} is coming soon.`,
                });
                setTimeout(() => setActionMessage(null), 4000);
              }}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              {row.status === 'active' ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onClick={() => {
                setActionMessage({
                  type: 'error',
                  text: `Delete for ${row.firstName} ${row.lastName} is coming soon.`,
                });
                setTimeout(() => setActionMessage(null), 4000);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageShell
      title="User Management"
      description={
        loading ? 'Loading users...' : `${allUsers.length} accounts \u00B7 ${activeCount} active`
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      }
    >
      {/* Action Feedback */}
      {actionMessage && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-[14px] ${
            actionMessage.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-700'
              : 'border-error-200 bg-error-50 text-error-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="sm" className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load users"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Data */}
      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <UserCheck className="text-success-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {activeCount}
                </p>
                <p className="text-[13px] text-neutral-500">Active Users</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <UserX className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {inactiveCount}
                </p>
                <p className="text-[13px] text-neutral-500">Inactive</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Shield className="text-primary-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">{mfaCount}</p>
                <p className="text-[13px] text-neutral-500">2FA Enabled</p>
              </div>
            </Card>
          </div>

          {/* Search + Role Filter */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
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
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'property_admin', label: 'Admins' },
                { key: 'front_desk', label: 'Front Desk' },
                { key: 'security_guard', label: 'Security' },
                { key: 'maintenance_staff', label: 'Maintenance' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRoleFilter(r.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${roleFilter === r.key ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state when no users exist at all */}
          {allUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No users found"
              description="Get started by creating the first user account for this property."
              action={
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Create User
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
              emptyMessage="No users found."
              emptyIcon={<Users className="h-6 w-6" />}
            />
          )}
        </>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={handleUserCreated}
      />
    </PageShell>
  );
}
