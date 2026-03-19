import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FeaturesPage from '../features/page';

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

describe('Features Page', () => {
  it('renders page heading', () => {
    render(<FeaturesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /everything you need/i }),
    ).toBeInTheDocument();
  });

  it('shows all major feature modules', () => {
    render(<FeaturesPage />);

    expect(screen.getByText('Security Console')).toBeInTheDocument();
    expect(screen.getByText('Package Tracking')).toBeInTheDocument();
    expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    expect(screen.getByText('Amenity Booking')).toBeInTheDocument();
    expect(screen.getByText('Announcements')).toBeInTheDocument();
    expect(screen.getByText('Staff Training')).toBeInTheDocument();
  });

  it('shows role-based showcase section', () => {
    render(<FeaturesPage />);

    expect(screen.getByText('Concierge & Front Desk')).toBeInTheDocument();
    expect(screen.getByText('Property Manager')).toBeInTheDocument();
    expect(screen.getByText('Resident')).toBeInTheDocument();
  });

  it('has CTA to request demo', () => {
    render(<FeaturesPage />);

    const cta = screen.getByRole('link', { name: /request a demo/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/contact');
  });
});
