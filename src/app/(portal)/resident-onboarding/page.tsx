'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Car,
  Dog,
  Heart,
  PartyPopper,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useApi, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingData {
  completed: boolean;
  steps: {
    welcome: boolean;
    profile: boolean;
    emergencyContacts: boolean;
    vehicles: boolean;
    pets: boolean;
    complete: boolean;
  };
  counts: { emergencyContacts: number; vehicles: number; pets: number };
  residentType: string;
  unitNumber: string;
  propertyName: string;
  firstName: string;
}

interface EmergencyContactForm {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface VehicleForm {
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  province: string;
}

interface PetForm {
  name: string;
  species: string;
  breed: string;
  weight: string;
}

const STEP_KEYS = [
  'welcome',
  'profile',
  'emergencyContacts',
  'vehicles',
  'pets',
  'complete',
] as const;
type StepKey = (typeof STEP_KEYS)[number];

interface StepConfig {
  key: StepKey;
  label: string;
  icon: LucideIcon;
}

const STEPS: StepConfig[] = [
  { key: 'welcome', label: 'Welcome', icon: Building2 },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'emergencyContacts', label: 'Emergency', icon: Heart },
  { key: 'vehicles', label: 'Vehicles', icon: Car },
  { key: 'pets', label: 'Pets', icon: Dog },
  { key: 'complete', label: 'Complete', icon: PartyPopper },
];

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Neighbour', 'Other'];
const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Fish', 'Other'];
const PROVINCES = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NB', 'NS', 'PE', 'NL', 'NT', 'YT', 'NU'];

const emptyContact = (): EmergencyContactForm => ({
  name: '',
  relationship: 'Spouse',
  phone: '',
  email: '',
});

const emptyVehicle = (): VehicleForm => ({
  make: '',
  model: '',
  color: '',
  licensePlate: '',
  province: 'ON',
});

