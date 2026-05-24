'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

const PROBLEMS = [
  {
    number: '01',
    title: 'Five tools, none of them talk.',
    body: 'Packages live in one app, maintenance in another, security in a third. Your staff copies the same number into the same field, five times a day.',
  },
  {
    number: '02',
    title: 'Built for the desk, not the building.',
    body: "Yesterday's software was designed for office computers. Your concierge is on a phone at the front desk, dealing with a resident, a courier, and a contractor at the same time.",
  },
  {
    number: '03',
    title: 'Residents downloaded the app once.',
    body: 'They opened it twice. Now they call the front desk for everything. The app was never the problem. Twelve apps for twelve things was.',
  },
] as const;

export function ProblemSection() {
  return (
    <section
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
        {/* Header: left-aligned editorial */}
        <div style={{ maxWidth: 880 }}>
          <ScrollReveal>
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
              The Problem
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
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
              Building management software
              <br />
              hasn&apos;t evolved in fifteen years.
            </h2>
          </ScrollReveal>
        </div>

        {/* Numbered editorial list */}
        <div
          style={{
            marginTop: 'var(--space-3xl)',
            display: 'grid',
            gap: '2.5rem',
          }}
        >
          {PROBLEMS.map((p, i) => (
            <ScrollReveal key={p.number} delay={i * 120}>
              <article
                className="mkt-problem-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: '2rem',
                  paddingBlock: '2rem',
                  borderTop: '1px solid rgba(26, 26, 26, 0.08)',
                  alignItems: 'baseline',
                }}
              >
                <div
                  style={{
                    fontSize: '3.5rem',
                    fontWeight: 200,
                    color: 'var(--color-brass)',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {p.number}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 'clamp(1.375rem, 2vw, 1.75rem)',
                      fontWeight: 500,
                      color: 'var(--color-graphite)',
                      letterSpacing: '-0.015em',
                      lineHeight: 1.25,
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: 1.65,
                      color: 'var(--color-slate)',
                      marginTop: '0.75rem',
                      maxWidth: 680,
                    }}
                  >
                    {p.body}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Transition line, right-aligned signature */}
        <ScrollReveal delay={420}>
          <div
            style={{
              marginTop: '3.5rem',
              paddingTop: '2.5rem',
              borderTop: '1px solid rgba(26, 26, 26, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: '1rem',
                color: 'var(--color-slate)',
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              So we built something else.
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="var(--color-brass)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </div>
        </ScrollReveal>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) {
          .mkt-problem-row {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </section>
  );
}
