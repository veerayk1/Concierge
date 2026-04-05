'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// Browser Mockup (CSS-only abstract dashboard)
// ---------------------------------------------------------------------------

function BrowserMockup({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      style={{
        perspective: 1200,
        marginTop: '3rem',
      }}
    >
      <div
        style={{
          transform: isVisible
            ? 'rotateY(0deg) rotateX(0deg)'
            : 'rotateY(-2deg) rotateX(2deg)',
          transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
          maxWidth: 960,
          marginInline: 'auto',
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            background: '#1A1A1A',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#FF5F57',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#FEBC2E',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#28C840',
            }}
          />
          {/* URL bar */}
          <div
            style={{
              flex: 1,
              marginLeft: 12,
              height: 28,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              paddingInline: 12,
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              app.concierge.ca/dashboard
            </span>
          </div>
        </div>

        {/* Dashboard content */}
        <div
          style={{
            display: 'flex',
            minHeight: 360,
            background: '#111',
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              width: 200,
              background: '#141414',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              flexShrink: 0,
            }}
            className="mkt-mockup-sidebar"
          >
            {/* Logo area */}
            <div
              style={{
                height: 20,
                width: 80,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.08)',
                marginBottom: 16,
              }}
            />
            {/* Nav items */}
            {[0.12, 0.08, 0.08, 0.1, 0.06, 0.08].map((opacity, i) => (
              <div
                key={i}
                style={{
                  height: 32,
                  borderRadius: 6,
                  background:
                    i === 0
                      ? 'rgba(201, 169, 110, 0.12)'
                      : `rgba(255,255,255,${opacity})`,
                  display: 'flex',
                  alignItems: 'center',
                  paddingInline: 10,
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background:
                      i === 0
                        ? 'rgba(201, 169, 110, 0.4)'
                        : `rgba(255,255,255,${opacity + 0.04})`,
                  }}
                />
                <div
                  style={{
                    height: 8,
                    width: `${50 + i * 8}%`,
                    borderRadius: 4,
                    background:
                      i === 0
                        ? 'rgba(201, 169, 110, 0.3)'
                        : `rgba(255,255,255,${opacity + 0.02})`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main area */}
          <div style={{ flex: 1, padding: 24 }}>
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  height: 12,
                  width: 140,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <div
                style={{
                  height: 28,
                  width: 80,
                  borderRadius: 6,
                  background: 'rgba(201, 169, 110, 0.2)',
                }}
              />
            </div>

            {/* Two stat cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 20,
              }}
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(201, 169, 110, 0.2)',
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      width: '40%',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                      marginBottom: 10,
                    }}
                  />
                  <div
                    style={{
                      height: 24,
                      width: '30%',
                      borderRadius: 4,
                      background: 'rgba(201, 169, 110, 0.25)',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Grid of smaller cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      height: 6,
                      width: '60%',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.08)',
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 6,
                      width: '80%',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.04)',
                      marginBottom: 6,
                    }}
                  />
                  <div
                    style={{
                      height: 6,
                      width: '45%',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution Section
// ---------------------------------------------------------------------------

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        background: '#0A0A0A',
        paddingBlock: 'var(--space-section)',
        overflow: 'hidden',
      }}
    >
      {/* Background overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 50%, rgba(10,10,10,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Text content */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: 720,
            marginInline: 'auto',
          }}
        >
          <ScrollReveal>
            <p className="mkt-eyebrow">INTRODUCING CONCIERGE</p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h2
              className="mkt-section-headline"
              style={{ marginTop: '1.25rem', color: '#fff' }}
            >
              One platform. Every building. No compromises.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p
              style={{
                fontSize: 'clamp(1.125rem, 1.5vw, 1.25rem)',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.7)',
                marginTop: '1.5rem',
                maxWidth: 720,
                marginInline: 'auto',
              }}
            >
              Concierge is a unified building management platform that replaces your entire stack —
              packages, maintenance, security logs, visitor management, amenity bookings, parking,
              resident communications, and more. One login. One design language. One system that
              actually works together.
            </p>
          </ScrollReveal>
        </div>

        {/* Browser mockup */}
        <ScrollReveal delay={300}>
          <BrowserMockup isVisible={isVisible} />
        </ScrollReveal>
      </div>

      {/* Responsive hide sidebar on small screens */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .mkt-mockup-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
