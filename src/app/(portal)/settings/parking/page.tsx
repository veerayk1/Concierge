'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, Clock, Grid3X3, Plus, Settings2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

const INITIAL_AREAS: ParkingArea[] = [
  { id: '1', name: 'P1 Underground', code: 'P1', totalSpots: 120, visitorSpots: 0 },
  { id: '2', name: 'P2 Surface', code: 'P2', totalSpots: 80, visitorSpots: 10 },
  { id: '3', name: 'Visitor Lot', code: 'VIS', totalSpots: 30, visitorSpots: 30 },
];

const INITIAL_PERMIT_TYPES: PermitType[] = [
  {
    id: '1',
    name: 'Resident',
    duration: '1 Year',
    renewable: true,
    autoRenew: true,
    requiresApproval: false,
    maxPerUnit: 2,
  },
  {
    id: '2',
    name: 'Visitor',
    duration: '24 Hours',
    renewable: false,
    autoRenew: false,
    requiresApproval: false,
    maxPerUnit: 3,
  },
  {
    id: '3',
    name: 'Contractor',
    duration: '1 Week',
    renewable: true,
    autoRenew: false,
    requiresApproval: true,
    maxPerUnit: 1,
  },
  {
    id: '4',
    name: 'Reserved',
    duration: '1 Month',
    renewable: true,
    autoRenew: true,
    requiresApproval: true,
    maxPerUnit: 1,
  },
];

const SCOPES: LimitScope[] = ['Per Unit', 'Per Plate', 'Per Area'];
const PERIODS: LimitPeriod[] = [
  'Per Week',
  'Per Month',
  'Per Year',
  'Consecutive Days',
  'Day Visits',
];

const INITIAL_LIMITS: LimitMatrix = {
  'Per Unit': {
    'Per Week': 5,
    'Per Month': 15,
    'Per Year': 100,
    'Consecutive Days': 3,
    'Day Visits': 2,
  },
  'Per Plate': {
    'Per Week': 3,
    'Per Month': 10,
    'Per Year': 60,
    'Consecutive Days': 2,
    'Day Visits': 1,
  },
  'Per Area': {
    'Per Week': 50,
    'Per Month': 200,
    'Per Year': 0,
    'Consecutive Days': 10,
    'Day Visits': 15,
  },
};

const TABS = ['Areas', 'Permit Types', 'Limits', 'Self-Service'] as const;
type Tab = (typeof TABS)[number];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParkingConfigurationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Areas');
  const [areas, setAreas] = useState(INITIAL_AREAS);
  const [permitTypes] = useState(INITIAL_PERMIT_TYPES);
  const [limits, setLimits] = useState(INITIAL_LIMITS);

  // Self-service state
  const [allowResidentVisitorParking, setAllowResidentVisitorParking] = useState(true);
  const [maxVisitorPermitsPerDay, setMaxVisitorPermitsPerDay] = useState(2);
  const [defaultVisitorDuration, setDefaultVisitorDuration] = useState('24');
  const [maxVisitorDays, setMaxVisitorDays] = useState(3);
  const [requirePlateNumber, setRequirePlateNumber] = useState(true);

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
                        <h3 className="text-[15px] font-semibold text-neutral-900">{area.name}</h3>
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
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Tab: Limits                                                       */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'Limits' && (
        <div>
          <h2 className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Parking Limits Matrix
          </h2>
          <p className="mb-4 text-[13px] text-neutral-500">
            Set maximum parking usage across different scopes and time periods. Enter 0 for
            unlimited.
          </p>
          <Card padding="none">
            <CardContent>
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

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
