/* -------------------------------------------------------------------------- */
/*  TestimonialSection — Server Component (Section 8)                         */
/* -------------------------------------------------------------------------- */

export function TestimonialSection() {
  return (
    <section className="mkt-section mkt-section--ivory">
      <div
        className="mkt-container mkt-text-center"
        style={{
          paddingBlock: 'var(--space-4xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Decorative quotation mark */}
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '8rem',
            lineHeight: 0.8,
            color: '#C9A96E',
            opacity: 0.15,
            userSelect: 'none',
            marginBottom: '-1rem',
          }}
        >
          {'\u201C'}
        </span>

        {/* Quote */}
        <blockquote
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 300,
            color: 'var(--color-graphite)',
            lineHeight: 1.4,
            maxWidth: 800,
            margin: 0,
            padding: 0,
            border: 'none',
          }}
        >
          We evaluated every platform on the market. Most of them felt like they
          were built by people who had never set foot in a residential building.
          Concierge is the first system that actually understands how buildings
          operate.
        </blockquote>

        {/* Attribution */}
        <div style={{ marginTop: '1rem' }}>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--color-graphite)',
              margin: 0,
            }}
          >
            — Sarah Chen
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-slate)',
              margin: 0,
              marginTop: '0.25rem',
            }}
          >
            Director of Operations, Meridian Property Group
          </p>
        </div>
      </div>
    </section>
  );
}
