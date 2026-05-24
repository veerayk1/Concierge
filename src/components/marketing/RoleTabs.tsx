'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

interface RoleTab {
  id: string;
  label: string;
  title: string;
  bullets: string[];
  visual: ReactNode;
}

// ---------------------------------------------------------------------------
// Building Staff — live operations feed (the front desk's reality)
// ---------------------------------------------------------------------------

function StaffVisual() {
  const items = [
    {
      icon: 'package',
      title: 'New package · Amazon',
      meta: 'Unit 1208 · Sarah Chen',
      time: 'just now',
      color: '#D4BA85',
    },
    {
      icon: 'visitor',
      title: 'Visitor expected · 2:30pm',
      meta: 'Cleaning service for Unit 904',
      time: '14m',
      color: '#5BD493',
    },
    {
      icon: 'request',
      title: 'Maintenance · Hot water',
      meta: 'Floor 9, priority high',
      time: '23m',
      color: '#E07A5F',
    },
    {
      icon: 'fob',
      title: 'Key returned',
      meta: 'Unit 612 elevator FOB',
      time: '47m',
      color: '#9CA3AF',
    },
  ];

  return (
    <MockupShell label="Today" sublabel="Live operations · 12 events">
      <div>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              gap: 12,
              alignItems: 'center',
              paddingBlock: 11,
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${it.color}1A`,
                border: `1px solid ${it.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StaffIcon kind={it.icon} color={it.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#fff',
                  letterSpacing: '-0.005em',
                }}
              >
                {it.title}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                {it.meta}
              </div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                color: 'rgba(255,255,255,0.4)',
                fontFeatureSettings: '"tnum"',
              }}
            >
              {it.time}
            </span>
          </div>
        ))}
      </div>
    </MockupShell>
  );
}

