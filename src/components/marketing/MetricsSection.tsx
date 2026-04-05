'use client';

import { useCountUp } from '@/components/marketing/useCountUp';

/* -------------------------------------------------------------------------- */
/*  Stat definitions                                                          */
/* -------------------------------------------------------------------------- */

interface StatDef {
  target: number;
  format: (value: number) => string;
  label: string;
}

const stats: StatDef[] = [
  {
    target: 200,
    format: (v) => `${v.toLocaleString()}+`,
    label: 'Properties Managed',
  },
  {
    target: 50000,
    format: (v) => `${v.toLocaleString()}+`,
    label: 'Residents Served',
  },
  {
    target: 999,
    format: (v) => `${(v / 10).toFixed(1)}%`,
    label: 'Platform Uptime',
  },
  {
    target: 30,
    format: (v) => `<${v} min`,
    label: 'Average Onboarding Time',
  },
];

/* -------------------------------------------------------------------------- */
/*  Individual stat block (needs its own hook call)                            */
/* -------------------------------------------------------------------------- */

function StatBlock({ stat }: { stat: StatDef }) {
  const { ref, value } = useCountUp(stat.target, 1800);

  return (
    <div ref={ref} className="mkt-stat" style={{ flex: '1 1 0', minWidth: 160 }}>
      <span
        style={{
          fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
          fontWeight: 300,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: '#fff',
        }}
      >
        {stat.format(value)}
      </span>
      <span
        style={{
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.5)',
          marginTop: 'var(--space-xs)',
        }}
      >
        {stat.label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MetricsSection Component                                                  */
/* -------------------------------------------------------------------------- */

export function MetricsSection() {
  return (
    <section className="mkt-section mkt-section--dark mkt-dark">
      <div className="mkt-container">
        {/* Eyebrow */}
        <p
          className="mkt-eyebrow mkt-text-center"
          style={{ marginBottom: 'var(--space-2xl)' }}
        >
          BY THE NUMBERS
        </p>

        {/* Stats row */}
        <div className="metrics__row">
          {stats.map((stat, i) => (
            <div key={i} className="metrics__item" style={{ display: 'contents' }}>
              <StatBlock stat={stat} />
              {/* Vertical divider (not after last) */}
              {i < stats.length - 1 && (
                <div
                  className="metrics__divider"
                  aria-hidden="true"
                  style={{
                    width: 1,
                    alignSelf: 'stretch',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .metrics__row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xl);
        }

        @media (max-width: 767px) {
          .metrics__row {
            flex-wrap: wrap;
            gap: var(--space-xl) var(--space-lg);
          }
          .metrics__row .mkt-stat {
            flex-basis: calc(50% - var(--space-lg));
          }
          .metrics__divider {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
