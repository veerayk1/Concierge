/**
 * Security & Privacy Page Tests
 *
 * Asserts the SEO-tuned structure: hero h1, eight compliance framework
 * codes, six security pillars, trust-fact stats strip, responsible
 * disclosure block, CTA to /contact.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SecurityPrivacyPage from '../security-privacy/page';

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

describe('Security & Privacy Page', () => {
  it('renders the SEO-tuned hero heading', () => {
    render(<SecurityPrivacyPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent ?? '').toMatch(/property data/i);
    expect(h1.textContent ?? '').toMatch(/bank data/i);
  });

  it('shows every framework code', () => {
    render(<SecurityPrivacyPage />);
    for (const code of [
      'SOC 2',
      'ISO 27001',
      'ISO 27701',
      'ISO 27017',
      'ISO 9001',
      'PIPEDA',
      'GDPR',
      'HIPAA',
    ]) {
      expect(screen.getAllByText(code).length).toBeGreaterThan(0);
    }
  });

  it('shows the six security pillars (eyebrow labels)', () => {
    render(<SecurityPrivacyPage />);
    expect(screen.getByText(/^Encryption$/)).toBeInTheDocument();
    expect(screen.getByText(/^Access control$/)).toBeInTheDocument();
    expect(screen.getByText(/^Audit & monitoring$/)).toBeInTheDocument();
    expect(screen.getByText(/^Privacy by design$/)).toBeInTheDocument();
    expect(screen.getByText(/^Resilience$/)).toBeInTheDocument();
    expect(screen.getByText(/^Secure development$/)).toBeInTheDocument();
  });

  it('shows the trust-fact stats strip', () => {
    render(<SecurityPrivacyPage />);
    expect(screen.getByText('256-bit')).toBeInTheDocument();
    expect(screen.getByText('99.99%')).toBeInTheDocument();
  });

  it('has a responsible disclosure section with security email', () => {
    render(<SecurityPrivacyPage />);
    // "Responsible disclosure" appears as the eyebrow + heading — multiple
    // matches are expected, so use getAllByText.
    expect(screen.getAllByText(/responsible disclosure/i).length).toBeGreaterThan(0);
    expect(screen.getByText('security@concierge.com')).toBeInTheDocument();
  });

  it('has a CTA pointing to /contact', () => {
    render(<SecurityPrivacyPage />);
    const cta = screen.getByRole('link', { name: /security pack/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/contact');
  });
});
