'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// Product Mockup — a richly-detailed CSS rendering of the actual dashboard.
// No gray-box placeholders. Real labels, real numbers, real product story.
// ---------------------------------------------------------------------------

const SIDEBAR_NAV = [
  { label: 'Dashboard', active: true },
  { label: 'Units' },
  { label: 'Residents' },
  { label: 'Amenities' },
] as const;

const SIDEBAR_OPS = [
  { label: 'Security console' },
  { label: 'Packages', badge: 23 },
  { label: 'Maintenance', badge: 5 },
  { label: 'Visitors' },
  { label: 'Announcements' },
] as const;

const KPIS = [
  { label: 'Open requests', value: 33, accent: '#D4BA85' },
  { label: 'Packages', value: 23, accent: '#D4BA85' },
  { label: 'Visitors', value: 16, accent: '#5BD493' },
  { label: 'Bookings today', value: 8, accent: '#D4BA85' },
] as const;

const ACTIVITY = [
  {
    type: 'package',
    who: 'Amazon · Unit 1208',
    label: 'Logged at front desk',
    time: '2m',
    color: '#D4BA85',
  },
  {
    type: 'request',
    who: 'Maintenance · Unit 904',
    label: 'Kitchen sink leak',
    time: '14m',
    color: '#E07A5F',
  },
  {
    type: 'visitor',
    who: 'Visitor · Unit 612',
    label: 'Cleaner signed in',
    time: '23m',
    color: '#5BD493',
  },
  {
    type: 'package',
    who: 'UPS · Unit 304',
    label: 'Released to resident',
    time: '41m',
    color: '#9CA3AF',
  },
] as const;

