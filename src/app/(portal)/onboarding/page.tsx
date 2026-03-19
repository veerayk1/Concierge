'use client';

/**
 * Onboarding Wizard — per PRD 23
 *
 * 8-step guided property setup. Wired to /api/v1/onboarding with auto-save,
 * skip functionality, step validation, and real-time progress tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  Shield,
  Package,
  Calendar,
  Bell,
  Palette,
  Rocket,
  Upload,
  Plus,
  Trash2,
  SkipForward,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepDef {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
  percentComplete: number;
  isComplete: boolean;
  stepData: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Steps — aligned to PRD 23
// ---------------------------------------------------------------------------

const STEPS: StepDef[] = [
  {
    id: 1,
    title: 'Property Details',
    description: 'Name, address, timezone, contact info',
    icon: Building2,
    required: true,
  },
  {
    id: 2,
    title: 'Units',
    description: 'Import or create your building units',
    icon: Package,
    required: false,
  },
  {
    id: 3,
    title: 'Amenities',
    description: 'Configure bookable amenity spaces',
    icon: Calendar,
    required: false,
  },
  {
    id: 4,
    title: 'Event Types',
    description: 'Set up security event categories',
    icon: Shield,
    required: false,
  },
  { id: 5, title: 'Staff', description: 'Invite your team members', icon: Users, required: false },
  {
    id: 6,
    title: 'Residents',
    description: 'Import or invite residents',
    icon: Users,
    required: false,
  },
  {
    id: 7,
    title: 'Branding',
    description: 'Logo, colors, and welcome message',
    icon: Palette,
    required: false,
  },
  {
    id: 8,
    title: 'Go Live',
    description: 'Review and activate your property',
    icon: Rocket,
    required: false,
  },
];

// Demo propertyId for development
const DEMO_PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

async function fetchProgress(propertyId: string): Promise<OnboardingState> {
  const res = await fetch(`/api/v1/onboarding?propertyId=${propertyId}`, {
    headers: {
      ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
        ? { 'x-demo-role': localStorage.getItem('demo_role')! }
        : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch onboarding progress');
  const json = await res.json();
  return {
    currentStep: json.data.currentStep,
    completedSteps: json.data.completedSteps,
    skippedSteps: json.data.skippedSteps ?? [],
    percentComplete: json.data.percentComplete,
    isComplete: json.data.isComplete,
    stepData: {},
  };
}

async function saveStep(
  propertyId: string,
  step: number,
  data?: Record<string, unknown>,
  skip?: boolean,
) {
  const res = await fetch('/api/v1/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
        ? { 'x-demo-role': localStorage.getItem('demo_role')! }
        : {}),
    },
    body: JSON.stringify({ propertyId, step, data, skip }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save step');
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Step Indicator (Progress Bar)
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  skippedSteps,
  onStepClick,
}: {
  steps: StepDef[];
  currentStep: number;
  completedSteps: Set<number>;
  skippedSteps: Set<number>;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const isSkipped = skippedSteps.has(step.id);
        const canClick = step.id <= currentStep || isCompleted || isSkipped;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => canClick && onStepClick(step.id)}
              disabled={!canClick}
              className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'border-success-500 bg-success-50'
                    : isSkipped
                      ? 'border-warning-500 bg-warning-50'
                      : isActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 bg-white'
                }`}
              >
                {isCompleted ? (
                  <Check className="text-success-600 h-5 w-5" />
                ) : isSkipped ? (
                  <SkipForward className="text-warning-600 h-4 w-4" />
                ) : (
                  <Icon
                    className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`}
                  />
                )}
              </div>
              <span
                className={`text-center text-[11px] font-medium whitespace-nowrap ${
                  isActive
                    ? 'text-primary-600'
                    : isCompleted
                      ? 'text-success-600'
                      : isSkipped
                        ? 'text-warning-600'
                        : 'text-neutral-400'
                }`}
              >
                {step.title}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <div
                className={`mx-2 mb-6 h-0.5 flex-1 rounded-full ${
                  isCompleted ? 'bg-success-300' : isSkipped ? 'bg-warning-200' : 'bg-neutral-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Property Details
// ---------------------------------------------------------------------------

function PropertyDetailsStep({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Property Name"
          placeholder="e.g. Maple Heights Condominiums"
          value={data.propertyName ?? ''}
          onChange={(e) => onChange('propertyName', e.target.value)}
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Street Address"
            placeholder="100 Queensway Park Dr"
            value={data.address ?? ''}
            onChange={(e) => onChange('address', e.target.value)}
            required
          />
        </div>
        <Input
          label="City"
          placeholder="Toronto"
          value={data.city ?? ''}
          onChange={(e) => onChange('city', e.target.value)}
          required
        />
        <Input
          label="Province / State"
          placeholder="Ontario"
          value={data.province ?? ''}
          onChange={(e) => onChange('province', e.target.value)}
          required
        />
        <Input
          label="Postal / ZIP Code"
          placeholder="M8Y 1H8"
          value={data.postalCode ?? ''}
          onChange={(e) => onChange('postalCode', e.target.value)}
          required
        />
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-neutral-700">
            Property Type <span className="text-error-500">*</span>
          </label>
          <select
            className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all focus:ring-4 focus:outline-none"
            value={data.propertyType ?? ''}
            onChange={(e) => onChange('propertyType', e.target.value)}
          >
            <option value="">Select type...</option>
            <option value="condominium">Condominium</option>
            <option value="apartment">Apartment</option>
            <option value="cooperative">Co-operative</option>
            <option value="townhouse">Townhouse Complex</option>
            <option value="mixed_use">Mixed-Use</option>
          </select>
        </div>
        <Input
          label="Total Unit Count"
          type="number"
          placeholder="171"
          value={data.unitCount ?? ''}
          onChange={(e) => onChange('unitCount', e.target.value)}
          required
        />
        <Input
          label="Number of Buildings"
          type="number"
          placeholder="1"
          value={data.buildingCount ?? ''}
          onChange={(e) => onChange('buildingCount', e.target.value)}
          required
        />
        <Input
          label="Property Phone"
          type="tel"
          placeholder="+1 (416) 555-0100"
          value={data.phone ?? ''}
          onChange={(e) => onChange('phone', e.target.value)}
          required
        />
        <Input
          label="Property Email"
          type="email"
          placeholder="info@mapleheights.ca"
          value={data.email ?? ''}
          onChange={(e) => onChange('email', e.target.value)}
          required
        />
        <Input
          label="Timezone"
          placeholder="America/Toronto"
          value={data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={(e) => onChange('timezone', e.target.value)}
          required
        />
      </div>

      {/* Compliance Consent — PRD 23 Section 4.1 */}
      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Legal Agreements</h4>
        <div className="flex flex-col gap-3">
          {[
            { key: 'terms', label: 'I agree to the Terms of Service', required: true },
            {
              key: 'privacy',
              label: 'I have read and agree to the Privacy Policy',
              required: true,
            },
            {
              key: 'dataProcessing',
              label:
                "I consent to Concierge processing my property's data as described in the Privacy Policy",
              required: true,
            },
            {
              key: 'dataSharing',
              label:
                'I consent to sharing property data with my management company for building administration',
              required: true,
            },
            {
              key: 'vendorSharing',
              label:
                'I consent to sharing relevant data with approved third-party vendors (optional)',
              required: false,
            },
          ].map((consent) => (
            <label key={consent.key} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={data[consent.key] === 'true'}
                onChange={(e) => onChange(consent.key, String(e.target.checked))}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300"
              />
              <span className="text-[14px] text-neutral-700">
                {consent.label}
                {consent.required && <span className="text-error-500 ml-1">*</span>}
              </span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Units
// ---------------------------------------------------------------------------

function UnitsStep({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  const [units, setUnits] = useState<Array<{ number: string; floor: string; type: string }>>(() => {
    try {
      return JSON.parse(data.units || '[]');
    } catch {
      return [];
    }
  });
  const [newUnit, setNewUnit] = useState({ number: '', floor: '', type: 'studio' });

  function addUnit() {
    if (!newUnit.number || !newUnit.floor) return;
    const updated = [...units, newUnit];
    setUnits(updated);
    onChange('units', JSON.stringify(updated));
    setNewUnit({ number: '', floor: '', type: 'studio' });
  }

  function removeUnit(idx: number) {
    const updated = units.filter((_, i) => i !== idx);
    setUnits(updated);
    onChange('units', JSON.stringify(updated));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Import options */}
      <div className="flex gap-3">
        <Button variant="secondary" size="sm">
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
        <Button variant="secondary" size="sm">
          <Sparkles className="h-4 w-4" /> Auto-Generate
        </Button>
      </div>

      {/* Manual entry */}
      <Card>
        <h4 className="mb-3 text-[14px] font-semibold text-neutral-900">Add Units Manually</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            label="Unit Number"
            placeholder="101"
            value={newUnit.number}
            onChange={(e) => setNewUnit({ ...newUnit, number: e.target.value })}
          />
          <Input
            label="Floor"
            placeholder="1"
            value={newUnit.floor}
            onChange={(e) => setNewUnit({ ...newUnit, floor: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Unit Type</label>
            <select
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
              value={newUnit.type}
              onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value })}
            >
              <option value="studio">Studio</option>
              <option value="1bed">1 Bedroom</option>
              <option value="2bed">2 Bedroom</option>
              <option value="3bed">3 Bedroom</option>
              <option value="penthouse">Penthouse</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={addUnit} size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </Card>

      {/* Unit list */}
      {units.length > 0 && (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Unit
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Floor
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Type
                </th>
                <th className="w-12 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {units.map((unit, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3 text-[14px] font-medium text-neutral-900">
                    {unit.number}
                  </td>
                  <td className="px-5 py-3 text-[14px] text-neutral-600">{unit.floor}</td>
                  <td className="px-5 py-3 text-[14px] text-neutral-600 capitalize">
                    {unit.type.replace(/(\d)bed/, '$1 Bed')}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => removeUnit(idx)}
                      className="hover:text-error-500 text-neutral-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-neutral-100 px-5 py-3 text-[13px] text-neutral-500">
            {units.length} unit{units.length !== 1 ? 's' : ''} added
          </div>
        </Card>
      )}

      {units.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
          <Package className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-[14px] font-medium text-neutral-500">No units yet</p>
          <p className="mt-1 text-[12px] text-neutral-400">Add units manually or import from CSV</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Amenities
// ---------------------------------------------------------------------------

function AmenitiesStep({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  const templates = [
    {
      name: 'Standard Condo',
      items: ['Party Room', 'Gym', 'Pool', 'BBQ Area', 'Guest Suite', 'Theatre Room'],
    },
    { name: 'Small Building', items: ['Party Room', 'Gym', 'Rooftop Terrace'] },
    {
      name: 'Luxury Building',
      items: [
        'Party Room',
        'Gym',
        'Pool',
        'BBQ Area',
        'Guest Suite',
        'Theatre Room',
        'Spa',
        'Wine Cellar',
        'Co-Working Space',
        'Yoga Studio',
      ],
    },
  ];

  const [amenities, setAmenities] = useState<string[]>(() => {
    try {
      return JSON.parse(data.amenities || '[]');
    } catch {
      return [];
    }
  });
  const [newAmenity, setNewAmenity] = useState('');

  function applyTemplate(items: string[]) {
    setAmenities(items);
    onChange('amenities', JSON.stringify(items));
  }

  function addAmenity() {
    if (!newAmenity.trim()) return;
    const updated = [...amenities, newAmenity.trim()];
    setAmenities(updated);
    onChange('amenities', JSON.stringify(updated));
    setNewAmenity('');
  }

  function removeAmenity(idx: number) {
    const updated = amenities.filter((_, i) => i !== idx);
    setAmenities(updated);
    onChange('amenities', JSON.stringify(updated));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Templates */}
      <div>
        <h4 className="mb-3 text-[14px] font-semibold text-neutral-900">Start with a Template</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {templates.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => applyTemplate(tpl.items)}
              className="hover:border-primary-300 rounded-xl border border-neutral-200 bg-white p-4 text-left transition-all hover:shadow-sm"
            >
              <p className="text-[14px] font-semibold text-neutral-900">{tpl.name}</p>
              <p className="mt-1 text-[12px] text-neutral-500">{tpl.items.length} amenities</p>
            </button>
          ))}
        </div>
      </div>

      {/* Add custom */}
      <div className="flex gap-3">
        <Input
          placeholder="Add custom amenity..."
          value={newAmenity}
          onChange={(e) => setNewAmenity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addAmenity()}
        />
        <Button onClick={addAmenity} variant="secondary">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Amenity cards */}
      {amenities.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {amenities.map((name, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Calendar className="text-primary-500 h-4 w-4" />
                <span className="text-[14px] text-neutral-900">{name}</span>
              </div>
              <button
                onClick={() => removeAmenity(idx)}
                className="hover:text-error-500 text-neutral-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Event Types
// ---------------------------------------------------------------------------

function EventTypesStep() {
  const defaultTypes = [
    { name: 'Package Delivery', icon: '📦', color: 'bg-blue-100' },
    { name: 'Visitor Entry', icon: '🚶', color: 'bg-green-100' },
    { name: 'Incident Report', icon: '⚠️', color: 'bg-red-100' },
    { name: 'Noise Complaint', icon: '🔊', color: 'bg-amber-100' },
    { name: 'Fire Safety', icon: '🔥', color: 'bg-red-100' },
    { name: 'Key Checkout', icon: '🔑', color: 'bg-purple-100' },
    { name: 'Cleaning Log', icon: '🧹', color: 'bg-teal-100' },
    { name: 'Parking Violation', icon: '🚗', color: 'bg-orange-100' },
    { name: 'General Note', icon: '📝', color: 'bg-neutral-100' },
    { name: 'Authorized Entry', icon: '🚪', color: 'bg-indigo-100' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px] text-neutral-500">
        These are the default event types for your security console. You can customize them later in
        Settings.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {defaultTypes.map((type) => (
          <div
            key={type.name}
            className={`flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 ${type.color}`}
          >
            <span className="text-lg">{type.icon}</span>
            <span className="text-[13px] font-medium text-neutral-900">{type.name}</span>
          </div>
        ))}
      </div>
      <Card>
        <div className="flex items-center gap-2 text-[13px] text-neutral-500">
          <Check className="text-success-500 h-4 w-4" />
          <span>
            10 default event types will be created. You can add, remove, or customize them after
            setup.
          </span>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Staff
// ---------------------------------------------------------------------------

function StaffStep({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  const [staff, setStaff] = useState<Array<{ name: string; email: string; role: string }>>(() => {
    try {
      return JSON.parse(data.staff || '[]');
    } catch {
      return [];
    }
  });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'front_desk' });

  function addStaff() {
    if (!newStaff.name || !newStaff.email) return;
    const updated = [...staff, newStaff];
    setStaff(updated);
    onChange('staff', JSON.stringify(updated));
    setNewStaff({ name: '', email: '', role: 'front_desk' });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h4 className="mb-3 text-[14px] font-semibold text-neutral-900">Invite Team Members</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Add the staff who will use Concierge. They will receive email invitations.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Role</label>
            <select
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
            >
              <option value="property_manager">Property Manager</option>
              <option value="front_desk">Front Desk / Concierge</option>
              <option value="security_guard">Security Guard</option>
              <option value="superintendent">Superintendent</option>
              <option value="maintenance_staff">Maintenance Staff</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={addStaff} size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </Card>

      {staff.length > 0 && (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {staff.map((s, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3.5 text-[14px] text-neutral-900">{s.name}</td>
                  <td className="px-5 py-3.5 text-[14px] text-neutral-600">{s.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant="primary" size="sm">
                      {s.role.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="warning" size="sm" dot>
                      Pending Invite
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6: Residents
// ---------------------------------------------------------------------------

function ResidentsStep() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <Button variant="secondary">
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
        <Button variant="secondary">
          <Plus className="h-4 w-4" /> Add Manually
        </Button>
      </div>
      <Card>
        <h4 className="mb-3 text-[15px] font-semibold text-neutral-900">CSV Import</h4>
        <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-[14px] font-medium text-neutral-500">
            Upload a CSV with resident details
          </p>
          <p className="mt-1 text-[12px] text-neutral-400">
            Required columns: Name, Email, Unit Number. Optional: Phone, Move-In Date
          </p>
          <Button variant="secondary" size="sm" className="mt-4">
            Download Template
          </Button>
        </div>
      </Card>
      <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-[13px] text-blue-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          You can skip this step and import residents after launch. They can also self-register via
          invite links.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 7: Branding
// ---------------------------------------------------------------------------

function BrandingStep({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  const colors = [
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#EC4899',
    '#EF4444',
    '#F97316',
    '#EAB308',
    '#22C55E',
    '#14B8A6',
    '#06B6D4',
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Property Logo</h4>
        <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-2 text-[14px] font-medium text-neutral-500">Upload your property logo</p>
          <p className="mt-1 text-[12px] text-neutral-400">
            PNG, SVG, or JPG. Max 2MB. Recommended 200x200px.
          </p>
          <Button variant="secondary" size="sm" className="mt-3">
            Upload Logo
          </Button>
        </div>
      </Card>

      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Accent Color</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Choose a primary color for buttons, links, and highlights.
        </p>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange('accentColor', color)}
              className={`h-10 w-10 rounded-xl border-2 transition-all hover:scale-110 ${
                (data.accentColor || '#3B82F6') === color
                  ? 'border-neutral-900 ring-2 ring-neutral-200'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h4 className="mb-3 text-[15px] font-semibold text-neutral-900">Welcome Message</h4>
        <p className="mb-3 text-[13px] text-neutral-500">
          This appears on the resident login page.
        </p>
        <textarea
          className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          rows={3}
          placeholder="Welcome to your property! Log in to access your resident portal."
          value={data.welcomeMessage ?? ''}
          onChange={(e) => onChange('welcomeMessage', e.target.value)}
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 8: Go Live
// ---------------------------------------------------------------------------

function GoLiveStep({
  completedSteps,
  skippedSteps,
  onActivate,
  isActivating,
}: {
  completedSteps: Set<number>;
  skippedSteps: Set<number>;
  onActivate: () => void;
  isActivating: boolean;
}) {
  const checklist = STEPS.slice(0, 7).map((step) => ({
    title: step.title,
    completed: completedSteps.has(step.id),
    skipped: skippedSteps.has(step.id),
  }));

  const allDone = checklist.every((item) => item.completed || item.skipped);
  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Setup Checklist</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          {completedCount} of 7 steps completed. Skipped steps can be completed after launch.
        </p>
        <div className="flex flex-col gap-3">
          {checklist.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <Check className="text-success-500 h-5 w-5" />
                ) : item.skipped ? (
                  <SkipForward className="text-warning-500 h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-neutral-300" />
                )}
                <span className="text-[14px] text-neutral-900">{item.title}</span>
              </div>
              <Badge
                variant={item.completed ? 'success' : item.skipped ? 'warning' : 'default'}
                size="sm"
              >
                {item.completed ? 'Complete' : item.skipped ? 'Skipped' : 'Incomplete'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-neutral-50 p-8 text-center">
        <div className="bg-primary-50 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Rocket className="text-primary-600 h-8 w-8" />
        </div>
        <h3 className="text-[20px] font-bold text-neutral-900">Ready to Go Live?</h3>
        <p className="max-w-md text-[14px] text-neutral-500">
          Once you launch, your property portal will be accessible to all invited staff and
          residents. You can continue configuring settings after launch.
        </p>
        <Button
          size="lg"
          disabled={!allDone || isActivating}
          onClick={onActivate}
          loading={isActivating}
        >
          <Rocket className="h-5 w-5" />
          {isActivating ? 'Activating...' : 'Launch Property'}
        </Button>
        {!allDone && (
          <p className="text-warning-600 text-[13px]">
            Complete or skip all steps above before launching.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());
  const [percentComplete, setPercentComplete] = useState(0);
  const [stepData, setStepData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load progress on mount
  useEffect(() => {
    fetchProgress(DEMO_PROPERTY_ID)
      .then((state) => {
        setCurrentStep(state.currentStep);
        setCompletedSteps(new Set(state.completedSteps));
        setSkippedSteps(new Set(state.skippedSteps));
        setPercentComplete(state.percentComplete);
      })
      .catch(() => {
        // New property — start fresh
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-save handler with debounce
  const handleFieldChange = useCallback(
    (step: number, field: string, value: string) => {
      setStepData((prev) => ({
        ...prev,
        [step]: { ...prev[step], [field]: value },
      }));

      // Debounced auto-save
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        try {
          setSaving(true);
          setError(null);
          // Don't complete the step on auto-save — just save data
          await saveStep(DEMO_PROPERTY_ID, step, { ...(stepData[step] ?? {}), [field]: value });
          setLastSaved(new Date());
        } catch {
          // Silent auto-save failure — data persists locally
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [stepData],
  );

  async function handleNext() {
    try {
      setSaving(true);
      setError(null);
      await saveStep(DEMO_PROPERTY_ID, currentStep, stepData[currentStep] ?? {});

      setCompletedSteps((prev) => {
        const next = new Set(prev);
        next.add(currentStep);
        return next;
      });
      setSkippedSteps((prev) => {
        const next = new Set(prev);
        next.delete(currentStep);
        return next;
      });
      setPercentComplete(((completedSteps.size + 1) / STEPS.length) * 100);
      setLastSaved(new Date());

      if (currentStep < 8) setCurrentStep(currentStep + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    try {
      setSaving(true);
      setError(null);
      await saveStep(DEMO_PROPERTY_ID, currentStep, undefined, true);

      setSkippedSteps((prev) => {
        const next = new Set(prev);
        next.add(currentStep);
        return next;
      });
      setLastSaved(new Date());

      if (currentStep < 8) setCurrentStep(currentStep + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }

  async function handleActivate() {
    try {
      setIsActivating(true);
      setError(null);
      await saveStep(DEMO_PROPERTY_ID, 8);
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        next.add(8);
        return next;
      });
      setPercentComplete(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate');
    } finally {
      setIsActivating(false);
    }
  }

  function renderStepContent() {
    const data = stepData[currentStep] ?? {};
    const onChange = (field: string, value: string) => handleFieldChange(currentStep, field, value);

    switch (currentStep) {
      case 1:
        return <PropertyDetailsStep data={data} onChange={onChange} />;
      case 2:
        return <UnitsStep data={data} onChange={onChange} />;
      case 3:
        return <AmenitiesStep data={data} onChange={onChange} />;
      case 4:
        return <EventTypesStep />;
      case 5:
        return <StaffStep data={data} onChange={onChange} />;
      case 6:
        return <ResidentsStep />;
      case 7:
        return <BrandingStep data={data} onChange={onChange} />;
      case 8:
        return (
          <GoLiveStep
            completedSteps={completedSteps}
            skippedSteps={skippedSteps}
            onActivate={handleActivate}
            isActivating={isActivating}
          />
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
      </div>
    );
  }

  const step = STEPS[currentStep - 1];

  return (
    <div className="mx-auto max-w-[900px] px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Property Setup</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Complete these steps to configure your property.
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-2">
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          skippedSteps={skippedSteps}
          onStepClick={setCurrentStep}
        />
      </Card>

      {/* Progress percentage */}
      <div className="mb-8 flex items-center justify-between px-1">
        <p className="text-[13px] text-neutral-500">
          Setup Progress: {Math.round(percentComplete)}% complete (
          {completedSteps.size + skippedSteps.size} of {STEPS.length} steps)
        </p>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="bg-primary-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-error-200 bg-error-50 text-error-700 mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step Title */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-bold text-neutral-900">
            Step {currentStep}: {step?.title}
          </h2>
          {completedSteps.has(currentStep) && (
            <Badge variant="success" size="sm">
              Complete
            </Badge>
          )}
          {skippedSteps.has(currentStep) && (
            <Badge variant="warning" size="sm">
              Skipped
            </Badge>
          )}
        </div>
        <p className="mt-1 text-[14px] text-neutral-500">{step?.description}</p>
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-4 text-[13px] text-neutral-400">
          {saving && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {!saving && lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
          <span>
            Step {currentStep} of {STEPS.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 1 && currentStep < 8 && !STEPS[currentStep - 1]?.required && (
            <Button variant="ghost" onClick={handleSkip} disabled={saving}>
              Skip for Now
            </Button>
          )}
          {currentStep < 8 && (
            <Button onClick={handleNext} loading={saving} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Continue'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
