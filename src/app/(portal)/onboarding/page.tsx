'use client';

import { useState } from 'react';
import {
  Check,
  ChevronRight,
  Building2,
  Users,
  Shield,
  Package,
  Calendar,
  Bell,
  Palette,
  Rocket,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
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
  icon: React.ElementType;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS: StepDef[] = [
  { id: 1, title: 'Property Details', icon: Building2 },
  { id: 2, title: 'Buildings & Units', icon: Package },
  { id: 3, title: 'User Roles', icon: Users },
  { id: 4, title: 'Security Setup', icon: Shield },
  { id: 5, title: 'Amenities', icon: Calendar },
  { id: 6, title: 'Notifications', icon: Bell },
  { id: 7, title: 'Branding', icon: Palette },
  { id: 8, title: 'Go Live', icon: Rocket },
];

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: {
  steps: StepDef[];
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-1 items-center last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'border-success-500 bg-success-50'
                    : isActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 bg-white'
                }`}
              >
                {isCompleted ? (
                  <Check className="text-success-600 h-5 w-5" />
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
                      : 'text-neutral-400'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 mb-6 h-0.5 flex-1 rounded-full ${
                  completedSteps.has(step.id) ? 'bg-success-300' : 'bg-neutral-200'
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
// Step Content Components
// ---------------------------------------------------------------------------

function PropertyDetailsStep() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Input
        label="Property Name"
        placeholder="Queensway Park Condos"
        defaultValue="Queensway Park Condos"
        required
      />
      <Input
        label="Address"
        placeholder="100 Queensway Park Dr"
        defaultValue="100 Queensway Park Dr"
        required
      />
      <Input label="City" placeholder="Toronto" defaultValue="Toronto" required />
      <Input label="Province" placeholder="Ontario" defaultValue="Ontario" required />
      <Input label="Postal Code" placeholder="M8Y 1H8" defaultValue="M8Y 1H8" required />
      <Input label="Unit Count" type="number" placeholder="171" defaultValue="171" required />
      <div className="sm:col-span-2">
        <Input
          label="Timezone"
          placeholder="America/Toronto"
          defaultValue="America/Toronto"
          required
        />
      </div>
    </div>
  );
}

function BuildingsUnitsStep() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Building Name" placeholder="Tower A" defaultValue="Tower A" />
        <Input label="Number of Floors" type="number" placeholder="25" defaultValue="25" />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm">
          Add Another Building
        </Button>
        <Button variant="secondary" size="sm">
          Import CSV
        </Button>
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3">
          <h4 className="text-[14px] font-semibold text-neutral-900">Units</h4>
          <p className="text-[13px] text-neutral-500">
            Upload a CSV file with unit numbers, floors, and types, or add units manually below.
          </p>
          <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-2 text-[14px] font-medium text-neutral-500">
              Drag & drop a CSV file here, or click to browse
            </p>
            <p className="mt-1 text-[12px] text-neutral-400">Supports .csv and .xlsx formats</p>
          </div>
          <Button variant="secondary" size="sm" className="self-start">
            Add Unit Manually
          </Button>
        </div>
      </Card>
    </div>
  );
}

function UserRolesStep() {
  const invitedUsers = [
    { name: 'Sarah Chen', email: 'sarah@example.com', role: 'Property Manager' },
    { name: 'Mike Torres', email: 'mike@example.com', role: 'Front Desk' },
    { name: 'Priya Patel', email: 'priya@example.com', role: 'Security Guard' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-1 text-[14px] font-semibold text-neutral-900">Invite Team Members</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Add admins and staff who will use the platform. You can add more later.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Full Name" placeholder="Jane Doe" />
          <Input label="Email" type="email" placeholder="jane@example.com" />
          <Input label="Role" placeholder="Property Manager" />
        </div>
        <Button variant="secondary" size="sm" className="mt-3">
          Add to List
        </Button>
      </div>

      <Card padding="none">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/80">
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                Name
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                Email
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                Role
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invitedUsers.map((user) => (
              <tr key={user.email}>
                <td className="px-5 py-3.5 text-[14px] text-neutral-900">{user.name}</td>
                <td className="px-5 py-3.5 text-[14px] text-neutral-600">{user.email}</td>
                <td className="px-5 py-3.5">
                  <Badge variant="primary" size="sm">
                    {user.role}
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
    </div>
  );
}

function SecuritySetupStep() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">
          Multi-Factor Authentication
        </h4>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <div>
            <p className="text-[14px] font-medium text-neutral-900">
              Require MFA for all admin accounts
            </p>
            <p className="text-[13px] text-neutral-500">Admins must set up 2FA on first login</p>
          </div>
          <div className="bg-primary-500 flex h-6 w-11 cursor-pointer items-center rounded-full px-0.5">
            <div className="h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform" />
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Session Timeout</h4>
        <Input
          label="Auto-logout after inactivity (minutes)"
          type="number"
          placeholder="30"
          defaultValue="30"
          helperText="Users will be automatically signed out after this period of inactivity."
        />
      </Card>

      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Password Policy</h4>
        <div className="flex flex-col gap-3">
          {[
            'Minimum 12 characters',
            'At least one uppercase letter',
            'At least one number',
            'At least one special character',
            'Cannot reuse last 5 passwords',
          ].map((rule) => (
            <div key={rule} className="flex items-center gap-2">
              <Check className="text-success-500 h-4 w-4" />
              <span className="text-[14px] text-neutral-700">{rule}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AmenitiesStep() {
  const mockAmenities = [
    { name: 'Party Room', capacity: 50, hours: '9:00 AM - 11:00 PM' },
    { name: 'Gym', capacity: 20, hours: '6:00 AM - 10:00 PM' },
    { name: 'Pool', capacity: 30, hours: '7:00 AM - 9:00 PM' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-1 text-[14px] font-semibold text-neutral-900">Add Amenities</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Configure the bookable amenities in your property. You can add rules and pricing later.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Input label="Amenity Name" placeholder="Party Room" />
          <Input label="Capacity" type="number" placeholder="50" />
          <Input label="Available Hours" placeholder="9:00 AM - 11:00 PM" />
          <Input label="Rules / Notes" placeholder="No smoking" />
        </div>
        <Button variant="secondary" size="sm" className="mt-3">
          Add Amenity
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {mockAmenities.map((amenity) => (
          <Card key={amenity.name} hoverable>
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Calendar className="text-primary-600 h-5 w-5" />
              </div>
              <h4 className="text-[15px] font-semibold text-neutral-900">{amenity.name}</h4>
            </div>
            <p className="text-[13px] text-neutral-500">Capacity: {amenity.capacity}</p>
            <p className="text-[13px] text-neutral-500">Hours: {amenity.hours}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h4 className="mb-3 text-[15px] font-semibold text-neutral-900">Booking Settings</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Max booking duration (hours)" type="number" defaultValue="4" />
          <Input label="Advance booking limit (days)" type="number" defaultValue="30" />
        </div>
      </Card>
    </div>
  );
}

function NotificationsStep() {
  const channels = [
    { name: 'Email', description: 'Send notifications via email', enabled: true },
    { name: 'SMS', description: 'Text message alerts for urgent items', enabled: true },
    { name: 'Push Notifications', description: 'In-app and mobile push alerts', enabled: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-1 text-[14px] font-semibold text-neutral-900">Default Channels</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Choose which notification channels to enable by default. Residents can customize their
          preferences later.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {channels.map((channel) => (
          <Card key={channel.name} padding="sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-[14px] font-medium text-neutral-900">{channel.name}</p>
                  <p className="text-[13px] text-neutral-500">{channel.description}</p>
                </div>
              </div>
              <div
                className={`flex h-6 w-11 cursor-pointer items-center rounded-full px-0.5 ${
                  channel.enabled ? 'bg-primary-500' : 'bg-neutral-200'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    channel.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h4 className="mb-3 text-[15px] font-semibold text-neutral-900">Template Preview</h4>
        <p className="mb-3 text-[13px] text-neutral-500">
          Default notification templates will be used. You can customize templates after setup.
        </p>
        <div className="rounded-xl bg-neutral-50 p-4 font-mono text-[13px] text-neutral-600">
          <p>Subject: [Property Name] - New Package Arrived</p>
          <p className="mt-2">Hi [Resident Name],</p>
          <p className="mt-1">A package has been received for unit [Unit Number].</p>
          <p className="mt-1">Please pick up your package from the front desk.</p>
        </div>
      </Card>
    </div>
  );
}

