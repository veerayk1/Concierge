import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concierge.app';

const SEO_TITLE = 'About Concierge | The Modern Property Management Platform Built in Canada';
const SEO_DESCRIPTION =
  'Concierge is the next-generation property management software built for Canadian condos, HOAs, and high-rises. We reverse-engineered every major platform, kept the best, dropped the worst, and rebuilt the category around real building operations.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    'about Concierge',
    'property management platform Canada',
    'condo software Toronto',
    'PIPEDA-compliant property software',
    'Canadian PropTech',
    'building management startup',
    'modern condo software',
    'multi-family software Canada',
  ],
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/about`,
    siteName: 'Concierge',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PRINCIPLES = [
  {
    eyebrow: '01',
    title: 'Replace five tools with one.',
    body: 'Front desk runs on one app. Security uses another. The board logs into a portal nobody opens. Residents have a website built in 2008. We built one platform for everyone — same database, five tailored interfaces.',
  },
  {
    eyebrow: '02',
    title: 'Design like Apple. Operate like a utility.',
    body: 'The product looks beautiful because beauty is functional — white space, one primary action per screen, color reserved for signal. The infrastructure is boring because boring infrastructure means the front desk doesn’t get paged at 3am.',
  },
  {
    eyebrow: '03',
    title: 'Build for the floor, not the demo.',
    body: 'Every workflow is designed by watching a concierge at the lobby during peak hours. Every screen is timed against a holiday Tuesday with forty packages. Every feature has to earn its place against the question: would the front desk thank us for it?',
  },
  {
    eyebrow: '04',
    title: 'Compliance as a feature.',
    body: 'PIPEDA, GDPR, SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, HIPAA. Compliance isn’t a checkbox we tick at the end — it’s how the product is shaped from the schema up. The audit log can’t be turned off because the audit log is the spine.',
  },
  {
    eyebrow: '05',
    title: 'Made in Canada. Built for the world.',
    body: 'Bilingual (English / fr-CA) from day one. PIPEDA-native, not retrofitted. Built in Toronto, with engineering practices borrowed from financial services and software security firms — because property data is more sensitive than most teams realize.',
  },
];

const RESEARCH = [
  {
    metric: '46',
    label: 'Live platforms studied',
    detail: 'Field-walked, screen-recorded, role-impersonated.',
  },
  {
    metric: '800+',
    label: 'Fields documented',
    detail: 'Every input box, every column, every label.',
  },
  { metric: '12', label: 'Workflows mapped', detail: 'Lifecycle chains from intake to close-out.' },
  {
    metric: '5',
    label: 'Personas observed',
    detail: 'Resident, concierge, security, manager, board.',
  },
];

const TIMELINE = [
  {
    year: '2024',
    title: 'Research',
    body: 'Three months reverse-engineering every major property management platform. Documented 800+ fields, 41 routes, 23+ unique features per platform.',
  },
  {
    year: '2025',
    title: 'Design',
    body: 'Wrote the 2,200-line design system before the first line of product code. Defined five personas. Drafted twenty-eight PRDs covering every module from packages to compliance. Brought in design partners from three Toronto condo corporations.',
  },
  {
    year: '2026',
    title: 'Build',
    body: 'Thirty-three weeks of focused engineering. 131-model schema. 100+ API endpoints. 2,194+ tests. Twelve modules shipped. Three pilot properties live, two more onboarding.',
  },
  {
    year: '2027',
    title: 'Scale',
    body: 'Series A. Twenty cities. Bilingual French support for Quebec. iOS and Android apps for residents. Open API and developer portal for integrations with door access, HVAC, and accounting platforms.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AboutPage() {
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
              'radial-gradient(ellipse 900px 600px at 50% 25%, rgba(201,169,110,0.18), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 700px 400px at 12% 75%, rgba(91,130,212,0.10), transparent 60%)',
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
            maxWidth: 1080,
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
                background: '#C9A96E',
                boxShadow: '0 0 0 4px rgba(201,169,110,0.18)',
              }}
            />
            Made in Toronto · Built for the world
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
            Property management software,{' '}
            <span style={{ color: '#C9A96E', fontStyle: 'italic', fontWeight: 400 }}>
              rebuilt from the floor up.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 760,
              margin: '1.5rem auto 0',
            }}
          >
            We studied every major building management platform — the dated ones, the bloated ones,
            and the ones with the prettiest dashboards. We documented 800+ fields and 12 workflows.
            Then we built the platform every property manager wishes existed.
          </p>
        </div>
      </section>

      {/* ============================ MISSION ============================ */}
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
            maxWidth: 920,
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
            }}
          >
            The mission
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#fff',
              margin: '0.75rem 0 1.5rem',
            }}
          >
            Replace the three apps every property manager hates with the one they didn’t know they
            could have.
          </h2>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.65)',
              margin: 0,
            }}
          >
            North American property teams juggle three to five disconnected platforms. One for
            packages. One for visitors. One for maintenance tickets. A spreadsheet for amenities. A
            PDF for announcements. The data lives in five places. The staff waste hours every shift
            just switching tabs. The residents see five interfaces, none of them good.
          </p>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.65)',
              margin: '1.25rem 0 0',
            }}
          >
            Concierge replaces all of it with one platform — designed by people who watched the
            concierge at peak hours, the security guard mid-shift, the board director on a Sunday
            night, the resident at the bus stop, and the property manager prepping for a board
            meeting.
          </p>
        </div>
      </section>

      {/* ============================ PRINCIPLES ============================ */}
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
              Our principles
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
              Five things we won’t compromise on.
            </h2>
          </header>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {PRINCIPLES.map((p) => (
              <article
                key={p.title}
                style={{
                  padding: '2rem',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#C9A96E',
                    margin: 0,
                    letterSpacing: '0.05em',
                  }}
                >
                  {p.eyebrow}
                </p>
                <h3
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 600,
                    lineHeight: 1.25,
                    color: '#fff',
                    margin: '0.75rem 0 1rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ RESEARCH ============================ */}
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
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
              The research
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.875rem, 3vw, 2.5rem)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: '0.75rem 0 1.25rem',
              }}
            >
              We didn’t guess. We documented.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
              }}
            >
              Before writing one line of product code, we field-walked five live properties,
              role-impersonated three concierge teams, and screen-recorded every existing platform.
              We documented every field, every workflow, every dead-end.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}
          >
            {RESEARCH.map((r) => (
              <div
                key={r.label}
                style={{
                  padding: '1.75rem',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 600,
                    color: '#C9A96E',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {r.metric}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#fff',
                    marginTop: '0.5rem',
                  }}
                >
                  {r.label}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.45)',
                    marginTop: '0.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  {r.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ TIMELINE ============================ */}
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
              The road
            </p>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: '0.75rem 0 1rem',
              }}
            >
              How we got here.
            </h2>
          </header>

          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {TIMELINE.map((t, i) => (
              <li
                key={t.year}
                style={{
                  padding: '2rem',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: '-0.875rem',
                    left: '2rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 999,
                    background: '#0A0A0A',
                    border: '1px solid rgba(201,169,110,0.45)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#C9A96E',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t.year}
                </div>
                <p
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.35)',
                    margin: 0,
                  }}
                >
                  Phase {i + 1}
                </p>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#fff',
                    margin: '0.5rem 0 0.875rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  {t.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================ TRUST STRIP ============================ */}
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
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            textAlign: 'center',
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
            Built for trust
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
            Compliance, security, and privacy — by design.
          </h2>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.6)',
              maxWidth: 720,
              marginInline: 'auto',
            }}
          >
            Property data is more sensitive than most teams realize. Resident contact info. Visitor
            logs. Incident reports. Insurance certificates. We treat it with the rigor financial
            services treat your bank account.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '2rem',
            }}
          >
            {[
              'PIPEDA',
              'GDPR',
              'SOC 2 Type II',
              'ISO 27001',
              'ISO 27701',
              'ISO 27017',
              'ISO 9001',
              'HIPAA',
            ].map((badge) => (
              <span
                key={badge}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.02em',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
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
            Let’s build the next chapter together.
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
            Pilot partners, design partners, and early customers welcome. Book a fifteen-minute
            walk-through — see exactly what your building could look like on a platform built for
            it.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href={'/contact' as never} className="btn-primary">
              Talk to Us
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
              Explore the product →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
