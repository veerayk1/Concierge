'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Car, Check, Clock, Grid3X3, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParkingArea {
  id: string;
  name: string;
  code: string;
  totalSpots: number;
  visitorSpots: number;
}

interface PermitType {
  id: string;
  name: string;
  duration: string;
  renewable: boolean;
  autoRenew: boolean;
  requiresApproval: boolean;
  maxPerUnit: number;
}

type LimitScope = 'Per Unit' | 'Per Plate' | 'Per Area';
type LimitPeriod = 'Per Week' | 'Per Month' | 'Per Year' | 'Consecutive Days' | 'Day Visits';

type LimitMatrix = Record<LimitScope, Record<LimitPeriod, number>>;

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_AREAS: ParkingArea[] = [];

const INITIAL_PERMIT_TYPES: PermitType[] = [];

const SCOPES: LimitScope[] = ['Per Unit', 'Per Plate', 'Per Area'];
const PERIODS: LimitPeriod[] = [
  'Per Week',
  'Per Month',
  'Per Year',
  'Consecutive Days',
  'Day Visits',
];

// Maps between display labels and API values
const SCOPE_MAP: Record<LimitScope, string> = {
  'Per Unit': 'per_unit',
  'Per Plate': 'per_plate',
  'Per Area': 'per_area',
};
const PERIOD_MAP: Record<LimitPeriod, string> = {
  'Per Week': 'per_week',
  'Per Month': 'per_month',
  'Per Year': 'per_year',
  'Consecutive Days': 'consecutive',
  'Day Visits': 'day_visit',
};
const REVERSE_SCOPE_MAP: Record<string, LimitScope> = Object.fromEntries(
  Object.entries(SCOPE_MAP).map(([k, v]) => [v, k as LimitScope]),
);
const REVERSE_PERIOD_MAP: Record<string, LimitPeriod> = Object.fromEntries(
  Object.entries(PERIOD_MAP).map(([k, v]) => [v, k as LimitPeriod]),
);

const INITIAL_LIMITS: LimitMatrix = {
  'Per Unit': {
    'Per Week': 0,
    'Per Month': 0,
    'Per Year': 0,
    'Consecutive Days': 0,
    'Day Visits': 0,
  },
  'Per Plate': {
    'Per Week': 0,
    'Per Month': 0,
    'Per Year': 0,
    'Consecutive Days': 0,
    'Day Visits': 0,
  },
  'Per Area': {
    'Per Week': 0,
    'Per Month': 0,
    'Per Year': 0,
    'Consecutive Days': 0,
    'Day Visits': 0,
  },
};

const TABS = ['Areas', 'Permit Types', 'Limits', 'Self-Service', 'Notifications'] as const;
type Tab = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Notification role definitions (Gap 13.2)
// ---------------------------------------------------------------------------

