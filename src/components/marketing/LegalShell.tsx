import { type ReactNode } from 'react';

/**
 * LegalShell — dark cinematic wrapper used by /privacy and /terms.
 *
 * Keeps the marketing visual momentum (aurora, status pill, brass
 * accent) on long legal copy without rewriting every paragraph.
 * Children are rendered inside a constrained, dark, readable prose
 * container with all the typographic overrides set globally.
 */
export function LegalShell({
  eyebrow,
  title,
  description,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <>
      <section
        style={{
          position: 'relative',
          background: '#0A0A0A',
          color: '#fff',
          marginTop: -72,
          paddingTop: 'calc(72px + 5rem)',
          paddingBottom: '4rem',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(201,169,110,0.14), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 85%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 880,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 999,
              background: 'rgba(201,169,110,0.08)',
              border: '1px solid rgba(201,169,110,0.18)',
              fontSize: '0.8125rem',
              color: 'rgba(212,186,133,0.9)',
              marginBottom: '2rem',
            }}
          >
            {eyebrow}
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.4vw, 1.125rem)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 640,
              margin: '1.25rem auto 1.5rem',
            }}
          >
            {description}
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Last updated · {lastUpdated}
          </p>
        </div>
      </section>

      <section
        style={{
          background: '#0E0E0E',
          color: 'rgba(255,255,255,0.78)',
          padding: '5rem 0 7rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="mkt-legal-prose"
          style={{
            maxWidth: 760,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
          }}
        >
          {children}
        </div>
      </section>

      <style>{`
        .mkt-legal-prose h2 {
          color: #fff;
          font-size: 1.375rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 3rem 0 1rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .mkt-legal-prose h2:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: 0;
        }
        .mkt-legal-prose h3 {
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 600;
          letter-spacing: -0.005em;
          margin: 2rem 0 0.75rem;
        }
        .mkt-legal-prose p {
          margin: 0 0 1rem;
        }
        .mkt-legal-prose ul,
        .mkt-legal-prose ol {
          margin: 0 0 1.25rem;
          padding-left: 1.5rem;
        }
        .mkt-legal-prose li {
          margin: 0.375rem 0;
        }
        .mkt-legal-prose a {
          color: #C9A96E;
          text-decoration: none;
          border-bottom: 1px solid rgba(201,169,110,0.4);
          transition: border-color 200ms ease;
        }
        .mkt-legal-prose a:hover {
          border-bottom-color: rgba(201,169,110,0.9);
        }
        .mkt-legal-prose strong {
          color: #fff;
          font-weight: 600;
        }
        .mkt-legal-prose em {
          color: rgba(255,255,255,0.88);
        }
        .mkt-legal-prose code {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.125rem 0.375rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: rgba(212,186,133,0.9);
        }
        .mkt-legal-prose table {
          width: 100%;
          margin: 1.5rem 0;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .mkt-legal-prose th,
        .mkt-legal-prose td {
          padding: 0.625rem 0.875rem;
          border: 1px solid rgba(255,255,255,0.08);
          text-align: left;
          vertical-align: top;
        }
        .mkt-legal-prose th {
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
