'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

type Feature = { name: string; body: string };
type Group = { label: string; description: string; features: Feature[] };

const GROUPS: Group[] = [
  {
    label: 'Operations',
    description: 'Everything that happens at the front desk and on the property.',
    features: [
      {
        name: 'Packages',
        body: 'Every delivery logged, photographed, and tracked from arrival to pickup. Notifications fire the moment a parcel hits the mailroom.',
      },
      {
        name: 'Maintenance & work orders',
        body: 'Residents file requests in seconds. Staff track them from open to resolved with full audit trail and photos.',
      },
      {
        name: 'Security & access logs',
        body: 'Pre-authorized visitors, entry logs, incident reports, and guard tours. Timestamps you can trust at 3am.',
      },
      {
        name: 'Parking',
        body: 'Spot assignments, visitor permits, and the full violation lifecycle from first warning to resolution.',
      },
    ],
  },
  {
    label: 'Residents',
    description: 'The half of the building your software usually ignores.',
    features: [
      {
        name: 'Resident portal',
        body: 'A clean, modern portal for packages, bookings, requests, and building comms. No app download required.',
      },
      {
        name: 'Announcements',
        body: 'Building-wide or floor-specific. Scheduled publishing, read receipts, and an emergency broadcast mode.',
      },
      {
        name: 'Amenities',
        body: 'Party rooms, gyms, pools, guest suites. Configurable time blocks, deposits, and automatic conflict prevention.',
      },
      {
        name: 'Elevator booking',
        body: 'Move-in and move-out scheduling with time blocks, security deposits, and insurance certificate uploads.',
      },
    ],
  },
  {
    label: 'Portfolio & Compliance',
    description: 'The pieces that keep the board, the auditor, and the lawyer happy.',
    features: [
      {
        name: 'Multi-property',
        body: 'One login. One building or one hundred. Instant context switching and cross-property reporting built in.',
      },
      {
        name: 'Documents & consent',
        body: 'Rules, bylaws, consent forms, and legal documents. Stored, versioned, signed digitally. Never chase a signature again.',
      },
      {
        name: 'Keys & fobs',
        body: 'Track every key, fob, and access device. Assignment history, lost-key workflow, deposit ledger.',
      },
      {
        name: 'Staff training',
        body: 'Built-in modules, certification tracking, and compliance reminders so your team is always audit-ready.',
      },
    ],
  },
];

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
          maxWidth: 1180,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Header — left aligned, editorial */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'end',
            paddingBottom: '4rem',
            borderBottom: '1px solid rgba(26,26,26,0.1)',
          }}
          className="mkt-features-header"
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
                  fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)',
                  fontWeight: 300,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.05,
                  marginTop: '1.25rem',
                  color: 'var(--color-graphite)',
                }}
              >
                Twelve modules.
                <br />
                One product.
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

        {/* Groups */}
        <div style={{ marginTop: '5rem', display: 'grid', gap: '5rem' }}>
          {GROUPS.map((group, gIdx) => (
            <ScrollReveal key={group.label} delay={gIdx * 100}>
              <div>
                {/* Group header */}
                <div
                  className="mkt-features-grouphead"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr',
                    gap: '2.5rem',
                    paddingBottom: '1.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--color-graphite)',
                        margin: 0,
                      }}
                    >
                      {String(gIdx + 1).padStart(2, '0')} &nbsp;{group.label}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--color-slate)',
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    {group.description}
                  </p>
                </div>

                {/* Feature rows */}
                <div>
                  {group.features.map((feature) => (
                    <div
                      key={feature.name}
                      className="mkt-feature-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '220px 1fr',
                        gap: '2.5rem',
                        paddingBlock: '1.5rem',
                        borderTop: '1px solid rgba(26,26,26,0.07)',
                        transition: 'background 200ms ease',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.0625rem',
                          fontWeight: 500,
                          color: 'var(--color-graphite)',
                          margin: 0,
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {feature.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          color: 'var(--color-slate)',
                          margin: 0,
                          maxWidth: 640,
                        }}
                      >
                        {feature.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .mkt-feature-row:hover {
          background: rgba(201, 169, 110, 0.04);
        }
        @media (max-width: 768px) {
          .mkt-features-header {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            align-items: start !important;
          }
          .mkt-features-grouphead {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mkt-feature-row {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}
