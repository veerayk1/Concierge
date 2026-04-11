'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Box,
  Brush,
  FileWarning,
  Key,
  MessageSquare,
  UserCheck,
  Circle,
  Plus,
  Loader2,
  Mail,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventType {
  id: string;
  name: string;
  group: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  enabled: boolean;
  notificationTemplate: string;
  description: string;
}

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface ApiEventType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  notificationTemplate: string | null;
  group: { id: string; name: string } | null;
  eventCount: number;
}

// Map icon slugs from DB to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  box: Box,
  'user-check': UserCheck,
  'file-warning': FileWarning,
  key: Key,
  'message-square': MessageSquare,
  brush: Brush,
};

// Map color slugs from DB to Tailwind classes
const COLOR_MAP: Record<string, { color: string; bgColor: string }> = {
  blue: { color: 'text-primary-600', bgColor: 'bg-primary-50' },
  green: { color: 'text-success-600', bgColor: 'bg-success-50' },
  red: { color: 'text-error-600', bgColor: 'bg-error-50' },
  yellow: { color: 'text-warning-600', bgColor: 'bg-warning-50' },
  orange: { color: 'text-warning-600', bgColor: 'bg-warning-50' },
  purple: { color: 'text-purple-600', bgColor: 'bg-purple-50' },
  cyan: { color: 'text-info-600', bgColor: 'bg-info-50' },
};

// ---------------------------------------------------------------------------
// Create Event Type Dialog
// ---------------------------------------------------------------------------

interface EventGroupOption {
  id: string;
  name: string;
  slug: string;
}

function CreateEventTypeDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [groups, setGroups] = useState<EventGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch event groups when dialog opens
  useEffect(() => {
    if (!open) return;
    setGroupsLoading(true);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined' && localStorage.getItem('demo_role')) {
      headers['x-demo-role'] = localStorage.getItem('demo_role')!;
    }
    fetch(`/api/v1/event-groups?propertyId=${getPropertyId()}`, { headers })
      .then((res) => res.json())
      .then((result) => {
        if (result.data && Array.isArray(result.data)) {
          setGroups(result.data);
        }
      })
      .catch(() => {})
      .finally(() => setGroupsLoading(false));
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const name = (form.get('name') as string).trim();
    const slug = (form.get('slug') as string).trim();
    const eventGroupId = form.get('eventGroupId') as string;
    const icon = (form.get('icon') as string) || 'circle';
    const color = (form.get('color') as string) || 'blue';

    // Validate slug pattern
    if (!slug || !/^[a-z0-9_]+$/.test(slug)) {
      setError(
        'Slug must contain only lowercase letters, numbers, and underscores (e.g. package_delivery)',
      );
      setSubmitting(false);
      return;
    }

    if (!name) {
      setError('Name is required');
      setSubmitting(false);
      return;
    }

    if (!eventGroupId) {
      setError('Event group is required');
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest('/api/v1/event-types', {
        method: 'POST',
        body: {
          propertyId: getPropertyId(),
          name,
          slug,
          eventGroupId,
          icon,
          color,
          isActive: true,
          notifyOnCreate: true,
        },
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || 'Failed to create event type');
        return;
      }

      setSuccessMsg(`Event type "${name}" created.`);
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
        onSuccess();
      }, 1000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Plus className="text-primary-500 h-5 w-5" />
          Add Event Type
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new event type for the security console and event log.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {error && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="border-success-200 bg-success-50 text-success-700 rounded-xl border px-4 py-3 text-[14px]">
              {successMsg}
            </div>
          )}

          <Input name="name" label="Name" placeholder="e.g. Package Delivery" required />
          <Input
            name="slug"
            label="Slug"
            placeholder="e.g. package_delivery"
            required
            helperText="Lowercase letters, numbers, and underscores only"
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Event Group<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              name="eventGroupId"
              disabled={groupsLoading}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
              required
            >
              <option value="">{groupsLoading ? 'Loading groups...' : 'Select a group...'}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Icon</label>
              <select
                name="icon"
                defaultValue="circle"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
              >
                <option value="circle">Circle</option>
                <option value="box">Box</option>
                <option value="user-check">User Check</option>
                <option value="file-warning">File Warning</option>
                <option value="key">Key</option>
                <option value="message-square">Message</option>
                <option value="brush">Brush</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Color</label>
              <select
                name="color"
                defaultValue="blue"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
                <option value="purple">Purple</option>
                <option value="cyan">Cyan</option>
              </select>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Event Type'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventTypesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- Email Config state ----
  const [emailConfigOpen, setEmailConfigOpen] = useState(false);
  const [emailConfigType, setEmailConfigType] = useState<EventType | null>(null);
  const [ccInput, setCcInput] = useState('');
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [ccLoading, setCcLoading] = useState(false);
  const [ccSaving, setCcSaving] = useState(false);
  const [ccSaved, setCcSaved] = useState(false);
  const [ccError, setCcError] = useState<string | null>(null);
  const [ccInputError, setCcInputError] = useState<string | null>(null);

  function openEmailConfig(et: EventType) {
    setEmailConfigType(et);
    setCcAddresses([]);
    setCcInput('');
    setCcError(null);
    setCcInputError(null);
    setCcSaved(false);
    setEmailConfigOpen(true);
    setCcLoading(true);
    apiRequest(
      `/api/v1/event-types/email-config?propertyId=${getPropertyId()}&eventTypeId=${et.id}`,
      { method: 'GET' },
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.autoCcAddresses) {
          setCcAddresses(json.data.autoCcAddresses);
        }
      })
      .catch(() => {}) // 404 = no config yet, start with empty list
      .finally(() => setCcLoading(false));
  }

  function addCcAddress() {
    const addr = ccInput.trim();
    if (!addr) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setCcInputError('Enter a valid email address');
      return;
    }
    if (ccAddresses.includes(addr)) {
      setCcInputError('Address already added');
      return;
    }
    if (ccAddresses.length >= 10) {
      setCcInputError('Maximum 10 CC recipients allowed');
      return;
    }
    setCcAddresses((prev) => [...prev, addr]);
    setCcInput('');
    setCcInputError(null);
    setCcSaved(false);
  }

  function removeCcAddress(addr: string) {
    setCcAddresses((prev) => prev.filter((a) => a !== addr));
    setCcSaved(false);
  }

  async function saveCcConfig() {
    if (!emailConfigType) return;
    setCcSaving(true);
    setCcError(null);
    try {
      const res = await apiRequest('/api/v1/event-types/email-config', {
        method: 'POST',
        body: {
          propertyId: getPropertyId(),
          eventTypeId: emailConfigType.id,
          autoCcAddresses: ccAddresses,
        },
      });
      if (res.ok) {
        setCcSaved(true);
      } else {
        const json = await res.json().catch(() => ({}));
        setCcError((json as { message?: string }).message || 'Failed to save. Please try again.');
      }
    } catch {
      setCcError('Network error. Please try again.');
    } finally {
      setCcSaving(false);
    }
  }

  const {
    data: apiEventTypes,
    loading,
    refetch,
  } = useApi<ApiEventType[]>(apiUrl('/api/v1/event-types', { propertyId: getPropertyId() }));

  const mergedEventTypes = useMemo<EventType[]>(() => {
    if (!apiEventTypes || apiEventTypes.length === 0) return [];
    return apiEventTypes.map((et) => {
      const colors = COLOR_MAP[et.color || ''] || {
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
      };
      return {
        id: et.id,
        name: et.name,
        group: et.group?.name || 'General',
        icon: ICON_MAP[et.icon || ''] || Circle,
        color: colors.color,
        bgColor: colors.bgColor,
        enabled: et.isActive,
        notificationTemplate: et.notificationTemplate || '',
        description: `${et.eventCount} event${et.eventCount === 1 ? '' : 's'} logged`,
      };
    });
  }, [apiEventTypes]);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  // Use API data when available
  const displayEventTypes = apiEventTypes ? mergedEventTypes : eventTypes;

  function toggleEventType(id: string) {
    setEventTypes((prev) =>
      prev.map((et) => (et.id === id ? { ...et, enabled: !et.enabled } : et)),
    );
  }

  async function handleSaveChanges() {
    setSaving(true);
    try {
      const updates = displayEventTypes.map((et) => ({
        id: et.id,
        isActive: et.enabled,
      }));
      const res = await apiRequest('/api/v1/event-types/batch', {
        method: 'PATCH',
        body: { propertyId: getPropertyId(), updates },
      });
      if (res.ok) {
        refetch();
      } else {
        const result = await res.json().catch(() => ({}));
        alert(result.message || 'Failed to save changes. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
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
            Event Type Configuration
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Configure event types, groups, icons, and notification templates.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Event Type
        </Button>
      </div>

      {/* Event Types List */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Event Types ({displayEventTypes.length})
        </h2>
        {displayEventTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
              <Circle className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-neutral-600">
              No event types configured
            </p>
            <p className="mt-1 text-[13px] text-neutral-400">
              Create event types to start logging events in the security console.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-5"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Event Type
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEventTypes.map((et) => {
              const Icon = et.icon;
              return (
                <Card key={et.id}>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${et.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${et.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-neutral-900">
                              {et.name}
                            </h3>
                            <Badge variant="default" size="sm">
                              {et.group}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[13px] text-neutral-500">{et.description}</p>
                        </div>
                        {/* Auto-CC Email Config Button */}
                        <button
                          type="button"
                          onClick={() => openEmailConfig(et)}
                          title="Configure auto-CC emails"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-700"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        {/* Toggle */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={et.enabled}
                          onClick={() => toggleEventType(et.id)}
                          className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                            et.enabled ? 'bg-primary-500' : 'bg-neutral-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              et.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Notification Template */}
                      {et.enabled && (
                        <div className="pl-14">
                          <Input
                            label="Notification Template"
                            defaultValue={et.notificationTemplate}
                            helperText="Use {{unit}}, {{visitor_name}}, {{summary}}, {{staff}} as placeholders."
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={handleSaveChanges} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Email Config Dialog */}
      <Dialog open={emailConfigOpen} onOpenChange={(o) => !o && setEmailConfigOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
            <Mail className="text-primary-500 h-5 w-5" />
            Email Configuration
            {emailConfigType && (
              <span className="font-normal text-neutral-500">— {emailConfigType.name}</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-500">
            These addresses are automatically notified whenever a new event of this type is created.
            Maximum 10 recipients.
          </DialogDescription>

          <div className="mt-6 flex flex-col gap-5">
            {/* Input row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-neutral-700">AUTO-CC RECIPIENTS</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={ccInput}
                  onChange={(e) => {
                    setCcInput(e.target.value);
                    setCcInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addCcAddress();
                    }
                  }}
                  placeholder="manager@building.com"
                  disabled={ccLoading || ccAddresses.length >= 10}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={addCcAddress}
                  disabled={ccLoading || !ccInput.trim() || ccAddresses.length >= 10}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200 flex h-[44px] items-center gap-1.5 rounded-xl px-4 text-[14px] font-medium text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              {ccInputError && <p className="text-error-600 text-[13px]">{ccInputError}</p>}
              <p className="text-[12px] text-neutral-400">
                Press Enter or comma to add. {ccAddresses.length}/10 addresses.
              </p>
            </div>

            {/* Loading */}
            {ccLoading && (
              <div className="flex items-center gap-2 text-[14px] text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading configuration...
              </div>
            )}

            {/* Tags */}
            {!ccLoading && ccAddresses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ccAddresses.map((addr) => (
                  <span
                    key={addr}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[13px] text-neutral-700"
                  >
                    {addr}
                    <button
                      type="button"
                      onClick={() => removeCcAddress(addr)}
                      className="text-neutral-400 transition-colors hover:text-neutral-700"
                      aria-label={`Remove ${addr}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {!ccLoading && ccAddresses.length === 0 && (
              <p className="rounded-xl border border-dashed border-neutral-200 py-4 text-center text-[13px] text-neutral-400">
                No auto-CC recipients configured. Add addresses above.
              </p>
            )}

            {/* Error */}
            {ccError && (
              <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
                {ccError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={() => setEmailConfigOpen(false)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCcConfig}
                disabled={ccSaving || ccLoading}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-medium text-white transition-colors ${
                  ccSaved
                    ? 'bg-success-500'
                    : 'bg-primary-500 hover:bg-primary-600 disabled:bg-primary-200'
                }`}
              >
                {ccSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : ccSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Event Type Dialog */}
      <CreateEventTypeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
