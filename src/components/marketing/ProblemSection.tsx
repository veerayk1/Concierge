'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// Card Data
// ---------------------------------------------------------------------------

const PROBLEM_CARDS = [
  {
    title: 'The Legacy Player',
    description:
      'Deep security workflows. Looks like it was built in 2008. Training takes weeks.',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C45C3E"
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
    title: 'The Franken-Platform',
    description:
      'Broad features, but feels like two different products glued together. Nothing is consistent.',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C45C3E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="8" y="8" width="10" height="10" rx="2" />
        <rect x="22" y="8" width="10" height="10" rx="2" />
        <rect x="8" y="22" width="10" height="10" rx="2" />
        <rect x="22" y="22" width="10" height="10" rx="2" />
        <path d="M18 13h4M13 18v4M27 18v4M18 27h4" />
      </svg>
    ),
  },
  {
    title: 'The Pretty Face',
    description:
      "Modern UI, but half the modules are missing. You still need three other tools.",
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="#C45C3E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="20" cy="14" r="5" />
        <path d="M10 34c0-2 2-6 4-8" />
        <path d="M30 34c0-2-2-6-4-8" />
        <path d="M14 26c2 1 4 1.5 6 1.5s4-.5 6-1.5" />
        <path d="M12 12l-2-4M28 12l2-4M20 8V4" />
      </svg>
    ),
  },
] as const;

// ---------------------------------------------------------------------------
// Problem Section
// ---------------------------------------------------------------------------

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
          maxWidth: 1280,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Part A — The Statement */}
        <div
          style={{
            maxWidth: 720,
            marginInline: 'auto',
            textAlign: 'center',
          }}
        >
          <ScrollReveal>
            <p className="mkt-eyebrow">THE PROBLEM</p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h2
              className="mkt-section-headline"
              style={{ marginTop: '1.25rem', color: 'var(--color-graphite)' }}
            >
              Building management software hasn&apos;t evolved in 15 years.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p
              className="mkt-body"
              style={{
                marginTop: '1.5rem',
                color: 'var(--color-slate)',
                lineHeight: 1.7,
                maxWidth: 680,
                marginInline: 'auto',
              }}
            >
              The tools property managers use today were designed in an era of desktop-first
              thinking, bolt-on modules, and &ldquo;good enough&rdquo; interfaces. Your staff wastes
              hours switching between systems. Your residents download apps they never open. Your
              data lives in five different places. It&apos;s not a workflow — it&apos;s a
              workaround.
            </p>
          </ScrollReveal>
        </div>

        {/* Part B — Three cards */}
        <div
          className="mkt-problem-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-lg)',
            marginTop: 'var(--space-3xl)',
          }}
        >
          {PROBLEM_CARDS.map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 120}>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-mist)',
                  borderTop: '3px solid rgba(196, 92, 62, 0.5)',
                  borderRadius: 16,
                  padding: 'var(--space-xl)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 200ms ease, transform 200ms ease',
                  height: '100%',
                }}
              >
                <div style={{ marginBottom: 'var(--space-sm)' }}>{card.icon}</div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-graphite)',
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'var(--color-slate)',
                    margin: 0,
                  }}
                >
                  {card.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Transition line */}
        <ScrollReveal delay={360}>
          <p
            className="mkt-sub-headline"
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-3xl)',
              color: 'var(--color-brass)',
              fontWeight: 500,
            }}
          >
            There&apos;s a better way.
          </p>
        </ScrollReveal>
      </div>

      {/* Responsive card grid */}
      <style jsx global>{`
        @media (max-width: 767px) {
          .mkt-problem-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
