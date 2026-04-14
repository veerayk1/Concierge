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

    // Hero headline — actual h1 text is "The last platform your building will ever need."
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /last platform your building will ever need/i,
      }),
    ).toBeInTheDocument();

    // Primary CTA — "Request a Demo" linking to /contact
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

    // Feature cards — actual feature titles from FeaturesGrid component
    expect(screen.getAllByText('Package Management').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Maintenance & Work Orders').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Amenity Bookings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Announcements & Notices').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Staff Training & Compliance').length).toBeGreaterThanOrEqual(1);
  });

  it('renders testimonials section with blockquote', () => {
    render(<LandingPage />);

    // Testimonial section uses a blockquote, not a heading
    const blockquote = screen.getByRole('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote.textContent).toMatch(/concierge/i);
  });

  it('renders bottom CTA section', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /ready to modernize your building/i }),
    ).toBeInTheDocument();
  });
});
