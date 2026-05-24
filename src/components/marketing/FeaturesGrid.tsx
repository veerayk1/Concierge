'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Feature category data
// ---------------------------------------------------------------------------

type Feature = { name: string; body: string };
type Group = {
  number: string;
  label: string;
  headline: string;
  description: string;
  features: Feature[];
  visual: ReactNode;
};

// ---------------------------------------------------------------------------
// Header section
// ---------------------------------------------------------------------------

export function FeaturesGrid() {
  return (
    <section
      id="features"
      style={{
        background: 'var(--color-ivory)',
        paddingBlock: 'var(--space-section)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Header */}
        <div
          className="mkt-features-header"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'end',
            paddingBottom: '4rem',
          }}
        >
          <ScrollReveal>
            <div>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--color-brass)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 1,
                    background: 'var(--color-brass)',
                    display: 'inline-block',
                  }}
                />
                The Product
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.02,
                  marginTop: '1.25rem',
                  color: 'var(--color-graphite)',
                }}
              >
                Twelve modules.
                <br />
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--color-brass)' }}>
                  One product.
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'var(--color-slate)',
                margin: 0,
              }}
            >
              Each piece is built for the role that actually uses it. Concierges get speed. Managers
              get oversight. Residents get a portal that loads in a tab. Everything shares the same
              data and the same design language, so nobody is learning a second product.
            </p>
          </ScrollReveal>
        </div>

        {/* Category blocks */}
        <div style={{ display: 'grid', gap: '5rem' }}>
          <FeatureBlock
            number="01"
            label="Operations"
            headline="The front desk, lived in."
            description="The flows your concierge runs hundreds of times a day, designed by someone who has actually stood behind that desk."
            features={[
              {
                name: 'Packages',
                body: 'Logged, photographed, courier-tagged in seconds. Auto notification on arrival.',
              },
              {
                name: 'Maintenance',
                body: 'Residents file in seconds. Staff route to a vendor or trade. Photos and audit trail throughout.',
              },
              {
                name: 'Security & access',
                body: 'Pre-authorize visitors, log incidents, run guard tours. Timestamps you can trust at 3am.',
              },
              {
                name: 'Parking',
                body: 'Spot assignment, visitor permits, and the full violation lifecycle.',
              },
            ]}
            visual={<OperationsVisual />}
            visualSide="right"
            accent="brass"
          />

          <FeatureBlock
            number="02"
            label="Residents"
            headline="The half of the building your software forgot."
            description="Residents get a portal that loads in a browser tab. No download, no friction, no support tickets about login."
            features={[
              {
                name: 'Resident portal',
                body: 'Self-serve packages, requests, bookings, comms. Works on phone and desktop.',
              },
              {
                name: 'Announcements',
                body: 'Building-wide or floor-specific. Scheduled, read-receipted, with an emergency mode.',
              },
              {
                name: 'Amenities',
                body: 'Party rooms, gyms, pools. Configurable time blocks, deposits, conflict prevention.',
              },
              {
                name: 'Elevator booking',
                body: 'Move-in scheduling with time blocks, deposits, and insurance certificate uploads.',
              },
            ]}
            visual={<ResidentsVisual />}
            visualSide="left"
            accent="green"
          />

          <FeatureBlock
            number="03"
            label="Portfolio & Compliance"
            headline="What keeps the board, the auditor, and the lawyer happy."
            description="The pieces nobody asks about until they need them. We built them so when the audit comes, the answer is already in the system."
            features={[
              {
                name: 'Multi-property',
                body: 'One login. One building or one hundred. Cross-property reporting is built in, not an add-on.',
              },
              {
                name: 'Documents & consent',
                body: 'Rules, bylaws, consent forms. Stored, versioned, signed digitally.',
              },
              {
                name: 'Keys & fobs',
                body: 'Track every access device. Assignment history, lost-key workflow, deposit ledger.',
              },
              {
                name: 'Staff training',
                body: 'Modules, certification tracking, audit-ready compliance reminders.',
              },
            ]}
            visual={<PortfolioVisual />}
            visualSide="right"
            accent="brass"
          />
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mkt-features-header {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            align-items: start !important;
          }
        }
      `}</style>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FeatureBlock — text on one side, visual mockup on the other
// ---------------------------------------------------------------------------

function FeatureBlock({
  number,
  label,
  headline,
  description,
  features,
  visual,
  visualSide,
  accent,
}: {
  number: string;
  label: string;
  headline: string;
  description: string;
  features: Feature[];
  visual: ReactNode;
  visualSide: 'left' | 'right';
  accent: 'brass' | 'green';
}) {
  const accentColor = accent === 'green' ? '#2E7D5B' : '#C9A96E';

  const text = (
    <ScrollReveal>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 200,
              color: accentColor,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {number}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-graphite)',
            }}
          >
            {label}
          </span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.75rem, 2.6vw, 2.5rem)',
            fontWeight: 400,
            color: 'var(--color-graphite)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
            maxWidth: 480,
          }}
        >
          {headline}
        </h3>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--color-slate)',
            marginTop: '1rem',
            marginBottom: '2rem',
            maxWidth: 500,
          }}
        >
          {description}
        </p>

        <div style={{ display: 'grid', gap: '1.125rem', maxWidth: 520 }}>
          {features.map((f) => (
            <div key={f.name}>
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--color-graphite)',
                  letterSpacing: '-0.005em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: accentColor,
                    display: 'inline-block',
                  }}
                />
                {f.name}
              </div>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.55,
                  color: 'var(--color-slate)',
                  margin: '4px 0 0 12px',
                  maxWidth: 500,
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );

  const visualBlock = <ScrollReveal delay={150}>{visual}</ScrollReveal>;

  return (
    <div
      className="mkt-feature-block"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
        gap: '4.5rem',
        alignItems: 'center',
      }}
    >
      {visualSide === 'left' ? (
        <>
          {visualBlock}
          {text}
        </>
      ) : (
        <>
          {text}
          {visualBlock}
        </>
      )}

      <style jsx global>{`
        @media (max-width: 1024px) {
          .mkt-feature-block {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OperationsVisual — a mini "package intake" panel
// ---------------------------------------------------------------------------

function OperationsVisual() {
  const packages = [
    {
      courier: 'Amazon',
      courierBg: '#FF9900',
      courierFg: '#000',
      unit: '1208',
      name: 'Sarah Chen',
      time: '2m',
      status: 'New',
      statusColor: '#5BD493',
    },
    {
      courier: 'UPS',
      courierBg: '#5A3921',
      courierFg: '#FFB500',
      unit: '904',
      name: 'M. Tanaka',
      time: '14m',
      status: 'Notified',
      statusColor: '#D4BA85',
    },
    {
      courier: 'FedEx',
      courierBg: '#4D148C',
      courierFg: '#FF6600',
      unit: '612',
      name: 'L. Rodriguez',
      time: '23m',
      status: 'Notified',
      statusColor: '#D4BA85',
    },
    {
      courier: 'DHL',
      courierBg: '#FFCC00',
      courierFg: '#D40511',
      unit: '301',
      name: 'A. Johnson',
      time: '41m',
      status: 'Picked up',
      statusColor: '#9CA3AF',
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Subtle halo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-30px',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201, 169, 110, 0.12), transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#fff',
          border: '1px solid rgba(26,26,26,0.08)',
          borderRadius: 18,
          padding: 20,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 24px 48px rgba(15,23,42,0.08)',
        }}
      >
        {/* Mini header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-graphite)',
                letterSpacing: '-0.01em',
              }}
            >
              Packages
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-slate)', marginTop: 2 }}>
              23 unreleased · 4 perishable
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--color-graphite)',
              color: '#fff',
              padding: '6px 11px',
              borderRadius: 6,
              letterSpacing: '-0.005em',
            }}
          >
            + Log package
          </div>
        </div>

        {/* Package rows */}
        <div
          style={{
            borderTop: '1px solid rgba(26,26,26,0.06)',
          }}
        >
          {packages.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto auto',
                gap: 12,
                alignItems: 'center',
                paddingBlock: 12,
                borderBottom: i === packages.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.05)',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  background: p.courierBg,
                  color: p.courierFg,
                  padding: '5px 8px',
                  borderRadius: 4,
                  textAlign: 'center',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {p.courier}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'var(--color-graphite)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  Unit {p.unit} · {p.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-slate)', marginTop: 1 }}>
                  Received {p.time} ago · Storage A
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-graphite)',
                  background: 'rgba(26,26,26,0.04)',
                  border: '1px solid rgba(26,26,26,0.05)',
                  padding: '3px 8px',
                  borderRadius: 999,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: p.statusColor,
                  }}
                />
                {p.status}
              </span>
              <span style={{ fontSize: 16, color: 'rgba(26,26,26,0.25)' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResidentsVisual — a stacked phone-notification composition
// ---------------------------------------------------------------------------

function ResidentsVisual() {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      {/* Halo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-30px',
          background:
            'radial-gradient(ellipse 60% 70% at 50% 40%, rgba(46, 125, 91, 0.12), transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 320,
          aspectRatio: '9 / 17',
          background: '#0F1014',
          borderRadius: 36,
          padding: 12,
          border: '8px solid #1a1b1f',
          boxShadow:
            '0 1px 2px rgba(0,0,0,0.1), 0 30px 60px rgba(15,23,42,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Phone screen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 26,
            background:
              'linear-gradient(180deg, #2E3343 0%, #1F2330 35%, #14171F 70%, #0B0E14 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '36px 12px 12px',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 80,
              height: 22,
              background: '#000',
              borderRadius: 14,
            }}
          />

          {/* Status text — time + carrier */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 18,
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              fontFeatureSettings: '"tnum"',
            }}
          >
            2:47
          </div>
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: '#fff',
            }}
          >
            <span>●●●</span>
          </div>

          {/* Notification stack */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <PhoneNotification
              app="Concierge"
              title="Your package has arrived"
              body="Amazon · ready for pickup at the front desk"
              time="now"
            />
            <PhoneNotification
              app="Concierge"
              title="Booking confirmed"
              body="Party room — Saturday 6–10pm"
              time="2m"
              dim={0.92}
            />
            <PhoneNotification
              app="Concierge"
              title="Building announcement"
              body="Water shutoff on the 9th floor 9–11am tomorrow"
              time="14m"
              dim={0.78}
            />
            <PhoneNotification
              app="Concierge"
              title="Request resolved"
              body="Your hot water leak request is closed."
              time="1h"
              dim={0.62}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneNotification({
  app,
  title,
  body,
  time,
  dim = 1,
}: {
  app: string;
  title: string;
  body: string;
  time: string;
  dim?: number;
}) {
  return (
    <div
      style={{
        background: `rgba(40, 44, 56, ${0.65 * dim + 0.1})`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: '10px 12px',
        opacity: dim,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
          fontSize: 9.5,
          letterSpacing: '0.02em',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #D4BA85 0%, #C9A96E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="7"
              height="7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B0C10"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{app}</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{time}</span>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          letterSpacing: '-0.005em',
          marginBottom: 2,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.35 }}>{body}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PortfolioVisual — a portfolio dashboard slice (properties + KPIs)
// ---------------------------------------------------------------------------

function PortfolioVisual() {
  const properties = [
    {
      name: 'Maple Heights',
      city: 'Toronto, ON',
      units: 200,
      status: 'Compliant',
      statusColor: '#5BD493',
      score: 92,
    },
    {
      name: 'Harbourfront Residences',
      city: 'Toronto, ON',
      units: 150,
      status: '2 expiring',
      statusColor: '#D4BA85',
      score: 78,
    },
    {
      name: 'Lakeshore Towers',
      city: 'Mississauga, ON',
      units: 320,
      status: 'Action needed',
      statusColor: '#E07A5F',
      score: 64,
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Halo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-30px',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201, 169, 110, 0.12), transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#fff',
          border: '1px solid rgba(26,26,26,0.08)',
          borderRadius: 18,
          padding: 20,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 24px 48px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-graphite)',
                letterSpacing: '-0.01em',
              }}
            >
              Portfolio
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-slate)', marginTop: 2 }}>
              3 properties · 670 units total
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MiniDonut label="Insurance" value={87} color="#5BD493" />
            <MiniDonut label="Inspections" value={62} color="#D4BA85" />
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(26,26,26,0.06)' }}>
          {properties.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 14,
                alignItems: 'center',
                paddingBlock: 12,
                borderBottom:
                  i === properties.length - 1 ? 'none' : '1px solid rgba(26,26,26,0.05)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'var(--color-graphite)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-slate)', marginTop: 1 }}>
                  {p.city} · {p.units} units
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-graphite)',
                  background: 'rgba(26,26,26,0.04)',
                  padding: '3px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(26,26,26,0.05)',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: p.statusColor,
                  }}
                />
                {p.status}
              </span>
              <ScoreBar value={p.score} />
              <span style={{ fontSize: 16, color: 'rgba(26,26,26,0.25)' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniDonut({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `conic-gradient(${color} 0% ${value}%, rgba(26,26,26,0.08) ${value}% 100%)`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--color-graphite)',
            fontFeatureSettings: '"tnum"',
          }}
        >
          {value}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-slate)', lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? '#5BD493' : value >= 70 ? '#D4BA85' : '#E07A5F';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <div
        style={{
          width: 56,
          height: 4,
          background: 'rgba(26,26,26,0.06)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--color-slate)',
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}/100
      </div>
    </div>
  );
}
