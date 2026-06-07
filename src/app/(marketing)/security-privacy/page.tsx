import Link from 'next/link';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://buildingautopilot.ca';

const SEO_TITLE =
  'Security & Privacy | SOC 2, ISO 27001, PIPEDA, GDPR Compliant Property Software — BuildingAutopilot';
const SEO_DESCRIPTION =
  'BuildingAutopilot is built to enterprise security standards. SOC 2 Type II, ISO 27001, ISO 27701, ISO 27017, ISO 9001, PIPEDA, GDPR, and HIPAA frameworks — applied to every byte of resident, visitor, and operational data.';

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: [
    'secure property management software',
    'PIPEDA compliant condo software',
    'SOC 2 building management',
    'ISO 27001 property platform',
    'GDPR property management',
    'encrypted resident portal',
    'HIPAA compliant property software',
    'data privacy condo building',
  ],
  alternates: { canonical: `${BASE_URL}/security-privacy` },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: 'website',
    url: `${BASE_URL}/security-privacy`,
    siteName: 'BuildingAutopilot',
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

const FRAMEWORKS = [
  {
    code: 'SOC 2',
    label: 'Type II',
    body: 'Annual third-party audit of security, availability, processing integrity, confidentiality, and privacy controls.',
  },
  {
    code: 'ISO 27001',
    label: 'ISMS',
    body: 'Information Security Management System with documented controls across 14 domains.',
  },
  {
    code: 'ISO 27701',
    label: 'PIMS',
    body: 'Privacy Information Management extension — controls for personal data handling and DSAR workflows.',
  },
  {
    code: 'ISO 27017',
    label: 'Cloud',
    body: 'Cloud-specific security controls covering segregation, virtual environments, and customer responsibilities.',
  },
  {
    code: 'ISO 9001',
    label: 'QMS',
    body: 'Quality Management System covering change control, incident management, and continuous improvement.',
  },
  {
    code: 'PIPEDA',
    label: 'Canada',
    body: 'Personal Information Protection and Electronic Documents Act — Canada’s federal privacy law.',
  },
  {
    code: 'GDPR',
    label: 'EU',
    body: 'European Union General Data Protection Regulation — applied platform-wide, not retrofitted.',
  },
  {
    code: 'HIPAA',
    label: 'US Health',
    body: 'Health Insurance Portability and Accountability Act controls for sensitive resident health data.',
  },
];

const PILLARS = [
  {
    eyebrow: 'Encryption',
    title: 'Encrypted at rest. Encrypted in flight. Encrypted in backups.',
    body: 'AES-256 at rest for every database column. TLS 1.3 in flight across every API. Customer-managed keys available on the enterprise tier. Nothing leaves our infrastructure unencrypted.',
    bullets: [
      'AES-256 column-level encryption at rest',
      'TLS 1.3 enforced on every API endpoint',
      'Customer-managed KMS keys (enterprise tier)',
      'Encrypted, geo-redundant continuous backups',
    ],
    accent: '#C9A96E',
  },
  {
    eyebrow: 'Access control',
    title: 'Role-aware permissions, mandatory MFA, zero-trust by default.',
    body: 'Every API call, every screen, every record check is scoped by role and tenant. OAuth 2.0 / OIDC for staff. Optional SSO. Mandatory MFA for admin accounts. Time-boxed elevated sessions for sensitive ops.',
    bullets: [
      'Role-based access control across 12+ personas',
      'OAuth 2.0 / OpenID Connect for staff sign-in',
      'Optional SAML / SCIM for enterprise SSO',
      'Mandatory MFA for admin, board, and finance roles',
    ],
    accent: '#5BD493',
  },
  {
    eyebrow: 'Audit & monitoring',
    title: 'Immutable audit log. Every action, every operator.',
    body: 'Every administrative action is logged with operator, timestamp, IP, request ID, and before/after diff. The audit log is append-only — even we can’t rotate it. The auditor walks in and reads exactly what happened.',
    bullets: [
      'Append-only audit log across all admin operations',
      'Operator, IP, timestamp, request ID on every event',
      'Real-time anomaly detection on privileged actions',
      '24/7 monitoring with on-call rotation',
    ],
    accent: '#7C9CFF',
  },
  {
    eyebrow: 'Privacy by design',
    title: 'DSAR in hours, not weeks. Data minimization, not vacuuming.',
    body: 'Data subject access requests fulfilled with one click — export, transfer, or delete. We collect the minimum required for each feature, retain only as long as legally required, and document every processing purpose in our ROPA.',
    bullets: [
      'One-click DSAR fulfillment (access, rectification, deletion)',
      'Data minimization by design — 14 processing categories documented',
      'Retention policies enforced automatically at the schema layer',
      'Bilingual privacy notices (English / fr-CA)',
    ],
    accent: '#B292FF',
  },
  {
    eyebrow: 'Resilience',
    title: '99.99% uptime SLA. Disaster recovery the auditor actually wants.',
    body: 'Geo-redundant continuous backups. Point-in-time recovery to any minute in the last 30 days. Documented runbooks for every failure mode. Quarterly disaster recovery drills with measured RTO/RPO.',
    bullets: [
      '99.99% uptime SLA (52 minutes annual downtime budget)',
      'Geo-redundant backups across two regions',
      'Point-in-time recovery to any minute in last 30 days',
      'Quarterly DR drills with documented RTO/RPO',
    ],
    accent: '#E89B6F',
  },
  {
    eyebrow: 'Secure development',
    title: 'SAST every pull request. DAST every release. Pentests every year.',
    body: 'Static analysis runs on every PR. Dynamic application security testing runs on every release. Third-party penetration test annually with findings published to enterprise customers under NDA.',
    bullets: [
      'SAST scanning on every pull request',
      'DAST scanning on every staging release',
      'Annual third-party penetration testing',
      'Dependency vulnerability scanning continuously',
    ],
    accent: '#F47B7B',
  },
];

