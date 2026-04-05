'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';

// Lazy-load Three.js canvas to avoid SSR issues and reduce bundle
const HeroCanvas = lazy(() =>
  import('./HeroCanvas').then((mod) => ({ default: mod.HeroCanvas }))
);

// ---------------------------------------------------------------------------
// Logo Placeholder
// ---------------------------------------------------------------------------

function LogoPlaceholder() {
  return (
    <div
      style={{
        width: 100,
        height: 32,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: '0.625rem',
          color: 'rgba(255,255,255,0.1)',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        LOGO
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

export function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [showChevron, setShowChevron] = useState(true);

  useEffect(() => {
    // Use double-rAF to ensure the browser has painted the initial state
    // before triggering the CSS animation. This prevents hydration batching.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    const handleScroll = () => {
      setShowChevron(window.scrollY <= 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSeeHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('features');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Class helper: applies the animation trigger class when visible
  const heroClass = (delay: number) =>
    `mkt-hero-enter${visible ? ` mkt-hero-visible mkt-hero-delay-${delay}` : ''}`;

  return (
    <section
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginTop: -72,
        paddingTop: 72,
      }}
    >
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 600px 400px at 55% 45%, rgba(201, 169, 110, 0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Three.js 3D canvas — lazy loaded, hidden on mobile */}
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>

      {/* Mobile fallback gradient (shown when Three.js canvas is hidden) */}
      <div
        aria-hidden="true"
        className="block md:hidden"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 400px 300px at 50% 50%, rgba(201, 169, 110, 0.06), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 960,
          width: '100%',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Eyebrow */}
        <p
          className={heroClass(1)}
          style={{
            textTransform: 'uppercase',
            color: '#C9A96E',
            fontSize: '0.8125rem',
            letterSpacing: '0.08em',
            fontWeight: 500,
            margin: 0,
          }}
        >
          BUILDING MANAGEMENT, REIMAGINED
        </p>

        {/* Headline */}
        <h1
          className={heroClass(2)}
          style={{
            fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
            fontWeight: 300,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginTop: '1.5rem',
            marginBottom: 0,
          }}
        >
          The last platform your building will ever need.
        </h1>

        {/* Sub-headline */}
        <p
          className={heroClass(3)}
          style={{
            fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.4,
            maxWidth: 680,
            marginTop: '1.5rem',
            marginBottom: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Concierge replaces your fragmented tools with one unified system — packages, maintenance,
          security, amenities, parking, and everything in between — designed for the people who
          actually run buildings.
        </p>

        {/* CTA group */}
        <div
          className={heroClass(4)}
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link href={'/contact' as never} className="btn-primary">
            Request a Demo
          </Link>
          <a href="#features" onClick={handleSeeHowItWorks} className="btn-secondary">
            See How It Works
          </a>
        </div>

        {/* Trust strip */}
        <div
          className={heroClass(5)}
          style={{
            marginTop: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'rgba(255,255,255,0.35)',
              margin: 0,
            }}
          >
            Trusted by 200+ residential properties across North America
          </p>
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <LogoPlaceholder />
            <LogoPlaceholder />
            <LogoPlaceholder />
            <LogoPlaceholder />
            <LogoPlaceholder />
            <LogoPlaceholder />
          </div>
        </div>
      </div>

      {/* Scroll chevron */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: showChevron ? 0.3 : 0,
          transition: 'opacity 400ms ease',
          animation: 'mktChevronBob 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
