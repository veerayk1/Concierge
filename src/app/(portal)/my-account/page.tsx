'use client';

import { Bell, Globe, Key, Lock, Mail, Phone, Shield, Smartphone, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { ROLE_DISPLAY_NAMES } from '@/lib/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MyAccountPage() {
  const { user, loading } = useAuth();

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
              <div className="flex items-center gap-3 text-[14px]">
                <Shield className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-700">{user.role.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
          <Button variant="secondary" fullWidth className="mt-6">
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
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: 'Package Notifications',
                    description: 'When a package arrives for you',
                    enabled: true,
                  },
                  {
                    label: 'Maintenance Updates',
                    description: 'Status changes on your requests',
                    enabled: true,
                  },
                  {
                    label: 'Announcements',
                    description: 'Building-wide announcements',
                    enabled: true,
                  },
                  {
                    label: 'Amenity Reminders',
                    description: 'Upcoming booking reminders',
                    enabled: false,
                  },
                  {
                    label: 'Community Updates',
                    description: 'New classified ads and events',
                    enabled: false,
                  },
                ].map((pref) => (
                  <div
                    key={pref.label}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{pref.label}</p>
                      <p className="text-[13px] text-neutral-500">{pref.description}</p>
                    </div>
                    <div
                      className={`relative h-6 w-11 rounded-full transition-colors ${pref.enabled ? 'bg-primary-500' : 'bg-neutral-200'}`}
                    >
                      <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${pref.enabled ? 'left-[22px]' : 'left-0.5'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
