'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Navigation Links
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
  { label: 'Login', href: '/login' },
] as const;

const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Security', href: '/security' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur-sm">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href={'/' as never}
            className="text-lg font-semibold tracking-tight text-neutral-900"
            aria-label="Concierge"
          >
            Concierge
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href as never}
                className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={'/contact' as never}
              className="inline-flex h-9 items-center rounded-lg bg-neutral-900 px-4 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Request a Demo
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="border-t border-neutral-100 bg-white px-6 py-4 md:hidden"
            data-testid="mobile-menu"
          >
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as never}
                  className="text-[15px] font-medium text-neutral-700 transition-colors hover:text-neutral-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={'/contact' as never}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Request a Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-neutral-50" role="contentinfo">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-lg font-semibold tracking-tight text-neutral-900">Concierge</p>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
                Next-generation building management for Canadian properties.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
                Product
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as never}
                      className="text-[14px] text-neutral-600 transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
                Company
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as never}
                      className="text-[14px] text-neutral-600 transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <p className="text-[13px] font-semibold tracking-wider text-neutral-400 uppercase">
                Legal
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as never}
                      className="text-[14px] text-neutral-600 transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <p className="text-[13px] text-neutral-400">
              &copy; {new Date().getFullYear()} Concierge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
