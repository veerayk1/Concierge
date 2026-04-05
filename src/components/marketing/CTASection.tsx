'use client';

import { ScrollReveal } from '@/components/marketing/ScrollReveal';

/* -------------------------------------------------------------------------- */
/*  CTASection Component (Section 9)                                          */
/* -------------------------------------------------------------------------- */

export function CTASection() {
  return (
    <section
      className="mkt-dark"
      style={{
        background:
          'linear-gradient(to bottom, rgba(10,10,10,0.88), rgba(10,10,10,0.95))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '120%',
          height: '120%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(ellipse at center, rgba(201,169,110,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="mkt-container mkt-text-center"
        style={{
          paddingBlock: 'var(--space-4xl)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ScrollReveal>
          <h2
            className="mkt-section-headline"
            style={{
              color: '#fff',
              marginBottom: 'var(--space-md)',
            }}
          >
            Ready to modernize your building?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p
            style={{
              fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
              fontWeight: 400,
              letterSpacing: '-0.01em',
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.6)',
              maxWidth: 640,
              marginInline: 'auto',
              marginBottom: 'var(--space-xl)',
            }}
          >
            Join the growing number of property management companies replacing
            their entire tech stack with Concierge. One platform. Every building.
            Starting today.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div
            className="mkt-btn-group"
            style={{
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <a href="/demo" className="btn-primary">
              Request a Demo
            </a>
            <a href="/contact" className="btn-ghost">
              Contact Sales
            </a>
          </div>

          <p
            style={{
              fontSize: '0.8125rem',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.02em',
            }}
          >
            No contracts. No setup fees. Full onboarding support.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
