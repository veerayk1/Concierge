'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, Phone, Clock, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChannelConfig {
  email: boolean;
  sms: boolean;
  push: boolean;
  voice: boolean;
}

interface ModuleNotificationConfig {
  id: string;
  module: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

interface GlobalSettings {
  defaultFromName: string;
  defaultFromEmail: string;
  replyToEmail: string;
  emailFooterText: string;
}

interface QuietHoursConfig {
  startTime: string;
  endTime: string;
  overrideForEmergencies: boolean;
}

interface NotificationSettingsPayload {
  globalSettings: GlobalSettings;
  channels: ChannelConfig;
  modules: ModuleNotificationConfig[];
  quietHours: QuietHoursConfig;
  digestMode: string;
  digestTime: string;
}

// ---------------------------------------------------------------------------
// Defaults (used when no saved settings exist)
// ---------------------------------------------------------------------------

const DEFAULT_GLOBAL: GlobalSettings = {
  defaultFromName: '',
  defaultFromEmail: '',
  replyToEmail: '',
  emailFooterText: '',
};

const DEFAULT_CHANNELS: ChannelConfig = {
  email: true,
  sms: true,
  push: true,
  voice: false,
};

const DEFAULT_MODULES: ModuleNotificationConfig[] = [
  { id: 'mod-1', module: 'Packages', email: true, sms: true, push: true, inApp: true },
  { id: 'mod-2', module: 'Maintenance', email: true, sms: true, push: true, inApp: true },
  { id: 'mod-3', module: 'Security', email: true, sms: true, push: true, inApp: true },
  { id: 'mod-4', module: 'Visitors', email: true, sms: false, push: true, inApp: true },
  { id: 'mod-5', module: 'Amenities', email: true, sms: false, push: true, inApp: true },
  { id: 'mod-6', module: 'Announcements', email: true, sms: true, push: true, inApp: true },
  { id: 'mod-7', module: 'Parking', email: true, sms: false, push: false, inApp: true },
  { id: 'mod-8', module: 'Events', email: true, sms: false, push: true, inApp: true },
  { id: 'mod-9', module: 'Training', email: true, sms: false, push: false, inApp: true },
  { id: 'mod-10', module: 'Community', email: false, sms: false, push: false, inApp: true },
  { id: 'mod-11', module: 'Governance', email: true, sms: false, push: false, inApp: true },
  { id: 'mod-12', module: 'Emergency', email: true, sms: true, push: true, inApp: true },
];

const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  startTime: '22:00',
  endTime: '07:00',
  overrideForEmergencies: true,
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function NotificationSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <Skeleton className="h-4 w-32" />
      <div>
        <Skeleton className="mb-2 h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      {/* Global settings skeleton */}
      <div>
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="space-y-5 rounded-2xl border border-neutral-200/80 bg-white p-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      {/* Channel config skeleton */}
      <div>
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-5 rounded-2xl border border-neutral-200/80 bg-white p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                  <Skeleton className="mb-1 h-4 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Module table skeleton */}
      <div>
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-8">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationSettingsPage() {
  const propertyId = getPropertyId();
  const fetchUrl = apiUrl('/api/v1/settings/notifications', { propertyId });

