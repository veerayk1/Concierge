import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Features — Concierge',
  description:
    'Explore the full feature set: security console, package tracking, maintenance requests, amenity booking, announcements, and staff training.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURE_MODULES = [
  {
    title: 'Security Console',
    description:
      'A unified real-time stream for visitors, incidents, shift notes, keys, and parking violations. Color-coded cards with 7 entry types give your security team instant context.',
    details: [
      'Real-time visitor logging with photo capture',
      'Incident reporting with severity levels',
      'Shift handoff notes with pinning',
      'FOB and key tracking with serial numbers',
      'Parking violation lifecycle management',
    ],
  },
  {
    title: 'Package Tracking',
    description:
      'From intake to release, every package is tracked with courier-branded cards, automatic resident notification, and label printing.',
    details: [
      'Courier-branded cards (Amazon, FedEx, UPS)',
      'Automatic SMS and email notification on arrival',
      'Batch intake for busy lobby hours',
      'Label printing with auto-generated reference numbers',
      'Storage location tracking',
    ],
  },
  {
    title: 'Maintenance Requests',
    description:
      'Residents submit requests with photos. Staff assign vendors, track SLA, and close with full audit trail.',
    details: [
      'Rich submission form with photo uploads',
      'Vendor assignment and tracking',
      'SLA monitoring with escalation',
      'Equipment linkage for preventive maintenance',
      'Work order printing',
    ],
  },
  {
    title: 'Amenity Booking',
    description:
      'Calendar, list, and grid views for booking party rooms, gyms, guest suites, and more. Supports approval workflows and payment collection.',
    details: [
      'Calendar, list, and grid views',
      'Approval workflows for premium amenities',
      'Payment integration for bookable spaces',
      'Recurring booking support',
      'Capacity management and conflict detection',
    ],
  },
  {
    title: 'Announcements',
    description:
      'Distribute building-wide announcements across email, SMS, push, and lobby displays with a single action.',
    details: [
      'Multi-channel distribution (email, SMS, push)',
      'Scheduled publishing',
      'Category-based organization',
      'Read receipt tracking',
      'Lobby display integration',
    ],
  },
  {
    title: 'Staff Training',
    description:
      'Built-in LMS for onboarding and ongoing training. Courses, quizzes, and completion tracking for concierge and security teams.',
    details: [
      'Course creation with modules and quizzes',
      'Pass/fail tracking with certificates',
      'Mandatory training assignment',
      'Progress dashboards for managers',
      'New hire onboarding checklists',
    ],
  },
] as const;

const ROLE_SHOWCASE = [
  {
    role: 'Concierge & Front Desk',
    description:
      'Quick-action event grid for package intake, visitor logging, and shift notes. Everything a front desk needs in one screen.',
  },
  {
    role: 'Security Guard',
    description:
      'Dedicated security dashboard with incident logging, parking violations, FOB tracking, emergency contacts, and camera integration.',
  },
  {
    role: 'Property Manager',
    description:
      'Full management dashboard with maintenance oversight, vendor compliance, alteration tracking, reports, and financials.',
  },
  {
    role: 'Resident',
    description:
      'Self-service portal to track packages, submit maintenance requests, book amenities, and read announcements.',
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Everything you need to manage your building
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          Three platforms unified into one. Each module is purpose-built for Canadian property
          management with role-aware interfaces.
        </p>
      </section>

      {/* Feature modules */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col gap-16">
          {FEATURE_MODULES.map((module, index) => (
            <div
              key={module.title}
              className={`flex flex-col gap-8 md:flex-row md:items-start ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-1">
                <h2 className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {module.title}
                </h2>
                <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
                  {module.description}
                </p>
                <ul className="mt-6 flex flex-col gap-2">
                  {module.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2 text-[14px] text-neutral-700"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mt-0.5 shrink-0 text-neutral-400"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <div className="aspect-video rounded-xl border border-neutral-200 bg-neutral-50" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-based showcase */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
              One platform, every role
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
              Each role sees a tailored interface designed for their specific workflow. No feature
              bloat, no overwhelming menus.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {ROLE_SHOWCASE.map((item) => (
              <div key={item.role} className="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 className="text-[18px] font-semibold text-neutral-900">{item.role}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
          See it in action
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
          Request a personalized demo and see how Concierge can work for your property.
        </p>
        <Link
          href={'/contact' as never}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Request a Demo
        </Link>
      </section>
    </div>
  );
}
