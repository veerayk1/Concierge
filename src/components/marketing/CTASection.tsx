'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

const WHATS_INSIDE = [
  'A 30-minute walkthrough of every module, with your data if you have it.',
  'A migration plan from whatever you run today.',
  'A pilot in one building, no contract, before you commit.',
];

export function CTASection() {
  return (
    <section
      className="mkt-dark"
      style={{
        background: '#0A0A0A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Layered aurora — matches the hero so the page bookends visually */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 900px 600px at 50% 70%, rgba(201, 169, 110, 0.14), transparent 65%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 700px 400px at 15% 30%, rgba(91, 130, 212, 0.07), transparent 60%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      {/* Grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1180,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
          paddingBlock: 'var(--space-section)',
        }}
      >
        <div
          className="mkt-cta-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: '5rem',
            alignItems: 'center',
          }}
        >
          {/* Left: pitch */}
          <div>
            <ScrollReveal>
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
                See it on your building
              </p>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                  fontWeight: 300,
                  color: '#fff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.02,
                  marginTop: '1.25rem',
                  marginBottom: 0,
                }}
              >
                One demo.
                <br />
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4BA85' }}>
                  Zero spreadsheets.
                </em>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={160}>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.62)',
                  marginTop: '1.5rem',
                  marginBottom: 0,
                  maxWidth: 480,
                }}
              >
                We will sit with your team, walk through how your building runs today, and show you
                exactly how BuildingAutopilot handles each piece. Thirty minutes. No deck. No
                nonsense.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={240}>
              <div
                style={{
                  marginTop: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href="/contact"
                  className="btn-primary"
                  style={{ padding: '14px 28px', fontSize: '0.9375rem' }}
                >
                  Request a Demo
                </a>
                <a
                  href="/contact"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 4px',
                    transition: 'color 200ms ease, gap 200ms ease',
                  }}
                  className="mkt-cta-link"
                >
                  Talk to sales
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" />
                  </svg>
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: what's in the box */}
          <ScrollReveal delay={200}>
            <div
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 18,
                padding: '28px 30px',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#D4BA85',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                }}
              >
                What you get
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {WHATS_INSIDE.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      fontSize: '0.9375rem',
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.78)',
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: 'rgba(201, 169, 110, 0.15)',
                        border: '1px solid rgba(201, 169, 110, 0.25)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="#D4BA85"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 7.5 6 10.5 11 4.5" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                style={{
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#5BD493',
                    boxShadow: '0 0 8px rgba(91, 212, 147, 0.6)',
                  }}
                />
                Demos this week typically book within 24 hours.
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .mkt-cta-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
        .mkt-cta-link:hover {
          color: #fff !important;
          gap: 10px !important;
        }
      `}</style>
    </section>
  );
}
