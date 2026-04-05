'use client';

import '@/styles/marketing.css';
import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { Preloader } from '@/components/marketing/Preloader';
import { CustomCursor } from '@/components/marketing/CustomCursor';

// ---------------------------------------------------------------------------
// Navigation Links
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'For Teams', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
] as const;

const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Security', href: '/security-privacy' },
    { label: 'Integrations', href: '/features' },
    { label: 'Changelog', href: '/blog' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press', href: '/about' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/privacy' },
    { label: 'Accessibility', href: '/about' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="marketing">
      {/* Preloader */}
      <Preloader />
      {/* Custom Cursor (desktop only) */}
      <CustomCursor />

      {/* Navbar */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(10, 10, 10, 0.8)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid transparent',
          transition: 'border-color 300ms ease',
        }}
      >
        <nav
          style={{
            maxWidth: 1280,
            width: '100%',
            marginInline: 'auto',
            paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href={'/' as never}
            style={{
              fontWeight: 300,
              fontSize: '1.375rem',
              color: '#fff',
              letterSpacing: '-0.02em',
              textDecoration: 'none',
            }}
            aria-label="Concierge home"
          >
            Concierge
          </Link>

          {/* Desktop center nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}
            className="mkt-nav-desktop"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href as never}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = 'rgba(255,255,255,1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
            className="mkt-nav-desktop"
          >
            <Link
              href={'/login' as never}
              style={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,1)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              Log In
            </Link>
            <Link
              href={'/contact' as never}
              className="btn-primary btn-sm"
              style={{
                padding: '0.625rem 1.5rem',
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mkt-nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
            }}
          >
            {mobileMenuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M2 5h16M2 10h16M2 15h16" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="mkt-mobile-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: '#0A0A0A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
          }}
          data-testid="mobile-menu"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href as never}
              style={{
                fontSize: '1.5rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
              onClick={() => setMobileMenuOpen(false)}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <Link
              href={'/login' as never}
              style={{
                fontSize: '1.5rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                textAlign: 'center',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              href={'/contact' as never}
              className="btn-primary"
              style={{ textAlign: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1" style={{ paddingTop: 72 }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        role="contentinfo"
        style={{
          background: '#0E0E0E',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            marginInline: 'auto',
            paddingInline: 'clamp(1.5rem, 4vw, 3rem)',
            paddingBlock: '4rem',
          }}
        >
          <div className="mkt-footer-grid">
            {/* Column 1 — Brand */}
            <div>
              <p
                style={{
                  fontWeight: 300,
                  fontSize: '1.25rem',
                  color: '#fff',
                }}
              >
                Concierge
              </p>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '0.75rem',
                  lineHeight: 1.6,
                }}
              >
                Building management, reimagined.
              </p>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  style={{ color: 'rgba(255,255,255,0.3)', transition: 'color 200ms ease' }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                {/* X (Twitter) */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  style={{ color: 'rgba(255,255,255,0.3)', transition: 'color 200ms ease' }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2 — Product */}
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Product
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  marginTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as never}
                      style={{
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        transition: 'color 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 — Company */}
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Company
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  marginTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as never}
                      style={{
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        transition: 'color 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 — Legal */}
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Legal
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  marginTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as never}
                      style={{
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        transition: 'color 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              paddingTop: '2rem',
              marginTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              &copy; 2026 Concierge. All rights reserved.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Built in Toronto
            </p>
          </div>
        </div>
      </footer>

      {/* Responsive styles for nav and footer */}
      <style jsx global>{`
        .mkt-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .mkt-nav-mobile-toggle {
          display: none !important;
        }
        @media (max-width: 767px) {
          .mkt-nav-desktop {
            display: none !important;
          }
          .mkt-nav-mobile-toggle {
            display: flex !important;
          }
          .mkt-footer-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}
