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
// Data
// ---------------------------------------------------------------------------

const SUBJECTS = [
  { value: '', label: 'Select a subject' },
  { value: 'sales', label: 'Book a demo (recommended)' },
  { value: 'general', label: 'General inquiry' },
  { value: 'support', label: 'Technical support' },
  { value: 'security', label: 'Security & privacy' },
  { value: 'partnership', label: 'Partnership or integration' },
] as const;

const CONTACT_LINKS = [
  {
    label: 'Email',
    value: 'hello@concierge.com',
    href: 'mailto:hello@concierge.com',
  },
  { label: 'Address', value: 'Toronto, Ontario, Canada', href: null },
  { label: 'Hours', value: 'Mon–Fri · 9:00 AM – 6:00 PM ET', href: null },
];

const REASONS = [
  {
    eyebrow: 'For property managers',
    title: 'See your building on the platform.',
    body: 'Book a 15-minute personalized walk-through. We will map your current tools to the modules that replace them — package tracking, visitor management, maintenance requests, amenity booking, security console.',
  },
  {
    eyebrow: 'For condo & HOA boards',
    title: 'Sit in on a board snapshot.',
    body: 'See the board view — meetings, motions, resolutions, vendor compliance, financials at a glance. Built for volunteer boards who prep on Sunday nights.',
  },
  {
    eyebrow: 'For residents & owners',
    title: 'Your building uses something else?',
    body: 'Forward this page to your property manager or board. We will follow up directly — no pressure, just a demo and a quote.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Please enter a valid email address';
    if (!subject) newErrors.subject = 'Please select a subject';
    if (!message.trim()) newErrors.message = 'Message is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.error ??
          (res.status === 429
            ? 'Too many requests. Please try again later.'
            : 'Something went wrong. Please try again.');
        setApiError(msg);
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
            We got it. We will be in touch.
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
            A real person on the team will reply within one business day. If your building is
            mid-emergency, email{' '}
            <a
              href="mailto:urgent@concierge.com"
              style={{ color: '#C9A96E', textDecoration: 'underline' }}
            >
              urgent@concierge.com
            </a>{' '}
            and someone will pick up faster.
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
          paddingBottom: '3rem',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 50% 20%, rgba(201,169,110,0.18), transparent 65%)',
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
            maxWidth: 1080,
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
            Replying within one business day · No pressure, no sales floor
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
            Let&rsquo;s see your building{' '}
            <span style={{ color: '#C9A96E', fontStyle: 'italic', fontWeight: 400 }}>
              on the platform.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.1875rem)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 660,
              margin: '1.5rem auto 0',
            }}
          >
            Book a personalized demo, ask a question, or pilot the platform at your property.
            Whatever it is, a real person on the team replies — usually within a few hours.
          </p>
        </div>
      </section>

      {/* ============================ FORM + DETAILS ============================ */}
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
          className="mkt-contact-grid"
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
              Send us a message
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
              Tell us about your building.
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
                label="Name"
                error={errors.name}
                input={
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Bennett"
                    style={inputStyle(!!errors.name)}
                  />
                }
              />
              <Field
                label="Email"
                error={errors.email}
                input={
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@property.com"
                    style={inputStyle(!!errors.email)}
                  />
                }
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <Field
                label="What can we help with?"
                error={errors.subject}
                input={
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={inputStyle(!!errors.subject)}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value} disabled={!s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                }
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <Field
                label="Message"
                error={errors.message}
                input={
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your property — how many units, what you use today, what you're hoping to improve."
                    rows={6}
                    style={{ ...inputStyle(!!errors.message), resize: 'vertical' }}
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
              {submitting ? 'Sending…' : 'Send message'}
            </button>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                margin: '1rem 0 0',
                textAlign: 'center',
              }}
            >
              By submitting you agree to our{' '}
              <Link
                href={'/privacy' as never}
                style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}
              >
                privacy policy
              </Link>
              . We will never share your information.
            </p>
          </form>

          {/* Right column — direct contact + reasons */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                padding: '1.75rem',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
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
                Or reach out direct
              </p>
              <dl style={{ margin: '1.25rem 0 0', display: 'grid', gap: '1rem' }}>
                {CONTACT_LINKS.map((c) => (
                  <div key={c.label}>
                    <dt
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {c.label}
                    </dt>
                    <dd
                      style={{
                        fontSize: '0.9375rem',
                        color: '#fff',
                        margin: '0.25rem 0 0',
                      }}
                    >
                      {c.href ? (
                        <a href={c.href} style={{ color: '#fff', textDecoration: 'none' }}>
                          {c.value}
                        </a>
                      ) : (
                        c.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {REASONS.map((r) => (
              <div
                key={r.eyebrow}
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
                    color: 'rgba(201,169,110,0.85)',
                    margin: 0,
                  }}
                >
                  {r.eyebrow}
                </p>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#fff',
                    margin: '0.5rem 0 0.5rem',
                    lineHeight: 1.3,
                  }}
                >
                  {r.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {r.body}
                </p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 880px) {
          .mkt-contact-grid {
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
