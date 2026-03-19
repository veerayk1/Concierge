import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LandingPage from '../page';

// Mock next/link
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

describe('Landing Page', () => {
  it('renders hero section with headline and CTA', () => {
    render(<LandingPage />);

    // Hero headline
    expect(
      screen.getByRole('heading', { level: 1, name: /modern way to manage your building/i }),
    ).toBeInTheDocument();

    // Primary CTA — there are multiple "Request a Demo" links, check that at least one exists
    const demoCtas = screen.getAllByRole('link', { name: /request a demo/i });
    expect(demoCtas.length).toBeGreaterThanOrEqual(1);
    expect(demoCtas[0]).toHaveAttribute('href', '/contact');
  });

  it('shows feature highlights section with platform capabilities', () => {
    render(<LandingPage />);

    // Section heading
    expect(
      screen.getByRole('heading', { name: /everything your building needs/i }),
    ).toBeInTheDocument();

    // Feature cards — 6 features per PRD (use getAllByText since names may appear in pricing too)
    expect(screen.getAllByText('Security Console').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Package Tracking').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Maintenance Requests').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Amenity Booking').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Announcements').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Staff Training').length).toBeGreaterThanOrEqual(1);
  });

  it('has pricing section with 3 tiers', () => {
    render(<LandingPage />);

    // Pricing section heading
    expect(
      screen.getByRole('heading', { name: /simple, transparent pricing/i }),
    ).toBeInTheDocument();

    // Three tiers
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders compliance bar with trust signals', () => {
    render(<LandingPage />);

    expect(screen.getByText(/enterprise-grade security/i)).toBeInTheDocument();
  });

  it('renders testimonials section', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /trusted by property managers/i }),
    ).toBeInTheDocument();
  });

  it('renders bottom CTA section', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /ready to modernize your building/i }),
    ).toBeInTheDocument();
  });
});