  const {
    data: savedSettings,
    loading,
    error: loadError,
  } = useApi<NotificationSettingsPayload | null>(fetchUrl);

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL);
  const [channels, setChannels] = useState<ChannelConfig>(DEFAULT_CHANNELS);
  const [modules, setModules] = useState<ModuleNotificationConfig[]>(DEFAULT_MODULES);
  const [quietHours, setQuietHours] = useState<QuietHoursConfig>(DEFAULT_QUIET_HOURS);
  const [digestMode, setDigestMode] = useState('immediate');
  const [digestTime, setDigestTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Hydrate state from API response (or use defaults if null/empty)
  useEffect(() => {
    if (loading) return;
    if (savedSettings) {
      if (savedSettings.globalSettings) setGlobalSettings(savedSettings.globalSettings);
      if (savedSettings.channels) setChannels(savedSettings.channels);
      if (savedSettings.modules?.length) setModules(savedSettings.modules);
      if (savedSettings.quietHours) setQuietHours(savedSettings.quietHours);
      if (savedSettings.digestMode) setDigestMode(savedSettings.digestMode);
      if (savedSettings.digestTime) setDigestTime(savedSettings.digestTime);
    }
    setInitialized(true);
  }, [loading, savedSettings]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const response = await apiRequest('/api/v1/settings/notifications', {
        method: 'PUT',
        body: {
          propertyId,
          globalSettings,
          channels,
          modules,
          quietHours,
          digestMode,
          digestTime,
        },
      });

      if (response.ok) {
        setSaveMessage('Changes saved successfully.');
      } else {
        const result = await response.json().catch(() => ({}));
        setSaveMessage(result.message || `Failed to save (${response.status}). Please try again.`);
      }
    } catch {
      setSaveMessage('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, [propertyId, globalSettings, channels, modules, quietHours, digestMode, digestTime]);

  function toggleModuleChannel(moduleId: string, channel: 'email' | 'sms' | 'push' | 'inApp') {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, [channel]: !m[channel] } : m)),
    );
  }

  // Show skeleton while loading from API
  if (loading || !initialized) {
    return <NotificationSettingsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Notification Settings
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure email, SMS, and push notification settings for your property.
        </p>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="border-warning-200 bg-warning-50 rounded-xl border px-4 py-3">
          <p className="text-warning-700 text-[14px]">
            Could not load saved settings — showing defaults. {loadError}
          </p>
        </div>
      )}

      {/* Global Settings */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Global Settings
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Default From Name"
                  value={globalSettings.defaultFromName}
                  onChange={(e) =>
                    setGlobalSettings((s) => ({ ...s, defaultFromName: e.target.value }))
                  }
                  placeholder="Your property name"
                  required
                />
                <Input
                  label="Default From Email"
                  type="email"
                  value={globalSettings.defaultFromEmail}
                  onChange={(e) =>
                    setGlobalSettings((s) => ({ ...s, defaultFromEmail: e.target.value }))
                  }
                  placeholder="notifications@example.com"
                  required
                />
              </div>
              <Input
                label="Reply-To Email"
                type="email"
                value={globalSettings.replyToEmail}
                onChange={(e) => setGlobalSettings((s) => ({ ...s, replyToEmail: e.target.value }))}
                placeholder="support@example.com"
                helperText="Replies from residents will be sent to this address."
              />
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email-footer"
                  className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                >
                  Email Footer Text
                </label>
                <textarea
                  id="email-footer"
                  rows={3}
                  value={globalSettings.emailFooterText}
                  onChange={(e) =>
                    setGlobalSettings((s) => ({ ...s, emailFooterText: e.target.value }))
                  }
                  placeholder="Property name and address..."
                  className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
                />
                <p className="text-[13px] text-neutral-500">
                  Appended to the bottom of all outgoing notification emails.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Configuration */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Channel Configuration
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-info-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Mail className="text-info-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">Email</p>
                    <p className="text-[13px] text-neutral-500">
                      Send notifications via email to residents and staff.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={channels.email}
                  onCheckedChange={(checked) => setChannels((c) => ({ ...c, email: checked }))}
                />
              </div>

              <div className="border-t border-neutral-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-success-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <MessageSquare className="text-success-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">SMS</p>
                    <p className="text-[13px] text-neutral-500">
                      Send text message notifications via Twilio.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={channels.sms}
                  onCheckedChange={(checked) => setChannels((c) => ({ ...c, sms: checked }))}
                />
              </div>

              <div className="border-t border-neutral-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Smartphone className="text-primary-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">Push Notifications</p>
                    <p className="text-[13px] text-neutral-500">
                      Browser and mobile push notifications via FCM.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={channels.push}
                  onCheckedChange={(checked) => setChannels((c) => ({ ...c, push: checked }))}
                />
              </div>

              <div className="border-t border-neutral-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-error-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Phone className="text-error-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">
                      Voice (Emergency Only)
                    </p>
                    <p className="text-[13px] text-neutral-500">
                      Automated voice calls for emergency broadcasts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="error" size="md">
                    Emergency
                  </Badge>
                  <Switch
                    checked={channels.voice}
                    onCheckedChange={(checked) => setChannels((c) => ({ ...c, voice: checked }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module-Specific Settings */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Module-Specific Settings
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80">
                  <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                    Module
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                    <div className="flex items-center justify-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                    <div className="flex items-center justify-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      SMS
                    </div>
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                    <div className="flex items-center justify-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" />
                      Push
                    </div>
                  </th>
                  <th className="px-5 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                    <div className="flex items-center justify-center gap-1.5">
                      <Bell className="h-3.5 w-3.5" />
                      In-App
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {modules.map((mod) => (
                  <tr key={mod.id} className="transition-colors hover:bg-neutral-50/50">
                    <td className="px-5 py-3.5">
                      <span className="text-[14px] font-medium text-neutral-900">{mod.module}</span>
                      {mod.module === 'Emergency' && (
                        <Badge variant="error" size="sm" className="ml-2">
                          Critical
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={mod.email}
                          onChange={() => toggleModuleChannel(mod.id, 'email')}
                          disabled={!channels.email}
                          className="text-primary-500 focus:ring-primary-100 h-4 w-4 rounded border-neutral-300 transition-colors disabled:opacity-40"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={mod.sms}
                          onChange={() => toggleModuleChannel(mod.id, 'sms')}
                          disabled={!channels.sms}
                          className="text-primary-500 focus:ring-primary-100 h-4 w-4 rounded border-neutral-300 transition-colors disabled:opacity-40"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={mod.push}
                          onChange={() => toggleModuleChannel(mod.id, 'push')}
                          disabled={!channels.push}
                          className="text-primary-500 focus:ring-primary-100 h-4 w-4 rounded border-neutral-300 transition-colors disabled:opacity-40"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={mod.inApp}
                          onChange={() => toggleModuleChannel(mod.id, 'inApp')}
                          className="text-primary-500 focus:ring-primary-100 h-4 w-4 rounded border-neutral-300 transition-colors disabled:opacity-40"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Quiet Hours
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <Moon className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-neutral-900">Quiet Hours</p>
                  <p className="text-[13px] text-neutral-500">
                    Non-emergency notifications will be held during quiet hours and delivered when
                    quiet hours end.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => setQuietHours((q) => ({ ...q, startTime: e.target.value }))}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => setQuietHours((q) => ({ ...q, endTime: e.target.value }))}
                />
              </div>
              <div className="bg-error-50/50 flex items-center justify-between rounded-xl px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium text-neutral-900">
                    Override for Emergencies
                  </p>
                  <p className="text-[13px] text-neutral-500">
                    Emergency broadcasts will always be sent, even during quiet hours.
                  </p>
                </div>
                <Switch
                  checked={quietHours.overrideForEmergencies}
                  onCheckedChange={(checked) =>
                    setQuietHours((q) => ({ ...q, overrideForEmergencies: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Digest Settings */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Digest Settings
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Clock className="text-primary-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-neutral-900">Notification Digest</p>
                  <p className="text-[13px] text-neutral-500">
                    Group multiple notifications into a single digest to reduce notification
                    fatigue.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                    Digest Mode
                  </label>
                  <Select value={digestMode} onValueChange={setDigestMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (No Digest)</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[13px] text-neutral-500">
                    Controls how often grouped notifications are sent.
                  </p>
                </div>
                <Input
                  label="Digest Delivery Time"
                  type="time"
                  value={digestTime}
                  onChange={(e) => setDigestTime(e.target.value)}
                  helperText="Time of day to send daily or weekly digests."
                  disabled={digestMode === 'immediate' || digestMode === 'hourly'}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {saveMessage && (
          <span
            className={`text-[14px] ${
              saveMessage.includes('success') ? 'text-success-600' : 'text-error-600'
            }`}
          >
            {saveMessage}
          </span>
        )}
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
