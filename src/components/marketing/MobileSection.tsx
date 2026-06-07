'use client';

/**
 * Mobile Section — landing-page block that says "residents get an app."
 *
 * What we can honestly claim today:
 *   - Installable on iPhone and Android via PWA (commit 77dd9e8 added
 *     the manifest, icons, service worker, and offline shell).
 *   - Native iOS + Android apps in development (commit 6b8432e added
 *     the Expo React Native scaffold at /mobile, plus the device-
 *     registration + account-deletion endpoints).
 *
 * What we do NOT claim:
 *   - "Available on the App Store" — not yet. Use "in private beta"
 *     until you've actually submitted and been approved.
 */

import Link from 'next/link';

import { Smartphone, Bell, ShieldCheck, Sparkles } from 'lucide-react';

export function MobileSection() {
  return (
    <section
      id="mobile"
      aria-labelledby="mobile-heading"
      style={{
        padding: 'clamp(64px, 10vw, 120px) clamp(24px, 5vw, 80px)',
        background: '#FAFAFA',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(32px, 6vw, 80px)',
          alignItems: 'center',
        }}
        className="mobile-grid"
      >
        {/* Left: copy */}
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.06)',
              color: '#475569',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.1,
              marginBottom: 24,
            }}
          >
            <Smartphone size={14} />
            For residents
          </span>

          <h2
            id="mobile-heading"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Installable on iPhone and Android.{' '}
            <em style={{ fontStyle: 'italic', color: '#475569' }}>Native apps in private beta.</em>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1.0625rem, 1.4vw, 1.25rem)',
              fontWeight: 400,
              color: '#64748B',
              lineHeight: 1.55,
              marginTop: 20,
              marginBottom: 0,
              maxWidth: 520,
              letterSpacing: '-0.005em',
            }}
          >
            Residents add BuildingAutopilot to their home screen in two taps. Packages, maintenance
            requests, and amenity bookings live in one place — not buried in three different
            buildings' apps.
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              marginTop: 32,
              marginBottom: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <FeatureLine
              icon={<Bell size={18} strokeWidth={1.6} />}
              title="Push notifications"
              body="A package arrives, a request gets an update, a booking is approved — instant alert."
            />
            <FeatureLine
              icon={<ShieldCheck size={18} strokeWidth={1.6} />}
              title="Biometric unlock"
              body="Face ID and Touch ID on iOS. Fingerprint on Android. Tokens never leave the secure enclave."
            />
            <FeatureLine
              icon={<Sparkles size={18} strokeWidth={1.6} />}
              title="Made for residents"
              body="Not a watered-down admin view. Designed for the one person it serves: the resident with their phone."
            />
          </ul>

          <div
            style={{
              marginTop: 40,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Link href={'/contact' as never} className="btn-primary mkt-cta-primary">
              Request native app access
            </Link>
            <a
              href="#mobile-install-help"
              style={{
                color: '#475569',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              How to install on phone &rsaquo;
            </a>
          </div>

          <p
            id="mobile-install-help"
            style={{
              marginTop: 20,
              padding: 16,
              background: '#F1F5F9',
              borderRadius: 12,
              fontSize: 13,
              color: '#475569',
              lineHeight: 1.55,
              maxWidth: 520,
              margin: '20px 0 0 0',
            }}
          >
            <strong style={{ color: '#0F172A' }}>iPhone:</strong> Open the BuildingAutopilot URL in
            Safari → tap the share icon → "Add to Home Screen."
            <br />
            <strong style={{ color: '#0F172A' }}>Android:</strong> Open in Chrome → menu → "Install
            app."
          </p>
        </div>

        {/* Right: phone mockup */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <PhoneMockup />
        </div>
      </div>

      {/* Responsive: stack on narrow viewports. Reused inline so this
          component is self-contained without polluting global CSS. */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function FeatureLine({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#0F172A',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span>
        <strong style={{ display: 'block', fontSize: 16, color: '#0F172A', fontWeight: 600 }}>
          {title}
        </strong>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            color: '#64748B',
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          {body}
        </span>
      </span>
    </li>
  );
}

function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="BuildingAutopilot mobile app preview showing the resident dashboard"
      style={{
        width: 280,
        height: 580,
        background: '#0F172A',
        borderRadius: 44,
        padding: 12,
        boxShadow:
          '0 30px 80px -20px rgba(15, 23, 42, 0.35), 0 12px 30px -10px rgba(15, 23, 42, 0.2)',
        position: 'relative',
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 110,
          height: 28,
          background: '#0F172A',
          borderRadius: 16,
          zIndex: 2,
        }}
      />
      {/* Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FFFFFF',
          borderRadius: 32,
          padding: '52px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflow: 'hidden',
        }}
      >
        {/* Greeting */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Tuesday
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0F172A',
              marginTop: 4,
              letterSpacing: -0.3,
            }}
          >
            Good morning, Alice.
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#92400E',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Packages
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>2</div>
          <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>awaiting pickup</div>
        </div>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#64748B',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Service requests
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>1</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>open · in progress</div>
        </div>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#64748B',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Upcoming bookings
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>1</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>amenity reserved</div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-around',
            paddingTop: 12,
            borderTop: '1px solid #E2E8F0',
          }}
        >
          {['Home', 'Packages', 'Requests', 'Account'].map((label, i) => (
            <div
              key={label}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: i === 0 ? '#0F172A' : '#94A3B8',
                textAlign: 'center',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
