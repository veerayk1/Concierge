'use client';

import { useRouter } from 'next/navigation';
import { Building2, Users, Shield, Wrench, Package, BarChart3 } from 'lucide-react';
import { DEFAULT_DEMO_PROPERTY_ID, DEMO_PROPERTY } from '@/lib/demo-config';
import type { Role } from '@/types';

const DEMO_PERSONAS: {
  role: Role;
  label: string;
  description: string;
  icon: typeof Building2;
  color: string;
}[] = [
  {
    role: 'property_manager',
    label: 'Property Manager',
    description:
      'Full operational dashboard — maintenance, packages, visitors, announcements, reports',
    icon: Building2,
    color: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300',
  },
  {
    role: 'front_desk',
    label: 'Front Desk / Concierge',
    description: 'Package intake, visitor log, shift notes, unit instructions, quick actions',
    icon: Package,
    color: 'border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300',
  },
  {
    role: 'security_guard',
    label: 'Security Guard',
    description: 'Security console, incident log, parking violations, FOB tracking, camera feeds',
    icon: Shield,
    color: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300',
  },
  {
    role: 'maintenance_staff',
    label: 'Maintenance Staff',
    description: 'Work orders, service requests, equipment, recurring tasks',
    icon: Wrench,
    color: 'border-green-200 bg-green-50 text-green-700 hover:border-green-300',
  },
  {
    role: 'resident_owner',
    label: 'Resident (Owner)',
    description: 'My packages, service requests, amenity booking, announcements, community',
    icon: Users,
    color: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300',
  },
  {
    role: 'board_member',
    label: 'Board Member',
    description: 'Reports, building analytics, governance, announcements, surveys',
    icon: BarChart3,
    color: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
  },
  {
    role: 'property_admin',
    label: 'Property Admin',
    description: 'Full admin access — users, settings, compliance, all modules',
    icon: Building2,
    color: 'border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300',
  },
  {
    role: 'security_supervisor',
    label: 'Security Supervisor',
    description: 'Security management, team oversight, parking, reports',
    icon: Shield,
    color: 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300',
  },
  {
    role: 'superintendent',
    label: 'Superintendent',
    description: 'Building systems, equipment, inspections, maintenance oversight',
    icon: Wrench,
    color: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300',
  },
  {
    role: 'resident_tenant',
    label: 'Resident (Tenant)',
    description: 'Tenant portal — packages, requests, booking, community',
    icon: Users,
    color: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300',
  },
];

function launchShowcase(role: Role, router: ReturnType<typeof useRouter>) {
  localStorage.setItem('demo_mode', 'showcase');
  localStorage.setItem('demo_role', role);
  localStorage.setItem('demo_propertyId', DEFAULT_DEMO_PROPERTY_ID);
  localStorage.setItem('demo_return_role', 'super_admin');
  // Full reload to ensure layout picks up the new state
  window.location.href = '/dashboard';
}

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-900">
          Demo Account
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Launch a live demo to showcase the platform to prospects. Each persona shows exactly what
          that role would see in production.
        </p>
      </div>

      {/* Demo Property Card */}
      <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
              Demo Property
            </p>
            <h2 className="mt-1 text-[18px] font-semibold text-neutral-900">
              {DEMO_PROPERTY.name}
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">{DEMO_PROPERTY.address}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-medium text-neutral-700">
              {DEMO_PROPERTY.unitCount} units
            </p>
            <p className="text-[12px] text-neutral-400">Professional tier</p>
          </div>
        </div>
      </div>

      {/* Persona Grid */}
      <div className="mb-4">
        <h3 className="text-[14px] font-medium text-neutral-700">Choose a persona</h3>
        <p className="mt-0.5 text-[12px] text-neutral-400">
          Click a role to launch the demo as that persona
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DEMO_PERSONAS.map((persona) => {
          const Icon = persona.icon;
          return (
            <button
              key={persona.role}
              type="button"
              onClick={() => launchShowcase(persona.role, router)}
              className={`rounded-xl border px-4 py-3.5 text-left transition-all duration-200 hover:shadow-sm active:scale-[0.98] ${persona.color}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4.5 w-4.5 shrink-0 opacity-70" />
                <span className="text-[13px] font-semibold">{persona.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed opacity-70">{persona.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
