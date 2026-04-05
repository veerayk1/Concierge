'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// Feature Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    title: 'Package Management',
    description:
      'Every delivery logged, photographed, and tracked — from arrival to resident pickup. Automated notifications the moment a package hits the mailroom.',
    icon: (
      // Package box
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 14l12-6 12 6-12 6-12-6z" />
        <path d="M8 14v12l12 6V20" />
        <path d="M32 14v12l-12 6V20" />
        <path d="M14 11l12 6" />
      </svg>
    ),
  },
  {
    title: 'Maintenance & Work Orders',
    description:
      'Residents submit requests in seconds. Staff track them from open to resolved with full audit trails and photo documentation.',
    icon: (
      // Wrench
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M26.5 10.5a7 7 0 00-9.1 8.7L10 26.6a2.8 2.8 0 003.9 3.9l7.4-7.4a7 7 0 008.7-9.1l-4.1 4.1-2.8-.7-.7-2.8 4.1-4.1z" />
      </svg>
    ),
  },
  {
    title: 'Security & Access Logs',
    description:
      'Visitor pre-authorization, entry logs, incident reports, and guard tour tracking — all in one place with timestamps you can trust.',
    icon: (
      // Shield
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 34s10-5 10-12.5V10L20 6 10 10v11.5C10 29 20 34 20 34z" />
        <path d="M15 20l3 3 7-7" />
      </svg>
    ),
  },
  {
    title: 'Amenity Bookings',
    description:
      'Party rooms, gyms, pools, guest suites — with configurable time slots, security deposits, and automatic conflict prevention.',
    icon: (
      // Calendar
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="8" y="10" width="24" height="22" rx="3" />
        <path d="M8 17h24" />
        <path d="M15 7v6M25 7v6" />
        <rect x="13" y="21" width="4" height="4" rx="1" />
        <rect x="23" y="21" width="4" height="4" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Parking Management',
    description:
      'Spot assignments, visitor parking permits, violation tracking with full lifecycle — from warning to resolution.',
    icon: (
      // Car
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 26h20v-4l-2-6H12l-2 6v4z" />
        <circle cx="14" cy="26" r="2" />
        <circle cx="26" cy="26" r="2" />
        <path d="M10 22h20" />
        <path d="M12 16l-1-4h18l-1 4" />
      </svg>
    ),
  },
  {
    title: 'Resident Portal',
    description:
      'A clean, modern portal where residents manage their own packages, bookings, requests, and building communications. No app download required.',
    icon: (
      // Users
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="16" cy="14" r="4" />
        <path d="M8 30c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        <circle cx="27" cy="16" r="3" />
        <path d="M28 22c2.8.6 5 3 5 6" />
      </svg>
    ),
  },
  {
    title: 'Announcements & Notices',
    description:
      'Building-wide or floor-specific communications. Scheduled publishing, read receipts, and emergency broadcast mode.',
    icon: (
      // Megaphone
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M30 10v16c0 0-5-2-10-2H12a3 3 0 01-3-3v-6a3 3 0 013-3h8c5 0 10-2 10-2z" />
        <path d="M14 24v6a2 2 0 002 2h2a2 2 0 002-2v-5" />
      </svg>
    ),
  },
  {
    title: 'Elevator Booking',
    description:
      'Move-in/move-out scheduling with time blocks, security deposit tracking, and insurance certificate uploads.',
    icon: (
      // ArrowUpDown
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="10" y="6" width="20" height="28" rx="3" />
        <path d="M16 15l4-4 4 4" />
        <path d="M16 25l4 4 4-4" />
        <line x1="20" y1="11" x2="20" y2="19" />
        <line x1="20" y1="21" x2="20" y2="29" />
      </svg>
    ),
  },
  {
    title: 'Key & FOB Management',
    description:
      'Track every key, fob, and access device across the building. Assignment history, lost key workflows, deposit tracking.',
    icon: (
      // Key
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="26" cy="14" r="6" />
        <path d="M21.5 18.5L8 32" />
        <path d="M12 28l4 4" />
        <path d="M16 24l4 4" />
      </svg>
    ),
  },
  {
    title: 'Document & Consent Tracking',
    description:
      'Rules, bylaws, consent forms, and legal documents — stored, versioned, and signed digitally. Never chase a signature again.',
    icon: (
      // File
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M24 6H12a3 3 0 00-3 3v22a3 3 0 003 3h16a3 3 0 003-3V13l-7-7z" />
        <path d="M24 6v7h7" />
        <path d="M14 20h12M14 26h8" />
      </svg>
    ),
  },
  {
    title: 'Multi-Property Portfolio',
    description:
      'Manage one building or a hundred from a single login. Instant context switching, cross-property reporting, and centralized user management.',
    icon: (
      // Building
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="8" y="8" width="12" height="26" rx="2" />
        <rect x="22" y="16" width="10" height="18" rx="2" />
        <path d="M12 13h4M12 18h4M12 23h4M12 28h4" />
        <path d="M26 21h3M26 26h3" />
      </svg>
    ),
  },
  {
    title: 'Staff Training & Compliance',
    description:
      'Built-in training modules, certification tracking, and compliance reminders so your team is always audit-ready.',
    icon: (
      // Graduation cap
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 10L6 18l14 8 14-8-14-8z" />
        <path d="M10 21v8c0 0 4 4 10 4s10-4 10-4v-8" />
        <path d="M34 18v10" />
      </svg>
    ),
  },
] as const;

// ---------------------------------------------------------------------------
// Features Grid
// ---------------------------------------------------------------------------

export function FeaturesGrid() {
  return (
    <section
      id="features"
      style={{
        background: 'var(--color-ivory)',
        paddingBlock: 'var(--space-section)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 720, marginInline: 'auto' }}>
          <ScrollReveal>
            <p className="mkt-eyebrow">WHAT&apos;S INSIDE</p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h2 className="mkt-section-headline" style={{ marginTop: '1.25rem' }}>
              Everything your building needs. Nothing it doesn&apos;t.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="mkt-sub-headline" style={{ marginTop: '1rem' }}>
              Twelve integrated modules, one consistent experience.
            </p>
          </ScrollReveal>
        </div>

        {/* Grid */}
        <div
          className="mkt-features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 'var(--space-3xl)',
          }}
        >
          {FEATURES.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={(index % 3) * 120}>
              <div
                className="mkt-card mkt-feature-card"
                style={{
                  height: '100%',
                }}
              >
                <div className="mkt-feature-card__icon">{feature.icon}</div>
                <h3 className="mkt-feature-card__title">{feature.title}</h3>
                <p className="mkt-feature-card__desc">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Responsive grid */}
      <style jsx global>{`
        @media (max-width: 1023px) and (min-width: 768px) {
          .mkt-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 767px) {
          .mkt-features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
