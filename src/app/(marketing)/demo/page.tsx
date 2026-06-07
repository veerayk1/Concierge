'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Data — SEO + sales narrative
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    eyebrow: '15 minutes',
    title: 'A walk-through built around your building.',
    body: 'No generic slide deck. Tell us how many units, what tools you use today, and which roles need the demo — we will show you exactly those screens, with sample data that looks like yours.',
  },
  {
    eyebrow: 'Sandbox access',
    title: 'Hands-on with your team, not just a presenter.',
    body: 'After the call we open a sandbox loaded with your sample data. Concierge, security, manager, board, and resident logins — each role can click around without touching production.',
  },
  {
    eyebrow: 'Migration mapped',
    title: 'We map your current tools to what replaces them.',
    body: 'BuildingLink? ICON? Condo Control? AppFolio? A spreadsheet? We map every workflow you use today to the BuildingAutopilot module that replaces it — and show what the migration looks like end-to-end.',
  },
  {
    eyebrow: 'No commitment',
    title: 'Demo first. Quote second. Decide on your timeline.',
    body: 'No high-pressure sales call. No mandatory follow-up. We send the recording, the sandbox, and a tailored quote. You decide if and when to move forward.',
  },
];

const PROPERTY_TYPES = [
  'Condo Corporation',
  'Rental Apartment',
  'HOA / Strata',
  'Co-op',
  'Mixed-Use',
  'Commercial',
  'Other',
] as const;

