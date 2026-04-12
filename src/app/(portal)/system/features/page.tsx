'use client';

/**
 * Feature Intelligence — Super Admin QA Checklist Dashboard
 *
 * Interactive testing flow covering all 11 phases of the platform.
 * Tracks completion per step with localStorage persistence.
 * Each step links directly to the relevant page.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Step {
  id: string;
  label: string;
  description?: string;
  href?: string;
}

interface Phase {
  id: string;
  title: string;
  role: string;
  roleColor: string;
  steps: Step[];
}

// ---------------------------------------------------------------------------
// Phase Data — All 11 Phases
// ---------------------------------------------------------------------------

const PHASES: Phase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Super Admin — Platform Setup',
    role: 'Super Admin',
    roleColor: 'bg-red-100 text-red-700',
    steps: [
      { id: '1.1', label: 'Login as Super Admin', href: '/login' },
      { id: '1.2', label: 'Verify Super Admin dashboard KPIs', href: '/dashboard' },
      {
        id: '1.3',
        label: 'Create a new Property',
        description: 'Fill: Name, Address, City, Province, Postal Code, Units, Type, Timezone',
        href: '/system/properties',
      },
      {
        id: '1.4',
        label: 'Verify property appears in list with ACTIVE status',
        href: '/system/properties',
      },
      { id: '1.5', label: 'Settings → General: verify property info', href: '/settings' },
      { id: '1.6', label: 'Settings → Modules: enable/disable modules', href: '/settings/modules' },
      {
        id: '1.7',
        label: 'Settings → Event Types: configure event types',
        href: '/settings/event-types',
      },
      { id: '1.8', label: 'Settings → Roles & Permissions: review roles', href: '/settings/roles' },
      {
        id: '1.9',
        label: 'Settings → Notifications: configure channels',
        href: '/settings/notifications',
      },
      {
        id: '1.10',
        label: 'Settings → Email Configuration: set sender addresses',
        href: '/settings/email',
      },
      {
        id: '1.11',
        label: 'Create a Property Admin user',
        description: 'Fill name, email, role → get temp password',
        href: '/users',
      },
      {
        id: '1.12',
        label: 'Platform Health: verify API, DB, Redis status',
        href: '/system/health',
      },
      { id: '1.13', label: 'AI Dashboard: verify health score and analytics', href: '/system/ai' },
      { id: '1.14', label: 'Billing: verify subscription status', href: '/system/billing' },
      { id: '1.15', label: 'Demo Account: verify demo sandbox works', href: '/system/demo' },
      { id: '1.16', label: 'Reports: verify 6 report types available', href: '/reports' },
      { id: '1.17', label: 'Logs: verify activity log', href: '/logs' },
      { id: '1.18', label: 'Building Directory: verify management', href: '/building-directory' },
      { id: '1.19', label: 'Compliance: verify tracking', href: '/compliance' },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Property Admin — Building Setup',
    role: 'Property Admin',
    roleColor: 'bg-purple-100 text-purple-700',
    steps: [
      { id: '2.1', label: 'Login as Property Admin', href: '/login' },
      { id: '2.2', label: 'Create units manually', href: '/units' },
      { id: '2.3', label: 'Bulk import units via CSV', href: '/units' },
      { id: '2.4', label: 'Auto-generate units by floor pattern', href: '/units' },
      { id: '2.5', label: 'Create Property Manager user', href: '/users' },
      { id: '2.6', label: 'Create Front Desk Staff user', href: '/users' },
      { id: '2.7', label: 'Create Security Guard user', href: '/users' },
      { id: '2.8', label: 'Create Security Supervisor user', href: '/users' },
      { id: '2.9', label: 'Create Maintenance Staff user', href: '/users' },
      { id: '2.10', label: 'Create Superintendent user', href: '/users' },
      {
        id: '2.11',
        label: 'Create amenities (Party Room, Gym, Pool, Guest Suite)',
        href: '/amenities',
      },
      { id: '2.12', label: 'Add Resident Owner to unit', href: '/residents' },
      { id: '2.13', label: 'Add Resident Tenant to unit', href: '/residents' },
      { id: '2.14', label: 'Add Board Member to unit', href: '/residents' },
      { id: '2.15', label: 'Create welcome announcement', href: '/announcements' },
      { id: '2.16', label: 'Add building vendors (plumber, electrician, HVAC)', href: '/vendors' },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Property Manager — Operations',
    role: 'Property Manager',
    roleColor: 'bg-blue-100 text-blue-700',
    steps: [
      { id: '3.1', label: 'Verify dashboard: "Operations Command Center"', href: '/dashboard' },
      {
        id: '3.2',
        label: 'Verify KPIs: Open Requests, Packages, Visitors, Bookings',
        href: '/dashboard',
      },
      { id: '3.3', label: 'Verify correct sidebar items', href: '/dashboard' },
      { id: '3.4', label: 'Units → verify all units appear', href: '/units' },
      { id: '3.5', label: 'Units → click unit detail page', href: '/units' },
      { id: '3.6', label: 'Units → add unit instruction', href: '/units' },
      { id: '3.7', label: 'Service Requests → verify empty state', href: '/maintenance' },
      {
        id: '3.8',
        label: 'Service Requests → create maintenance request',
        description: 'Category: Plumbing, Priority: High',
        href: '/maintenance',
      },
      { id: '3.9', label: 'Service Requests → assign to maintenance staff', href: '/maintenance' },
      {
        id: '3.10',
        label: 'Service Requests → track status: Open → In Progress → Resolved',
        href: '/maintenance',
      },
      {
        id: '3.11',
        label: 'Announcements → create announcement',
        description: '"Building Notice: Fire Drill Tomorrow"',
        href: '/announcements',
      },
      { id: '3.12', label: 'Announcements → publish via Email + Push', href: '/announcements' },
      { id: '3.13', label: 'Vendors → verify vendor list', href: '/vendors' },
      { id: '3.14', label: 'Equipment → add building equipment', href: '/equipment' },
      { id: '3.15', label: 'Inspections → create inspection', href: '/inspections' },
      { id: '3.16', label: 'Recurring Tasks → create weekly task', href: '/recurring-tasks' },
      { id: '3.17', label: 'Alterations → create alteration request', href: '/alterations' },
      { id: '3.18', label: 'Reports → generate Package Activity Report (CSV)', href: '/reports' },
      { id: '3.19', label: 'Reports → generate Maintenance Summary (Excel)', href: '/reports' },
      { id: '3.20', label: 'Reports → generate Shift Log Summary (PDF)', href: '/reports' },
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Front Desk — Daily Operations',
    role: 'Front Desk / Concierge',
    roleColor: 'bg-teal-100 text-teal-700',
    steps: [
      { id: '4.1', label: 'Verify dashboard: "Front Desk Hub"', href: '/dashboard' },
      {
        id: '4.2',
        label: 'Verify sidebar: Security Console, Packages, Visitors, Keys, Shift Log',
        href: '/dashboard',
      },
      {
        id: '4.3',
        label: 'Packages → log new package',
        description: 'Unit 1208, Amazon, Mailroom Shelf B',
        href: '/packages',
      },
      {
        id: '4.4',
        label: 'Packages → verify package in list with reference number',
        href: '/packages',
      },
      {
        id: '4.5',
        label: 'Packages → log perishable package',
        description: 'Unit 502, FedEx, Staff Fridge',
        href: '/packages',
      },
      { id: '4.6', label: 'Packages → release package to resident', href: '/packages' },
      { id: '4.7', label: 'Packages → verify KPI "Unreleased" decrements', href: '/packages' },
      { id: '4.8', label: 'Packages → batch intake 3 packages', href: '/packages' },
      {
        id: '4.9',
        label: 'Visitors → check in visitor',
        description: 'Visitor for Unit 1208, Personal, 2 hours',
        href: '/visitors',
      },
      { id: '4.10', label: 'Visitors → verify in active list', href: '/visitors' },
      { id: '4.11', label: 'Visitors → check out visitor', href: '/visitors' },
      { id: '4.12', label: 'Shift Log → create new entry', href: '/shift-log' },
      { id: '4.13', label: 'Shift Log → pin important entry', href: '/shift-log' },
      { id: '4.14', label: 'Shift Log → create handoff entry', href: '/shift-log' },
      {
        id: '4.15',
        label: 'Security Console → verify tabs (Visitors, Incidents, Keys, Pass-On)',
        href: '/security',
      },
      { id: '4.16', label: 'Security Console → log pass-on note', href: '/security' },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5: Security Guard — Security Operations',
    role: 'Security Guard',
    roleColor: 'bg-amber-100 text-amber-700',
    steps: [
      { id: '5.1', label: 'Verify dashboard: "Security Dashboard"', href: '/dashboard' },
      {
        id: '5.2',
        label: 'Verify sidebar: Security Console, Packages, Parking, Visitors, Keys, Shift Log',
        href: '/dashboard',
      },
      {
        id: '5.3',
        label: 'Security Console → report incident',
        description: 'Noise Complaint, Unit 815, Medium priority',
        href: '/security',
      },
      { id: '5.4', label: 'Security Console → verify incident in list', href: '/security' },
      { id: '5.5', label: 'Fire Log → log fire drill', href: '/security' },
      { id: '5.6', label: 'Noise Complaint → log complaint', href: '/security' },
      { id: '5.7', label: 'Parking → log parking violation', href: '/parking' },
      { id: '5.8', label: 'Visitors → check in delivery driver', href: '/visitors' },
      { id: '5.9', label: 'Visitors → check out delivery driver', href: '/visitors' },
      { id: '5.10', label: 'Packages → accept after-hours delivery', href: '/packages' },
    ],
  },
  {
    id: 'phase-6',
    title: 'Phase 6: Security Supervisor — Management',
    role: 'Security Supervisor',
    roleColor: 'bg-orange-100 text-orange-700',
    steps: [
      { id: '6.1', label: 'Verify dashboard with security-focused KPIs', href: '/dashboard' },
      { id: '6.2', label: 'Keys & FOBs → add Master Key', href: '/keys' },
      { id: '6.3', label: 'Keys & FOBs → add Lobby FOB', href: '/keys' },
      { id: '6.4', label: 'Keys & FOBs → checkout key to guard', href: '/keys' },
      { id: '6.5', label: 'Keys & FOBs → verify audit trail', href: '/keys' },
      { id: '6.6', label: 'Keys & FOBs → return key', href: '/keys' },
      { id: '6.7', label: "Review guard's incident report", href: '/security' },
      { id: '6.8', label: 'Add investigation notes to incident', href: '/security' },
      { id: '6.9', label: 'Close incident with resolution', href: '/security' },
    ],
  },
  {
    id: 'phase-7',
    title: 'Phase 7: Maintenance Staff — Work Orders',
    role: 'Maintenance Staff',
    roleColor: 'bg-green-100 text-green-700',
    steps: [
      { id: '7.1', label: 'Verify dashboard: "Work Queue"', href: '/dashboard' },
      {
        id: '7.2',
        label: 'Verify sidebar: Service Requests, Inspections, Equipment, Recurring Tasks',
        href: '/dashboard',
      },
      { id: '7.3', label: 'Service Requests → view assigned request', href: '/maintenance' },
      { id: '7.4', label: 'Service Requests → update status to In Progress', href: '/maintenance' },
      { id: '7.5', label: 'Service Requests → add comment with update', href: '/maintenance' },
      { id: '7.6', label: 'Service Requests → mark as Resolved', href: '/maintenance' },
      { id: '7.7', label: 'Equipment → view assigned equipment', href: '/equipment' },
      { id: '7.8', label: 'Equipment → log maintenance on item', href: '/equipment' },
      { id: '7.9', label: 'Inspections → complete checklist items', href: '/inspections' },
      { id: '7.10', label: 'Inspections → add photos and submit', href: '/inspections' },
      { id: '7.11', label: 'Recurring Tasks → mark daily task complete', href: '/recurring-tasks' },
    ],
  },
  {
    id: 'phase-8',
    title: 'Phase 8: Superintendent — Building Operations',
    role: 'Superintendent',
    roleColor: 'bg-cyan-100 text-cyan-700',
    steps: [
      { id: '8.1', label: 'Verify dashboard: "Building Operations"', href: '/dashboard' },
      {
        id: '8.2',
        label: 'Verify sidebar includes: Building Systems, Parts & Supplies, Purchase Orders',
        href: '/dashboard',
      },
      { id: '8.3', label: 'Building Systems → verify page loads', href: '/building-systems' },
      {
        id: '8.4',
        label: 'Parts & Supplies → add inventory item',
        description: 'Light Bulbs, Qty: 50, Reorder at: 10',
        href: '/parts-supplies',
      },
      { id: '8.5', label: 'Purchase Orders → create PO', href: '/purchase-orders' },
      { id: '8.6', label: 'Purchase Orders → link to vendor', href: '/purchase-orders' },
      { id: '8.7', label: 'Vendors → schedule maintenance', href: '/vendors' },
    ],
  },
  {
    id: 'phase-9',
    title: 'Phase 9: Resident (Owner) — Self-Service',
    role: 'Resident (Owner)',
    roleColor: 'bg-indigo-100 text-indigo-700',
    steps: [
      { id: '9.1', label: 'Verify dashboard: "My Dashboard"', href: '/dashboard' },
      {
        id: '9.2',
        label: 'Verify sidebar: My Packages, My Requests, Amenity Booking, Announcements, etc.',
        href: '/dashboard',
      },
      { id: '9.3', label: 'My Packages → view packages from front desk', href: '/my-packages' },
      {
        id: '9.4',
        label: 'My Requests → create maintenance request',
        description: 'Electrical: Kitchen light flickering',
        href: '/my-requests',
      },
      { id: '9.5', label: 'My Requests → verify reference number', href: '/my-requests' },
      { id: '9.6', label: 'Amenity Booking → book Party Room', href: '/amenity-booking' },
      { id: '9.7', label: 'Amenity Booking → verify confirmation', href: '/amenity-booking' },
      { id: '9.8', label: 'Announcements → read building announcements', href: '/announcements' },
      { id: '9.9', label: 'Events → view upcoming events', href: '/events' },
      { id: '9.10', label: 'Marketplace → create classified ad', href: '/marketplace' },
      { id: '9.11', label: 'Library → download document', href: '/library' },
      { id: '9.12', label: 'Forum → create topic', href: '/forum' },
      { id: '9.13', label: 'Idea Board → submit idea', href: '/ideas' },
      { id: '9.14', label: 'My Vacations → log vacation period', href: '/residents/vacations' },
      { id: '9.15', label: 'My Account → update profile', href: '/my-account' },
    ],
  },
  {
    id: 'phase-10',
    title: 'Phase 10: Board Member — Governance',
    role: 'Board Member',
    roleColor: 'bg-slate-100 text-slate-700',
    steps: [
      { id: '10.1', label: 'Verify governance-focused dashboard', href: '/dashboard' },
      { id: '10.2', label: 'Reports → view operations reports', href: '/reports' },
      { id: '10.3', label: 'Building Analytics → view performance', href: '/analytics' },
      { id: '10.4', label: 'Governance → view documents', href: '/governance' },
      { id: '10.5', label: 'Governance → review meeting minutes', href: '/governance' },
      { id: '10.6', label: 'Announcements → read announcements', href: '/announcements' },
      { id: '10.7', label: 'Events → view events', href: '/events' },
      { id: '10.8', label: 'Surveys → respond to survey', href: '/surveys' },
    ],
  },
  {
    id: 'phase-11',
    title: 'Phase 11: Cross-Role Verification',
    role: 'All Roles',
    roleColor: 'bg-neutral-100 text-neutral-700',
    steps: [
      { id: '11.1', label: 'Package logged by Front Desk → visible to Resident in My Packages' },
      { id: '11.2', label: 'Maintenance request by Resident → visible to Property Manager' },
      { id: '11.3', label: 'Maintenance request by Resident → visible to Maintenance Staff' },
      { id: '11.4', label: 'Incident by Security Guard → visible to Supervisor' },
      { id: '11.5', label: 'Announcement by Property Manager → visible to Residents' },
      { id: '11.6', label: 'Shift log by Front Desk → visible to next shift' },
      { id: '11.7', label: 'Key checkout by Supervisor → visible in audit trail' },
      { id: '11.8', label: 'Resident CANNOT see: Security Console, User Management, Settings' },
      { id: '11.9', label: 'Security Guard CANNOT see: Maintenance, Equipment, Settings' },
      { id: '11.10', label: 'Front Desk CANNOT see: Parking, Maintenance, Vendors' },
      { id: '11.11', label: 'Board Member CANNOT see: packages, visitors, security ops' },
    ],
  },
];

const TOTAL_STEPS = PHASES.reduce((sum, p) => sum + p.steps.length, 0);
const STORAGE_KEY = 'feature_intelligence_completed';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeatureIntelligencePage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompleted(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    }
  }, [completed, mounted]);

  const toggleStep = useCallback((stepId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const togglePhase = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      setCompleted(new Set());
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const completedCount = completed.size;
  const progressPercent = TOTAL_STEPS > 0 ? Math.round((completedCount / TOTAL_STEPS) * 100) : 0;

  if (!mounted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-[3px] border-neutral-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="text-primary-600 h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
                Feature Intelligence
              </h1>
              <p className="text-[14px] text-neutral-500">
                End-to-end testing flow across all 11 phases and {TOTAL_STEPS} steps
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Progress
        </button>
      </div>

      {/* Overall Progress */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-neutral-700">Overall Progress</span>
          <span className="text-primary-600 text-[14px] font-bold">
            {completedCount}/{TOTAL_STEPS} steps ({progressPercent}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="bg-primary-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-[12px] text-neutral-400">
          <span>{PHASES.length} phases</span>
          <span>\u2022</span>
          <span>10 roles</span>
          <span>\u2022</span>
          <span>30+ modules</span>
          <span>\u2022</span>
          <span>Progress saved locally</span>
        </div>
      </div>

      {/* Phase Cards */}
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          const phaseCompleted = phase.steps.filter((s) => completed.has(s.id)).length;
          const phaseTotal = phase.steps.length;
          const phasePercent = Math.round((phaseCompleted / phaseTotal) * 100);
          const isPhaseComplete = phaseCompleted === phaseTotal;

          return (
            <div
              key={phase.id}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isPhaseComplete
                  ? 'border-success-200 bg-success-50/30'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-neutral-50/50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-semibold text-neutral-900">
                      {phase.title}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${phase.roleColor}`}
                    >
                      {phase.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[13px] font-medium ${
                      isPhaseComplete ? 'text-success-600' : 'text-neutral-500'
                    }`}
                  >
                    {phaseCompleted}/{phaseTotal}
                  </span>
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPhaseComplete ? 'bg-success-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${phasePercent}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Phase Steps */}
              {isExpanded && (
                <div className="border-t border-neutral-100 px-4 pb-4">
                  <div className="divide-y divide-neutral-50">
                    {phase.steps.map((step) => {
                      const isDone = completed.has(step.id);
                      return (
                        <div
                          key={step.id}
                          className={`flex items-start gap-3 py-3 ${isDone ? 'opacity-60' : ''}`}
                        >
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="text-success-500 h-5 w-5" />
                            ) : (
                              <Circle className="hover:text-primary-400 h-5 w-5 text-neutral-300" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[13px] ${
                                isDone ? 'text-neutral-400 line-through' : 'text-neutral-800'
                              }`}
                            >
                              <span className="mr-2 font-mono text-[11px] text-neutral-400">
                                {step.id}
                              </span>
                              {step.label}
                            </span>
                            {step.description && (
                              <p className="mt-0.5 text-[12px] text-neutral-400">
                                {step.description}
                              </p>
                            )}
                          </div>

                          {step.href && (
                            <a
                              href={step.href}
                              className="hover:bg-primary-50 hover:text-primary-500 flex-shrink-0 rounded-md p-1 text-neutral-300 transition-colors"
                              title={`Go to ${step.href}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
