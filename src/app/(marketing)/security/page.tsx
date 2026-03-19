import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Security & Privacy — Concierge',
  description:
    'Enterprise-grade security for building management. Encryption, MFA, audit trails, and compliance with PIPEDA, SOC 2, ISO 27001, and more.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SECURITY_FEATURES = [
  {
    title: 'Encryption Everywhere',
    description:
      'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Database fields containing personal information use column-level encryption.',
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
    title: 'Multi-Factor Authentication',
    description:
      'Enforce MFA across your organization with support for authenticator apps, SMS verification, and hardware security keys.',
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
    title: 'Complete Audit Trails',
    description:
      'Every action is logged with who, what, when, and from where. Login history tracks device, IP address, and authentication status.',
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Access Control',
    description:
      'Granular permissions ensure every user sees only what they need. Admin-controlled account creation with no self-registration.',
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
    title: 'Tenant Isolation',
    description:
      'Each property operates in a fully isolated environment. Data from one building can never be accessed by another.',
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
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Automated Backups',
    description:
      'Continuous database backups with point-in-time recovery. Disaster recovery with cross-region replication and tested restore procedures.',
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
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  },
] as const;

const COMPLIANCE_FRAMEWORKS = [
  {
    name: 'PIPEDA',
    description:
      'Personal Information Protection and Electronic Documents Act — Canadian federal privacy law.',
  },
  {
    name: 'SOC 2 Type II',
    description:
      'Annual audit of security, availability, processing integrity, confidentiality, and privacy.',
  },
  {
    name: 'ISO 27001',
    description: 'International standard for information security management systems (ISMS).',
  },
  {
    name: 'ISO 27701',
    description: 'Extension to ISO 27001 for privacy information management.',
  },
  {
    name: 'ISO 27017',
    description: 'Cloud-specific security controls for cloud service providers and customers.',
  },
  {
    name: 'ISO 9001',
    description: 'Quality management system standard ensuring consistent service delivery.',
  },
  {
    name: 'GDPR',
    description: 'General Data Protection Regulation — for properties with European residents.',
  },
  {
    name: 'HIPAA',
    description:
      'Health Insurance Portability and Accountability Act — for properties handling health data.',
  },
] as const;

const PRIVACY_PRACTICES = [
  {
    title: 'Data Minimization',
    description:
      'We collect only the data necessary for building management. No tracking pixels, no ad networks, no data selling.',
  },
  {
    title: 'Right to Erasure',
    description:
      'Residents and staff can request complete deletion of their personal data. DSAR requests are processed within 30 days.',
  },
  {
    title: 'Data Residency',
    description:
      'All data for Canadian properties is stored in Canadian data centers. No cross-border transfers without explicit consent.',
  },
  {
    title: 'Transparent Processing',
    description:
      'Clear privacy notices explain what data is collected, why, and how long it is retained. No hidden processing.',
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecurityPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Security and privacy, by design
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          Building management involves sensitive personal data. We treat security as a foundation,
          not a feature. Every architectural decision starts with data protection.
        </p>
      </section>

      {/* Security Features */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_FEATURES.map((feature) => (
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

      {/* Compliance */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
              Compliance frameworks
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
              Concierge is built to meet the requirements of 8 compliance frameworks, ensuring your
              property data is protected to the highest standards.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPLIANCE_FRAMEWORKS.map((framework) => (
              <div
                key={framework.name}
                className="rounded-xl border border-neutral-200 bg-white p-5"
              >
                <h3 className="text-[16px] font-semibold text-neutral-900">{framework.name}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                  {framework.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Practices */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Our privacy commitments
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
            We believe privacy is a right, not a privilege. These commitments apply to every
            property on our platform.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PRIVACY_PRACTICES.map((practice) => (
            <div key={practice.title} className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-[18px] font-semibold text-neutral-900">{practice.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                {practice.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-neutral-900 md:text-[36px]">
            Have security questions?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-neutral-600">
            Our team is happy to walk through our security architecture, compliance certifications,
            and data handling practices.
          </p>
          <Link
            href={'/contact' as never}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
