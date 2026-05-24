'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// Founder's note. Replaces the fake "Property Manager, Toronto ON" testimonial
// — pre-revenue, an honest founder voice is more credible than a stranger's
// quote. Swap to a real customer quote once we have one in writing.
// ---------------------------------------------------------------------------

export function TestimonialSection() {
  return (
    <section
      style={{
        background: 'var(--color-ivory)',
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
            'radial-gradient(ellipse 700px 400px at 50% 50%, rgba(201, 169, 110, 0.08), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 980,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
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
            Why we built this
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <blockquote
            style={{
              fontSize: 'clamp(1.625rem, 3vw, 2.5rem)',
              fontWeight: 300,
              color: 'var(--color-graphite)',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              margin: '1.5rem 0 0',
              padding: 0,
              border: 'none',
            }}
          >
            We sat behind a front desk for a week.
            <br />
            <span style={{ color: 'var(--color-slate)' }}>
              Then we watched a property manager{' '}
              <em
                style={{
                  fontStyle: 'italic',
                  fontWeight: 300,
                  color: 'var(--color-brass)',
                }}
              >
                tab between five tools
              </em>{' '}
              to release one package. That is when we knew the category was broken at the seams, not
              at the surface.
            </span>
          </blockquote>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div
            style={{
              marginTop: '3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brass), #B89968)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              YV
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--color-graphite)',
                  letterSpacing: '-0.005em',
                }}
              >
                Yaswanth Veera
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-slate)',
                  marginTop: 1,
                }}
              >
                Founder, Concierge
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
