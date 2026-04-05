'use client';

import React from 'react';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';

/* -------------------------------------------------------------------------- */
/*  CSS-only visual mockups                                                   */
/* -------------------------------------------------------------------------- */

function OneActionVisual() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E8E6E1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
        padding: 'var(--space-lg)',
        maxWidth: 320,
        marginInline: 'auto',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 10,
          width: '55%',
          borderRadius: 5,
          background: '#1A1A1A',
          marginBottom: 'var(--space-lg)',
        }}
      />
      {/* Input rectangles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[100, 100, 100].map((w, i) => (
          <div
            key={i}
            style={{
              height: 36,
              borderRadius: 8,
              border: '1px solid #E8E6E1',
              background: '#FAFAF8',
              width: `${w}%`,
            }}
          />
        ))}
      </div>
      {/* Brass button */}
      <div
        style={{
          marginTop: 'var(--space-lg)',
          height: 42,
          borderRadius: 100,
          background: '#C9A96E',
        }}
      />
    </div>
  );
}

function ConsistencyVisual() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        maxWidth: 400,
        marginInline: 'auto',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E8E6E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            padding: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {/* Header line */}
          <div
            style={{
              height: 8,
              width: `${60 + i * 10}%`,
              borderRadius: 4,
              background: '#1A1A1A',
            }}
          />
          {/* Body lines */}
          <div
            style={{
              height: 6,
              width: '100%',
              borderRadius: 3,
              background: '#E8E6E1',
            }}
          />
          <div
            style={{
              height: 6,
              width: '75%',
              borderRadius: 3,
              background: '#E8E6E1',
            }}
          />
          {/* Button */}
          <div
            style={{
              height: 24,
              borderRadius: 100,
              background: '#C9A96E',
              marginTop: '0.375rem',
            }}
          />
        </div>
      ))}
    </div>
  );
}

function DataVisual() {
  const activityDots = [
    { color: 'rgba(46,125,91,0.7)' },
    { color: 'rgba(201,169,110,0.7)' },
    { color: 'rgba(196,92,62,0.7)' },
    { color: 'rgba(107,107,107,0.5)' },
  ];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E8E6E1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
        padding: 'var(--space-lg)',
        maxWidth: 320,
        marginInline: 'auto',
      }}
    >
      {/* Resident name */}
      <div
        style={{
          height: 10,
          width: '50%',
          borderRadius: 5,
          background: '#1A1A1A',
          marginBottom: '0.375rem',
        }}
      />
      {/* Unit number */}
      <div
        style={{
          height: 8,
          width: '25%',
          borderRadius: 4,
          background: '#6B6B6B',
          marginBottom: 'var(--space-md)',
        }}
      />
      {/* Divider */}
      <div
        style={{
          height: 1,
          background: '#E8E6E1',
          marginBottom: 'var(--space-sm)',
        }}
      />
      {/* Activity rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {activityDots.map((dot, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dot.color,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: '#E8E6E1',
                width: `${70 + i * 8}%`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Block data                                                                */
/* -------------------------------------------------------------------------- */

interface Block {
  title: string;
  text: string;
  visual: () => React.ReactNode;
  imagePosition: 'left' | 'right';
}

const blocks: Block[] = [
  {
    title: 'One Action Per Screen',
    text: "Every screen in Concierge has one primary action. No mystery meat navigation. No buried buttons. Your staff shouldn't need a manual to log a package or check in a visitor.",
    visual: OneActionVisual,
    imagePosition: 'left',
  },
  {
    title: 'Consistent Design Language',
    text: "Whether you're in the maintenance module or the parking system, it looks and feels the same. One design language across every feature. Learn one screen, and you've learned them all.",
    visual: ConsistencyVisual,
    imagePosition: 'right',
  },
  {
    title: 'Data Where You Need It',
    text: 'No more switching tabs. Resident history, package logs, maintenance records, and visitor data surface exactly where and when you need them — in context, not in a separate report.',
    visual: DataVisual,
    imagePosition: 'left',
  },
];

/* -------------------------------------------------------------------------- */
/*  DesignPhilosophy Component                                                */
/* -------------------------------------------------------------------------- */

export function DesignPhilosophy() {
  return (
    <section className="mkt-section mkt-section--warm">
      <div className="mkt-container">
        {/* Header */}
        <ScrollReveal className="mkt-text-center" style={{ marginBottom: 'var(--space-3xl)' }}>
          <p className="mkt-eyebrow" style={{ marginBottom: 'var(--space-sm)' }}>
            OUR APPROACH
          </p>
          <h2 className="mkt-section-headline">
            Software that respects your intelligence.
          </h2>
        </ScrollReveal>

        {/* Blocks */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3xl)',
          }}
        >
          {blocks.map((block, i) => {
            const Visual = block.visual;
            const imageFirst = block.imagePosition === 'left';

            return (
              <div
                key={i}
                className="design-phil__block"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 'var(--space-xl)',
                  alignItems: 'center',
                }}
              >
                {/* Image */}
                <ScrollReveal
                  direction={imageFirst ? 'left' : 'right'}
                  delay={100}
                  className="design-phil__visual"
                  style={{ order: imageFirst ? 0 : 1 }}
                >
                  <Visual />
                </ScrollReveal>

                {/* Text */}
                <ScrollReveal
                  delay={200}
                  className="design-phil__text"
                  style={{ order: imageFirst ? 1 : 0 }}
                >
                  <h3
                    style={{
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-obsidian)',
                      marginBottom: 'var(--space-sm)',
                    }}
                  >
                    {block.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: 1.7,
                      color: 'var(--color-slate)',
                      maxWidth: 520,
                    }}
                  >
                    {block.text}
                  </p>
                </ScrollReveal>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop two-column + alternating order */}
      <style>{`
        @media (min-width: 768px) {
          .design-phil__block {
            grid-template-columns: 1fr 1fr !important;
          }
          .design-phil__block:nth-child(odd) .design-phil__visual {
            order: 0 !important;
          }
          .design-phil__block:nth-child(odd) .design-phil__text {
            order: 1 !important;
          }
          .design-phil__block:nth-child(even) .design-phil__visual {
            order: 1 !important;
          }
          .design-phil__block:nth-child(even) .design-phil__text {
            order: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
