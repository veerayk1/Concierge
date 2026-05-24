'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';

const HeroCanvas = lazy(() => import('./HeroCanvas').then((mod) => ({ default: mod.HeroCanvas })));

const STAT_ROW = [
  { from: '5', to: '1', label: 'tools' },
  { from: '12', to: '1', label: 'logins' },
  { from: '30', to: '0', label: 'spreadsheets' },
] as const;

export function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [showChevron, setShowChevron] = useState(true);

  useEffect(() => {
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
            'radial-gradient(ellipse 720px 480px at 50% 40%, rgba(201, 169, 110, 0.10), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, #000 30%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>

      {/* Mobile fallback gradient */}
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

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 980,
          width: '100%',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Status pill */}
        <div
          className={heroClass(1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(201, 169, 110, 0.08)',
            border: '1px solid rgba(201, 169, 110, 0.18)',
            fontSize: '0.75rem',
            color: '#D4BA85',
            letterSpacing: '0.04em',
            fontWeight: 500,
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
          New: AI shift briefings now live
        </div>

        {/* Headline */}
        <h1
          className={heroClass(2)}
          style={{
            fontSize: 'clamp(3rem, 6.4vw, 6rem)',
            fontWeight: 300,
            color: '#fff',
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
            marginTop: '1.75rem',
            marginBottom: 0,
          }}
        >
          The last platform
          <br />
          your building{' '}
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4BA85' }}>will ever</em>{' '}
          need.
        </h1>

        {/* Sub-headline */}
        <p
          className={heroClass(3)}
          style={{
            fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.62)',
            lineHeight: 1.5,
            maxWidth: 620,
            marginTop: '1.5rem',
            marginBottom: 0,
            letterSpacing: '-0.005em',
          }}
        >
          Packages, maintenance, security, amenities, parking, residents. One system for everyone
          who keeps the building running.
        </p>

        {/* CTA group — clear primary, quiet secondary */}
        <div
          className={heroClass(4)}
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '2.25rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Link href={'/contact' as never} className="btn-primary mkt-cta-primary">
            Request a Demo
          </Link>
          <a
            href="#features"
            onClick={handleSeeHowItWorks}
            className="mkt-cta-link"
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
          >
            See how it works
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

        {/* Stat row — honest, specific, no fake logos */}
        <div
          className={heroClass(5)}
          style={{
            marginTop: '4rem',
            display: 'inline-flex',
            alignItems: 'stretch',
            gap: 0,
            padding: '0',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {STAT_ROW.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 22px',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.35)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(196, 92, 62, 0.5)',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {stat.from}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 400,
                  color: '#D4BA85',
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: '-0.02em',
                }}
              >
                {stat.to}
              </span>
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.45)',
                  marginLeft: 2,
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
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
          opacity: showChevron ? 0.35 : 0,
          transition: 'opacity 400ms ease',
          animation: 'mktChevronBob 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="22"
          height="22"
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

      <style jsx global>{`
        .mkt-cta-link:hover {
          color: #fff !important;
          gap: 10px !important;
        }
        @media (max-width: 640px) {
          .marketing .mkt-hero-stats-row {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
