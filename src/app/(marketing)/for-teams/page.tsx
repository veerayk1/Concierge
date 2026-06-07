import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://buildingautopilot.ca';

const SEO_TITLE =
  'For Property Teams | Software for Concierge, Security, Managers & Boards — BuildingAutopilot';
const SEO_DESCRIPTION =
  'Built for everyone who keeps the building running. BuildingAutopilot software for front desk staff, security guards, property managers, condo boards, and residents — one platform, five tailored interfaces, real-time everything.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    'concierge software',
    'front desk software',
    'security guard software',
    'property manager software',
    'condo board software',
    'HOA board management',
    'resident portal app',
    'building staff software',
    'multi-family operations software',
    'property management team tools',
  ],
  alternates: { canonical: `${BASE_URL}/for-teams` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/for-teams`,
    siteName: 'BuildingAutopilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// Data — five personas with concrete day-in-the-life value props
// ---------------------------------------------------------------------------

const PERSONAS = [
  {
    slug: 'front-desk',
    role: 'Concierge & Front Desk',
    accent: '#C9A96E',
    headline: 'Software that handles the lobby on the worst day of the year.',
    description:
      'Holiday season. Forty packages stacked behind the desk. A contractor for 14A. Two visitors waiting on buzz-up. A resident asking about a key. Front desk software built for the day where everything happens at once.',
    daily: [
      'Bulk package intake — scan thirty in five minutes',
      'One-tap visitor sign-in with photo and ID',
      'Quick-note shift log with patrol templates',
      'Per-unit instructions surface on every interaction',
      'AI-assisted shift briefing every shift change',
    ],
    quote:
      '“The shift change used to take twenty minutes. Now the next guard reads the briefing on her phone walking in. We start every shift on the same page.”',
    quoteRole: 'Concierge supervisor · 312-unit downtown high-rise',
  },
  {
    slug: 'security',
    role: 'Security & Guards',
    accent: '#F47B7B',
    headline: 'A real-time security console for the team on the floor.',
    description:
      'Incident reporting that captures the severity. Pass-on notes that survive shift change. FOB and key tracking by serial number. Parking violations with a lifecycle. Built for security guards walking the perimeter, not for managers reading a quarterly report.',
    daily: [
      'Seven entry types — one unified event stream',
      'Incident wizard with AI-suggested priority',
      'Key & FOB tracking with overdue alerts',
      'Mobile-optimized for patrol walk-throughs',
      'End-of-shift report auto-rolled-up from the day',
    ],
    quote:
      '“We used to lose pass-on notes at the shift swap. Now everything threaded — visitors signed in, incidents logged, keys still out. The next guard knows what mid-shift looked like.”',
    quoteRole: 'Security supervisor · 4-tower mixed-use complex',
  },
  {
    slug: 'managers',
    role: 'Property Managers',
    accent: '#7C9CFF',
    headline: 'A manager dashboard that reads like a triage queue.',
    description:
      'Property management software built around your decision queue. Vendor insurance expiring next week. Three approvals waiting on you. An alteration that&apos;s gone stalled. The day&apos;s priorities, sorted. No more digging through five inboxes to find what needs your sign-off.',
    daily: [
      'Decision queue — one feed of items waiting on you',
      'Vendor compliance with 5-state insurance tracking',
      'Alteration projects with momentum indicators (OK / Slow / Stalled / Stopped)',
      'AI-assisted maintenance triage and vendor recommendation',
      'Auditor-ready exports in Excel, CSV, PDF',
    ],
    quote:
      '“I spent thirty minutes every morning just figuring out what mattered. Now the queue tells me. Insurance expiring. Alteration stalled. Resident at 1402 escalating. I just work top-down.”',
    quoteRole: 'Senior property manager · Portfolio of 18 buildings',
  },
  {
    slug: 'boards',
    role: 'Condo & HOA Boards',
    accent: '#B292FF',
    headline: 'Governance the board can read on a Sunday night.',
    description:
      'Condo board software and HOA management software built for volunteer boards. Meetings with agendas, minutes with motions, resolutions with vote tallies, financials at a glance. The board sees what they need to see. The manager publishes what the board needs to read. Auditor-ready, lawyer-friendly.',
    daily: [
      'Board portal with meetings, minutes, motions, resolutions',
      'Vote tally with audit trail every resolution',
      'Compliance snapshot — what the auditor will ask first',
      'Financials and reserve fund at a glance',
      'Board-only document library, separate from residents',
    ],
    quote:
      '“As a board director, I have a day job. I can&apos;t spend forty minutes prepping for a Wednesday meeting. The snapshot tells me what changed. The motion tracker shows what we owe a vote on.”',
    quoteRole: 'Board director · 240-unit condo corporation',
  },
  {
    slug: 'residents',
    role: 'Residents & Owners',
    accent: '#5BD493',
    headline: 'A resident portal residents actually open.',
    description:
      'Resident portal software that respects that people live on their phones. My packages. My requests. My visitors. My bookings. My announcements. Five things on one screen — designed by people who hate menu spelunking. Schedule a plumber for Tuesday in twenty seconds.',
    daily: [
      'Self-service package pickup queue',
      'File a maintenance request with photo in three taps',
      'Schedule expected visitors, contractors, and deliveries',
      'Book amenities with payment integrated',
      'Vacation hold pauses notifications when you&apos;re away',
    ],
    quote:
      '“My building used to send me PDFs and a website that looked like 2008. Now I open the app, see what&apos;s waiting at the desk, schedule my contractor for Tuesday, done. I actually use it.”',
    quoteRole: 'Owner-occupant · downtown waterfront condo',
  },
] as const;

const VALUE_STRIP = [
  {
    eyebrow: 'Role-aware',
    title: 'Each persona sees their own interface.',
    body: 'No feature bloat, no overwhelming menus. The front desk sees package intake and visitor sign-in. The board sees governance and financials. The resident sees their five things. Same database, five tailored doors.',
  },
  {
    eyebrow: 'Real-time',
    title: 'Everyone sees the same building.',
    body: 'A package logged at the desk shows up in the resident&apos;s app in seconds. A maintenance request the resident files lands on the manager&apos;s queue immediately. No nightly syncs, no &ldquo;refresh and see&rdquo;.',
  },
  {
    eyebrow: 'Mobile-first',
    title: 'Built for the floor, not the desk.',
    body: 'Security walks the perimeter with the security console in their pocket. The super inspects equipment without going back to the office. The resident schedules a contractor at the bus stop.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ForTeamsPage() {
  return (
    <>
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
              'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(178,146,255,0.16), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 700px 400px at 85% 90%, rgba(201,169,110,0.12), transparent 60%)',
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
              background: 'rgba(178,146,255,0.08)',
              border: '1px solid rgba(178,146,255,0.18)',
              fontSize: '0.8125rem',
              color: 'rgba(200,180,255,0.9)',
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#B292FF',
                boxShadow: '0 0 0 4px rgba(178,146,255,0.18)',
              }}
            />
            Five personas · One platform · Zero context-switching
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
            Built for everyone who{' '}
            <span style={{ color: '#B292FF', fontStyle: 'italic', fontWeight: 400 }}>
              keeps the building running.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 760,
              margin: '1.5rem auto 0',
            }}
          >
            Concierge teams. Security guards. Property managers. Condo and HOA boards. Residents and
            owners. Five completely different jobs — one platform, five tailored interfaces,
            designed by people who actually watched each role work.
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
              href={'/features' as never}
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
              See the modules →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ VALUE STRIP ============================ */}
      <section
        style={{
          background: '#0E0E0E',
          color: '#fff',
          padding: '4rem 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}
        >
          {VALUE_STRIP.map((v) => (
            <div
              key={v.title}
              style={{
                padding: '2rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(201,169,110,0.85)',
                  margin: 0,
                }}
              >
                {v.eyebrow}
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
                {v.title}
              </h3>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0,
                }}
              >
                {v.body
                  .replace(/&apos;/g, '’')
                  .replace(/&ldquo;/g, '“')
                  .replace(/&rdquo;/g, '”')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ PERSONA DEEP DIVES ============================ */}
      {PERSONAS.map((p, idx) => (
        <section
          key={p.slug}
          id={p.slug}
          style={{
            background: idx % 2 === 0 ? '#0A0A0A' : '#0E0E0E',
            color: '#fff',
            padding: '6rem 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: idx % 2 === 0 ? -200 : 'auto',
              right: idx % 2 === 0 ? 'auto' : -200,
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${p.accent}, transparent 70%)`,
              opacity: 0.06,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 clamp(1.5rem, 4vw, 3rem)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '4rem',
              alignItems: 'start',
            }}
          >
            <div style={{ order: idx % 2 === 0 ? 1 : 2 }}>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: p.accent,
                  margin: 0,
                }}
              >
                {p.role}
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: '#fff',
                  margin: '0.75rem 0 1.25rem',
                }}
              >
                {p.headline}
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.65)',
                  margin: 0,
                }}
              >
                {p.description.replace(/&apos;/g, '’')}
              </p>
            </div>

            <div style={{ order: idx % 2 === 0 ? 2 : 1 }}>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {p.daily.map((d) => (
                  <li
                    key={d}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.875rem 1.125rem',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '0.9375rem',
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: p.accent,
                        marginTop: '0.5rem',
                        flexShrink: 0,
                        boxShadow: `0 0 0 4px ${p.accent}22`,
                      }}
                    />
                    <span>{d.replace(/&apos;/g, '’')}</span>
                  </li>
                ))}
              </ul>

              <figure
                style={{
                  marginTop: '2rem',
                  padding: '1.75rem',
                  borderRadius: 16,
                  background: `${p.accent}08`,
                  border: `1px solid ${p.accent}28`,
                }}
              >
                <blockquote
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.85)',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  {p.quote
                    .replace(/&apos;/g, '’')
                    .replace(/“/g, '“')
                    .replace(/”/g, '”')}
                </blockquote>
                <figcaption
                  style={{
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '1rem',
                  }}
                >
                  — {p.quoteRole}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      ))}

      {/* ============================ COMPARISON GRID ============================ */}
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
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <header
            style={{
              textAlign: 'center',
              marginBottom: '4rem',
              maxWidth: 720,
              marginInline: 'auto',
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
              }}
            >
              What each role gets
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
              Same database. Different door.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
              }}
            >
              The five roles do five different jobs. We don&apos;t make them learn one interface —
              we make the interface fit each role.
            </p>
          </header>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {PERSONAS.map((p) => (
              <Link
                key={p.slug}
                href={`#${p.slug}` as never}
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 200ms ease',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${p.accent}22`,
                    border: `1px solid ${p.accent}44`,
                    marginBottom: '1rem',
                  }}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: p.accent,
                    margin: 0,
                  }}
                >
                  {p.role}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0.5rem 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {p.daily[0]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section
        style={{
          background: '#0E0E0E',
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
              'radial-gradient(ellipse 800px 500px at 50% 80%, rgba(178,146,255,0.10), transparent 65%)',
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
            See it for your role.
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
            Book a fifteen-minute demo. Tell us which roles you support. We&apos;ll show you exactly
            the interface they&apos;ll see — not a generic product tour.
          </p>
          <Link href={'/contact' as never} className="btn-primary">
            Book Your Demo
          </Link>
        </div>
      </section>
    </>
  );
}
