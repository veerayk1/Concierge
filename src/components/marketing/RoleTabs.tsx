'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

/* -------------------------------------------------------------------------- */
/*  Tab data                                                                  */
/* -------------------------------------------------------------------------- */

interface RoleTab {
  id: string;
  label: string;
  title: string;
  bullets: string[];
  visual: 'staff' | 'managers' | 'residents' | 'board';
}

const tabs: RoleTab[] = [
  {
    id: 'staff',
    label: 'Building Staff',
    title: 'The frontline command center.',
    bullets: [
      'Real-time package intake with photo capture and instant notifications.',
      'Visitor check-in with pre-authorized guest lists and ID logging.',
      'Maintenance ticket management with priority queuing and status tracking.',
      'Security incident logging with timestamped entries and escalation workflows.',
    ],
    visual: 'staff',
  },
  {
    id: 'managers',
    label: 'Property Managers',
    title: 'Portfolio-wide visibility in one view.',
    bullets: [
      'Cross-property dashboards with KPIs for every building.',
      'Staff performance metrics and compliance status at a glance.',
      'Financial summaries including deposit tracking and fee collection.',
      'Audit trails for every action across every property.',
    ],
    visual: 'managers',
  },
  {
    id: 'residents',
    label: 'Residents',
    title: 'Your building, in your pocket.',
    bullets: [
      'Track packages from delivery notification to pickup confirmation.',
      'Book amenities, register guests, and manage parking in seconds.',
      'Submit and monitor maintenance requests with photo uploads.',
      'Access building documents, announcements, and emergency contacts.',
    ],
    visual: 'residents',
  },
  {
    id: 'board',
    label: 'Board Members',
    title: 'Governance without the noise.',
    bullets: [
      'High-level operational summaries without day-to-day clutter.',
      'Meeting document management and resolution tracking.',
      'Financial and compliance reporting for informed decision-making.',
      'Resident satisfaction metrics and trend analysis.',
    ],
    visual: 'board',
  },
];

/* -------------------------------------------------------------------------- */
/*  Visual mockups (CSS-only)                                                 */
/* -------------------------------------------------------------------------- */

function StaffVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Icon grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 8,
              background: 'rgba(201,169,110,0.15)',
            }}
          />
        ))}
      </div>
      {/* Feed lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[100, 80, 90].map((w, i) => (
          <div
            key={i}
            style={{
              height: 10,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.1)',
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ManagersVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {['12', '97%'].map((val, i) => (
          <div
            key={i}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              background: 'rgba(201,169,110,0.12)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 300,
                color: '#C9A96E',
              }}
            >
              {val}
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.08)',
                marginTop: '0.375rem',
              }}
            />
          </div>
        ))}
      </div>
      {/* Bar chart placeholder */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.375rem',
          height: 48,
        }}
      >
        {[60, 85, 40, 70, 55, 90, 45].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: 3,
              background:
                i === 5
                  ? 'rgba(201,169,110,0.5)'
                  : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ResidentsVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {[
        { color: 'rgba(46,125,91,0.6)', width: '70%' },
        { color: 'rgba(201,169,110,0.5)', width: '85%' },
        { color: 'rgba(196,92,62,0.5)', width: '60%' },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              width: item.width,
              height: 8,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.1)',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: item.color,
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function BoardVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary card with metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
        }}
      >
        {[
          { num: '4.2M', label: '' },
          { num: '92%', label: '' },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              background: 'rgba(201,169,110,0.12)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 300,
                color: '#C9A96E',
              }}
            >
              {m.num}
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.08)',
                marginTop: '0.375rem',
              }}
            />
          </div>
        ))}
      </div>
      {/* Timeline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid rgba(201,169,110,0.25)',
        }}
      >
        {[80, 65, 90].map((w, i) => (
          <div
            key={i}
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const visualComponents: Record<RoleTab['visual'], () => React.ReactNode> = {
  staff: StaffVisual,
  managers: ManagersVisual,
  residents: ResidentsVisual,
  board: BoardVisual,
};

/* -------------------------------------------------------------------------- */
/*  RoleTabs Component                                                        */
/* -------------------------------------------------------------------------- */

export function RoleTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex]!;

  return (
    <section
      className="mkt-section mkt-section--dark mkt-dark"
      style={{ overflow: 'hidden' }}
    >
      <div className="mkt-container">
        {/* Header */}
        <ScrollReveal className="mkt-text-center" style={{ marginBottom: 'var(--space-xl)' }}>
          <p className="mkt-eyebrow" style={{ marginBottom: 'var(--space-sm)' }}>
            BUILT FOR EVERYONE
          </p>
          <h2 className="mkt-section-headline" style={{ marginBottom: 'var(--space-md)' }}>
            One platform. Four perspectives.
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              maxWidth: 600,
              marginInline: 'auto',
            }}
          >
            Every role sees exactly what they need — nothing more, nothing less.
            The interface adapts to the person using it.
          </p>
        </ScrollReveal>

        {/* Tab buttons */}
        <ScrollReveal delay={100}>
          <div
            role="tablist"
            aria-label="Role-based views"
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={i === activeIndex}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveIndex(i)}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: 100,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  transition: 'background 300ms ease, color 300ms ease',
                  background:
                    i === activeIndex ? '#C9A96E' : 'rgba(255,255,255,0.06)',
                  color:
                    i === activeIndex ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Tab content — crossfade with absolute positioning */}
        <ScrollReveal delay={200}>
          <div style={{ position: 'relative' }}>
            {tabs.map((tab, i) => {
              const isActive = i === activeIndex;
              const Visual = visualComponents[tab.visual];
              return (
                <div
                  key={tab.id}
                  id={`panel-${tab.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${tab.id}`}
                  aria-hidden={!isActive}
                  style={{
                    position: isActive ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    opacity: isActive ? 1 : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                    transition: 'opacity 400ms ease',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 'var(--space-xl)',
                    }}
                    className="role-tabs__layout"
                  >
                    {/* Text column */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3
                        style={{
                          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                          fontWeight: 300,
                          color: '#fff',
                          letterSpacing: '-0.02em',
                          marginBottom: 'var(--space-lg)',
                        }}
                      >
                        {tab.title}
                      </h3>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-sm)',
                        }}
                      >
                        {tab.bullets.map((bullet, bi) => (
                          <li
                            key={bi}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '1.0625rem',
                              lineHeight: 1.6,
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#C9A96E',
                                flexShrink: 0,
                                marginTop: '0.55rem',
                              }}
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Visual column — glass card */}
                    <div>
                      <div
                        className="mkt-glass-card"
                        style={{
                          minHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Visual />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>

      {/* Responsive two-column layout on desktop */}
      <style>{`
        @media (min-width: 768px) {
          .role-tabs__layout {
            grid-template-columns: 3fr 2fr !important;
          }
        }
      `}</style>
    </section>
  );
}