function StaffIcon({ kind, color }: { kind: string; color: string }) {
  const stroke = color;
  const common = {
    width: '13',
    height: '13',
    viewBox: '0 0 14 14',
    fill: 'none',
    stroke,
    strokeWidth: '1.5',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (kind === 'package')
    return (
      <svg {...common}>
        <path d="M2 4l5-2 5 2v6l-5 2-5-2z" />
        <path d="M2 4l5 2 5-2M7 6v6" />
      </svg>
    );
  if (kind === 'visitor')
    return (
      <svg {...common}>
        <circle cx="7" cy="5" r="2.2" />
        <path d="M3 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      </svg>
    );
  if (kind === 'request')
    return (
      <svg {...common}>
        <path d="M3 7l2.5-3.5h3L11 7l-2.5 3.5h-3z" />
        <path d="M7 5v2.5" />
        <circle cx="7" cy="9" r="0.5" fill={stroke} stroke="none" />
      </svg>
    );
  if (kind === 'fob')
    return (
      <svg {...common}>
        <circle cx="9.5" cy="4.5" r="2" />
        <path d="M8 6L3 11M5 9l2 2M4 10l2 2" />
      </svg>
    );
  return null;
}

// ---------------------------------------------------------------------------
// Property Managers — multi-building portfolio view
// ---------------------------------------------------------------------------

function ManagersVisual() {
  const buildings = [
    { name: 'Maple Heights', units: 200, requests: 33, packages: 23, health: 87 },
    { name: 'Harbourfront Residences', units: 150, requests: 12, packages: 9, health: 78 },
    { name: 'Lakeshore Towers', units: 320, requests: 47, packages: 31, health: 64 },
  ];

  return (
    <MockupShell label="Portfolio" sublabel="3 properties · 670 units">
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, paddingBlock: 12 }}
      >
        {[
          { label: 'Avg health', value: '76' },
          { label: 'Open tickets', value: '92' },
          { label: 'Compliance', value: '94%' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#fff',
                marginTop: 3,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {buildings.map((b, i) => {
          const color = b.health >= 80 ? '#5BD493' : b.health >= 70 ? '#D4BA85' : '#E07A5F';
          return (
            <div
              key={b.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 12,
                alignItems: 'center',
                paddingBlock: 11,
                borderBottom:
                  i === buildings.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#fff',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {b.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                  {b.units} units
                </div>
              </div>
              <PortfolioStat label="reqs" value={b.requests} />
              <PortfolioStat label="pkgs" value={b.packages} />
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#fff',
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}80`,
                  }}
                />
                {b.health}
              </div>
            </div>
          );
        })}
      </div>
    </MockupShell>
  );
}

function PortfolioStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#fff',
          fontFeatureSettings: '"tnum"',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.4)',
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Residents — phone with the Concierge app
// ---------------------------------------------------------------------------

function ResidentsVisual() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-30px',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(91, 212, 147, 0.10), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 250,
          aspectRatio: '9 / 17',
          background: '#1a1b1f',
          borderRadius: 32,
          padding: 7,
          boxShadow: '0 1px 2px rgba(0,0,0,0.4), 0 30px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 25,
            background: 'linear-gradient(180deg, #14171F 0%, #0B0E14 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '30px 12px 12px',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 64,
              height: 18,
              background: '#000',
              borderRadius: 12,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 11,
              left: 14,
              fontSize: 9.5,
              fontWeight: 600,
              color: '#fff',
              fontFeatureSettings: '"tnum"',
            }}
          >
            2:47
          </div>

          {/* Header */}
          <div style={{ marginTop: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Good afternoon</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 1 }}>Alice</div>
          </div>

          {/* Action grid */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}
          >
            {[
              { label: 'Packages', count: '2', color: '#D4BA85' },
              { label: 'Bookings', count: '1', color: '#5BD493' },
              { label: 'Requests', count: '3', color: '#E07A5F' },
              { label: 'Visitors', count: '—', color: '#9CA3AF' },
            ].map((a) => (
              <div
                key={a.label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 9,
                  padding: '8px 9px',
                }}
              >
                <div
                  style={{
                    fontSize: 8.5,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {a.label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 5,
                    marginTop: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: a.color,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {a.count}
                  </span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>open</span>
                </div>
              </div>
            ))}
          </div>

          {/* Announcement */}
          <div
            style={{
              background: 'rgba(212, 186, 133, 0.08)',
              border: '1px solid rgba(212, 186, 133, 0.18)',
              borderRadius: 8,
              padding: '7px 9px',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 8.5,
                color: '#D4BA85',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Announcement
            </div>
            <div style={{ fontSize: 10, color: '#fff', lineHeight: 1.35 }}>
              Water shutoff on floor 9, tomorrow 9–11am.
            </div>
          </div>

          {/* Recent activity */}
          <div
            style={{
              fontSize: 8.5,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 5,
              fontWeight: 600,
            }}
          >
            Recent
          </div>
          {[
            { title: 'Package ready', meta: 'Amazon · pickup' },
            { title: 'Booking confirmed', meta: 'Party room · Sat' },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                paddingBlock: 5,
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ fontSize: 10.5, color: '#fff', fontWeight: 500 }}>{r.title}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                {r.meta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board Members — governance summary
// ---------------------------------------------------------------------------

function BoardVisual() {
  return (
    <MockupShell label="Q2 Board Pack" sublabel="May 2026 · Maple Heights">
      {/* Top KPIs */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, paddingBlock: 12 }}
      >
        {[
          { label: 'Reserve fund', value: '$4.2M', delta: '+2.4%', deltaColor: '#5BD493' },
          { label: 'Operating budget', value: '94%', delta: 'on track', deltaColor: '#D4BA85' },
          { label: 'Resident NPS', value: '+62', delta: '+8 vs Q1', deltaColor: '#5BD493' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                marginTop: 3,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {kpi.value}
            </div>
            <div style={{ fontSize: 9, color: kpi.deltaColor, marginTop: 2 }}>● {kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Pending decisions */}
      <div
        style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
          marginTop: 8,
          marginBottom: 6,
        }}
      >
        Pending decisions · 3
      </div>
      {[
        { title: 'Lobby furniture refresh', meta: '$48k · vendor selected', urgent: false },
        { title: 'Elevator modernization quote', meta: '3 bids received', urgent: true },
        { title: 'Pool reopening date', meta: 'June 1 vs June 15', urgent: false },
      ].map((d, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingBlock: 9,
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: d.urgent ? '#E07A5F' : 'rgba(255,255,255,0.3)',
              flexShrink: 0,
              boxShadow: d.urgent ? '0 0 6px rgba(224, 122, 95, 0.5)' : 'none',
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{d.title}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
              {d.meta}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: '#D4BA85',
              background: 'rgba(201,169,110,0.1)',
              border: '1px solid rgba(201,169,110,0.2)',
              padding: '3px 8px',
              borderRadius: 999,
            }}
          >
            Review
          </span>
        </div>
      ))}
    </MockupShell>
  );
}

// ---------------------------------------------------------------------------
// Shared MockupShell — a small "panel" frame for staff/manager/board visuals
// ---------------------------------------------------------------------------

function MockupShell({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel: string;
  children: ReactNode;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-20px',
          background:
            'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(201,169,110,0.12), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#11131A',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: '14px 18px 18px',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '-0.005em' }}>
            {label}
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            {sublabel}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab data
// ---------------------------------------------------------------------------

const tabs: RoleTab[] = [
  {
    id: 'staff',
    label: 'Building Staff',
    title: 'The frontline command center.',
    bullets: [
      'Real-time package intake with photo capture and instant resident notifications.',
      'Visitor check-in with pre-authorized guest lists and ID logging.',
      'Maintenance ticket queue with priority routing and status tracking.',
      'Security incident logging with timestamps and escalation workflows.',
    ],
    visual: <StaffVisual />,
  },
  {
    id: 'managers',
    label: 'Property Managers',
    title: 'Portfolio-wide visibility in one view.',
    bullets: [
      'Cross-property dashboards with the KPIs that matter for every building.',
      'Staff performance and compliance status at a glance.',
      'Financial summaries with deposit tracking and fee collection.',
      'Audit trails for every action, every property, every user.',
    ],
    visual: <ManagersVisual />,
  },
  {
    id: 'residents',
    label: 'Residents',
    title: 'Your building, in your pocket.',
    bullets: [
      'Track packages from delivery notification to pickup confirmation.',
      'Book amenities, register guests, manage parking in seconds.',
      'Submit and monitor maintenance requests with photo uploads.',
      'Access building documents, announcements, and emergency contacts.',
    ],
    visual: <ResidentsVisual />,
  },
  {
    id: 'board',
    label: 'Board Members',
    title: 'Governance without the noise.',
    bullets: [
      'High-level operational summaries without day-to-day clutter.',
      'Meeting document management and resolution tracking.',
      'Financial and compliance reporting for informed decisions.',
      'Resident satisfaction trends and quarterly outcome reviews.',
    ],
    visual: <BoardVisual />,
  },
];

// ---------------------------------------------------------------------------
// RoleTabs Component
// ---------------------------------------------------------------------------

export function RoleTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex]!;

  return (
    <section
      className="mkt-section mkt-section--dark mkt-dark"
      style={{ overflow: 'hidden', position: 'relative' }}
    >
      {/* Soft brand glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 900px 500px at 50% 20%, rgba(201, 169, 110, 0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="mkt-container" style={{ position: 'relative' }}>
        {/* Header — editorial split */}
        <div
          className="mkt-roletabs-header"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'end',
            marginBottom: 'var(--space-2xl)',
          }}
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
                  style={{ width: 24, height: 1, background: '#D4BA85', display: 'inline-block' }}
                />
                Built for everyone
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                  fontWeight: 300,
                  color: '#fff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.02,
                  marginTop: '1.25rem',
                }}
              >
                One platform.
                <br />
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#D4BA85' }}>
                  Four perspectives.
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.62)',
                margin: 0,
              }}
            >
              Every role sees exactly what they need. Nothing more, nothing less. The interface
              adapts to the person using it, so nobody spends their day fighting the software they
              were hired to use.
            </p>
          </ScrollReveal>
        </div>

        {/* Tab buttons */}
        <ScrollReveal delay={120}>
          <div
            role="tablist"
            aria-label="Role-based views"
            className="mkt-roletabs-buttons"
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '3rem',
              padding: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 999,
              width: 'fit-content',
              marginInline: 'auto',
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
                  padding: '0.5rem 1.25rem',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  letterSpacing: '-0.005em',
                  transition: 'background 300ms ease, color 300ms ease, transform 200ms ease',
                  background: i === activeIndex ? '#fff' : 'transparent',
                  color: i === activeIndex ? '#0A0A0A' : 'rgba(255,255,255,0.65)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Tab content */}
        <ScrollReveal delay={200}>
          <div style={{ position: 'relative', minHeight: 460 }}>
            {tabs.map((tab, i) => {
              const isActive = i === activeIndex;
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
                    transition: 'opacity 400ms ease, transform 400ms ease',
                    transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                  }}
                >
                  <div
                    className="mkt-roletabs-layout"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
                      gap: '4rem',
                      alignItems: 'center',
                    }}
                  >
                    {/* Text */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'clamp(1.5rem, 2.6vw, 2.25rem)',
                          fontWeight: 400,
                          color: '#fff',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.1,
                          marginBottom: '1.5rem',
                          margin: 0,
                        }}
                      >
                        {tab.title}
                      </h3>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: '1.5rem 0 0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.875rem',
                        }}
                      >
                        {tab.bullets.map((bullet, bi) => (
                          <li
                            key={bi}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              color: 'rgba(255,255,255,0.72)',
                              fontSize: '0.9375rem',
                              lineHeight: 1.55,
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: '#D4BA85',
                                flexShrink: 0,
                                marginTop: '0.55rem',
                              }}
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Visual */}
                    <div>{tab.visual}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .mkt-roletabs-header {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            align-items: start !important;
          }
          .mkt-roletabs-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </section>
  );
}