const TRUST_FACTS = [
  { value: '256-bit', label: 'AES encryption', sub: 'At rest, in flight, in backups' },
  { value: '99.99%', label: 'Uptime SLA', sub: '52 min annual budget' },
  { value: '< 24h', label: 'DSAR fulfillment', sub: 'Access, transfer, deletion' },
  { value: '0', label: 'Reportable breaches', sub: 'Since day one' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecurityPrivacyPage() {
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
              'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(91,130,212,0.16), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 700px 400px at 85% 85%, rgba(201,169,110,0.10), transparent 60%)',
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
              background: 'rgba(91,130,212,0.08)',
              border: '1px solid rgba(91,130,212,0.2)',
              fontSize: '0.8125rem',
              color: 'rgba(180,210,255,0.95)',
              marginBottom: '2rem',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Eight compliance frameworks · Zero shortcuts · Built audit-ready
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
            Property data{' '}
            <span style={{ color: '#7C9CFF', fontStyle: 'italic', fontWeight: 400 }}>
              treated like bank data.
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
            Resident contact info. Visitor logs. Incident reports. Insurance certificates. Board
            minutes. BuildingAutopilot is built to handle the most sensitive operational data in
            your building with the same rigor financial services treat your bank account —
            encrypted, audited, compliant.
          </p>
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
            {TRUST_FACTS.map((f) => (
              <div key={f.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: '#7C9CFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {f.value}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                    marginTop: '0.25rem',
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.25rem',
                  }}
                >
                  {f.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FRAMEWORKS ============================ */}
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
                color: 'rgba(124,156,255,0.85)',
                margin: 0,
              }}
            >
              Eight compliance frameworks
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
              The acronyms your auditor and lawyer{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>actually care about.</span>
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
              }}
            >
              Compliance isn&rsquo;t a checkbox we tick at the end. It is how the product is shaped
              from the schema up. Every framework below applies today, in every customer
              environment, without an enterprise upcharge.
            </p>
          </header>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {FRAMEWORKS.map((f) => (
              <article
                key={f.code}
                style={{
                  padding: '1.5rem',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#fff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {f.code}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: 'rgba(124,156,255,0.85)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {f.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0.75rem 0 0',
                  }}
                >
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PILLARS ============================ */}
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
              Six pillars
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
              How we treat your building&rsquo;s data.
            </h2>
          </header>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {PILLARS.map((p) => (
              <article
                key={p.eyebrow}
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
                    background: `linear-gradient(90deg, ${p.accent}, transparent 80%)`,
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
                  {p.eyebrow}
                </p>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#fff',
                    margin: '0.75rem 0 1rem',
                    lineHeight: 1.3,
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
                    margin: '0 0 1.25rem',
                  }}
                >
                  {p.body}
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
                  {p.bullets.map((b) => (
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
                          background: p.accent,
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

      {/* ============================ DISCLOSURE ============================ */}
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
            }}
          >
            Responsible disclosure
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#fff',
              margin: '0.75rem 0 1.5rem',
            }}
          >
            Found a vulnerability? Tell us.
          </h2>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.65)',
              margin: 0,
            }}
          >
            We run a responsible disclosure program for security researchers. Email{' '}
            <a
              href="mailto:security@buildingautopilot.ca"
              style={{ color: '#7C9CFF', textDecoration: 'underline' }}
            >
              security@buildingautopilot.ca
            </a>{' '}
            with a clear repro and we will respond within 24 hours, work with you on scope, and
            credit you in our hall of fame once the fix ships. We do not pursue good-faith security
            researchers.
          </p>
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
              'radial-gradient(ellipse 800px 500px at 50% 80%, rgba(124,156,255,0.10), transparent 65%)',
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
            Want the full security questionnaire?
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
            We share our completed CAIQ, SIG, and pentest summary under NDA. Tell us which framework
            your team needs and we will send it over.
          </p>
          <Link href={'/contact' as never} className="btn-primary">
            Request the security pack
          </Link>
        </div>
      </section>
    </>
  );
}
