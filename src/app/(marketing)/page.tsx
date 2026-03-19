import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Concierge | Modern Building Management',
  description:
    'Security logging, package tracking, maintenance requests, amenity bookings, and resident communication — all in one platform built for Canadian properties.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Security Console',
    description: 'Log visitors, incidents, and shift notes in a unified real-time stream.',
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: 'Package Tracking',
    description:
      'Scan, notify, and release packages with courier-branded cards and label printing.',
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: 'Maintenance Requests',
    description: 'Submit, assign, and track work orders with photo uploads and vendor assignment.',
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: 'Amenity Booking',
    description: 'Reserve party rooms, gyms, and guest suites with approval workflows and payment.',
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Announcements',
    description: 'Send building-wide announcements via email, SMS, push, and lobby displays.',
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
      </svg>
    ),
    title: 'Staff Training',
    description:
      'Train concierge and security staff with courses, quizzes, and completion tracking.',
  },
] as const;

const PRICING_TIERS: Array<{
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    name: 'Starter',
    price: '$2.50',
    unit: '/unit/month',
    description: 'For small buildings getting started with digital management.',
    features: ['Package tracking', 'Visitor logging', 'Announcements', 'Basic reporting'],
  },
  {
    name: 'Professional',
    price: '$4.50',
    unit: '/unit/month',
    description: 'For managed properties that need the full suite.',
    features: [
      'Everything in Starter',
      'Maintenance requests',
      'Amenity booking',
      'Security console',
      'Staff training',
      'Multi-channel notifications',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    unit: '',
    description: 'For management companies with multiple properties.',
    features: [
      'Everything in Professional',
      'Multi-property management',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'White-label branding',
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Concierge replaced three separate tools we were juggling. Our front desk staff were trained in under an hour.',
    name: 'Sarah M.',
    role: 'Property Manager',
    property: 'Downtown Toronto',
  },
  {
    quote:
      'The security console is exactly what we needed. Incident logging, visitor tracking, and shift notes all in one place.',
    name: 'James P.',
    role: 'Security Supervisor',
    property: 'Midtown Condos',
  },
  {
    quote:
      'Residents love the self-service portal. Maintenance requests dropped our phone volume by 60%.',
    name: 'Linda K.',
    role: 'Board President',
    property: 'Lakeshore Residences',
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div>
      {/* Section 1: Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl">
          <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
            The modern way to manage your building.
          </h1>
          <p className="mt-5 text-[18px] leading-relaxed text-neutral-600 md:text-[20px]">
            Security logging, package tracking, maintenance requests, amenity bookings, and resident
            communication — all in one platform built for Canadian properties.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={'/contact' as never}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Request a Demo
            </Link>
            <Link
              href={'/pricing' as never}
              className="inline-flex items-center text-[15px] font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-700"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance bar */}
      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-6 py-4">
          <p className="text-[13px] font-medium text-neutral-500">
            Enterprise-grade security for Canadian properties
          </p>
        </div>
      </section>

      {/* Section 3: Feature Highlights */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Everything your building needs
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
            Three platforms unified into one. Built by people who understand Canadian property
            management.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="text-neutral-900">{feature.icon}</div>
              <h3 className="mt-4 text-[18px] font-semibold text-neutral-900">{feature.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Pricing Preview */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
              No hidden fees. No per-user charges. Just a fair price per unit.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border bg-white p-6 ${
                  tier.popular ? 'border-neutral-900 shadow-lg' : 'border-neutral-200'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-1 text-[12px] font-medium text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-[18px] font-semibold text-neutral-900">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[32px] font-bold tracking-tight text-neutral-900">
                    {tier.price}
                  </span>
                  {tier.unit && <span className="text-[14px] text-neutral-500">{tier.unit}</span>}
                </div>
                <p className="mt-2 text-[14px] text-neutral-600">{tier.description}</p>
                <ul className="mt-6 flex flex-col gap-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
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
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Trusted by property managers across Canada
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-xl border border-neutral-200 bg-white p-6"
            >
              <p className="text-[15px] leading-relaxed text-neutral-700">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-4">
                <p className="text-[14px] font-semibold text-neutral-900">{testimonial.name}</p>
                <p className="text-[13px] text-neutral-500">
                  {testimonial.role}, {testimonial.property}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6: Bottom CTA */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Ready to modernize your building?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
            Join property managers across Canada who have switched to Concierge.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={'/contact' as never}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Request a Demo
            </Link>
            <Link
              href={'/pricing' as never}
              className="inline-flex items-center text-[15px] font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-700"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
