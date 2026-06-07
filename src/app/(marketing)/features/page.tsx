import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// SEO Metadata — targets high-volume property management keywords
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://buildingautopilot.ca';

const SEO_TITLE =
  'Property Management Software | All-in-One Building Management Platform — BuildingAutopilot';
const SEO_DESCRIPTION =
  'The modern property management software that replaces five disconnected tools. Package tracking, visitor management, maintenance requests, amenity booking, security console, and resident portal — one platform, every role, real-time.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    'property management software',
    'condo management software',
    'building management software',
    'HOA software',
    'visitor management system',
    'package tracking software',
    'maintenance request software',
    'amenity booking software',
    'concierge software',
    'resident portal',
    'apartment management software',
    'multi-family property software',
    'BuildingLink alternative',
    'Aquarius ICON alternative',
    'Condo Control alternative',
  ],
  alternates: { canonical: `${BASE_URL}/features` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/features`,
    siteName: 'BuildingAutopilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// Data — twelve product surfaces, each with concrete benefits
// ---------------------------------------------------------------------------

const MODULES = [
  {
    eyebrow: 'Front desk · 24/7',
    title: 'Package management software that ends the lobby pile-up',
    body: 'Scan a label, snap the parcel, the resident gets a push, email, and SMS in seconds. Courier-branded cards (Amazon, FedEx, UPS, Canada Post) make 200 packages a day feel like 20. Built for the holidays — and every Tuesday.',
    bullets: [
      'Bulk intake: scan thirty deliveries in five minutes',
      'Perishable flag with auto-escalation when no one comes down',
      'Storage location, reference number, photo — all auto-captured',
      'Resident self-service pickup queue',
    ],
    accent: '#C9A96E',
  },
  {
    eyebrow: 'Security & concierge',
    title: 'Visitor management system with one-tap pre-authorization',
    body: 'Residents schedule guests, contractors, and deliveries from their phone. Front desk and security see the day’s expected arrivals in one feed. One tap signs them in, captures the photo, and posts to the shift log.',
    bullets: [
      'Pre-authorize for tonight, tomorrow, or recurring visits',
      'Photo capture, ID verification, vehicle plate, parking pass',
      'Auto-notify the host when their guest arrives',
      'Real-time visitor log with sign-in / sign-out tracking',
    ],
    accent: '#5BD493',
  },
  {
    eyebrow: 'Maintenance & repairs',
    title: 'Maintenance request software residents actually use',
    body: 'A photo, a sentence, a tap. The board sees the queue. The super sees the priority. The vendor sees the SLA clock. Every request lands with full context — unit, equipment, history, permission to enter — so nothing falls through.',
    bullets: [
      'Photo & document uploads (4MB, HEIC, PDF, JPG)',
      'Vendor assignment with insurance compliance check',
      'SLA monitoring with automatic escalation',
      'Equipment linkage — preventive maintenance pipeline',
    ],
    accent: '#7C9CFF',
  },
  {
    eyebrow: 'Amenities & bookings',
    title: 'Amenity booking software the board approves of',
    body: 'Calendar, list, grid — pick a view. Party rooms, gyms, guest suites, BBQ pits, EV chargers. Approval workflows for premium amenities. Payment collection built-in. No more spreadsheet wars.',
    bullets: [
      'Three view modes (calendar, list, grid) — staff pick their default',
      'Approval workflows for board-gated amenities',
      'Stripe-backed payment collection, deposits, refunds',
      'Capacity, conflict detection, recurring bookings',
    ],
    accent: '#E89B6F',
  },
  {
    eyebrow: 'Security console',
    title: 'A real-time security command center for condo buildings',
    body: 'One stream. Seven entry types — visitors, incidents, packages, keys, pass-on notes, cleaning logs, free-form notes. Color-coded cards give security instant context. No more flipping between tabs at 3am.',
    bullets: [
      'Unified event log with configurable event types',
      'Incident severity with one-tap priority',
      'FOB and key tracking with serial numbers',
      'Parking violation lifecycle — create, track, resolve',
    ],
    accent: '#F47B7B',
  },
  {
    eyebrow: 'Communications',
    title: 'Building-wide announcements across every channel',
    body: 'Push once. Lands on the resident’s phone, in their inbox, on the lobby display, and in the building app — all from one composer. Read receipts. Category filters. Targeted by floor, unit type, or audience.',
    bullets: [
      'Multi-channel delivery — email, SMS, push, lobby screen',
      'Scheduled publishing & expiry',
      'Targeted audiences — by floor, by tenure, by interest',
      'Read receipt analytics',
    ],
    accent: '#B292FF',
  },
  {
    eyebrow: 'Resident portal',
    title: 'A resident portal residents will open more than once',
    body: 'My packages. My requests. My bookings. My visitors. My announcements. Five things on one screen — no menu spelunking. Mobile-first because residents live on their phones.',
    bullets: [
      'Self-service package pickup queue',
      'Track open maintenance requests with status updates',
      'Schedule expected visitors, deliveries, and contractors',
      'Vacation hold — pause notifications when you’re away',
    ],
    accent: '#62C7E5',
  },
  {
    eyebrow: 'Property managers',
    title: 'Manager dashboard built around the queue, not the calendar',
    body: 'One feed of things waiting on you. Vendor compliance at risk. Alteration projects stalled. Approvals overdue. Reports ready to email to the board. The day’s priorities, in order.',
    bullets: [
      'Decision queue — every item that needs your sign-off',
      'Vendor compliance dashboard with 5-state insurance tracking',
      'Alteration tracking with momentum indicators',
      'Exportable reports in Excel, CSV, and PDF',
    ],
    accent: '#C9A96E',
  },
  {
    eyebrow: 'Building operations',
    title: 'Equipment, inspections, and preventive maintenance — tracked',
    body: 'Every elevator, every fan-coil, every fire panel. Inspections on a schedule the auditor will accept. Recurring tasks that don’t need a sticky note. Equipment records with lifecycle dates and replacement forecasts.',
    bullets: [
      'Equipment lifecycle tracking with categories',
      'Mobile-first inspections with checklists',
      'Recurring task scheduler with calendar forecasting',
      'Parts and supplies inventory',
    ],
    accent: '#A5D5A8',
  },
  {
    eyebrow: 'Governance',
    title: 'Board governance software for condo and HOA boards',
    body: 'Meetings, minutes, motions, resolutions, attendance. The board sees what they need to see. The manager publishes what the board needs to read. Auditor-ready exports any time.',
    bullets: [
      'Board meeting scheduler with agenda templates',
      'Minutes capture with motion tracking',
      'Resolutions with vote tally and audit trail',
      'Board-only document library',
    ],
    accent: '#7C9CFF',
  },
  {
    eyebrow: 'Compliance',
    title: 'Compliance reports that satisfy PIPEDA, GDPR, SOC 2, ISO 27001',
    body: 'Eight built-in compliance frameworks. Audit logs that never get rotated out. DSAR workflows that finish in hours, not weeks. Sleep well at night — the auditor will love you.',
    bullets: [
      'Immutable audit log of every administrative action',
      'DSAR — data subject access requests in one click',
      'SOC 2, ISO 27001, ISO 27701, PIPEDA, GDPR, HIPAA reports',
      'Penetration test results & vulnerability scans',
    ],
    accent: '#F47B7B',
  },
  {
    eyebrow: 'Staff training',
    title: 'Staff training and onboarding for concierge teams',
    body: 'Built-in LMS so a new concierge is up to speed in two shifts, not two weeks. Quizzes. Pass/fail tracking. Mandatory courses for fire safety, privacy, customer service. Certificates the auditor accepts.',
    bullets: [
      'Course builder with modules, quizzes, certificates',
      'Mandatory training assignment by role',
      'Progress dashboards for managers',
      'New hire onboarding checklist',
    ],
    accent: '#E89B6F',
  },
] as const;

const STATS = [
  { value: '12', label: 'Modules unified', sub: 'Replaces five separate tools' },
  {
    value: '5',
    label: 'Personas, one platform',
    sub: 'Resident, concierge, security, manager, board',
  },
  { value: '8', label: 'Compliance frameworks', sub: 'PIPEDA · GDPR · SOC 2 · ISO 27001' },
  { value: '99.99%', label: 'Uptime SLA', sub: 'Built on enterprise-grade infrastructure' },
];

const SEO_FAQ = [
  {
    q: 'What is the best property management software for Canadian condos?',
    a: 'BuildingAutopilot is purpose-built for Canadian property management — PIPEDA-compliant, bilingual (English / fr-CA), and supports the operational realities of high-rise condos, low-rise apartments, mixed-use buildings, and townhouse communities. It replaces fragmented tools with one unified platform.',
  },
  {
    q: 'How does the visitor management system work?',
    a: 'Residents pre-authorize expected visitors from their phone. Front desk and security see the day’s expected arrivals in one feed. When the guest arrives, one tap signs them in — capturing photo, ID, vehicle plate, and parking pass — and notifies the host automatically.',
  },
  {
    q: 'Can residents book amenities and pay through BuildingAutopilot?',
    a: 'Yes. The amenity booking module supports party rooms, guest suites, gyms, BBQ areas, EV chargers, and any custom amenity. Approval workflows are configurable. Payment collection is integrated via Stripe — deposits, full payments, refunds, and recurring bookings all supported.',
  },
  {
    q: 'Does BuildingAutopilot handle package deliveries from Amazon, FedEx, and UPS?',
    a: 'Yes. Every package gets a courier-branded card, an auto-generated reference number, and triggers a multi-channel notification (push, email, SMS) the moment it’s logged. Bulk intake lets one concierge process thirty deliveries in five minutes. Perishable items get aging-shelf alerts.',
  },
  {
    q: 'What about security and compliance — is the data safe?',
    a: 'BuildingAutopilot is built to enterprise standards: SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, PIPEDA, GDPR, and HIPAA frameworks are all addressed. Every administrative action is logged in an immutable audit log. Data subject access requests (DSAR) can be fulfilled in hours.',
  },
  {
    q: 'Is BuildingAutopilot mobile-friendly for residents and staff?',
    a: 'Yes — the platform is mobile-first. Residents file maintenance requests, schedule visitors, and book amenities from their phone. Staff use mobile-optimized views for inspections, package intake, and the security console while walking the property.',
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FeaturesPage() {
  // FAQ schema markup — gives rich SERP snippets
  const faqJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SEO_FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  });

  return (
    <>
      {/* JSON-LD structured data for SERP-rich snippets */}
      <script type="application/ld+json">{faqJsonLd}</script>

      {/* ============================ HERO ============================ */}
      <section
        style={{
          position: 'relative',
          background: '#0A0A0A',
          color: '#fff',
          marginTop: -72,
          paddingTop: 'calc(72px + 6rem)',
          paddingBottom: '6rem',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(201,169,110,0.20), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 700px 400px at 85% 95%, rgba(91,130,212,0.12), transparent 60%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 85%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 999,
              background: 'rgba(201,169,110,0.08)',
              border: '1px solid rgba(201,169,110,0.18)',
              fontSize: '0.8125rem',
              color: 'rgba(212,186,133,0.9)',
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#5BD493',
                boxShadow: '0 0 0 4px rgba(91,212,147,0.18)',
              }}
            />
            Twelve modules · One product · Five personas
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: '#fff',
              margin: 0,
            }}
          >
            The all-in-one property management software{' '}
            <span style={{ color: '#C9A96E', fontStyle: 'italic', fontWeight: 400 }}>
              your building deserves.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 720,
              margin: '1.5rem auto 0',
            }}
          >
            Visitor management. Package tracking. Maintenance requests. Amenity booking. Security
            console. Resident portal. Compliance reports. One platform that replaces five tools —
            built for condos, HOAs, apartments, and mixed-use buildings across North America.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '2.5rem',
              flexWrap: 'wrap',
            }}
          >
            <Link href={'/contact' as never} className="btn-primary">
              Request a Demo
            </Link>
            <Link
              href={'/for-teams' as never}
              style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                padding: '0.875rem 1.5rem',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              See it by role →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.5rem',
              marginTop: '5rem',
              padding: '2rem',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 600,
                    color: '#C9A96E',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                    marginTop: '0.25rem',
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.25rem',
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ MODULE GRID ============================ */}
      <section
        style={{
          background: '#0E0E0E',
          color: '#fff',
          padding: '6rem 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <header style={{ maxWidth: 720, marginBottom: '4rem' }}>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(201,169,110,0.85)',
                margin: 0,
              }}
            >
              Every surface of your building, covered
            </p>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: '0.75rem 0 1.25rem',
              }}
            >
              Twelve modules. One login.{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Zero spreadsheets.</span>
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
              }}
            >
              Every module talks to the others. A maintenance request links to the unit. The unit
              links to the resident. The resident links to their packages, their visitors, their
              bookings. No more copy-pasting between tabs.
            </p>
          </header>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {MODULES.map((m) => (
              <article
                key={m.title}
                style={{
                  position: 'relative',
                  padding: '2rem',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${m.accent}, transparent 80%)`,
                  }}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: m.accent,
                    margin: 0,
                  }}
                >
                  {m.eyebrow}
                </p>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: '#fff',
                    margin: '0.75rem 0 1rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {m.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 1.5rem',
                  }}
                >
                  {m.body}
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  {m.bullets.map((b) => (
                    <li
                      key={b}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: m.accent,
                          marginTop: '0.5rem',
                          flexShrink: 0,
                        }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ INTEGRATIONS / TECH ============================ */}
      <section
        style={{
          background: '#0A0A0A',
          color: '#fff',
          padding: '6rem 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(201,169,110,0.85)',
                margin: 0,
              }}
            >
              Built on enterprise infrastructure
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: '0.75rem 0 1rem',
              }}
            >
              The boring stuff that keeps you sleeping at night.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
              }}
            >
              99.99% uptime SLA. SOC 2 Type II controls. PIPEDA &amp; GDPR-compliant data handling.
              Encrypted at rest, encrypted in flight, encrypted in backups — with the kind of
              disaster recovery your auditor actually wants to see.
            </p>
          </div>
          <div>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem 2rem',
                margin: 0,
              }}
            >
              {[
                ['Uptime SLA', '99.99%'],
                ['Encryption', 'AES-256'],
                ['Auth', 'OAuth 2.0 / OIDC'],
                ['Backups', 'Continuous, geo-redundant'],
                ['API', 'REST + Webhooks'],
                ['Mobile', 'iOS & Android'],
                ['Languages', 'English & fr-CA'],
                ['Compliance', '8 frameworks'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {label}
                  </dt>
                  <dd
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 500,
                      color: '#fff',
                      margin: '0.25rem 0 0',
                    }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section
        style={{
          background: '#0E0E0E',
          color: '#fff',
          padding: '6rem 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(201,169,110,0.85)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Common questions
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#fff',
              margin: '0.75rem 0 3rem',
              textAlign: 'center',
            }}
          >
            Everything property teams ask before they switch.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {SEO_FAQ.map(({ q, a }) => (
              <details
                key={q}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <summary
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#fff',
                    cursor: 'pointer',
                    listStyle: 'none',
                  }}
                >
                  {q}
                </summary>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.65)',
                    margin: '1rem 0 0',
                  }}
                >
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ BOTTOM CTA ============================ */}
      <section
        style={{
          background: '#0A0A0A',
          color: '#fff',
          padding: '6rem 0 8rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 800px 500px at 50% 80%, rgba(201,169,110,0.14), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 720,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#fff',
              margin: 0,
            }}
          >
            Stop running your building on five tabs and a spreadsheet.
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.6)',
              margin: '1.25rem auto 2.5rem',
              maxWidth: 580,
            }}
          >
            Book a personalized walk-through. We&apos;ll show you exactly how BuildingAutopilot
            handles the day your front desk would rather forget.
          </p>
          <Link href={'/contact' as never} className="btn-primary">
            Request a Demo
          </Link>
        </div>
      </section>
    </>
  );
}
