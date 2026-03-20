import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'About Concierge — Building the Future of Property Management',
  description:
    'Learn about Concierge — our mission to modernize building management for Canadian properties with role-aware interfaces, Apple-grade design, and privacy by default.',
  openGraph: {
    title: 'About Concierge',
    description:
      'Building the future of property management. Security-first, role-aware, Canadian-built.',
    type: 'website',
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const VALUES = [
  {
    title: 'Security-First',
    description:
      'Every architectural decision starts with data protection. AES-256 encryption at rest, TLS 1.3 in transit, MFA, audit trails on every action, and compliance with PIPEDA, SOC 2, and ISO 27001.',
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
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Role-Aware Design',
    description:
      'Concierge staff, security guards, property managers, board members, and residents each see only what they need. No feature bloat, no 60-item navigation menus.',
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Canadian-Built',
    description:
      'Designed for Canadian condo corporations, management companies, and HOAs. All data stored in Canadian data centres. Bilingual support (English and French-Canadian) from day one.',
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
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: 'Privacy by Default',
    description:
      'Data minimization, no tracking pixels, no ad networks, no data selling. Right to erasure, transparent processing, and DSAR compliance built into the platform from the start.',
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
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Simplicity First',
    description:
      'Every screen has one primary action. We hide complexity behind progressive disclosure so first-time users never struggle. Apple-grade minimalism in every component.',
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
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l2.5 2.5L16 9" />
      </svg>
    ),
  },
  {
    title: 'Unified Platform',
    description:
      'One platform replaces fragmented tools for packages, security, maintenance, amenities, communication, and training. No more juggling three separate systems.',
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
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
] as const;

const TEAM_MEMBERS = [
  {
    name: 'Yaswanth Kosuru',
    role: 'Founder & CEO',
    bio: 'Product visionary with deep expertise in property management technology. Obsessed with replacing fragmented condo tools with one elegant platform.',
  },
  {
    name: 'Engineering Team',
    role: 'Full-Stack Development',
    bio: 'A team of senior engineers building with Next.js, TypeScript, and PostgreSQL. Every line of code is tested, reviewed, and secured.',
  },
  {
    name: 'Design Team',
    role: 'Product Design',
    bio: 'Designers who believe in Apple-grade minimalism. White backgrounds, clean typography, and interfaces that get out of the way.',
  },
  {
    name: 'Security Team',
    role: 'Security & Compliance',
    bio: 'Dedicated security professionals ensuring compliance with 8 frameworks including PIPEDA, SOC 2, and ISO 27001. Data protection is their obsession.',
  },
] as const;

const MILESTONES = [
  {
    label: '29',
    description: 'Product requirement documents',
  },
  {
    label: '131',
    description: 'Database models',
  },
  {
    label: '8',
    description: 'Compliance frameworks',
  },
  {
    label: '2,194+',
    description: 'Passing tests',
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
          About Concierge
        </p>
        <h1 className="mt-4 text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Building the future of property management
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          We studied every major building management platform, identified what works and what fails,
          and built something better from the ground up — designed specifically for Canadian
          properties.
        </p>
      </section>

      {/* Mission */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
            Our Mission
          </p>
          <h2 className="mt-4 text-[24px] font-bold tracking-tight text-neutral-900 md:text-[32px]">
            Replace fragmented, dated tools with one modern platform that property teams actually
            enjoy using.
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-neutral-600">
            Property managers juggle three or more separate systems for packages, security,
            maintenance, and communication. Staff waste hours switching between tabs. Residents get
            frustrated with clunky portals built in the 2000s. We are building the platform that
            brings everything together with role-aware interfaces, multi-channel notifications, and
            enterprise-grade security — with Apple-grade design that makes complex operations feel
            simple.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-neutral-100 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {MILESTONES.map((stat) => (
              <div key={stat.description} className="text-center">
                <p className="text-[32px] font-bold tracking-tight text-neutral-900">
                  {stat.label}
                </p>
                <p className="mt-1 text-[14px] text-neutral-500">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            What we believe
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
            These principles guide every product decision, from which features to build to how
            buttons are aligned.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="text-neutral-900">{value.icon}</div>
              <h3 className="mt-4 text-[18px] font-semibold text-neutral-900">{value.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
              The team behind Concierge
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
              A focused team of builders who understand the unique challenges of Canadian property
              management.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="rounded-xl border border-neutral-200 bg-white p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-neutral-400"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[18px] font-semibold text-neutral-900">{member.name}</h3>
                <p className="text-[14px] font-medium text-neutral-500">{member.role}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
          Join us in building the future
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
          See Concierge in action with a personalized demo, or get in touch to learn how we can
          modernize your property management.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={'/demo' as never}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Request a Demo
          </Link>
          <Link
            href={'/contact' as never}
            className="inline-flex items-center text-[15px] font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-700"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
