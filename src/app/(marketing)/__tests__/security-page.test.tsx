/**
 * Security Page Tests
 *
 * Validates that the security page renders compliance badges, encryption
 * details, trust indicators, and privacy commitments correctly.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SecurityPage from '../security-privacy/page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

describe('Security Page — Hero', () => {
  it('renders the page heading', () => {
    render(<SecurityPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /security and privacy, by design/i }),
    ).toBeInTheDocument();
  });

  it('renders the hero description mentioning sensitive personal data', () => {
    render(<SecurityPage />);

    expect(
      screen.getByText(/building management involves sensitive personal data/i),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Security Features (Encryption Details & Trust Indicators)
// ---------------------------------------------------------------------------

describe('Security Page — Security Features', () => {
  it('renders Encryption Everywhere card with AES-256 and TLS 1.3 details', () => {
    render(<SecurityPage />);

    expect(screen.getByText('Encryption Everywhere')).toBeInTheDocument();
    expect(screen.getByText(/AES-256/)).toBeInTheDocument();
    expect(screen.getByText(/TLS 1\.3/)).toBeInTheDocument();
  });

  it('renders Multi-Factor Authentication card', () => {
    render(<SecurityPage />);

    expect(screen.getByText('Multi-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText(/authenticator apps/i)).toBeInTheDocument();
  });

  it('renders Complete Audit Trails card', () => {
    render(<SecurityPage />);

    expect(screen.getByText('Complete Audit Trails')).toBeInTheDocument();
    expect(screen.getByText(/who, what, when/i)).toBeInTheDocument();
  });

  it('renders Role-Based Access Control card', () => {
    render(<SecurityPage />);

    expect(screen.getByText('Role-Based Access Control')).toBeInTheDocument();
    expect(screen.getByText(/granular permissions/i)).toBeInTheDocument();
  });

  it('renders Tenant Isolation card', () => {
    render(<SecurityPage />);

    expect(screen.getByText('Tenant Isolation')).toBeInTheDocument();
    expect(screen.getByText(/fully isolated environment/i)).toBeInTheDocument();
  });

  it('renders Automated Backups card', () => {
    render(<SecurityPage />);

    expect(screen.getByText('Automated Backups')).toBeInTheDocument();
    expect(screen.getByText(/point-in-time recovery/i)).toBeInTheDocument();
  });

  it('renders all 6 security feature cards', () => {
    render(<SecurityPage />);

    const expectedFeatures = [
      'Encryption Everywhere',
      'Multi-Factor Authentication',
      'Complete Audit Trails',
      'Role-Based Access Control',
      'Tenant Isolation',
      'Automated Backups',
    ];

    for (const feature of expectedFeatures) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });
});

// ---------------------------------------------------------------------------
// Compliance Badges (8 Frameworks)
// ---------------------------------------------------------------------------

describe('Security Page — Compliance Badges', () => {
  it('renders the compliance frameworks heading', () => {
    render(<SecurityPage />);

    expect(screen.getByRole('heading', { name: /compliance frameworks/i })).toBeInTheDocument();
  });

  it('renders all 8 compliance badges', () => {
    render(<SecurityPage />);

    const frameworks = [
      'PIPEDA',
      'SOC 2 Type II',
      'ISO 27001',
      'ISO 27701',
      'ISO 27017',
      'ISO 9001',
      'GDPR',
      'HIPAA',
    ];

    for (const framework of frameworks) {
      expect(screen.getByText(framework)).toBeInTheDocument();
    }
  });

  it('renders PIPEDA description mentioning Canadian federal privacy law', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/Canadian federal privacy law/i)).toBeInTheDocument();
  });

  it('renders SOC 2 description mentioning annual audit', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/annual audit/i)).toBeInTheDocument();
  });

  it('renders GDPR description mentioning European residents', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/European residents/i)).toBeInTheDocument();
  });

  it('renders HIPAA description mentioning health data', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/health data/i)).toBeInTheDocument();
  });

  it('mentions 8 compliance frameworks in the section intro', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/8 compliance frameworks/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Privacy Commitments
// ---------------------------------------------------------------------------

describe('Security Page — Privacy Commitments', () => {
  it('renders the privacy commitments heading', () => {
    render(<SecurityPage />);

    expect(screen.getByRole('heading', { name: /our privacy commitments/i })).toBeInTheDocument();
  });

  it('renders all 4 privacy practices', () => {
    render(<SecurityPage />);

    const practices = [
      'Data Minimization',
      'Right to Erasure',
      'Data Residency',
      'Transparent Processing',
    ];

    for (const practice of practices) {
      expect(screen.getByText(practice)).toBeInTheDocument();
    }
  });

  it('mentions no tracking pixels and no data selling', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/no tracking pixels/i)).toBeInTheDocument();
    expect(screen.getByText(/no data selling/i)).toBeInTheDocument();
  });

  it('mentions DSAR requests processed within 30 days', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/30 days/i)).toBeInTheDocument();
  });

  it('mentions Canadian data centers for Canadian properties', () => {
    render(<SecurityPage />);

    expect(screen.getByText(/Canadian data centers/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Bottom CTA
// ---------------------------------------------------------------------------

describe('Security Page — CTA', () => {
  it('renders the security questions heading', () => {
    render(<SecurityPage />);

    expect(screen.getByRole('heading', { name: /have security questions/i })).toBeInTheDocument();
  });

  it('has a Contact Us CTA link pointing to /contact', () => {
    render(<SecurityPage />);

    const cta = screen.getByRole('link', { name: /contact us/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/contact');
  });
});
