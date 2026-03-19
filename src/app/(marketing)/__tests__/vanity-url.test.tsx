import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PropertyLoginPage from '../../[property-slug]/page';

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

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('Vanity URL Login (/{property-slug})', () => {
  it('renders branded login for property slug', () => {
    render(<PropertyLoginPage params={{ 'property-slug': 'maple-heights' }} />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    // Shows property context
    expect(screen.getByText(/maple-heights/i)).toBeInTheDocument();
  });

  it('shows email and password fields', () => {
    render(<PropertyLoginPage params={{ 'property-slug': 'maple-heights' }} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('has a link to the generic login page', () => {
    render(<PropertyLoginPage params={{ 'property-slug': 'maple-heights' }} />);

    const loginLink = screen.getByRole('link', { name: /different property/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
