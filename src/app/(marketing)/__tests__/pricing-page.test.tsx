import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PricingPage from '../pricing/page';

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

describe('Pricing Page', () => {
  it('shows starter, professional, and enterprise tiers', () => {
    render(<PricingPage />);

    expect(screen.getByRole('heading', { name: 'Starter' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Professional' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enterprise' })).toBeInTheDocument();
  });

  it('shows pricing amounts for starter and professional', () => {
    render(<PricingPage />);

    // Starter and Professional have visible pricing
    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByText('$4.50')).toBeInTheDocument();
  });

  it('shows contact sales for enterprise', () => {
    render(<PricingPage />);

    expect(screen.getByText(/contact sales/i)).toBeInTheDocument();
  });

  it('renders feature comparison table', () => {
    render(<PricingPage />);

    expect(screen.getByRole('heading', { name: /feature comparison/i })).toBeInTheDocument();

    // Feature comparison entries
    expect(screen.getByText('Package Tracking')).toBeInTheDocument();
    expect(screen.getByText('Security Console')).toBeInTheDocument();
    expect(screen.getByText('Amenity Booking')).toBeInTheDocument();
    expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
  });

  it('highlights professional tier as recommended', () => {
    render(<PricingPage />);

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });
});