function BrandingStep() {
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
          Choose a primary color for buttons, links, and highlights across the portal.
        </p>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-10 w-10 rounded-xl border-2 transition-all hover:scale-110 ${
                color === '#3B82F6'
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
          This message will appear on the resident login page.
        </p>
        <textarea
          className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          rows={3}
          placeholder="Welcome to Queensway Park Condos! Log in to access your resident portal."
          defaultValue="Welcome to Queensway Park Condos! Log in to access your resident portal."
        />
      </Card>
    </div>
  );
}

function GoLiveStep({ completedSteps }: { completedSteps: Set<number> }) {
  const checklist = STEPS.slice(0, 7).map((step) => ({
    title: step.title,
    completed: completedSteps.has(step.id),
  }));

  const allDone = checklist.every((item) => item.completed);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h4 className="mb-4 text-[15px] font-semibold text-neutral-900">Setup Checklist</h4>
        <p className="mb-4 text-[13px] text-neutral-500">
          Review your configuration before going live. All steps should be completed.
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
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-neutral-300" />
                )}
                <span className="text-[14px] text-neutral-900">{item.title}</span>
              </div>
              <Badge variant={item.completed ? 'success' : 'warning'} size="sm">
                {item.completed ? 'Complete' : 'Incomplete'}
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
        <Button size="lg" disabled={!allDone}>
          <Rocket className="h-5 w-5" />
          Launch Property
        </Button>
        {!allDone && (
          <p className="text-warning-600 text-[13px]">Complete all steps above before launching.</p>
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

  function handleNext() {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return <PropertyDetailsStep />;
      case 2:
        return <BuildingsUnitsStep />;
      case 3:
        return <UserRolesStep />;
      case 4:
        return <SecuritySetupStep />;
      case 5:
        return <AmenitiesStep />;
      case 6:
        return <NotificationsStep />;
      case 7:
        return <BrandingStep />;
      case 8:
        return <GoLiveStep completedSteps={completedSteps} />;
      default:
        return null;
    }
  }

  return (
    <PageShell
      title="Property Setup"
      description="Complete these steps to configure your property."
    >
      {/* Step Indicator */}
      <Card className="mb-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} />
      </Card>

      {/* Step Title */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-bold text-neutral-900">
            Step {currentStep}: {STEPS[currentStep - 1]?.title}
          </h2>
          <Badge variant={completedSteps.has(currentStep) ? 'success' : 'default'} size="sm">
            {completedSteps.has(currentStep) ? 'Complete' : 'Incomplete'}
          </Badge>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1}>
          Back
        </Button>
        <div className="flex items-center gap-2 text-[13px] text-neutral-400">
          Step {currentStep} of {STEPS.length}
        </div>
        {currentStep < 8 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </PageShell>
  );
}
