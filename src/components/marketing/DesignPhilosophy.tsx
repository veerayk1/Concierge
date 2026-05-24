'use client';

import React from 'react';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

// ---------------------------------------------------------------------------
// One Action Per Screen — a real Log Package form with one primary CTA
// ---------------------------------------------------------------------------

function OneActionVisual() {
  return (
    <div style={{ position: 'relative', maxWidth: 360, marginInline: 'auto' }}>
      {/* Halo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-20px',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201, 169, 110, 0.10), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid rgba(26,26,26,0.08)',
          padding: 22,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 24px 48px rgba(15,23,42,0.08)',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-brass)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            New
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-graphite)',
              letterSpacing: '-0.01em',
            }}
          >
            Log a package
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Recipient" value="Sarah Chen · Unit 1208" />
          <FormField label="Courier" value="Amazon" />
          <FormField label="Tracking number" value="TBA0421984302" mono />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Storage" value="A · slot 4" compact />
            <FormField label="Type" value="Standard" compact />
          </div>
        </div>

        {/* Single primary CTA */}
        <button
          type="button"
          style={{
            marginTop: 18,
            width: '100%',
            height: 42,
            borderRadius: 12,
            background: 'var(--color-graphite)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          Log and notify
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" />
          </svg>
        </button>

        {/* Annotation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            justifyContent: 'center',
            fontSize: 11,
            color: 'var(--color-slate)',
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#5BD493' }} />
          Resident gets a push, an email, and an SMS.
        </div>
      </div>

      {/* Caption pointer to the primary action */}
      <div
        style={{
          position: 'absolute',
          right: -150,
          bottom: 80,
          width: 130,
          color: 'var(--color-slate)',
          fontSize: 12,
          lineHeight: 1.45,
          fontStyle: 'italic',
        }}
        className="mkt-philosophy-caption"
      >
        <div
          style={{
            width: 24,
            height: 1,
            background: 'var(--color-brass)',
            marginBottom: 8,
          }}
        />
        One primary action. Nothing competes for attention.
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  compact,
  mono,
}: {
  label: string;
  value: string;
  compact?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-slate)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: compact ? 32 : 36,
          borderRadius: 8,
          border: '1px solid rgba(26,26,26,0.1)',
          background: '#FAFAF8',
          display: 'flex',
          alignItems: 'center',
          paddingInline: 11,
          fontSize: 13,
          color: 'var(--color-graphite)',
          fontFamily: mono ? 'ui-monospace, "SF Mono", monospace' : 'inherit',
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consistency — three module previews sharing the same visual rhythm
// ---------------------------------------------------------------------------

function ConsistencyVisual() {
  const modules = [
    {
      module: 'Packages',
      title: 'Sarah Chen · Unit 1208',
      meta: 'Amazon · 2m ago',
      status: 'New',
      statusColor: '#5BD493',
    },
    {
      module: 'Visitors',
      title: 'Cleaning service · Unit 904',
      meta: 'Expected 2:30pm',
      status: 'Pre-auth',
      statusColor: '#D4BA85',
    },
    {
      module: 'Maintenance',
      title: 'Hot-water leak · Floor 9',
      meta: 'Reported 14m ago',
      status: 'High',
      statusColor: '#E07A5F',
    },
  ];

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 14,
        maxWidth: 380,
        marginInline: 'auto',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-20px',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201, 169, 110, 0.10), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      {modules.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            background: '#fff',
            borderRadius: 14,
            border: '1px solid rgba(26,26,26,0.08)',
            padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-brass)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {m.module}
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: 'var(--color-graphite)',
                letterSpacing: '-0.005em',
              }}
            >
              {m.title}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-slate)', marginTop: 2 }}>
              {m.meta}
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-graphite)',
              background: 'rgba(26,26,26,0.04)',
              border: '1px solid rgba(26,26,26,0.05)',
              padding: '3px 8px',
              borderRadius: 999,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: m.statusColor,
              }}
            />
            {m.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data Where You Need It — resident detail with contextual history
// ---------------------------------------------------------------------------

function DataVisual() {
  return (
    <div style={{ position: 'relative', maxWidth: 380, marginInline: 'auto' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-20px',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201, 169, 110, 0.10), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid rgba(26,26,26,0.08)',
          padding: 20,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 24px 48px rgba(15,23,42,0.08)',
        }}
      >
        {/* Resident header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4BA85, #B89968)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
            }}
          >
            SC
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--color-graphite)',
                letterSpacing: '-0.005em',
              }}
            >
              Sarah Chen
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-slate)', marginTop: 1 }}>
              Owner · Unit 1208 · Floor 12
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-graphite)',
              background: 'rgba(91,212,147,0.12)',
              border: '1px solid rgba(91,212,147,0.25)',
              padding: '3px 8px',
              borderRadius: 999,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#5BD493',
              }}
            />
            Active
          </span>
        </div>

        {/* Mini stats */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}
        >
          {[
            { label: 'Packages', value: '2', sub: 'awaiting' },
            { label: 'Requests', value: '0', sub: 'open' },
            { label: 'Bookings', value: '1', sub: 'upcoming' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: '#FAFAF8',
                border: '1px solid rgba(26,26,26,0.06)',
                borderRadius: 9,
                padding: '7px 9px',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--color-slate)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--color-graphite)',
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {s.value}
                </span>
                <span style={{ fontSize: 9.5, color: 'var(--color-slate)' }}>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div
          style={{
            fontSize: 10,
            color: 'var(--color-slate)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            paddingTop: 10,
            borderTop: '1px solid rgba(26,26,26,0.06)',
            marginBottom: 6,
          }}
        >
          Recent activity
        </div>
        {[
          { dot: '#D4BA85', text: 'Amazon package logged', time: '2m' },
          { dot: '#5BD493', text: 'Guest pre-authorized', time: '1h' },
          { dot: '#9CA3AF', text: 'Party room booked for Sat', time: '3h' },
        ].map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              paddingBlock: 6,
              borderTop: i === 0 ? 'none' : '1px solid rgba(26,26,26,0.04)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: a.dot,
                flexShrink: 0,
                boxShadow: `0 0 5px ${a.dot}66`,
              }}
            />
            <span
              style={{ fontSize: 12, color: 'var(--color-graphite)', flex: 1, fontWeight: 500 }}
            >
              {a.text}
            </span>
            <span
              style={{ fontSize: 10.5, color: 'var(--color-slate)', fontFeatureSettings: '"tnum"' }}
            >
              {a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block data
// ---------------------------------------------------------------------------

interface Block {
  number: string;
  title: string;
  text: string;
  visual: () => React.ReactNode;
  imagePosition: 'left' | 'right';
}

const blocks: Block[] = [
  {
    number: '01',
    title: 'One action per screen.',
    text: "Every screen has one thing the user came to do. No mystery-meat navigation. No buried buttons. Your staff shouldn't need a manual to log a package or check in a visitor.",
    visual: OneActionVisual,
    imagePosition: 'left',
  },
  {
    number: '02',
    title: 'One design language.',
    text: "Packages, maintenance, parking, security: they all look and feel the same. Learn one screen and you've learned them all. Onboarding a new staff member is hours, not weeks.",
    visual: ConsistencyVisual,
    imagePosition: 'right',
  },
  {
    number: '03',
    title: 'The data sits where the work is.',
    text: 'No more switching tabs. Resident history, package logs, maintenance records, and visitor data surface right next to the action that needs them. In context, not in a separate report two clicks away.',
    visual: DataVisual,
    imagePosition: 'left',
  },
];

// ---------------------------------------------------------------------------
// DesignPhilosophy
// ---------------------------------------------------------------------------

export function DesignPhilosophy() {
  return (
    <section
      style={{
        background: 'var(--color-warm-white)',
        paddingBlock: 'var(--space-section)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          marginInline: 'auto',
          paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        {/* Editorial split header */}
        <div
          className="mkt-philosophy-header"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'end',
            paddingBottom: '5rem',
          }}
        >
          <ScrollReveal>
            <div>
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
                Our approach
              </p>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.02,
                  marginTop: '1.25rem',
                  color: 'var(--color-graphite)',
                }}
              >
                Software that{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--color-brass)' }}>
                  respects
                </em>
                <br />
                your intelligence.
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: 'var(--color-slate)',
                margin: 0,
              }}
            >
              Three rules we wrote down before we wrote any code, and that every screen has to pass.
              They are why a brand-new concierge can log their first package in under a minute and a
              board member can open the platform once a quarter and still know what to do.
            </p>
          </ScrollReveal>
        </div>

        {/* Blocks */}
        <div style={{ display: 'grid', gap: '5.5rem' }}>
          {blocks.map((block, i) => {
            const Visual = block.visual;
            const imageFirst = block.imagePosition === 'left';

            return (
              <div
                key={i}
                className="mkt-philosophy-block"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '4.5rem',
                  alignItems: 'center',
                }}
              >
                {imageFirst ? (
                  <>
                    <ScrollReveal delay={100}>
                      <div>
                        <Visual />
                      </div>
                    </ScrollReveal>
                    <ScrollReveal delay={150}>
                      <PhilosophyText number={block.number} title={block.title} text={block.text} />
                    </ScrollReveal>
                  </>
                ) : (
                  <>
                    <ScrollReveal delay={100}>
                      <PhilosophyText number={block.number} title={block.title} text={block.text} />
                    </ScrollReveal>
                    <ScrollReveal delay={150}>
                      <div>
                        <Visual />
                      </div>
                    </ScrollReveal>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .mkt-philosophy-header {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            align-items: start !important;
            padding-bottom: 3rem !important;
          }
          .mkt-philosophy-block {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
          .mkt-philosophy-caption {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function PhilosophyText({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '2.5rem',
            fontWeight: 200,
            color: 'var(--color-brass)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-graphite)',
          }}
        >
          Rule
        </span>
      </div>
      <h3
        style={{
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: 'var(--color-graphite)',
          lineHeight: 1.1,
          margin: 0,
          maxWidth: 480,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '1.0625rem',
          lineHeight: 1.65,
          color: 'var(--color-slate)',
          marginTop: '1rem',
          maxWidth: 500,
        }}
      >
        {text}
      </p>
    </div>
  );
}
