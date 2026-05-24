'use client';

import { useCountUp } from '@/components/marketing/useCountUp';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// Product-truth metrics. Every number here is defensible from what shipped.
// No vanity counts, no fake user totals.
// ---------------------------------------------------------------------------

interface StatDef {
  target: number;
  format: (value: number) => string;
  prefix?: string;
  suffix?: string;
  label: string;
  caption: string;
}

const stats: StatDef[] = [
  {
    target: 12,
    format: (v) => `${v}`,
    label: 'Modules',
    caption: 'All integrated, all sharing the same data.',
  },
  {
    target: 7,
    format: (v) => `${v}`,
    label: 'Roles',
    caption: 'Each one gets a tailored dashboard, not a one-size-fits-all view.',
  },
  {
    target: 30,
    format: (v) => `${v}`,
    suffix: 's',
    label: 'To log a package',
    caption: 'From courier scan to resident notification.',
  },
  {
    target: 1,
    format: (v) => `${v}`,
    label: 'Login',
    caption: 'Replaces the twelve your team juggles today.',
  },
];

function StatBlock({ stat }: { stat: StatDef }) {
  const { ref, value } = useCountUp(stat.target, 1400);

  return (
    <div
      ref={ref}
      style={{
        flex: '1 1 0',
        minWidth: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 'clamp(3.75rem, 7vw, 6rem)',
          fontWeight: 200,
          letterSpacing: '-0.05em',
          lineHeight: 0.95,
          color: '#fff',
          fontFeatureSettings: '"tnum"',
          display: 'inline-flex',
          alignItems: 'baseline',
        }}
      >
        {stat.format(value)}
        {stat.suffix && (
          <span
            style={{
              fontSize: '0.42em',
              color: '#D4BA85',
              marginLeft: 4,
              fontWeight: 300,
            }}
          >
            {stat.suffix}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          color: '#D4BA85',
          textTransform: 'uppercase',
        }}
      >
        {stat.label}
      </div>
      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
          maxWidth: 220,
        }}
      >
        {stat.caption}
      </p>
    </div>
  );
}

export function MetricsSection() {
  return (
    <section
      style={{
        background: '#0A0A0A',
        paddingBlock: 'var(--space-section)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Soft brand glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 800px 500px at 50% 30%, rgba(201, 169, 110, 0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1240,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Header — editorial split */}
        <div
          className="mkt-metrics-header"
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
                  color: '#D4BA85',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{ width: 24, height: 1, background: '#D4BA85', display: 'inline-block' }}
                />
                The shape of it
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                  fontWeight: 300,
                  color: '#fff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.02,
                  marginTop: '1.25rem',
                }}
              >
                Small numbers,
                <br />
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4BA85' }}>
                  big surface area.
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.62)',
                margin: 0,
              }}
            >
              Most platforms in this space brag about modules. We brag about what it takes to get
              work done. Every number on this page is measured against an actual workflow our team
              runs in the product, not a marketing roundup.
            </p>
          </ScrollReveal>
        </div>

        {/* Stats grid */}
        <ScrollReveal delay={150}>
          <div
            className="mkt-metrics-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '3rem',
              paddingTop: '3rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {stats.map((stat, i) => (
              <StatBlock key={i} stat={stat} />
            ))}
          </div>
        </ScrollReveal>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .mkt-metrics-header {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            align-items: start !important;
          }
          .mkt-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 3rem 2rem !important;
          }
        }
        @media (max-width: 500px) {
          .mkt-metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