const NOTIFICATION_ROLES = [
  { slug: 'board_member', name: 'Board Member' },
  { slug: 'front_desk', name: 'Front Desk / Concierge' },
  { slug: 'offsite_owner', name: 'Offsite Owner' },
  { slug: 'property_manager', name: 'Property Manager' },
  { slug: 'security_supervisor', name: 'Security Supervisor' },
  { slug: 'security_guard', name: 'Security Guard' },
  { slug: 'superintendent', name: 'Superintendent' },
  { slug: 'resident_tenant', name: 'Resident (Tenant)' },
  { slug: 'property_admin', name: 'Property Admin' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParkingConfigurationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Areas');
  const [areas, setAreas] = useState(INITIAL_AREAS);
  const [permitTypes] = useState(INITIAL_PERMIT_TYPES);
  const [limits, setLimits] = useState(INITIAL_LIMITS);

  // Limits tab API state
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [limitsSaving, setLimitsSaving] = useState(false);
  const [limitsSaved, setLimitsSaved] = useState(false);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  // Notifications tab state (Gap 13.2)
  const [notificationRoles, setNotificationRoles] = useState<string[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Self-service state
  const [allowResidentVisitorParking, setAllowResidentVisitorParking] = useState(true);
  const [maxVisitorPermitsPerDay, setMaxVisitorPermitsPerDay] = useState(2);
  const [defaultVisitorDuration, setDefaultVisitorDuration] = useState('24');
  const [maxVisitorDays, setMaxVisitorDays] = useState(3);
  const [requirePlateNumber, setRequirePlateNumber] = useState(true);

  // Load limits from API when Limits tab is activated
  useEffect(() => {
    if (activeTab !== 'Limits') return;
    const propertyId = typeof window !== 'undefined' ? localStorage.getItem('propertyId') : null;
    if (!propertyId) return;

    setLimitsLoading(true);
    setLimitsError(null);
    apiRequest(`/api/v1/parking/limits?propertyId=${propertyId}`, { method: 'GET' })
      .then((r) => r.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const matrix: LimitMatrix = JSON.parse(JSON.stringify(INITIAL_LIMITS));
          for (const record of json.data) {
            const scope = REVERSE_SCOPE_MAP[record.scope];
            const period = REVERSE_PERIOD_MAP[record.period];
            if (scope && period) {
              matrix[scope][period] = record.isActive ? record.maxCount : 0;
            }
          }
          setLimits(matrix);
        }
      })
      .catch(() => setLimitsError('Failed to load parking limits'))
      .finally(() => setLimitsLoading(false));
  }, [activeTab]);

  // Load notification roles when Notifications tab is activated
  useEffect(() => {
    if (activeTab !== 'Notifications') return;
    const propertyId = typeof window !== 'undefined' ? localStorage.getItem('propertyId') : null;
    if (!propertyId) return;

    setNotifLoading(true);
    setNotifError(null);
    apiRequest(`/api/v1/properties/${propertyId}`, { method: 'GET' })
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.parkingNotificationRoles) {
          setNotificationRoles(
            Array.isArray(json.data.parkingNotificationRoles)
              ? json.data.parkingNotificationRoles
              : [],
          );
        }
      })
      .catch(() => setNotifError('Failed to load notification settings'))
      .finally(() => setNotifLoading(false));
  }, [activeTab]);

  async function handleSaveNotifications() {
    const propertyId = typeof window !== 'undefined' ? localStorage.getItem('propertyId') : null;
    if (!propertyId) return;

    setNotifSaving(true);
    setNotifError(null);
    setNotifSaved(false);

    try {
      const res = await apiRequest(`/api/v1/properties/${propertyId}`, {
        method: 'PATCH',
        body: { parkingNotificationRoles: notificationRoles },
      });
      if (!res.ok) {
        const json = await res.json();
        setNotifError(json.message ?? 'Failed to save notification settings');
      } else {
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 3000);
      }
    } catch {
      setNotifError('Network error — could not save notification settings');
    } finally {
      setNotifSaving(false);
    }
  }

  function toggleNotificationRole(slug: string) {
    setNotificationRoles((prev) =>
      prev.includes(slug) ? prev.filter((r) => r !== slug) : [...prev, slug],
    );
  }

  async function handleSaveLimits() {
    const propertyId = typeof window !== 'undefined' ? localStorage.getItem('propertyId') : null;
    if (!propertyId) return;

    setLimitsSaving(true);
    setLimitsError(null);
    setLimitsSaved(false);

    const limitsPayload = SCOPES.flatMap((scope) =>
      PERIODS.map((period) => ({
        scope: SCOPE_MAP[scope],
        period: PERIOD_MAP[period],
        maxCount: limits[scope][period],
        ...(period === 'Consecutive Days' && limits[scope][period] > 0
          ? { consecutiveDays: limits[scope][period] }
          : {}),
        ...(period === 'Day Visits' && limits[scope][period] > 0
          ? { dayVisitLimit: limits[scope][period] }
          : {}),
      })),
    );

    try {
      const res = await apiRequest('/api/v1/parking/limits', {
        method: 'PUT',
        body: { propertyId, limits: limitsPayload },
      });
      if (!res.ok) {
        const json = await res.json();
        setLimitsError(json.message ?? 'Failed to save limits');
      } else {
        setLimitsSaved(true);
        setTimeout(() => setLimitsSaved(false), 3000);
      }
    } catch {
      setLimitsError('Network error — could not save limits');
    } finally {
      setLimitsSaving(false);
    }
  }

  function removeArea(id: string) {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }

  function updateLimit(scope: LimitScope, period: LimitPeriod, value: number) {
    setLimits((prev) => ({
      ...prev,
      [scope]: { ...prev[scope], [period]: value },
    }));
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
          Parking Configuration
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure parking areas, permit types, usage limits, and self-service options.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-[14px] font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Tab: Areas                                                        */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Areas' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Parking Areas
            </h2>
            <Button size="sm" variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Area
            </Button>
          </div>
          {areas.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                    <Car className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    No parking areas configured
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    Add parking areas to manage spots and visitor parking for your property.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {areas.map((area) => (
                <Card key={area.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                          <Car className="text-primary-600 h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold text-neutral-900">
                            {area.name}
                          </h3>
                          <p className="mt-0.5 text-[13px] text-neutral-500">Code: {area.code}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArea(area.id)}
                        className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Input
                        label="Total Spots"
                        type="number"
                        defaultValue={String(area.totalSpots)}
                      />
                      <Input
                        label="Visitor Spots"
                        type="number"
                        defaultValue={String(area.visitorSpots)}
                        helperText="Spots reserved for visitor parking."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Tab: Permit Types                                                 */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Permit Types' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Permit Types
            </h2>
            <Button size="sm" variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Permit Type
            </Button>
          </div>
          {permitTypes.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                    <Clock className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    No permit types configured
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    Add permit types to define parking permit durations, limits, and approval rules.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {permitTypes.map((pt) => (
                <Card key={pt.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-info-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                          <Clock className="text-info-600 h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold text-neutral-900">{pt.name}</h3>
                          <p className="mt-0.5 text-[13px] text-neutral-500">
                            Duration: {pt.duration} &middot; Max per unit: {pt.maxPerUnit}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {pt.renewable && (
                              <Badge variant="success" size="sm">
                                Renewable
                              </Badge>
                            )}
                            {pt.autoRenew && (
                              <Badge variant="info" size="sm">
                                Auto-Renew
                              </Badge>
                            )}
                            {pt.requiresApproval && (
                              <Badge variant="warning" size="sm">
                                Requires Approval
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <Input label="Duration" defaultValue={pt.duration} />
                      <Input
                        label="Max Per Unit"
                        type="number"
                        defaultValue={String(pt.maxPerUnit)}
                      />
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                          Requires Approval
                        </label>
                        <select
                          defaultValue={pt.requiresApproval ? 'yes' : 'no'}
                          className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 ease-out hover:border-neutral-300 focus:ring-4 focus:outline-none"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Tab: Limits                                                       */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Limits' && (
        <div>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Parking Limits Matrix
              </h2>
              <p className="text-[13px] text-neutral-500">
                Set maximum parking usage across different scopes and time periods. Enter 0 for
                unlimited. These limits are enforced when creating new permits.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveLimits}
              disabled={limitsSaving || limitsLoading}
              className="shrink-0"
            >
              {limitsSaved ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Saved
                </>
              ) : limitsSaving ? (
                'Saving…'
              ) : (
                'Save Limits'
              )}
            </Button>
          </div>

          {limitsError && (
            <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-[13px] text-red-600">
              {limitsError}
            </p>
          )}

          <Card padding="none">
            <CardContent>
              {limitsLoading ? (
                <div className="flex items-center justify-center py-12 text-[14px] text-neutral-400">
                  Loading limits…
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/80">
                        <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                          <div className="flex items-center gap-1.5">
                            <Grid3X3 className="h-3.5 w-3.5" />
                            Scope / Period
                          </div>
                        </th>
                        {PERIODS.map((period) => (
                          <th
                            key={period}
                            className="px-3 py-3 text-center text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase"
                          >
                            {period}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {SCOPES.map((scope) => (
                        <tr key={scope}>
                          <td className="px-5 py-3.5 text-[14px] font-medium text-neutral-900">
                            {scope}
                          </td>
                          {PERIODS.map((period) => (
                            <td key={period} className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                value={limits[scope][period]}
                                onChange={(e) =>
                                  updateLimit(scope, period, parseInt(e.target.value, 10) || 0)
                                }
                                className="focus:border-primary-500 focus:ring-primary-100 mx-auto h-[36px] w-[72px] rounded-lg border border-neutral-200 bg-white px-2 text-center text-[14px] text-neutral-900 transition-all duration-200 ease-out hover:border-neutral-300 focus:ring-4 focus:outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Tab: Self-Service                                                 */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Self-Service' && (
        <div className="space-y-8">
          {/* Resident Self-Service */}
          <div>
            <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Resident Self-Service
            </h2>
            <Card>
              <CardContent>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-success-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <Users className="text-success-600 h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-neutral-900">
                          Allow Resident Visitor Parking Registration
                        </h3>
                        <p className="text-[13px] text-neutral-500">
                          Let residents register visitor parking permits through the resident
                          portal.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowResidentVisitorParking}
                      onClick={() => setAllowResidentVisitorParking(!allowResidentVisitorParking)}
                      className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                        allowResidentVisitorParking ? 'bg-primary-500' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          allowResidentVisitorParking ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <Input
                    label="Max Visitor Permits Per Unit Per Day"
                    type="number"
                    value={String(maxVisitorPermitsPerDay)}
                    onChange={(e) => setMaxVisitorPermitsPerDay(parseInt(e.target.value, 10) || 0)}
                    helperText="Maximum number of visitor parking permits a single unit can register per day."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visitor Pass Settings */}
          <div>
            <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Visitor Pass Settings
            </h2>
            <Card>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Default Duration (Hours)"
                      type="number"
                      value={defaultVisitorDuration}
                      onChange={(e) => setDefaultVisitorDuration(e.target.value)}
                      helperText="Default duration for visitor parking passes."
                    />
                    <Input
                      label="Max Days"
                      type="number"
                      value={String(maxVisitorDays)}
                      onChange={(e) => setMaxVisitorDays(parseInt(e.target.value, 10) || 0)}
                      helperText="Maximum number of days for a visitor pass."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-medium text-neutral-900">
                        Require License Plate Number
                      </h3>
                      <p className="text-[13px] text-neutral-500">
                        Visitors must provide a license plate number when registering.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={requirePlateNumber}
                      onClick={() => setRequirePlateNumber(!requirePlateNumber)}
                      className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                        requirePlateNumber ? 'bg-primary-500' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          requirePlateNumber ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Tab: Notifications (Gap 13.2)                                    */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Notifications' && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Parking Limit Notifications
              </h2>
              <p className="text-[13px] text-neutral-500">
                Select which roles receive a notification when a parking limit is exceeded.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveNotifications}
              disabled={notifSaving || notifLoading}
              className="shrink-0"
            >
              {notifSaved ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Saved
                </>
              ) : notifSaving ? (
                'Saving…'
              ) : (
                'Save'
              )}
            </Button>
          </div>

          {notifError && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-[13px] text-red-600">{notifError}</p>
          )}

          <Card>
            <CardContent>
              {notifLoading ? (
                <div className="flex items-center justify-center py-8 text-[14px] text-neutral-400">
                  Loading…
                </div>
              ) : (
                <div className="space-y-3">
                  {NOTIFICATION_ROLES.map((role) => {
                    const enabled = notificationRoles.includes(role.slug);
                    return (
                      <div
                        key={role.slug}
                        className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-primary-50' : 'bg-neutral-100'}`}
                          >
                            <Bell
                              className={`h-4 w-4 ${enabled ? 'text-primary-500' : 'text-neutral-400'}`}
                            />
                          </div>
                          <span className="text-[14px] font-medium text-neutral-900">
                            {role.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => toggleNotificationRole(role.slug)}
                          className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                            enabled ? 'bg-primary-500' : 'bg-neutral-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
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
      )}

      {/* Save */}
      {activeTab !== 'Notifications' && activeTab !== 'Limits' && (
        <div className="flex justify-end pt-2">
          <Button size="lg">Save Changes</Button>
        </div>
      )}
    </div>
  );
}