const UNIT_RANGES = [
  '1 – 49 units',
  '50 – 149 units',
  '150 – 499 units',
  '500 – 999 units',
  '1,000+ units',
  'Multi-property portfolio',
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    units: '',
    propertyType: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.company.trim()) newErrors.company = 'Property name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/public/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error ??
          (res.status === 429
            ? 'Too many requests. Please try again later.'
            : 'Something went wrong. Please try again.');
        setApiError(message);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setApiError('Unable to reach the server. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section
        style={{
          position: 'relative',
          background: '#0A0A0A',
          color: '#fff',
          minHeight: '100vh',
          marginTop: -72,
          paddingTop: 'calc(72px + 8rem)',
          paddingBottom: '8rem',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 50% 30%, rgba(91,212,147,0.16), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 640,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 2rem',
              borderRadius: '50%',
              background: 'rgba(91,212,147,0.12)',
              border: '1px solid rgba(91,212,147,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 12px rgba(91,212,147,0.06)',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5BD493"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Demo request received.
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.65)',
              margin: '1.25rem auto 2.5rem',
              maxWidth: 520,
            }}
          >
            We will email you within one business day with available times for a 15-minute
            personalized walk-through. A real person on the team — not a calendar bot.
          </p>
          <Link href={'/' as never} className="btn-primary">
            Back to homepage
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* ============================ HERO ============================ */}
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
              'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(201,169,110,0.20), transparent 65%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 700px 400px at 85% 80%, rgba(91,212,147,0.10), transparent 60%)',
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
            maxWidth: 1100,
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
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#5BD493',
                boxShadow: '0 0 0 4px rgba(91,212,147,0.18)',
              }}
            />
            Fifteen minutes · Tailored to your property · No sales floor
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            See your building{' '}
            <span style={{ color: '#C9A96E', fontStyle: 'italic', fontWeight: 400 }}>
              on the platform
            </span>{' '}
            in fifteen minutes.
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.1875rem)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 720,
              margin: '1.5rem auto 0',
            }}
          >
            Book a personalized demo with the team. We will show you the exact modules and personas
            your property would use — package tracking, visitor management, maintenance requests,
            amenity booking, security console, resident portal — with sample data that looks like
            yours.
          </p>
        </div>
      </section>

      {/* ============================ FORM + BENEFITS ============================ */}
      <section
        style={{
          background: '#0E0E0E',
          color: '#fff',
          padding: '5rem 0 6rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            gap: '3rem',
          }}
          className="mkt-demo-grid"
        >
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{
              padding: '2.5rem',
              borderRadius: 24,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px -20px rgba(0,0,0,0.4)',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(201,169,110,0.85)',
                margin: 0,
              }}
            >
              Book your demo
            </p>
            <h2
              style={{
                fontSize: '1.625rem',
                fontWeight: 600,
                color: '#fff',
                margin: '0.5rem 0 2rem',
                letterSpacing: '-0.01em',
              }}
            >
              Tell us about your property.
            </h2>

            {apiError && (
              <div
                role="alert"
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: 12,
                  background: 'rgba(244,123,123,0.08)',
                  border: '1px solid rgba(244,123,123,0.25)',
                  color: '#FCA5A5',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                }}
              >
                {apiError}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
              }}
              className="mkt-form-row"
            >
              <Field
                label="Your name"
                error={errors.name}
                input={
                  <input
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Sarah Bennett"
                    style={inputStyle(!!errors.name)}
                  />
                }
              />
              <Field
                label="Work email"
                error={errors.email}
                input={
                  <input
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="you@property.com"
                    style={inputStyle(!!errors.email)}
                  />
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
              }}
              className="mkt-form-row"
            >
              <Field
                label="Property name"
                error={errors.company}
                input={
                  <input
                    type="text"
                    autoComplete="organization"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Queensway Park Condos"
                    style={inputStyle(!!errors.company)}
                  />
                }
              />
              <Field
                label="Phone (optional)"
                input={
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 416 555 0123"
                    style={inputStyle(false)}
                  />
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
              }}
              className="mkt-form-row"
            >
              <Field
                label="Property type"
                input={
                  <select
                    value={formData.propertyType}
                    onChange={(e) => handleChange('propertyType', e.target.value)}
                    style={inputStyle(false)}
                  >
                    <option value="" disabled>
                      Select a property type
                    </option>
                    {PROPERTY_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label="Number of units"
                input={
                  <select
                    value={formData.units}
                    onChange={(e) => handleChange('units', e.target.value)}
                    style={inputStyle(false)}
                  >
                    <option value="" disabled>
                      Pick a range
                    </option>
                    {UNIT_RANGES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                }
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <Field
                label="What are you hoping to see? (optional)"
                input={
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="The tools you use today, the workflows that hurt the most, the personas that need to be sold."
                    rows={5}
                    style={{ ...inputStyle(false), resize: 'vertical' }}
                  />
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                width: '100%',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Sending…' : 'Book my demo'}
            </button>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                margin: '1rem 0 0',
                textAlign: 'center',
              }}
            >
              We will email you within one business day. No spam, no high-pressure follow-up —
              promised.
            </p>
          </form>

          {/* Right column — benefits */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(201,169,110,0.85)',
                margin: 0,
              }}
            >
              What you get
            </p>
            {BENEFITS.map((b) => (
              <div
                key={b.eyebrow}
                style={{
                  padding: '1.5rem',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#C9A96E',
                    margin: 0,
                  }}
                >
                  {b.eyebrow}
                </p>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#fff',
                    margin: '0.5rem 0 0.5rem',
                    lineHeight: 1.35,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {b.body}
                </p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section
        style={{
          background: '#0A0A0A',
          color: '#fff',
          padding: '5rem 0 6rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(201,169,110,0.85)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Common questions
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#fff',
              margin: '0.75rem 0 3rem',
              textAlign: 'center',
            }}
          >
            What to expect from the call.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: 'How long is the demo?',
                a: 'Fifteen minutes for the main walk-through. We can stretch to thirty if your team has a lot of questions, or run multiple short calls for different roles (manager, board, security, residents).',
              },
              {
                q: 'Will it be tailored to my property?',
                a: 'Yes. We use the property type, unit count, and tools-you-have-today info from the form to set up sample data that looks like yours — same number of units, same vendor list, same lobby flow.',
              },
              {
                q: 'Do I need to install anything?',
                a: 'No. The demo is a web call (Google Meet, Zoom, Teams — your pick) and a browser tab. We provide a sandbox URL afterward so your team can click around independently.',
              },
              {
                q: 'How much does BuildingAutopilot cost?',
                a: 'Pricing depends on unit count, modules enabled, and pilot terms. We share a tailored quote in writing after the demo — no high-pressure phone follow-up.',
              },
              {
                q: 'Can you migrate from BuildingLink / ICON / Condo Control / AppFolio?',
                a: 'Yes. Our migration team handles unit lists, resident contacts, vendor records, and history imports. We have done it for properties of every size — typical migrations finish in 1–3 weeks.',
              },
            ].map((f) => (
              <details
                key={f.q}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <summary
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#fff',
                    cursor: 'pointer',
                    listStyle: 'none',
                  }}
                >
                  {f.q}
                </summary>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.65)',
                    margin: '1rem 0 0',
                  }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 880px) {
          .mkt-demo-grid {
            grid-template-columns: 1fr !important;
          }
          .mkt-form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(244,123,123,0.4)' : 'rgba(255,255,255,0.1)'}`,
    color: '#fff',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 200ms ease, background 200ms ease',
  };
}

function Field({ label, error, input }: { label: string; error?: string; input: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          fontSize: '0.8125rem',
          color: 'rgba(255,255,255,0.7)',
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {input}
      {error && (
        <span
          style={{
            fontSize: '0.75rem',
            color: '#FCA5A5',
            display: 'block',
            marginTop: '0.375rem',
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}
