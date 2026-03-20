'use client';

import {
  Bell,
  Globe,
  Key,
  Lock,
  Mail,
  Phone,
  Shield,
  Smartphone,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { getPropertyId } from '@/lib/demo-config';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import type { Role } from '@/types';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPreference {
  id: string;
  module: string;
  channel: string;
  enabled: boolean;
  digestMode: string;
}

// Module display config for notification preferences
const NOTIFICATION_MODULES = [
  {
    module: 'packages',
    label: 'Package Notifications',
    description: 'When a package arrives for you',
  },
  {
    module: 'maintenance',
    label: 'Maintenance Updates',
    description: 'Status changes on your requests',
  },
  { module: 'announcements', label: 'Announcements', description: 'Building-wide announcements' },
  { module: 'amenities', label: 'Amenity Reminders', description: 'Upcoming booking reminders' },
  { module: 'community', label: 'Community Updates', description: 'New classified ads and events' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Demo user lookup for when useAuth returns no user (demo mode)
const DEMO_USERS: Record<
  string,
  {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: Role;
  }
> = {
  resident_owner: {
    id: 'demo-resident-owner',
    email: 'janet.smith@email.com',
    firstName: 'Janet',
    lastName: 'Smith',
    phone: '+14165552001',
    role: 'resident_owner',
  },
  resident_tenant: {
    id: 'demo-resident-tenant',
    email: 'david.chen@email.com',
    firstName: 'David',
    lastName: 'Chen',
    phone: '+14165552003',
    role: 'resident_tenant',
  },
  front_desk: {
    id: 'demo-front-desk',
    email: 'mike.j@bondtower.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    phone: null,
    role: 'front_desk',
  },
  property_admin: {
    id: 'demo-admin',
    email: 'admin@bondtower.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: null,
    role: 'property_admin',
  },
  super_admin: {
    id: 'demo-super-admin',
    email: 'superadmin@concierge.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: null,
    role: 'super_admin',
  },
};

function getDemoUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem('demo_role');
  if (!role) return null;
  const demoUser = DEMO_USERS[role];
  if (!demoUser) return null;
  return demoUser;
}

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
};

export default function MyAccountPage() {
  const { user: authUser, loading: authLoading, setUser } = useAuth();

  // In demo mode, useAuth returns null — use a demo user fallback
  const [demoUser, setDemoUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!authUser && !authLoading) {
      setDemoUser(getDemoUser());
    }
  }, [authUser, authLoading]);

  const user = authUser ?? demoUser;
  const loading = authLoading && !demoUser;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form state -- initialised when dialog opens
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Notification preferences from API
  const {
    data: prefsData,
    loading: prefsLoading,
    error: prefsError,
    refetch: refetchPrefs,
  } = useApi<NotificationPreference[]>(
    apiUrl('/api/v1/resident/notifications', { propertyId: getPropertyId() }),
  );

  // Parse preferences, handling the useApi unwrap behavior
  const preferences = useMemo<NotificationPreference[]>(() => {
    if (!prefsData) return [];
    const raw = prefsData as unknown as { data?: NotificationPreference[] };
    const prefs = raw.data ?? (prefsData as unknown as NotificationPreference[]);
    return Array.isArray(prefs) ? prefs : [];
  }, [prefsData]);

  // Build a map: module -> enabled (using email channel as primary)
  const prefMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const pref of preferences) {
      if (pref.channel === 'email') {
        map[pref.module] = pref.enabled;
      }
    }
    return map;
  }, [preferences]);

  const [togglingPref, setTogglingPref] = useState<string | null>(null);

  const togglePreference = useCallback(
    async (module: string, currentEnabled: boolean) => {
      setTogglingPref(module);
      try {
        await apiRequest('/api/v1/resident/notifications', {
          method: 'PATCH',
          body: {
            preferences: [{ module, channel: 'email', enabled: !currentEnabled }],
          },
        });
        refetchPrefs();
      } catch {
        // Silently fail - the toggle will revert on refetch
      } finally {
        setTogglingPref(null);
      }
    },
    [refetchPrefs],
  );

  const openDialog = useCallback(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? '');
    setFieldErrors({});
    setFeedback(null);
    setDialogOpen(true);
  }, [user]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setSaving(true);
      setFeedback(null);
      setFieldErrors({});

      try {
        const payload: ProfileUpdatePayload = {};
        if (firstName !== user.firstName) payload.firstName = firstName;
        if (lastName !== user.lastName) payload.lastName = lastName;
        if ((phone || '') !== (user.phone ?? '')) payload.phone = phone;

        if (Object.keys(payload).length === 0) {
          setFeedback({ type: 'success', message: 'No changes to save.' });
          setSaving(false);
          return;
        }

        const updated = await apiClient<ProfileResponse>('/api/v1/users/me', {
          method: 'PATCH',
          body: payload,
        });

        // Update local auth state so the UI refreshes immediately
        setUser({
          ...user,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
        });

        setFeedback({ type: 'success', message: 'Profile updated successfully.' });

        // Auto-close dialog after a brief delay so user sees the success message
        setTimeout(() => {
          setDialogOpen(false);
        }, 1200);
      } catch (err) {
        if (err instanceof ApiClientError && err.fields) {
          // Map field-level validation errors from API
          const mapped: Record<string, string[]> = {};
          for (const fe of err.fields) {
            const existing = mapped[fe.field] ?? [];
            existing.push(fe.message);
            mapped[fe.field] = existing;
          }
          setFieldErrors(mapped);
          setFeedback({ type: 'error', message: 'Please fix the errors below.' });
        } else if (err instanceof ApiClientError) {
          setFeedback({ type: 'error', message: err.message });
        } else {
          setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
        }
      } finally {
        setSaving(false);
      }
    },
    [user, firstName, lastName, phone, setUser],
  );

  if (loading || !user) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl xl:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="My Account"
      description="Manage your profile, preferences, and security settings."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Profile Card */}
        <Card className="flex flex-col items-center text-center">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="xl" />
          <h2 className="mt-4 text-[20px] font-bold text-neutral-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="mt-1 text-[14px] text-neutral-500">{ROLE_DISPLAY_NAMES[user.role]}</p>
          <Badge variant="success" size="md" dot className="mt-3">
            Active
          </Badge>
          <div className="mt-6 w-full border-t border-neutral-100 pt-4">
            <div className="flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 text-[14px]">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-700">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-[14px]">
                  <Phone className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-[14px]">
                <Shield className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-700">{user.role.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
          <Button variant="secondary" fullWidth className="mt-6" onClick={openDialog}>
            Edit Profile
          </Button>
        </Card>

        {/* Settings Sections */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Security */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Security</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-4">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-neutral-500" />
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">Password</p>
                      <p className="text-[13px] text-neutral-500">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-neutral-500" />
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">
                        Two-Factor Authentication
                      </p>
                      <p className="text-[13px] text-neutral-500">Authenticator app enabled</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-neutral-500" />
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">Active Sessions</p>
                      <p className="text-[13px] text-neutral-500">2 devices currently signed in</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Notification Preferences
              </h2>
            </div>
            <CardContent>
              {prefsLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : prefsError ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <AlertTriangle className="h-5 w-5 text-neutral-400" />
                  <p className="text-[14px] text-neutral-500">Failed to load preferences.</p>
                  <Button variant="secondary" size="sm" onClick={refetchPrefs}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {NOTIFICATION_MODULES.map((mod) => {
                    const isEnabled = prefMap[mod.module] ?? true; // Default to enabled if not set
                    const isToggling = togglingPref === mod.module;
                    return (
                      <div
                        key={mod.module}
                        className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                      >
                        <div>
                          <p className="text-[14px] font-medium text-neutral-900">{mod.label}</p>
                          <p className="text-[13px] text-neutral-500">{mod.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePreference(mod.module, isEnabled)}
                          disabled={isToggling}
                          className={`relative h-6 w-11 rounded-full transition-colors ${isEnabled ? 'bg-primary-500' : 'bg-neutral-200'} ${isToggling ? 'opacity-50' : ''}`}
                          aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${mod.label}`}
                        >
                          <div
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${isEnabled ? 'left-[22px]' : 'left-0.5'}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information. Email changes require a separate verification process.
          </DialogDescription>

          {feedback && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
                feedback.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
              role="alert"
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="First Name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={fieldErrors.firstName?.[0]}
              disabled={saving}
            />
            <Input
              label="Last Name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={fieldErrors.lastName?.[0]}
              disabled={saving}
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone?.[0]}
              helperText="Optional. Format: +1 (555) 123-4567"
              disabled={saving}
            />
            <Input
              label="Email"
              value={user.email}
              disabled
              helperText="Email changes require a verification process. Contact your administrator."
            />

            <div className="mt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