function ProductMockup({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className="mkt-mockup-stage"
      style={{
        position: 'relative',
        marginTop: '4rem',
        perspective: 2200,
      }}
    >
      {/* Glow underlay — soft brass halo behind the mockup */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-40px -10% -10% -10%',
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201, 169, 110, 0.18), transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />

      <div
        className="mkt-mockup-frame"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1120,
          marginInline: 'auto',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.05) inset, 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)',
          background: '#0F1014',
          transform: isVisible
            ? 'rotateX(0deg) rotateY(0deg) translateY(0)'
            : 'rotateX(8deg) rotateY(-2deg) translateY(40px)',
          transformOrigin: 'center top',
          transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms ease',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1A1B20 0%, #16171B 100%)',
            padding: '11px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
          </div>
          <div
            style={{
              flex: 1,
              marginLeft: 8,
              height: 26,
              borderRadius: 7,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              paddingInline: 12,
              gap: 8,
              fontSize: 11.5,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <rect x="3" y="6" width="8" height="6" rx="1" />
              <path d="M5 6V4a2 2 0 0 1 4 0v2" strokeLinecap="round" />
            </svg>
            buildingautopilot.ca
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/dashboard</span>
          </div>
        </div>

        {/* App body: sidebar + main */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '208px 1fr',
            minHeight: 540,
            background: '#0F1014',
          }}
        >
          {/* Sidebar */}
          <aside
            className="mkt-mockup-sidebar-real"
            style={{
              borderRight: '1px solid rgba(255,255,255,0.05)',
              background: '#0B0C10',
              padding: '18px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {/* Logo block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingInline: 6 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: 'linear-gradient(135deg, #D4BA85 0%, #C9A96E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0B0C10"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span
                style={{ fontSize: 13, color: '#fff', fontWeight: 500, letterSpacing: '-0.01em' }}
              >
                BuildingAutopilot
              </span>
            </div>

            {/* OVERVIEW group */}
            <NavGroup title="Overview" items={SIDEBAR_NAV} />
            {/* OPERATIONS group */}
            <NavGroup title="Operations" items={SIDEBAR_OPS} />
          </aside>

          {/* Main content */}
          <main style={{ padding: '22px 28px', overflow: 'hidden' }}>
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <span>Dashboard</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    height: 26,
                    width: 180,
                    borderRadius: 7,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    paddingInline: 10,
                    gap: 7,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="6" cy="6" r="4" />
                    <path d="M9 9l3 3" strokeLinecap="round" />
                  </svg>
                  Search anything…
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '1px 4px',
                      borderRadius: 3,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    ⌘K
                  </span>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4BA85, #B89968)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#0B0C10',
                  }}
                >
                  SC
                </div>
              </div>
            </div>

            {/* Page header */}
            <div style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Good afternoon, Sarah
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  margin: '4px 0 0',
                }}
              >
                Management overview · Friday, May 24
              </p>
            </div>

            {/* AI Briefing + Health row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              {/* AI Daily Briefing card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: 'rgba(201,169,110,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="#D4BA85"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 1l1.5 4L13 7l-4.5 2L7 13l-1.5-4L1 7l4.5-2z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 500 }}>
                    AI Daily Briefing
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      color: '#D4BA85',
                      background: 'rgba(201,169,110,0.1)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      letterSpacing: '0.04em',
                    }}
                  >
                    AUTO
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 6 }}>
                    Good afternoon. Three things need your attention this afternoon:
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4 }}
                  >
                    <span style={{ color: '#D4BA85', marginTop: 1 }}>·</span>
                    <span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>5 maintenance requests</span>{' '}
                      overdue, including a hot-water leak on floor 9
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4 }}
                  >
                    <span style={{ color: '#D4BA85', marginTop: 1 }}>·</span>
                    <span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>23 packages</span> waiting
                      for pickup, 2 marked perishable
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{ color: '#D4BA85', marginTop: 1 }}>·</span>
                    <span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>Sarah Lee</span> moving in
                      Saturday, elevator booked 10a–2p
                    </span>
                  </div>
                </div>
              </div>

              {/* Building Health card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 500, marginBottom: 12 }}>
                  Building health
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      position: 'relative',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'conic-gradient(#5BD493 0% 87%, rgba(255,255,255,0.06) 87% 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 5,
                        borderRadius: '50%',
                        background: '#11131A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#fff',
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      87
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 11, color: '#5BD493', fontWeight: 500, marginBottom: 4 }}
                    >
                      ● Healthy
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                      +4 vs last week. Driven by faster ticket close-out.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginBottom: 14,
              }}
            >
              {KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 5,
                    }}
                  >
                    {kpi.label}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#fff',
                      letterSpacing: '-0.02em',
                      fontFeatureSettings: '"tnum"',
                      lineHeight: 1,
                    }}
                  >
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Activity feed */}
            <div
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 500,
                  paddingBlock: 6,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  marginBottom: 4,
                }}
              >
                Recent activity
              </div>
              {ACTIVITY.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom:
                      i === ACTIVITY.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: a.color,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${a.color}66`,
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 500, minWidth: 0 }}>
                    {a.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>· {a.who}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.35)',
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mkt-mockup-sidebar-real {
            display: none !important;
          }
          .mkt-mockup-frame > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{
    readonly label: string;
    readonly active?: boolean;
    readonly badge?: number;
  }>;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          paddingInline: 8,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingInline: 8,
              paddingBlock: 6,
              borderRadius: 6,
              background: item.active ? 'rgba(201,169,110,0.1)' : 'transparent',
              fontSize: 11.5,
              color: item.active ? '#D4BA85' : 'rgba(255,255,255,0.7)',
              fontWeight: item.active ? 500 : 400,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: item.active ? '#D4BA85' : 'rgba(255,255,255,0.25)',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
            {item.badge !== undefined && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 999,
                  background: 'rgba(201,169,110,0.15)',
                  color: '#D4BA85',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
        ))}
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      { threshold: 0.15 },
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
      {/* Background ambient */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 1000px 600px at 50% 30%, rgba(201, 169, 110, 0.06), transparent 70%)',
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
        {/* Text content — editorial split, not centered */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'end',
          }}
          className="mkt-solution-header"
        >
          <ScrollReveal>
            <div>
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
                  style={{
                    width: 24,
                    height: 1,
                    background: '#D4BA85',
                    display: 'inline-block',
                  }}
                />
                Introducing BuildingAutopilot
              </p>
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
                One platform.
                <br />
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4BA85' }}>
                  Every building.
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.62)',
                margin: 0,
                paddingBottom: '0.75rem',
              }}
            >
              One login replaces the dozen your team juggles today. Packages, maintenance, security,
              visitors, amenities, parking, residents. Same data, same design, same product.
              Everything finally talks.
            </p>
          </ScrollReveal>
        </div>

        {/* Product mockup */}
        <ProductMockup isVisible={isVisible} />
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mkt-solution-header {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            align-items: start !important;
          }
        }
      `}</style>
    </section>
  );
}
