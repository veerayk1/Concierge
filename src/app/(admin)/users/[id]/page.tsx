'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  History,
} from 'lucide-react';
import { useApi, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/page-shell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoleSummary {
  id: string;
  name: string;
  slug: string;
}

interface PropertyAssignment {
  propertyId: string;
  propertyName: string;
  role: RoleSummary | null;
}

interface LoginAudit {
  id: string;
  email: string;
  success: boolean;
  failReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  isActive: boolean;
  activatedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'pending' | 'suspended';
  properties: PropertyAssignment[];
  recentLogins: LoginAudit[];
}

interface RoleOption {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = getPropertyId();

  const { data, loading, error, refetch } = useApi<UserDetail>(`/api/v1/users/${id}`);
  const { data: roleData } = useApi<RoleOption[]>(`/api/v1/roles?propertyId=${propertyId}`);

  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');

  useEffect(() => {
    if (!data) return;
    setFirstName(data.firstName ?? '');
    setLastName(data.lastName ?? '');
    setPhone(data.phone ?? '');
    const assignment = data.properties.find((p) => p.propertyId === propertyId);
    setRoleId(assignment?.role?.id ?? '');
  }, [data, propertyId]);

  function showMessage(type: 'success' | 'error', text: string) {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const url = roleId
        ? `/api/v1/users/${data.id}?propertyId=${propertyId}`
        : `/api/v1/users/${data.id}`;
      const resp = await apiRequest(url, {
        method: 'PATCH',
        body: {
          firstName,
          lastName,
          phone: phone || null,
          ...(roleId ? { roleId } : {}),
        },
      });
      if (resp.ok) {
        showMessage('success', 'Profile updated.');
        setEditing(false);
        refetch();
      } else {
        showMessage('error', 'Failed to update profile.');
      }
    } catch {
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!data) return;
    try {
      const resp = await apiRequest(`/api/v1/users/${data.id}/welcome-email`, { method: 'POST' });
      if (resp.ok) {
        const label = data.status === 'pending' ? 'Welcome email' : 'Password reset email';
        showMessage('success', `${label} sent to ${data.firstName} ${data.lastName}.`);
      } else {
        showMessage('error', 'Failed to send email.');
      }
    } catch {
      showMessage('error', 'Network error. Please try again.');
    }
  }

  async function handleCopyActivationLink() {
    if (!data) return;
    try {
      const resp = await apiRequest(`/api/v1/users/${data.id}/welcome-email`, { method: 'POST' });
      if (!resp.ok) {
        showMessage('error', 'Failed to generate activation link.');
        return;
      }
      const j = await resp.json();
      const url: string | undefined = j?.data?.activationUrl;
      if (!url) {
        showMessage('error', 'Activation link missing from response.');
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        showMessage('success', 'Activation link copied to clipboard.');
      } catch {
        // Some browsers block clipboard API without user gesture in iframe
        // — surface the link in the toast so the admin can copy manually.
        showMessage('success', `Activation link: ${url}`);
      }
    } catch {
      showMessage('error', 'Network error. Please try again.');
    }
  }

  async function handleToggleStatus() {
    if (!data) return;
    const newStatus = data.isActive ? 'suspended' : 'active';
    try {
      const resp = await apiRequest(`/api/v1/users/${data.id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      if (resp.ok) {
        showMessage(
          'success',
          `${data.firstName} ${data.lastName} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
        );
        refetch();
      } else {
        showMessage('error', 'Failed to change status.');
      }
    } catch {
      showMessage('error', 'Network error. Please try again.');
    }
  }

  async function handleDelete() {
    if (!data) return;
    if (
      !confirm(
        `Delete ${data.firstName} ${data.lastName}? This deactivates the account and revokes all sessions. The user can be restored from backups but will lose immediate access.`,
      )
    ) {
      return;
    }
    try {
      const resp = await apiRequest(`/api/v1/users/${data.id}`, { method: 'DELETE' });
      if (resp.ok) {
        router.push('/users');
      } else {
        showMessage('error', 'Failed to delete user.');
      }
    } catch {
      showMessage('error', 'Network error. Please try again.');
    }
  }

  const statusBadge = useMemo(() => {
    if (!data) return null;
    const map = {
      active: { variant: 'success' as const, label: 'Active' },
      suspended: { variant: 'error' as const, label: 'Suspended' },
      pending: { variant: 'warning' as const, label: 'Pending' },
    };
    const s = map[data.status] ?? map.pending;
    return (
      <Badge variant={s.variant} size="sm" dot>
        {s.label}
      </Badge>
    );
  }, [data]);

  if (loading) {
    return (
      <PageShell title="Loading user...">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell title="User Detail">
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="User not found"
          description={error ?? 'This user account no longer exists or you do not have access.'}
          action={
            <Link
              href="/users"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
          }
        />
      </PageShell>
    );
  }

  const fullName = `${data.firstName} ${data.lastName}`.trim() || data.email;
  const primaryRole =
    data.properties.find((p) => p.propertyId === propertyId)?.role?.name ?? 'No role';

  return (
    <PageShell
      title={fullName}
      description={`${data.email} · ${primaryRole}`}
      actions={
        <Link
          href="/users"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
      }
    >
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

      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} size="lg" status={data.isActive ? 'online' : 'offline'} />
            <div>
              <h2 className="text-[20px] font-semibold tracking-tight text-neutral-900">
                {fullName}
              </h2>
              <p className="text-[13px] text-neutral-500">{data.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {statusBadge}
                <Badge variant="primary" size="sm">
                  {primaryRole}
                </Badge>
                {data.mfaEnabled ? (
                  <Badge variant="success" size="sm">
                    <Shield className="h-2.5 w-2.5" />
                    2FA Enabled
                  </Badge>
                ) : (
                  <span className="text-[12px] text-neutral-400">2FA off</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* For Pending users, the same endpoint that resets a password
                also re-issues the activation token + welcome email. Show
                the label that matches the user's actual state so the
                admin knows what's about to happen. */}
            <Button variant="secondary" size="sm" onClick={handleResetPassword}>
              <KeyRound className="h-4 w-4" />
              {data.status === 'pending' ? 'Resend Welcome Email' : 'Reset Password'}
            </Button>
            {data.status === 'pending' && (
              <Button variant="secondary" size="sm" onClick={handleCopyActivationLink}>
                <Mail className="h-4 w-4" />
                Copy Activation Link
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleToggleStatus}>
              {data.isActive ? (
                <>
                  <UserMinus className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Account Profile</CardTitle>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setFirstName(data.firstName);
                      setLastName(data.lastName);
                      setPhone(data.phone ?? '');
                      const assignment = data.properties.find((p) => p.propertyId === propertyId);
                      setRoleId(assignment?.role?.id ?? '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Edit Details
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="First Name" icon={<UserCheck className="h-4 w-4 text-neutral-400" />}>
                {editing ? (
                  <Input value={firstName} onChange={setFirstName} placeholder="First name" />
                ) : (
                  <span className="text-[14px] text-neutral-900">{data.firstName || '—'}</span>
                )}
              </Field>
              <Field label="Last Name" icon={<UserCheck className="h-4 w-4 text-neutral-400" />}>
                {editing ? (
                  <Input value={lastName} onChange={setLastName} placeholder="Last name" />
                ) : (
                  <span className="text-[14px] text-neutral-900">{data.lastName || '—'}</span>
                )}
              </Field>
              <Field label="Email" icon={<Mail className="h-4 w-4 text-neutral-400" />}>
                <span className="text-[14px] text-neutral-900">{data.email}</span>
              </Field>
              <Field label="Phone" icon={<Phone className="h-4 w-4 text-neutral-400" />}>
                {editing ? (
                  <Input value={phone} onChange={setPhone} placeholder="+1 555 123 4567" />
                ) : (
                  <span className="text-[14px] text-neutral-900">{data.phone || '—'}</span>
                )}
              </Field>
              <Field
                label="Role at this property"
                icon={<Shield className="h-4 w-4 text-neutral-400" />}
              >
                {editing && roleData && roleData.length > 0 ? (
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="focus:border-primary-300 focus:ring-primary-100 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 focus:ring-4 focus:outline-none"
                  >
                    {roleData.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[14px] text-neutral-900">{primaryRole}</span>
                )}
              </Field>
              <Field label="Created" icon={<Calendar className="h-4 w-4 text-neutral-400" />}>
                <span className="text-[14px] text-neutral-900">
                  {new Date(data.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </Field>
              <Field label="Last Login" icon={<History className="h-4 w-4 text-neutral-400" />}>
                <span className="text-[14px] text-neutral-900">
                  {data.lastLoginAt
                    ? new Date(data.lastLoginAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Never'}
                </span>
              </Field>
              <Field label="2FA" icon={<Shield className="h-4 w-4 text-neutral-400" />}>
                {data.mfaEnabled ? (
                  <span className="text-success-600 inline-flex items-center gap-1.5 text-[14px]">
                    <CheckCircle2 className="h-4 w-4" />
                    Enabled
                  </span>
                ) : (
                  <span className="text-[14px] text-neutral-500">Not enabled</span>
                )}
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties tab */}
        <TabsContent value="properties" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {data.properties.length === 0 ? (
                <p className="text-[13px] text-neutral-500">
                  This user is not assigned to any property.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.properties.map((p) => (
                    <li
                      key={p.propertyId}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-neutral-900">{p.propertyName}</p>
                        <p className="text-[12px] text-neutral-500">{p.role?.name ?? 'No role'}</p>
                      </div>
                      {p.propertyId === propertyId && (
                        <Badge variant="primary" size="sm">
                          Current
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Login Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentLogins.length === 0 ? (
                <p className="text-[13px] text-neutral-500">No login activity recorded yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-100">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-neutral-50/80 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                        <th className="px-4 py-2.5">When</th>
                        <th className="px-4 py-2.5">Result</th>
                        <th className="px-4 py-2.5">IP</th>
                        <th className="px-4 py-2.5">Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {data.recentLogins.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-2.5 text-neutral-700">
                            {new Date(row.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-2.5">
                            {row.success ? (
                              <Badge variant="success" size="sm">
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="error" size="sm">
                                {row.failReason ?? 'Failed'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[12px] text-neutral-500">
                            {row.ipAddress ?? '—'}
                          </td>
                          <td className="max-w-xs truncate px-4 py-2.5 text-neutral-500">
                            {row.userAgent ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
        {icon}
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="focus:border-primary-300 focus:ring-primary-100 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
    />
  );
}