const emptyPet = (): PetForm => ({
  name: '',
  species: 'Dog',
  breed: '',
  weight: '',
});

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentIndex,
  completedSteps,
}: {
  steps: StepConfig[];
  currentIndex: number;
  completedSteps: Record<string, boolean>;
}) {
  return (
    <div className="mx-auto mb-10 flex max-w-2xl items-center justify-between">
      {steps.map((s, i) => {
        const isComplete = completedSteps[s.key] && i < currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = s.icon;

        return (
          <div key={s.key} className="flex flex-1 flex-col items-center">
            {/* Connector line */}
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 transition-colors duration-300 ${
                    i <= currentIndex ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                />
              )}
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isComplete
                    ? 'border-success-500 bg-success-500 text-white'
                    : isCurrent
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-neutral-200 bg-white text-neutral-400'
                }`}
              >
                {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors duration-300 ${
                    i < currentIndex ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
            <span
              className={`mt-2 text-[11px] font-medium ${
                isCurrent
                  ? 'text-primary-600'
                  : isComplete
                    ? 'text-success-600'
                    : 'text-neutral-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select helper (native <select> styled to match design system)
// ---------------------------------------------------------------------------

function NativeSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { label: string; value: string })[];
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
        {label}
        {required && (
          <span className="text-error-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus:ring-primary-200 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 hover:border-neutral-300 focus:ring-2 focus:ring-offset-1 focus:outline-none"
      >
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ResidentOnboardingPage() {
  const propertyId = getPropertyId();
  const {
    data: onboarding,
    loading,
    refetch,
  } = useApi<OnboardingData>(`/api/v1/resident/onboarding?propertyId=${propertyId}`);

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  // Step 1: Welcome
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [language, setLanguage] = useState('en');

  // Step 2: Profile
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('Email');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(false);
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [parkingSpot, setParkingSpot] = useState('');
  const [storageLocker, setStorageLocker] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');

  // Step 3: Emergency Contacts
  const [contacts, setContacts] = useState<EmergencyContactForm[]>([emptyContact()]);

  // Step 4: Vehicles
  const [vehicles, setVehicles] = useState<VehicleForm[]>([emptyVehicle()]);
  const [noVehicle, setNoVehicle] = useState(false);

  // Step 5: Pets
  const [pets, setPets] = useState<PetForm[]>([emptyPet()]);
  const [noPets, setNoPets] = useState(false);

  // Completion summary
  const [summary, setSummary] = useState({ contacts: 0, vehicles: 0, pets: 0 });

  // Determine if user is owner or tenant for conditional fields
  const isOwner =
    onboarding?.residentType === 'Owner' || onboarding?.residentType === 'Off-Site Owner';

  // Animate step transitions
  const goToStep = useCallback(
    (next: number) => {
      if (next === currentStep) return;
      setFadeClass('opacity-0 translate-y-2');
      setTimeout(() => {
        setCurrentStep(next);
        setFadeClass('opacity-100 translate-y-0');
      }, 200);
    },
    [currentStep],
  );

  // Save step data to the API
  const saveStep = useCallback(async (step: string, data: unknown) => {
    setSaving(true);
    try {
      const res = await apiRequest('/api/v1/resident/onboarding', {
        method: 'POST',
        body: { step, data },
      });
      const json = await res.json();
      return json.data;
    } catch {
      // Silently fail — the user can retry
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  // Handle "Next" button for each step
  const handleNext = useCallback(async () => {
    const stepKey = STEP_KEYS[currentStep];

    switch (stepKey) {
      case 'welcome':
        // Save language preference
        await saveStep('profile', { language });
        break;

      case 'profile':
        await saveStep('profile', {
          phone,
          language,
          accessibilityNeeds,
          accessibilityNotes: accessibilityNeeds ? accessibilityNotes : undefined,
        });
        break;

      case 'emergencyContacts': {
        const validContacts = contacts.filter((c) => c.name && c.phone);
        if (validContacts.length > 0) {
          const result = await saveStep('emergencyContacts', { contacts: validContacts });
          if (result)
            setSummary((prev) => ({ ...prev, contacts: result.count || validContacts.length }));
        }
        break;
      }

      case 'vehicles': {
        if (noVehicle) {
          await saveStep('vehicles', { skipped: true });
        } else {
          const validVehicles = vehicles.filter((v) => v.make && v.model && v.licensePlate);
          if (validVehicles.length > 0) {
            const result = await saveStep('vehicles', { vehicles: validVehicles });
            if (result)
              setSummary((prev) => ({ ...prev, vehicles: result.count || validVehicles.length }));
          }
        }
        break;
      }

      case 'pets': {
        if (noPets) {
          await saveStep('pets', { skipped: true });
        } else {
          const validPets = pets.filter((p) => p.name && p.species);
          if (validPets.length > 0) {
            const result = await saveStep('pets', { pets: validPets });
            if (result) setSummary((prev) => ({ ...prev, pets: result.count || validPets.length }));
          }
        }
        // Mark complete
        await saveStep('complete', {});
        break;
      }

      default:
        break;
    }

    goToStep(currentStep + 1);
  }, [
    currentStep,
    language,
    phone,
    accessibilityNeeds,
    accessibilityNotes,
    contacts,
    vehicles,
    noVehicle,
    pets,
    noPets,
    saveStep,
    goToStep,
  ]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // Can the user proceed from the current step?
  const canProceed = (() => {
    switch (STEP_KEYS[currentStep]) {
      case 'welcome':
        return consentTerms && consentPrivacy;
      case 'profile':
        return phone.trim().length >= 7;
      case 'emergencyContacts':
        return contacts.some((c) => c.name.trim() && c.phone.trim());
      case 'vehicles':
        return noVehicle || vehicles.some((v) => v.make && v.model && v.licensePlate);
      case 'pets':
        return noPets || pets.some((p) => p.name && p.species);
      default:
        return true;
    }
  })();

  // If already completed, prefill summary from API data
  useEffect(() => {
    if (onboarding?.completed) {
      setSummary({
        contacts: onboarding.counts.emergencyContacts,
        vehicles: onboarding.counts.vehicles,
        pets: onboarding.counts.pets,
      });
    }
  }, [onboarding]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="border-primary-200 border-t-primary-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    );
  }

  const firstName = onboarding?.firstName || 'there';
  const unitNumber = onboarding?.unitNumber || '';
  const propertyName = onboarding?.propertyName || 'your building';
  const residentType = onboarding?.residentType || 'Resident';
  const completedSteps = onboarding?.steps ?? {
    welcome: false,
    profile: false,
    emergencyContacts: false,
    vehicles: false,
    pets: false,
    complete: false,
  };

  // ---------------------------------------------------------------------------
  // Step content renderers
  // ---------------------------------------------------------------------------

  const renderWelcome = () => (
    <div className="text-center">
      <div className="bg-primary-50 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
        <Building2 className="text-primary-600 h-10 w-10" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900">
        Welcome to {propertyName}, {firstName}!
      </h1>
      <p className="mx-auto mb-8 max-w-md text-[15px] text-neutral-500">
        Let&apos;s get you set up in a few quick steps. This will only take a couple of minutes.
      </p>

      {/* Unit + resident type badges */}
      <div className="mb-8 flex items-center justify-center gap-3">
        {unitNumber && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-1.5 text-[13px] font-medium text-neutral-700">
            <Building2 className="h-3.5 w-3.5" />
            Unit {unitNumber}
          </span>
        )}
        <span className="bg-primary-50 text-primary-700 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium">
          <User className="h-3.5 w-3.5" />
          {residentType}
        </span>
      </div>

      {/* Consent checkboxes */}
      <div className="mx-auto max-w-sm space-y-4 text-left">
        <Checkbox
          checked={consentTerms}
          onCheckedChange={(checked) => setConsentTerms(checked === true)}
          label="I agree to the Terms of Service"
        />
        <Checkbox
          checked={consentPrivacy}
          onCheckedChange={(checked) => setConsentPrivacy(checked === true)}
          label="I agree to the Privacy Policy"
        />
      </div>

      {/* Language selector */}
      <div className="mx-auto mt-8 max-w-xs">
        <NativeSelect
          label="Preferred Language"
          value={language}
          onChange={setLanguage}
          options={[
            { label: 'English', value: 'en' },
            { label: 'Français (Canada)', value: 'fr-CA' },
          ]}
        />
      </div>
    </div>
  );

  const renderProfile = () => (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
          <Phone className="text-primary-600 h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Your Profile</h2>
          <p className="text-[13px] text-neutral-500">How should the building reach you?</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Phone Number"
          type="tel"
          placeholder="(416) 555-0123"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <NativeSelect
          label="Preferred Contact Method"
          value={contactMethod}
          onChange={setContactMethod}
          options={['Email', 'Phone', 'Both']}
        />
      </div>

      {/* Accessibility */}
      <div className="mt-6 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
        <Checkbox
          checked={accessibilityNeeds}
          onCheckedChange={(checked) => setAccessibilityNeeds(checked === true)}
          label="I have accessibility or mobility requirements"
          description="This helps the building team prepare for emergencies"
        />
        {accessibilityNeeds && (
          <div className="mt-4 pl-7">
            <Textarea
              label="Please describe your needs"
              placeholder="e.g., Wheelchair user, requires elevator priority during evacuation"
              value={accessibilityNotes}
              onChange={(e) => setAccessibilityNotes(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Owner-specific fields */}
      {isOwner && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input
            label="Parking Spot"
            placeholder="P1-042"
            value={parkingSpot}
            onChange={(e) => setParkingSpot(e.target.value)}
          />
          <Input
            label="Storage Locker"
            placeholder="L-15"
            value={storageLocker}
            onChange={(e) => setStorageLocker(e.target.value)}
          />
        </div>
      )}

      {/* Tenant-specific fields */}
      {!isOwner && residentType === 'Tenant' && (
        <div className="mt-6">
          <Input
            label="Lease End Date (optional)"
            type="date"
            value={leaseEndDate}
            onChange={(e) => setLeaseEndDate(e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const renderEmergencyContacts = () => (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
          <Heart className="text-error-500 h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Emergency Contacts</h2>
          <p className="text-[13px] text-neutral-500">
            Who should we call in an emergency? At least 1 required.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {contacts.map((contact, idx) => (
          <Card key={idx} className="relative overflow-hidden border-neutral-100">
            <CardContent className="p-5">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => setContacts((prev) => prev.filter((_, i) => i !== idx))}
                  className="hover:bg-error-50 hover:text-error-500 absolute top-3 right-3 rounded-lg p-1.5 text-neutral-400 transition-colors"
                  aria-label="Remove contact"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <p className="mb-4 text-[13px] font-medium text-neutral-500">Contact {idx + 1}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  placeholder="Jane Doe"
                  value={contact.name}
                  onChange={(e) => {
                    setContacts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, name: e.target.value } : c)),
                    );
                  }}
                  required
                />
                <NativeSelect
                  label="Relationship"
                  value={contact.relationship}
                  onChange={(v) => {
                    setContacts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, relationship: v } : c)),
                    );
                  }}
                  options={RELATIONSHIPS}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="(416) 555-0199"
                  value={contact.phone}
                  onChange={(e) => {
                    setContacts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, phone: e.target.value } : c)),
                    );
                  }}
                  required
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="jane@example.com"
                  value={contact.email}
                  onChange={(e) => {
                    setContacts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, email: e.target.value } : c)),
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contacts.length < 3 && (
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => setContacts((prev) => [...prev, emptyContact()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Contact
        </Button>
      )}
    </div>
  );

  const renderVehicles = () => (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
          <Car className="text-info-600 h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Vehicles &amp; Parking</h2>
          <p className="text-[13px] text-neutral-500">
            Register your vehicles for parking and building security.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
        <Checkbox
          checked={noVehicle}
          onCheckedChange={(checked) => setNoVehicle(checked === true)}
          label="I don't have a vehicle"
          description="You can add one later from your account settings"
        />
      </div>

      {!noVehicle && (
        <>
          <div className="space-y-6">
            {vehicles.map((vehicle, idx) => (
              <Card key={idx} className="relative overflow-hidden border-neutral-100">
                <CardContent className="p-5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => setVehicles((prev) => prev.filter((_, i) => i !== idx))}
                      className="hover:bg-error-50 hover:text-error-500 absolute top-3 right-3 rounded-lg p-1.5 text-neutral-400 transition-colors"
                      aria-label="Remove vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Make"
                      placeholder="Toyota"
                      value={vehicle.make}
                      onChange={(e) => {
                        setVehicles((prev) =>
                          prev.map((v, i) => (i === idx ? { ...v, make: e.target.value } : v)),
                        );
                      }}
                      required
                    />
                    <Input
                      label="Model"
                      placeholder="Camry"
                      value={vehicle.model}
                      onChange={(e) => {
                        setVehicles((prev) =>
                          prev.map((v, i) => (i === idx ? { ...v, model: e.target.value } : v)),
                        );
                      }}
                      required
                    />
                    <Input
                      label="Color"
                      placeholder="Silver"
                      value={vehicle.color}
                      onChange={(e) => {
                        setVehicles((prev) =>
                          prev.map((v, i) => (i === idx ? { ...v, color: e.target.value } : v)),
                        );
                      }}
                    />
                    <Input
                      label="License Plate"
                      placeholder="ABCD 123"
                      value={vehicle.licensePlate}
                      onChange={(e) => {
                        setVehicles((prev) =>
                          prev.map((v, i) =>
                            i === idx ? { ...v, licensePlate: e.target.value } : v,
                          ),
                        );
                      }}
                      required
                    />
                    <NativeSelect
                      label="Province / Territory"
                      value={vehicle.province}
                      onChange={(v) => {
                        setVehicles((prev) =>
                          prev.map((veh, i) => (i === idx ? { ...veh, province: v } : veh)),
                        );
                      }}
                      options={PROVINCES}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {vehicles.length < 3 && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setVehicles((prev) => [...prev, emptyVehicle()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Vehicle
            </Button>
          )}
        </>
      )}
    </div>
  );

  const renderPets = () => (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
          <Dog className="text-warning-600 h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Pets</h2>
          <p className="text-[13px] text-neutral-500">
            Let the building know about your furry (or scaly) friends.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
        <Checkbox
          checked={noPets}
          onCheckedChange={(checked) => setNoPets(checked === true)}
          label="No pets"
          description="You can add one later from your account settings"
        />
      </div>

      {!noPets && (
        <>
          <div className="space-y-6">
            {pets.map((pet, idx) => (
              <Card key={idx} className="relative overflow-hidden border-neutral-100">
                <CardContent className="p-5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => setPets((prev) => prev.filter((_, i) => i !== idx))}
                      className="hover:bg-error-50 hover:text-error-500 absolute top-3 right-3 rounded-lg p-1.5 text-neutral-400 transition-colors"
                      aria-label="Remove pet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Pet Name"
                      placeholder="Buddy"
                      value={pet.name}
                      onChange={(e) => {
                        setPets((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)),
                        );
                      }}
                      required
                    />
                    <NativeSelect
                      label="Species"
                      value={pet.species}
                      onChange={(v) => {
                        setPets((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, species: v } : p)),
                        );
                      }}
                      options={SPECIES_OPTIONS}
                      required
                    />
                    <Input
                      label="Breed (optional)"
                      placeholder="Golden Retriever"
                      value={pet.breed}
                      onChange={(e) => {
                        setPets((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, breed: e.target.value } : p)),
                        );
                      }}
                    />
                    <Input
                      label="Weight (lbs, optional)"
                      type="number"
                      placeholder="45"
                      value={pet.weight}
                      onChange={(e) => {
                        setPets((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, weight: e.target.value } : p)),
                        );
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pets.length < 3 && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setPets((prev) => [...prev, emptyPet()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Pet
            </Button>
          )}
        </>
      )}
    </div>
  );

  const renderComplete = () => (
    <div className="text-center">
      {/* Animated checkmark */}
      <div className="bg-success-50 ring-success-50/50 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ring-8">
        <ShieldCheck className="text-success-600 h-10 w-10" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900">
        You&apos;re All Set!
      </h1>
      <p className="mx-auto mb-8 max-w-md text-[15px] text-neutral-500">
        Your profile is complete. The building team has everything they need.
      </p>

      {/* Summary cards */}
      <div className="mx-auto mb-8 grid max-w-md gap-3">
        {summary.contacts > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-5 py-3 text-left">
            <Heart className="text-error-400 h-5 w-5" />
            <span className="text-[14px] text-neutral-700">
              {summary.contacts} emergency contact{summary.contacts > 1 ? 's' : ''} added
            </span>
            <Check className="text-success-500 ml-auto h-4 w-4" />
          </div>
        )}
        {summary.vehicles > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-5 py-3 text-left">
            <Car className="text-info-500 h-5 w-5" />
            <span className="text-[14px] text-neutral-700">
              {summary.vehicles} vehicle{summary.vehicles > 1 ? 's' : ''} registered
            </span>
            <Check className="text-success-500 ml-auto h-4 w-4" />
          </div>
        )}
        {summary.pets > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-5 py-3 text-left">
            <Dog className="text-warning-500 h-5 w-5" />
            <span className="text-[14px] text-neutral-700">
              {summary.pets} pet{summary.pets > 1 ? 's' : ''} registered
            </span>
            <Check className="text-success-500 ml-auto h-4 w-4" />
          </div>
        )}
      </div>

      {/* Quick action links */}
      <div className="mx-auto mb-6 flex max-w-md flex-col gap-3 sm:flex-row">
        <a
          href="/my-packages"
          className="hover:border-primary-200 hover:bg-primary-50 flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-center text-[13px] font-medium text-neutral-700 transition-colors"
        >
          View My Packages
        </a>
        <a
          href="/amenity-booking"
          className="hover:border-primary-200 hover:bg-primary-50 flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-center text-[13px] font-medium text-neutral-700 transition-colors"
        >
          Book an Amenity
        </a>
        <a
          href="/my-requests"
          className="hover:border-primary-200 hover:bg-primary-50 flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-center text-[13px] font-medium text-neutral-700 transition-colors"
        >
          Submit a Request
        </a>
      </div>

      <a href="/dashboard">
        <Button size="lg" className="px-10">
          Go to Dashboard
        </Button>
      </a>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const stepRenderers: Record<StepKey, () => React.ReactNode> = {
    welcome: renderWelcome,
    profile: renderProfile,
    emergencyContacts: renderEmergencyContacts,
    vehicles: renderVehicles,
    pets: renderPets,
    complete: renderComplete,
  };

  const isLastInputStep = currentStep === STEP_KEYS.length - 2; // pets step
  const isCompleteStep = currentStep === STEP_KEYS.length - 1;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Step indicator */}
        <StepIndicator steps={STEPS} currentIndex={currentStep} completedSteps={completedSteps} />

        {/* Step content card */}
        <Card className="border-neutral-100 shadow-sm">
          <CardContent className="p-8 sm:p-10">
            <div className={`transition-all duration-200 ease-in-out ${fadeClass}`}>
              {stepRenderers[STEP_KEYS[currentStep] as StepKey]()}
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {!isCompleteStep && (
          <div className="mt-6 flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handleBack} disabled={saving}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <Button onClick={handleNext} disabled={!canProceed || saving} size="lg">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </span>
              ) : isLastInputStep ? (
                <span className="flex items-center gap-1">
                  Complete Setup
                  <Check className="ml-1 h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
