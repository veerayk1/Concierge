'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import {
  Download,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { DataTable, type Column } from '@/components/ui/data-table';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';

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
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_USERS: UserAccount[] = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@bondtower.com',
    role: 'property_admin',
    roleDisplay: 'Property Admin',
    status: 'active',
    mfaEnabled: true,
    lastLogin: '2026-03-18T09:00:00',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.j@bondtower.com',
    role: 'front_desk',
    roleDisplay: 'Front Desk',
    status: 'active',
    mfaEnabled: false,
    lastLogin: '2026-03-18T07:00:00',
    createdAt: '2024-06-15',
  },
  {
    id: '3',
    firstName: 'Guard',
    lastName: 'Patel',
    email: 'guard.patel@bondtower.com',
    role: 'security_guard',
    roleDisplay: 'Security Guard',
    status: 'active',
    mfaEnabled: false,
    lastLogin: '2026-03-18T06:45:00',
    createdAt: '2024-03-01',
  },
  {
    id: '4',
    firstName: 'Guard',
    lastName: 'Chen',
    email: 'guard.chen@bondtower.com',
    role: 'security_guard',
    roleDisplay: 'Security Guard',
    status: 'active',
    mfaEnabled: false,
    lastLogin: '2026-03-17T22:00:00',
    createdAt: '2024-09-01',
  },
  {
    id: '5',
    firstName: 'Angela',
    lastName: 'Davis',
    email: 'angela.d@bondtower.com',
    role: 'front_desk',
    roleDisplay: 'Front Desk',
    status: 'active',
    mfaEnabled: false,
    lastLogin: '2026-03-17T07:00:00',
    createdAt: '2025-01-15',
  },
  {
    id: '6',
    firstName: 'Mike',
    lastName: 'Thompson',
    email: 'mike.t@bondtower.com',
    role: 'maintenance_staff',
    roleDisplay: 'Maintenance',
    status: 'active',
    mfaEnabled: false,
    lastLogin: '2026-03-18T08:30:00',
    createdAt: '2024-02-01',
  },
  {
    id: '7',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.w@bondtower.com',
    role: 'maintenance_staff',
    roleDisplay: 'Maintenance',
    status: 'inactive',
    mfaEnabled: false,
    lastLogin: '2026-02-28T10:00:00',
    createdAt: '2024-05-01',
  },
  {
    id: '8',
    firstName: 'Sarah',
    lastName: 'Lee',
    email: 'sarah.l@bondtower.com',
    role: 'property_manager',
    roleDisplay: 'Property Manager',
    status: 'active',
    mfaEnabled: true,
    lastLogin: '2026-03-18T08:00:00',
    createdAt: '2023-06-01',
  },
];

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

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch real users from API
  const {
    data: apiUsers,
    loading: apiLoading,
    refetch,
  } = useApi<UserAccount[]>(apiUrl('/api/v1/users', { propertyId: PROPERTY_ID }));

  const handleUserCreated = useCallback(() => {
    setShowCreateDialog(false);
    refetch();
  }, [refetch]);

  // Merge API users with mock data as fallback
  const allUsers = useMemo(() => {
    if (apiUsers && Array.isArray(apiUsers) && apiUsers.length > 0) {
      return apiUsers.map((u: Record<string, unknown>) => ({
        id: u.id as string,
        firstName: u.firstName as string,
        lastName: u.lastName as string,
        email: u.email as string,
        role: (u.role as Record<string, string>)?.slug || 'front_desk',
        roleDisplay: (u.role as Record<string, string>)?.name || 'Staff',
        status: (u.status as string) || 'active',
        mfaEnabled: (u.mfaEnabled as boolean) || false,
        lastLogin: u.lastLoginAt as string | undefined,
        createdAt: u.createdAt as string,
      }));
    }
    return MOCK_USERS;
  }, [apiUsers]);

  const filteredUsers = useMemo(
    () =>
      allUsers.filter((u) => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
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
        const m = {
          active: { v: 'success' as const, l: 'Active' },
          inactive: { v: 'default' as const, l: 'Inactive' },
          locked: { v: 'error' as const, l: 'Locked' },
        };
        const s = m[row.status];
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
      cell: () => (
        <button
          type="button"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <PageShell
      title="User Management"
      description={`${MOCK_USERS.length} accounts \u00B7 ${activeCount} active`}
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
      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <UserCheck className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{activeCount}</p>
            <p className="text-[13px] text-neutral-500">Active Users</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <UserX className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {MOCK_USERS.length - activeCount}
            </p>
            <p className="text-[13px] text-neutral-500">Inactive</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Shield className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {MOCK_USERS.filter((u) => u.mfaEnabled).length}
            </p>
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

      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyMessage="No users found."
        emptyIcon={<Users className="h-6 w-6" />}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={PROPERTY_ID}
        onSuccess={handleUserCreated}
      />
    </PageShell>
  );
}
