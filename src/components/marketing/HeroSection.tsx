'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// CSS keyframes and animation styles
// ---------------------------------------------------------------------------

const fadeInUpKeyframes = `
@keyframes heroFadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroChevronBob {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(8px);
  }
}
`;

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
  const [showChevron, setShowChevron] = useState(true);

  useEffect(() => {
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
      <style dangerouslySetInnerHTML={{ __html: fadeInUpKeyframes }} />

      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 600px 400px at 55% 45%, rgba(201, 169, 110, 0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* 3D canvas placeholder */}
      <div
        id="hero-canvas"
        style={{
          position: 'absolute',
          inset: 0,
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
          style={{
            textTransform: 'uppercase',
            color: '#C9A96E',
            fontSize: '0.8125rem',
            letterSpacing: '0.08em',
            fontWeight: 500,
            margin: 0,
            opacity: 0,
            animation: 'heroFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards',
          }}
        >
          BUILDING MANAGEMENT, REIMAGINED
        </p>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
            fontWeight: 300,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginTop: '1.5rem',
            marginBottom: 0,
            opacity: 0,
            animation: 'heroFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards',
          }}
        >
          The last platform your building will ever need.
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.4,
            maxWidth: 680,
            marginTop: '1.5rem',
            marginBottom: 0,
            letterSpacing: '-0.01em',
            opacity: 0,
            animation: 'heroFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 400ms forwards',
          }}
        >
          Concierge replaces your fragmented tools with one unified system — packages, maintenance,
          security, amenities, parking, and everything in between — designed for the people who
          actually run buildings.
        </p>

        {/* CTA group */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            opacity: 0,
            animation: 'heroFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 600ms forwards',
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
          style={{
            marginTop: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            opacity: 0,
            animation: 'heroFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 800ms forwards',
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
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: showChevron ? 0.3 : 0,
          transition: 'opacity 400ms ease',
          animation: 'heroChevronBob 2s ease-in-out infinite',
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
